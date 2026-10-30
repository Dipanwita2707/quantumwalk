"""Versioned multi-concept missions with private evidence and one-time rewards."""
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from collaboration_routes import audit, privileged
from completion_models import BossAttempt, BossDefinition
from database import utc_value
from extended_models import MissionEvent, RewardEvent
from laboratory_routes import ASSESSMENTS, owned_run
from limits import enforce_rate
from science_models import LABS

router = APIRouter(prefix="/api/v1")
BUILTIN = {"wave-detective": {"title": "Wave detective", "objective": "Connect coherence and barrier transmission using two reproducible experiments.", "prerequisites": ["double-slit"], "xp": 250,
    "steps": [{"lab_slug": "double-slit", "instructions": "Compare a coherent pattern with your prediction."}, {"lab_slug": "tunnelling", "instructions": "Explain what changing barrier width does to transmission."}]}}


class BossStep(BaseModel):
    model_config = ConfigDict(extra="forbid")
    lab_slug: str = Field(max_length=80)
    instructions: str = Field(min_length=10, max_length=1500)


class BossInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=120)
    objective: str = Field(min_length=20, max_length=2000)
    prerequisites: list[str] = Field(default_factory=list, max_length=5)
    xp: int = Field(ge=0, le=500)
    steps: list[BossStep] = Field(min_length=2, max_length=5)
    status: Literal["active", "retired"] = "active"
    expected_version: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def implemented_steps(self):
        slugs = [step.lab_slug for step in self.steps]
        if len(set(slugs)) != len(slugs) or any(slug not in LABS or slug not in ASSESSMENTS for slug in [*slugs, *self.prerequisites]):
            raise ValueError("Choose distinct implemented labs and supported mastery prerequisites")
        return self


def snapshot(content):
    return {**{key: value for key, value in content.items() if key != "steps"}, "steps": [
        {**step, "model_version": LABS[step["lab_slug"]].version, "question": ASSESSMENTS[step["lab_slug"]][0],
         "choices": ASSESSMENTS[step["lab_slug"]][1], "correct_choice": ASSESSMENTS[step["lab_slug"]][2]}
        for step in content["steps"]]}


def definition(db, slug):
    row = db.get(BossDefinition, slug)
    if row:
        if row.status == "retired": raise HTTPException(404, "Boss mission not available")
        return row.content, row.version
    if slug not in BUILTIN: raise HTTPException(404, "Boss mission not found")
    return snapshot(BUILTIN[slug]), 1


def public_definition(slug, content, version):
    return {"slug": slug, "version": version, **{key: value for key, value in content.items() if key != "steps"},
            "steps": [{key: value for key, value in step.items() if key != "correct_choice"} for step in content["steps"]]}


