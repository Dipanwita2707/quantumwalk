"""Owner-scoped run, notebook, assessment and report workflows."""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from database import Progress, User, utc_value
from entitlements import active_plan, consume, usage
from extended_models import LabRun, MissionEvent, Notebook, NotebookEntry, ReportArtifact, RewardEvent, UserPreference
from limits import enforce_rate, simulation_slot
from science_models import LABS, ScienceRequest, run_model
from science_reports import export_report
from operational_events import record_simulation_failure

router = APIRouter(prefix="/api/v1")


class RunInput(ScienceRequest):
    prediction: str = Field(min_length=3, max_length=2000)


class TitleInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=120)


class EntryInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    run_id: str = Field(max_length=36)
    notes: str = Field(default="", max_length=10000)


class NotesInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    notes: str = Field(max_length=10000)


class PreferenceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    experience: Literal["beginner", "intermediate", "advanced"]
    interests: list[Literal["physics", "computing", "atoms", "cosmology", "signals"]] = Field(max_length=5)
    reduced_motion: bool = False
    leaderboard_opt_in: bool = False


def owned_run(db, run_id, user_id):
    run = db.scalar(select(LabRun).where(LabRun.id == run_id, LabRun.owner_user_id == user_id))
    if not run:
        raise HTTPException(404, "Saved experiment not found")
    return run


def run_view(run):
    return {**run.result, "id": run.id, "created_at": utc_value(run.created_at), "prediction": run.prediction, "title": run.result.get("model_card", {}).get("title", LABS[run.lab_slug].title)}


