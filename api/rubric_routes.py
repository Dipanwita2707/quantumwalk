"""Instructor-owned weighted criteria; server-computed scores and saved snapshots."""
from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from collaboration_routes import audit, authorized_class
from completion_models import AssignmentRubric, SubmissionRubric
from extended_models import Assignment, Submission

router = APIRouter(prefix="/api/v1/faculty")


class Criterion(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(pattern=r"^[a-z][a-z0-9-]{1,39}$")
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=10, max_length=1500)
    weight: int = Field(ge=1, le=100)
    maximum: int = Field(ge=1, le=100)


class RubricInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    criteria: list[Criterion] = Field(min_length=1, max_length=8)

    @model_validator(mode="after")
    def valid_weights(self):
        if sum(item.weight for item in self.criteria) != 100 or len({item.id for item in self.criteria}) != len(self.criteria):
            raise ValueError("Criteria need unique IDs and weights totaling 100")
        return self


def assignment_for(db, assignment_id, user_id, *, teacher=False, lock=False):
    query = select(Assignment).where(Assignment.id == assignment_id)
    if lock:
        query = query.with_for_update()
    assignment = db.scalar(query)
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    authorized_class(db, assignment.classroom_id, user_id, teacher)
    return assignment


@router.get("/assignments/{assignment_id}/rubric")
def rubric(assignment_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    assignment_for(db, assignment_id, auth.user.id)
    record = db.get(AssignmentRubric, assignment_id)
    frozen = bool(db.scalar(select(func.count()).select_from(Submission).where(Submission.assignment_id == assignment_id)))
    return {"definition": record.definition if record else None, "revision": record.revision if record else 0, "frozen": frozen}


@router.put("/assignments/{assignment_id}/rubric")
def save_rubric(assignment_id: str, body: RubricInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    assignment_for(db, assignment_id, auth.user.id, teacher=True, lock=True)
    if db.scalar(select(func.count()).select_from(Submission).where(Submission.assignment_id == assignment_id)):
        raise HTTPException(409, "This rubric is frozen because assignment evidence has been submitted")
    record = db.get(AssignmentRubric, assignment_id)
    if record is None:
        record = AssignmentRubric(assignment_id=assignment_id, revision=0); db.add(record)
    record.definition = body.model_dump(); record.revision += 1
    audit(db, auth.user.id, "assignment.rubric_saved", assignment_id, {"revision": record.revision})
    db.commit()
    return {"definition": record.definition, "revision": record.revision, "frozen": False}


class RatingsInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False, strict=True)
    ratings: dict[str, Annotated[float, Field(ge=0, le=100)]] = Field(min_length=1, max_length=8)
    feedback: str = Field(max_length=5000)


@router.put("/submissions/{submission_id}/rubric-grade")
def grade_with_rubric(submission_id: str, body: RatingsInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    submission = db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(404, "Submission not found")
    assignment_for(db, submission.assignment_id, auth.user.id, teacher=True, lock=True)
    rubric = db.get(AssignmentRubric, submission.assignment_id)
    if not rubric:
        raise HTTPException(409, "This assignment uses ordinary score and feedback grading")
    criteria = {item["id"]: item for item in rubric.definition["criteria"]}
    if set(body.ratings) != set(criteria) or any(body.ratings[key] > item["maximum"] for key, item in criteria.items()):
        raise HTTPException(422, "Provide a supported score for every rubric criterion")
    score = round(sum(body.ratings[key] / item["maximum"] * item["weight"] for key, item in criteria.items()))
    record = db.get(SubmissionRubric, submission_id)
    if record is None:
        record = SubmissionRubric(submission_id=submission_id); db.add(record)
    record.definition_snapshot = rubric.definition; record.ratings = body.ratings; record.revision = rubric.revision
    record.graded_at = datetime.now(timezone.utc)
    submission.score = score; submission.feedback = body.feedback
    audit(db, auth.user.id, "submission.rubric_graded", submission_id, {"rubric_revision": rubric.revision, "score": score})
    db.commit()
    return {"id": submission.id, "score": score, "feedback": submission.feedback, "ratings": record.ratings}