@router.get("/boss-missions")
def bosses(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    records = {row.slug: row for row in db.scalars(select(BossDefinition))}
    completed = set(db.scalars(select(MissionEvent.mission_slug).where(MissionEvent.user_id == auth.user.id, MissionEvent.completed.is_(True))))
    earned = set(db.scalars(select(RewardEvent.event_key).where(RewardEvent.user_id == auth.user.id)))
    output = []
    for slug in dict.fromkeys([*BUILTIN, *records]):
        if slug in records and records[slug].status == "retired": continue
        content, version = definition(db, slug)
        output.append({**public_definition(slug, content, version), "locked": any(item not in completed for item in content["prerequisites"]), "reward_recorded": f"boss:{slug}:mastery" in earned})
    return output


@router.put("/admin/boss-missions/{slug}")
def author_boss(slug: str, body: BossInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    import re
    if not re.fullmatch(r"[a-z][a-z0-9-]{1,59}", slug): raise HTTPException(422, "Use a short lowercase mission slug")
    row = db.scalar(select(BossDefinition).where(BossDefinition.slug == slug).with_for_update())
    current = row.version if row else 1 if slug in BUILTIN else 0
    if current != body.expected_version: raise HTTPException(409, "Mission definition changed. Reload before saving")
    if not row:
        row = BossDefinition(slug=slug, creator_user_id=auth.user.id); db.add(row)
    row.version = current + 1; row.status = body.status
    row.content = snapshot(body.model_dump(exclude={"status", "expected_version"}))
    audit(db, auth.user.id, "boss.definition_saved", slug, {"version": row.version, "status": row.status})
    try: db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Mission definition changed. Reload and retry") from None
    return {"slug": slug, "version": row.version, "status": row.status}


@router.get("/admin/boss-missions")
def author_catalog(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    records = {row.slug: row for row in db.scalars(select(BossDefinition))}
    return [{**public_definition(slug, records[slug].content if slug in records else snapshot(BUILTIN[slug]), records[slug].version if slug in records else 1),
             "status": records[slug].status if slug in records else "active"}
            for slug in dict.fromkeys([*BUILTIN, *records])]


class StepEvidence(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    run_id: str = Field(max_length=36)
    choice: int = Field(ge=0, le=5)
    reflection: str = Field(min_length=20, max_length=2000)


class BossEvidence(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    version: int = Field(ge=1)
    steps: list[StepEvidence] = Field(min_length=2, max_length=5)
    reflection: str = Field(min_length=40, max_length=4000)


@router.post("/boss-missions/{slug}/attempts", status_code=201)
def attempt(slug: str, body: BossEvidence, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    enforce_rate(request, "boss-attempt", 20)
    content, version = definition(db, slug)
    if body.version != version or len(body.steps) != len(content["steps"]): raise HTTPException(409, "Mission version changed. Reopen the current definition")
    mastered = set(db.scalars(select(MissionEvent.mission_slug).where(MissionEvent.user_id == auth.user.id, MissionEvent.completed.is_(True))))
    if any(item not in mastered for item in content["prerequisites"]): raise HTTPException(409, "Complete the required mastery checkpoints first")
    if db.scalar(select(func.count()).select_from(BossAttempt).where(BossAttempt.owner_user_id == auth.user.id)) >= 1000: raise HTTPException(429, "Saved boss-attempt limit reached")
    results, evidence = [], []
    for step, submitted in zip(content["steps"], body.steps):
        run = owned_run(db, submitted.run_id, auth.user.id)
        if run.lab_slug != step["lab_slug"] or run.model_version != step["model_version"] or run.status != "completed": raise HTTPException(422, "Every checkpoint needs a completed matching model/version run")
        correct = submitted.choice == step["correct_choice"]
        results.append({"lab_slug": step["lab_slug"], "passed": correct, "feedback": "Checkpoint supported by your saved evidence." if correct else "Review the model assumptions and your result before trying again."})
        evidence.append({**submitted.model_dump(), "model_version": run.model_version})
    passed = all(item["passed"] for item in results)
    if not db.get(BossDefinition, slug):
        try:
            with db.begin_nested():
                db.add(BossDefinition(slug=slug, content=content, version=version, status="active")); db.flush()
        except IntegrityError: pass
    record = BossAttempt(owner_user_id=auth.user.id, boss_slug=slug, boss_version=version, definition_snapshot=public_definition(slug, content, version), evidence=evidence, reflection=body.reflection, passed=passed)
    db.add(record)
    key = f"boss:{slug}:mastery"
    eligible = passed and not db.scalar(select(RewardEvent.id).where(RewardEvent.user_id == auth.user.id, RewardEvent.event_key == key))
    reward = content["xp"] if eligible else 0
    if eligible: db.add(RewardEvent(user_id=auth.user.id, event_key=key, xp=reward, reason=f"Evidence-based boss mastery: {content['title']}"))
    try: db.commit(); db.refresh(record)
    except IntegrityError:
        db.rollback()
        if not db.scalar(select(RewardEvent.id).where(RewardEvent.user_id == auth.user.id, RewardEvent.event_key == key)):
            raise HTTPException(409, "The evidence could not be saved. Reload and retry") from None
        return {"passed": passed, "xp_awarded": 0, "steps": results, "feedback": "A concurrent submission already recorded this reward."}
    return {"id": record.id, "passed": passed, "xp_awarded": reward, "steps": results, "feedback": "Boss evidence recorded."}


@router.get("/boss-attempts")
def attempts(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return [{"id": row.id, "boss_slug": row.boss_slug, "version": row.boss_version, "passed": row.passed, "created_at": utc_value(row.created_at), "evidence": row.evidence, "reflection": row.reflection} for row in db.scalars(select(BossAttempt).where(BossAttempt.owner_user_id == auth.user.id).order_by(BossAttempt.created_at.desc()).limit(100))]