@router.post("/labs/{slug}/runs", status_code=201)
def execute(slug: str, body: RunInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    return create_run(slug, body, request, auth, db)


def create_run(slug, body, request, auth, db, *, context=None):
    if slug not in LABS:
        raise HTTPException(404, "Lab not found")
    from science_routes import detail
    card = detail(slug, db)
    enforce_rate(request, "science-private", 30)
    try:
        consume(db, auth.user.id, "lab.run")
        with simulation_slot():
            result = run_model(slug, body)
        result["model_card"] = card
        if context is not None:
            result["analysis_context"] = context
        record = LabRun(owner_user_id=auth.user.id, lab_slug=slug, model_version=LABS[slug].version, status="completed", prediction=body.prediction, result=result)
        db.add(record); db.commit(); db.refresh(record)
        return run_view(record)
    except ValueError as error:
        record_simulation_failure(db, auth.user.id, slug, 422, "invalid_model_input")
        raise HTTPException(422, str(error)) from None
    except HTTPException as error:
        record_simulation_failure(db, auth.user.id, slug, error.status_code, "allowance_or_resource_limit")
        raise
    except (ArithmeticError, RuntimeError, TimeoutError):
        record_simulation_failure(db, auth.user.id, slug, 503, "model_execution_failed")
        raise HTTPException(503, "The model could not complete this run. Your inputs have not been saved as a successful result.") from None


class BatchInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    runs: list[RunInput] = Field(min_length=1, max_length=10)


@router.post("/labs/{slug}/batch", status_code=201)
def batch(slug: str, body: BatchInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    if slug not in LABS:
        raise HTTPException(404, "Lab not found")
    from science_routes import detail
    card = detail(slug, db)
    enforce_rate(request, "science-batch", 5)
    try:
        consume(db, auth.user.id, "batch.run", len(body.runs))
        consume(db, auth.user.id, "lab.run", len(body.runs))
        with simulation_slot():
            results = [run_model(slug, item) for item in body.runs]
        for result in results:
            result["model_card"] = card
        records = [LabRun(owner_user_id=auth.user.id, lab_slug=slug, model_version=LABS[slug].version, status="completed", prediction=item.prediction, result=result) for item, result in zip(body.runs, results)]
        db.add_all(records); db.commit()
        return {"items": [run_view(record) for record in records]}
    except ValueError as error:
        raise HTTPException(422, str(error)) from None


@router.get("/runs")
def list_runs(q: str = Query(default="", max_length=120), offset: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100), auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    statement = select(LabRun).where(LabRun.owner_user_id == auth.user.id)
    if q:
        slugs = [lab.slug for lab in LABS.values() if q.lower() in f"{lab.title} {lab.domain}".lower()]
        statement = statement.where(LabRun.lab_slug.in_(slugs))
    total = db.scalar(select(func.count()).select_from(statement.subquery()))
    records = db.scalars(statement.order_by(LabRun.created_at.desc(), LabRun.id).offset(offset).limit(limit)).all()
    return {"items": [run_view(run) for run in records], "total": total, "offset": offset, "limit": limit}


@router.get("/runs/{run_id}")
def get_run(run_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return run_view(owned_run(db, run_id, auth.user.id))


@router.delete("/runs/{run_id}", status_code=204)
def delete_run(run_id: str, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    db.delete(owned_run(db, run_id, auth.user.id)); db.commit()
    return Response(status_code=204)


@router.get("/runs/{run_id}/export")
def download(run_id: str, format: Literal["json", "csv"], request: Request, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    enforce_rate(request, "report", 20)
    run = owned_run(db, run_id, auth.user.id)
    payload, media_type = export_report(run, format)
    return Response(payload, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="quantumwalk-{run.lab_slug}-{run.id}.{format}"'})


class ReportInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    run_id: str = Field(max_length=36)
    format: Literal["json", "csv", "pdf"]


@router.post("/reports", status_code=201)
def create_report(body: ReportInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    enforce_rate(request, "report", 20)
    run = owned_run(db, body.run_id, auth.user.id)
    if body.format == "pdf":
        consume(db, auth.user.id, "report.pdf")
    payload, _ = export_report(run, body.format)
    report = ReportArtifact(owner_user_id=auth.user.id, run_id=run.id, format=body.format, checksum=hashlib.sha256(payload).hexdigest())
    db.add(report); db.commit()
    return {"id": report.id, "status": "completed", "checksum": report.checksum, "download": f"/api/v1/reports/{report.id}/download"}


@router.get("/reports/{report_id}/download")
def report_download(report_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    report = db.scalar(select(ReportArtifact).where(ReportArtifact.id == report_id, ReportArtifact.owner_user_id == auth.user.id))
    if not report:
        raise HTTPException(404, "Report not found")
    payload, media_type = export_report(owned_run(db, report.run_id, auth.user.id), report.format)
    digest = hashlib.sha256(payload).hexdigest()
    if digest != report.checksum:
        raise HTTPException(409, "The report renderer changed. Generate a new report from the saved experiment")
    return Response(payload, media_type=media_type, headers={"Content-Disposition": f'attachment; filename="quantumwalk-report.{report.format}"', "X-Content-SHA256": digest})


@router.get("/notebooks")
def notebooks(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return [{"id": item.id, "title": item.title} for item in db.scalars(select(Notebook).where(Notebook.owner_user_id == auth.user.id).order_by(Notebook.created_at.desc()).limit(100))]


@router.post("/notebooks", status_code=201)
def new_notebook(body: TitleInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    if db.scalar(select(func.count()).select_from(Notebook).where(Notebook.owner_user_id == auth.user.id)) >= 100:
        raise HTTPException(429, "Notebook limit reached")
    notebook = Notebook(owner_user_id=auth.user.id, title=body.title)
    db.add(notebook); db.commit()
    return {"id": notebook.id, "title": notebook.title}


def owned_notebook(db, notebook_id, user_id):
    item = db.scalar(select(Notebook).where(Notebook.id == notebook_id, Notebook.owner_user_id == user_id))
    if not item:
        raise HTTPException(404, "Notebook not found")
    return item


@router.get("/notebooks/{notebook_id}/entries")
def entries(notebook_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    owned_notebook(db, notebook_id, auth.user.id)
    return [{"id": entry.id, "run_id": entry.run_id, "notes": entry.notes} for entry in db.scalars(select(NotebookEntry).where(NotebookEntry.notebook_id == notebook_id).order_by(NotebookEntry.created_at.desc()).limit(100))]


@router.post("/notebooks/{notebook_id}/entries", status_code=201)
def new_entry(notebook_id: str, body: EntryInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    owned_notebook(db, notebook_id, auth.user.id); owned_run(db, body.run_id, auth.user.id)
    if db.scalar(select(func.count()).select_from(NotebookEntry).where(NotebookEntry.notebook_id == notebook_id)) >= 100:
        raise HTTPException(429, "Notebook entry limit reached")
    entry = NotebookEntry(notebook_id=notebook_id, run_id=body.run_id, notes=body.notes)
    db.add(entry); db.commit()
    return {"id": entry.id, "run_id": entry.run_id, "notes": entry.notes}


@router.put("/notebooks/{notebook_id}/entries/{entry_id}")
def update_entry(notebook_id: str, entry_id: str, body: NotesInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    owned_notebook(db, notebook_id, auth.user.id)
    entry = db.scalar(select(NotebookEntry).where(NotebookEntry.id == entry_id, NotebookEntry.notebook_id == notebook_id))
    if not entry:
        raise HTTPException(404, "Entry not found")
    entry.notes = body.notes; db.commit()
    return {"id": entry.id, "notes": entry.notes}


ASSESSMENTS = {
    "double-slit": ("What removes interference in this model?", ["Which-path information removes coherence", "The observer's consciousness"], 0),
    "tunnelling": ("For energy below the barrier, widening it generally…", ["Increases transmission", "Decreases transmission"], 1),
    "hydrogen": ("An orbital describes…", ["A planetary electron path", "A probability distribution"], 1),
    "oscillator": ("The ground-state energy is…", ["Zero", "One half ℏω"], 1),
    "bell": ("A finite-shot CHSH estimate…", ["Has sampling uncertainty", "Always equals the ideal value"], 0),
    "lensing": ("This lensing model uses…", ["Quantum gravity", "Classical weak-field general relativity"], 1),
    "cosmic-structure": ("Linear growth in this toy model…", ["Scales existing fluctuations", "Solves nonlinear galaxy formation"], 0),
    "fusion": ("The Gamow factor alone is…", ["A complete stellar fusion rate", "A barrier-penetration approximation"], 1),
    "spectrum": ("The spectrum here comes from…", ["Synthetic sampled data", "An observed star"], 0),
}
PREREQUISITES = {"tunnelling": "double-slit", "oscillator": "double-slit", "bell": "double-slit", "cosmic-structure": "lensing", "fusion": "tunnelling"}


@router.get("/missions")
def missions(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    completed = set(db.scalars(select(MissionEvent.mission_slug).where(MissionEvent.user_id == auth.user.id, MissionEvent.completed.is_(True))))
    return [{"slug": slug, "title": lab.title, "objective": lab.objective, "question": ASSESSMENTS[slug][0], "choices": ASSESSMENTS[slug][1], "completed": slug in completed, "locked": slug in PREREQUISITES and PREREQUISITES[slug] not in completed, "prerequisite": LABS[PREREQUISITES[slug]].title if slug in PREREQUISITES else None, "xp": 100, "criteria": "Run the model with a prediction, answer the checkpoint correctly, and reflect on your result.", "hint": lab.limitations, "hint_penalty": 0} for slug, lab in LABS.items()]


class MissionInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    run_id: str = Field(max_length=36)
    choice: int = Field(ge=0, le=1)
    reflection: str = Field(min_length=20, max_length=2000)


@router.post("/missions/{slug}/events")
def checkpoint(slug: str, body: MissionInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    if slug not in LABS:
        raise HTTPException(404, "Mission not found")
    prerequisite = PREREQUISITES.get(slug)
    if prerequisite and not db.scalar(select(MissionEvent.id).where(MissionEvent.user_id == auth.user.id, MissionEvent.mission_slug == prerequisite, MissionEvent.completed.is_(True))):
        raise HTTPException(409, f"Complete {LABS[prerequisite].title} first")
    run = owned_run(db, body.run_id, auth.user.id)
    if run.lab_slug != slug or run.status != "completed":
        raise HTTPException(422, "Complete the matching experiment first")
    correct = body.choice == ASSESSMENTS[slug][2]
    if not correct:
        return {"completed": False, "xp_awarded": 0, "feedback": LABS[slug].limitations}
    existing = db.scalar(select(MissionEvent).where(MissionEvent.user_id == auth.user.id, MissionEvent.mission_slug == slug))
    if existing:
        return {"completed": existing.completed, "xp_awarded": 0, "feedback": "This mission is already recorded."}
    db.add(MissionEvent(user_id=auth.user.id, mission_slug=slug, run_id=run.id, choice=body.choice, reflection=body.reflection, completed=True))
    db.add(RewardEvent(user_id=auth.user.id, event_key=f"mission:{slug}:v1", xp=100, reason=f"Completed {LABS[slug].title}"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"completed": True, "xp_awarded": 0, "feedback": "This mission is already recorded."}
    return {"completed": True, "xp_awarded": 100, "feedback": "Checkpoint passed. Your prediction, run and reflection are recorded."}


@router.get("/me/progress")
def progress(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    xp = db.scalar(select(func.coalesce(func.sum(RewardEvent.xp), 0)).where(RewardEvent.user_id == auth.user.id))
    xp += db.scalar(select(func.coalesce(func.sum(Progress.score), 0)).where(Progress.user_id == auth.user.id))
    completed = list(db.scalars(select(MissionEvent).where(MissionEvent.user_id == auth.user.id, MissionEvent.completed.is_(True))))
    days = {utc_value(item.created_at).date() for item in completed}
    return {"xp": xp, "level": 1 + xp // 500, "streak_days": mastery_streak(days), "streak_basis": "Consecutive UTC dates with a newly validated scientific mission; earned XP is never removed", "badges": [{"slug": item.mission_slug, "title": LABS[item.mission_slug].title, "reason": "Prediction, completed experiment, correct checkpoint and reflection recorded", "earned_at": utc_value(item.created_at)} for item in completed], "plan": {key: value for key, value in active_plan(db, auth.user.id).items() if key != "price_id"}, "usage": usage(db, auth.user.id), "reset": "00:00 UTC"}


def mastery_streak(days, today=None):
    today = today or datetime.now(timezone.utc).date()
    cursor = today if today in days else today - timedelta(days=1)
    count = 0
    while cursor in days:
        count += 1
        cursor -= timedelta(days=1)
    return count


@router.get("/me/preferences")
def preferences(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    record = db.get(UserPreference, auth.user.id)
    return {"experience": record.experience if record else "beginner", "interests": record.interests if record else [], "reduced_motion": record.reduced_motion if record else False, "leaderboard_opt_in": record.leaderboard_opt_in if record else False}


@router.put("/me/preferences")
def save_preferences(body: PreferenceInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    record = db.get(UserPreference, auth.user.id)
    if not record:
        record = UserPreference(user_id=auth.user.id); db.add(record)
    record.experience = body.experience; record.interests = list(set(body.interests)); record.reduced_motion = body.reduced_motion
    record.leaderboard_opt_in = body.leaderboard_opt_in
    db.commit()
    return body


@router.get("/leaderboard")
def leaderboard(period: Literal["week", "month"] = "week", auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7 if period == "week" else 30)
    score = func.sum(RewardEvent.xp)
    statement = select(User.display_name, score.label("xp")).join(RewardEvent, RewardEvent.user_id == User.id).join(UserPreference, UserPreference.user_id == User.id).where(UserPreference.leaderboard_opt_in.is_(True), RewardEvent.created_at >= start).group_by(User.id, User.display_name).order_by(score.desc(), User.id).limit(50)
    return {"period": period, "since": start.isoformat(), "category": "Validated scientific missions", "players": [{"rank": index + 1, "display_name": name, "xp": xp} for index, (name, xp) in enumerate(db.execute(statement))]}
