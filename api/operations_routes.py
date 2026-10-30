"""Administrator-only operational summaries from persisted records."""
import os
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db
from collaboration_routes import privileged
from database import utc_value
from completion_models import SimulationJob
from simulation_jobs import enabled, EXECUTION_SLOTS, EXECUTION_SECONDS
from extended_models import AuditEvent, LabRun, PaymentEvent, Subscription, UsageBucket

router = APIRouter(prefix="/api/v1/admin")


@router.get("/operations")
def operations(period: Literal["day", "week"] = "day", auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin"})
    since = datetime.now(timezone.utc) - timedelta(days=1 if period == "day" else 7)
    run_counts = dict(db.execute(select(LabRun.status, func.count()).where(LabRun.created_at >= since).group_by(LabRun.status)).all())
    incidents = list(db.scalars(select(AuditEvent).where(AuditEvent.created_at >= since,
        AuditEvent.action.in_(["simulation.failed", "quota.denied"])).order_by(AuditEvent.created_at.desc()).limit(100)))
    subscription_counts = dict(db.execute(select(Subscription.status, func.count()).group_by(Subscription.status)).all())
    today = datetime.now(timezone.utc).date().isoformat()
    metered = dict(db.execute(select(UsageBucket.feature, func.sum(UsageBucket.used)).where(UsageBucket.period == today).group_by(UsageBucket.feature)).all())
    payment_events = db.scalar(select(func.count()).select_from(PaymentEvent).where(PaymentEvent.created_at >= since))
    return {"since": since, "period": period, "runs": run_counts, "usage_today": metered,
            "subscriptions": subscription_counts, "verified_payment_events": payment_events,
            "providers": {"stripe_key_present": bool(os.getenv("STRIPE_SECRET_KEY")), "stripe_webhook_present": bool(os.getenv("STRIPE_WEBHOOK_SECRET")), "smtp_host_present": bool(os.getenv("SMTP_HOST"))},
            "runtime": {"mode": "bounded-synchronous-and-worker" if enabled() else "bounded-synchronous", "durable_queue": enabled(), "worker_required": True, "worker_slots": EXECUTION_SLOTS, "job_deadline_seconds": EXECUTION_SECONDS},
            "jobs": dict(db.execute(select(SimulationJob.status, func.count()).group_by(SimulationJob.status)).all()),
            "incidents": [{"id": event.id, "kind": event.action, "model": event.target_id,
                           "code": event.details.get("code", "unspecified"), "status": event.details.get("status"),
                           "created_at": utc_value(event.created_at)} for event in incidents],
            "limitations": "Incident recording begins with this release and covers private scientific execution failures and allowance denials. Presence flags do not prove provider health. No raw request, prediction, credential or exception text is included."}
