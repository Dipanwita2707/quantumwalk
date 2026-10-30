"""Durable, private scientific jobs with serialized admission and leased claims.

No broker dependency: PostgreSQL transaction locks serialize queue admission and
the two execution slots. SQLite uses its database writer lock for local testing.
The separate worker executes only the allowlisted, validated model functions.
"""
import hashlib
import json
import os
from datetime import timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import Field
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from completion_models import SimulationJob
from database import utc_now, utc_value
from entitlements import consume
from extended_models import AuditEvent, LabRun
from laboratory_routes import RunInput
from limits import enforce_rate
from science_models import LABS, validated_parameters

router = APIRouter(prefix="/api/v1")
LEASE_SECONDS = 90
EXECUTION_SECONDS = 30
MAX_ATTEMPTS = 3
EXECUTION_SLOTS = 2


def enabled():
    return os.getenv("QUANTUMWALK_DURABLE_JOBS", "0") == "1"


def queue_lock(db):
    connection = db.connection()
    if connection.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(718391206)"))
    elif connection.dialect.name == "sqlite":
        if not connection.connection.driver_connection.in_transaction:
            connection.exec_driver_sql("BEGIN IMMEDIATE")
    else:
        raise RuntimeError("Durable execution supports PostgreSQL or SQLite only")


def view(row):
    return {"id": row.id, "lab": row.lab_slug, "model_version": row.model_version, "status": row.status,
            "cancel_requested": row.cancel_requested, "error_code": row.error_code, "run_id": row.run_id,
            "created_at": utc_value(row.created_at), "updated_at": utc_value(row.updated_at), "attempts": row.attempt_count}


def owned(db, job_id, user_id):
    row = db.scalar(select(SimulationJob).where(SimulationJob.id == job_id, SimulationJob.owner_user_id == user_id))
    if row is None: raise HTTPException(404, "Simulation job not found")
    return row


@router.get("/simulation-jobs/capabilities")
def capabilities():
    return {"enabled": enabled(), "kinds": ["science"], "timeout_seconds": EXECUTION_SECONDS,
            "concurrency": EXECUTION_SLOTS, "maximum_active_per_user": 3,
            "allowance_policy": "One run allowance is reserved at submission, including cancelled or failed jobs. Retries do not charge again.",
            "worker_required": True}


