"""Immutable authored lesson snapshots with explicit reviewed publication."""
from datetime import datetime, timezone
from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from collaboration_routes import audit, privileged
from completion_models import LessonPublication, LessonRevision
from content import LESSONS, LESSON_ANSWERS
from database import utc_value

router = APIRouter()
BUILTINS = {item["slug"]: item for item in LESSONS}


def public_snapshot(base, revision):
    if revision is None:
        return {**base, "content_version": "builtin-1"}
    public = {key: value for key, value in revision.content.items() if key not in ("correct_choice", "published_at")}
    return {**base, **public, "content_version": revision.id, "revision": revision.revision}


def published_lessons(db):
    records = {publication.lesson_slug: (publication, revision) for publication, revision in db.execute(select(LessonPublication, LessonRevision).join(LessonRevision, LessonRevision.id == LessonPublication.revision_id))}
    return [public_snapshot(base, records[slug][1] if slug in records else None) for slug, base in BUILTINS.items() if slug not in records or records[slug][0].state != "retired"]


class LessonDraft(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=3, max_length=120)
    objective: str = Field(min_length=10, max_length=1000)
    level: Literal["Beginner", "Intermediate", "Advanced"]
    minutes: int = Field(ge=1, le=180)
    steps: list[Annotated[str, Field(min_length=3, max_length=1500)]] = Field(min_length=1, max_length=20)
    question: str = Field(min_length=10, max_length=500)
    choices: list[Annotated[str, Field(min_length=1, max_length=300)]] = Field(min_length=2, max_length=6)
    correct_choice: int = Field(ge=0, le=5)

    @model_validator(mode="after")
    def answer_exists(self):
        if self.correct_choice >= len(self.choices) or len(set(self.choices)) != len(self.choices):
            raise ValueError("Choose a valid answer among distinct choices")
        return self


def lesson_content(db, slug, version=None):
    base = BUILTINS.get(slug)
    if base is None:
        raise HTTPException(404, "Lesson not found")
    publication = db.get(LessonPublication, slug)
    if publication and publication.state == "retired":
        raise HTTPException(410, "This lesson has been retired. Choose another learning activity")
    if version in (None, "builtin-1") and (version == "builtin-1" or not publication):
        return public_snapshot(base, None), LESSON_ANSWERS[slug]
    revision = db.get(LessonRevision, publication.revision_id) if version is None and publication else db.scalar(select(LessonRevision).where(LessonRevision.lesson_slug == slug, LessonRevision.id == version, LessonRevision.status == "approved"))
    if not revision or revision.status != "approved":
        raise HTTPException(409, "This lesson version is unavailable. Reload the lesson before answering")
    return public_snapshot(base, revision), revision.content["correct_choice"]


@router.get("/api/lessons/{slug}/versions")
def public_versions(slug: str, db: Session = Depends(get_db)):
    lesson_content(db, slug)
    return [{"content_version": "builtin-1", "title": BUILTINS[slug]["title"], "revision": 0}] + [
        {"content_version": row.id, "revision": row.revision, "title": row.content["title"], "published_at": row.content.get("published_at")}
        for row in db.scalars(select(LessonRevision).where(LessonRevision.lesson_slug == slug, LessonRevision.status == "approved").order_by(LessonRevision.revision.desc()).limit(100))]


@router.get("/api/v1/admin/lessons")
def lesson_catalog(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    publications = {row.lesson_slug: row for row in db.scalars(select(LessonPublication))}
    return [{"slug": slug, "title": base["title"], "publication_id": publications[slug].revision_id if slug in publications else None,
             "state": publications[slug].state if slug in publications else "builtin",
             "draft": {**{key: base[key] for key in LessonDraft.model_fields if key != "correct_choice"}, "correct_choice": LESSON_ANSWERS[slug]}}
            for slug, base in BUILTINS.items()]


@router.get("/api/v1/admin/lessons/{slug}/revisions")
def revisions(slug: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    if slug not in BUILTINS:
        raise HTTPException(404, "Lesson not found")
    return [{"id": row.id, "revision": row.revision, "status": row.status, "content": row.content, "created_at": utc_value(row.created_at)} for row in db.scalars(select(LessonRevision).where(LessonRevision.lesson_slug == slug).order_by(LessonRevision.revision.desc()).limit(100))]


@router.post("/api/v1/admin/lessons/{slug}/revisions", status_code=201)
def create_revision(slug: str, body: LessonDraft, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    if slug not in BUILTINS:
        raise HTTPException(404, "Choose an implemented lesson")
    number = 1 + db.scalar(select(func.coalesce(func.max(LessonRevision.revision), 0)).where(LessonRevision.lesson_slug == slug))
    record = LessonRevision(lesson_slug=slug, revision=number, content=body.model_dump(), status="draft", creator_user_id=auth.user.id)
    db.add(record)
    audit(db, auth.user.id, "lesson.revision_created", slug, {"revision": number})
    try:
        db.commit(); db.refresh(record)
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Another revision was just created. Reload and retry") from None
    return {"id": record.id, "revision": number, "status": "draft"}


class PublishLesson(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rationale: str = Field(min_length=20, max_length=2000)
    expected_publication_id: str | None = Field(default=None, max_length=36)
    state: Literal["active", "retired"] = "active"


@router.put("/api/v1/admin/lessons/{slug}/publish/{revision_id}")
def publish(slug: str, revision_id: str, body: PublishLesson, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    revision = db.scalar(select(LessonRevision).where(LessonRevision.id == revision_id, LessonRevision.lesson_slug == slug))
    if not revision:
        raise HTTPException(404, "Lesson revision not found")
    current = db.scalar(select(LessonPublication).where(LessonPublication.lesson_slug == slug).with_for_update())
    if (current.revision_id if current else None) != body.expected_publication_id:
        raise HTTPException(409, "Publication changed. Reload before reviewing this revision")
    if revision.status == "draft":
        revision.status = "approved"; revision.reviewer_user_id = auth.user.id
        revision.content = {**revision.content, "published_at": datetime.now(timezone.utc).isoformat()}
    if not current:
        current = LessonPublication(lesson_slug=slug, revision_id=revision.id); db.add(current)
    current.revision_id = revision.id; current.state = body.state; current.updated_at = datetime.now(timezone.utc)
    audit(db, auth.user.id, "lesson.publication", slug, {"revision_id": revision.id, "state": body.state, "rationale": body.rationale})
    try:
        db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Publication changed. Reload and retry") from None
    return {"slug": slug, "revision_id": revision.id, "state": current.state}