class JobInput(RunInput):
    request_key: str = Field(min_length=16, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")


@router.post("/labs/{slug}/jobs", status_code=202)
def enqueue(slug: str, body: JobInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    if not enabled(): raise HTTPException(503, "Durable execution is not enabled on this deployment. Use Run experiment.")
    if slug not in LABS: raise HTTPException(404, "Lab not found")
    enforce_rate(request, "science-queue", 20)
    from science_routes import detail
    card = detail(slug, db)
    try: parameters = validated_parameters(LABS[slug], body)
    except ValueError as error: raise HTTPException(422, str(error)) from None
    content = {"parameters": parameters, "seed": body.seed, "prediction": body.prediction, "model_card": card}
    digest = hashlib.sha256(json.dumps({"lab": slug, "version": LABS[slug].version, "request": content}, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    queue_lock(db)
    previous = db.scalar(select(SimulationJob).where(SimulationJob.owner_user_id == auth.user.id, SimulationJob.request_key == body.request_key))
    if previous:
        if previous.request_hash != digest: raise HTTPException(409, "This request key was used for different inputs")
        return view(previous)
    active = select(SimulationJob).where(SimulationJob.status.in_(["queued", "running"]))
    if db.scalar(select(func.count()).select_from(active.where(SimulationJob.owner_user_id == auth.user.id).subquery())) >= 3:
        raise HTTPException(429, "Finish or cancel an active job before submitting another")
    if db.scalar(select(func.count()).select_from(active.subquery())) >= 1000:
        raise HTTPException(429, "The durable queue is full. Try again later")
    if db.scalar(select(func.count()).select_from(SimulationJob).where(SimulationJob.owner_user_id == auth.user.id)) >= 1000:
        raise HTTPException(429, "Saved job limit reached")
    consume(db, auth.user.id, "lab.run")
    row = SimulationJob(owner_user_id=auth.user.id, request_key=body.request_key, request_hash=digest, kind="science", lab_slug=slug, model_version=LABS[slug].version, parameters=content)
    db.add(row); db.commit(); db.refresh(row)
    return view(row)


@router.get("/simulation-jobs")
def history(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return [view(row) for row in db.scalars(select(SimulationJob).where(SimulationJob.owner_user_id == auth.user.id).order_by(SimulationJob.created_at.desc()).limit(100))]


@router.get("/simulation-jobs/{job_id}")
def status(job_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return view(owned(db, job_id, auth.user.id))


@router.post("/simulation-jobs/{job_id}/cancel")
def cancel(job_id: str, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    queue_lock(db)
    row = owned(db, job_id, auth.user.id)
    if row.status in {"queued", "running"}:
        row.cancel_requested = True
        if row.status == "queued": row.status = "cancelled"
        row.updated_at = utc_now()
        db.commit()
    return view(row)


def claim(db, worker_id):
    """Recover expired leases and atomically claim at most two global slots."""
    queue_lock(db)
    now = utc_now()
    for row in db.scalars(select(SimulationJob).where(SimulationJob.status == "running", SimulationJob.lease_expires_at <= now)):
        row.status = "cancelled" if row.cancel_requested else "failed" if row.attempt_count >= MAX_ATTEMPTS else "queued"
        row.error_code = "lease_expired" if row.status == "failed" else None
        row.lease_owner = None; row.lease_expires_at = None; row.updated_at = now
    db.flush()
    count = db.scalar(select(func.count()).select_from(SimulationJob).where(SimulationJob.status == "running"))
    if count >= EXECUTION_SLOTS:
        db.commit(); return None
    row = db.scalar(select(SimulationJob).where(SimulationJob.status == "queued", SimulationJob.cancel_requested.is_(False)).order_by(SimulationJob.created_at, SimulationJob.id).limit(1).with_for_update(skip_locked=True))
    if row is None:
        db.commit(); return None
    row.status = "running"; row.attempt_count += 1
    row.lease_owner = f"{worker_id}:{uuid4()}"; row.lease_expires_at = now + timedelta(seconds=LEASE_SECONDS)
    row.heartbeat_at = now; row.updated_at = now
    db.commit(); db.refresh(row)
    return {"id": row.id, "lease": row.lease_owner, "lab": row.lab_slug, "model_version": row.model_version, "parameters": row.parameters}


def heartbeat(db, job):
    now = utc_now()
    updated = db.execute(update(SimulationJob).where(SimulationJob.id == job["id"], SimulationJob.status == "running", SimulationJob.lease_owner == job["lease"], SimulationJob.lease_expires_at > now, SimulationJob.cancel_requested.is_(False)).values(heartbeat_at=now, lease_expires_at=now+timedelta(seconds=LEASE_SECONDS), updated_at=now)).rowcount
    db.commit()
    return updated == 1


def finalize(db, job, result=None, error_code=None):
    queue_lock(db)
    row = db.scalar(select(SimulationJob).where(SimulationJob.id == job["id"], SimulationJob.status == "running", SimulationJob.lease_owner == job["lease"], SimulationJob.lease_expires_at > utc_now()).with_for_update())
    if row is None:
        db.rollback(); return False
    if row.cancel_requested:
        row.status = "cancelled"
    elif result is not None and error_code is None:
        result["model_card"] = row.parameters["model_card"]
        record = LabRun(owner_user_id=row.owner_user_id, lab_slug=row.lab_slug, model_version=row.model_version, status="completed", prediction=row.parameters["prediction"], result=result)
        db.add(record); db.flush()
        row.run_id = record.id; row.status = "completed"
    else:
        row.status = "failed"
        row.error_code = error_code if error_code in {"execution_timeout", "model_version_changed", "model_execution_failed", "worker_interrupted"} else "model_execution_failed"
        db.add(AuditEvent(actor_user_id=row.owner_user_id, action="simulation.failed", target_id=row.lab_slug, details={"code": row.error_code, "status": 503}))
    row.lease_owner = None; row.lease_expires_at = None; row.updated_at = utc_now()
    db.commit()
    return True
