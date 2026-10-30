"""Explicit sharing, instructor-scoped assessment and audited administration."""
import hashlib
import os
import secrets
import csv
import io
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import AuthContext, current_auth, get_db, require_csrf
from database import Identity, User, utc_value
from entitlements import consume
from extended_models import Assignment, AuditEvent, ClassMembership, Classroom, CommunityPost, CommunityReport, LabDefinition, LabRun, Membership, Organization, Plan, PlanEntitlement, Submission, Subscription, UserRole
from laboratory_routes import TitleInput, owned_run, run_view
from limits import enforce_rate
from science_models import LABS, definition
from completion_models import AssignmentRubric, SubmissionRubric

router = APIRouter(prefix="/api/v1")


def roles(db, user_id):
    values = set(db.scalars(select(UserRole.role).where(UserRole.user_id == user_id)))
    subjects = set(filter(None, os.getenv("QUANTUMWALK_ADMIN_GOOGLE_SUBJECTS", "").split(",")))
    if subjects and db.scalar(select(Identity.id).where(Identity.user_id == user_id, Identity.provider == "google", Identity.provider_subject.in_(subjects))):
        values.add("admin")
    return values


def privileged(db, user_id, allowed):
    if not roles(db, user_id).intersection(allowed):
        raise HTTPException(403, "This action requires an authorized role")


def audit(db, user_id, action, target, details=None):
    db.add(AuditEvent(actor_user_id=user_id, action=action, target_id=target, details=details or {}))


@router.get("/me/roles")
def my_roles(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return sorted(roles(db, auth.user.id))


@router.get("/community/posts")
def posts(q: str = Query("", max_length=120), category: Literal["all", "discussion", "project", "event"] = "all", offset: int = Query(0, ge=0), auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    statement = select(CommunityPost).where(CommunityPost.hidden.is_(False))
    if category != "all": statement = statement.where(CommunityPost.category == category)
    if q: statement = statement.where(CommunityPost.title.icontains(q, autoescape=True))
    return [{"id": row.id, "title": row.title, "body": row.body, "category": row.category, "created_at": utc_value(row.created_at), "mine": row.owner_user_id == auth.user.id} for row in db.scalars(statement.order_by(CommunityPost.created_at.desc()).offset(offset).limit(20))]


class PostInput(TitleInput):
    body: str = Field(min_length=10, max_length=10000)
    category: Literal["discussion", "project", "event"]
    consent_public: Literal[True]


@router.post("/community/posts", status_code=201)
def publish(body: PostInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    enforce_rate(request, "community-publish", 5)
    post = CommunityPost(owner_user_id=auth.user.id, title=body.title, body=body.body, category=body.category)
    db.add(post); db.commit()
    return {"id": post.id, "visibility": "community"}


@router.delete("/community/posts/{post_id}", status_code=204)
def remove_post(post_id: str, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    post = db.get(CommunityPost, post_id)
    if not post or post.owner_user_id != auth.user.id:
        raise HTTPException(404, "Post not found")
    db.delete(post); db.commit(); return Response(status_code=204)


class ReasonInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=10, max_length=500)


@router.post("/community/posts/{post_id}/report")
def report_post(post_id: str, body: ReasonInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    enforce_rate(request, "community-report", 10)
    if not db.get(CommunityPost, post_id): raise HTTPException(404, "Post not found")
    existing = db.scalar(select(CommunityReport).where(CommunityReport.post_id == post_id, CommunityReport.reporter_user_id == auth.user.id))
    if not existing:
        db.add(CommunityReport(post_id=post_id, reporter_user_id=auth.user.id, reason=body.reason)); db.commit()
    return {"reported": True}


@router.get("/faculty/classes")
def classes(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    member_ids = select(ClassMembership.classroom_id).where(ClassMembership.user_id == auth.user.id)
    records = db.scalars(select(Classroom).where((Classroom.instructor_user_id == auth.user.id) | Classroom.id.in_(member_ids)))
    return [{"id": item.id, "title": item.title, "instructor": item.instructor_user_id == auth.user.id} for item in records]


@router.post("/faculty/organizations", status_code=201)
def create_org(body: TitleInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "faculty"})
    consume(db, auth.user.id, "class.dashboard")
    organization = Organization(owner_user_id=auth.user.id, name=body.title)
    db.add(organization); db.flush(); db.add(Membership(organization_id=organization.id, user_id=auth.user.id, role="instructor")); db.commit()
    return {"id": organization.id, "name": organization.name}


@router.get("/faculty/organizations")
def organizations(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return [{"id": row.id, "name": row.name} for row in db.scalars(select(Organization).where(Organization.owner_user_id == auth.user.id))]


class ClassroomInput(TitleInput):
    organization_id: str = Field(max_length=36)


@router.post("/faculty/classes", status_code=201)
def create_class(body: ClassroomInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "faculty"})
    organization = db.get(Organization, body.organization_id)
    if not organization or organization.owner_user_id != auth.user.id: raise HTTPException(404, "Organization not found")
    consume(db, auth.user.id, "class.dashboard")
    code = secrets.token_urlsafe(24)
    record = Classroom(organization_id=organization.id, instructor_user_id=auth.user.id, title=body.title, join_code_hash=hashlib.sha256(code.encode()).hexdigest())
    db.add(record); db.flush(); audit(db, auth.user.id, "class.create", record.id); db.commit()
    return {"id": record.id, "title": record.title, "join_code": code}


class JoinInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=20, max_length=80)


@router.post("/faculty/classes/join")
def join_class(body: JoinInput, request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    enforce_rate(request, "class-join", 10)
    record = db.scalar(select(Classroom).where(Classroom.join_code_hash == hashlib.sha256(body.code.encode()).hexdigest()))
    if not record: raise HTTPException(404, "Class invitation not found")
    if not db.get(ClassMembership, (record.id, auth.user.id)):
        db.add(ClassMembership(classroom_id=record.id, user_id=auth.user.id)); db.commit()
    return {"id": record.id, "title": record.title}


def authorized_class(db, classroom_id, user_id, instructor=False):
    record = db.get(Classroom, classroom_id)
    if not record or (record.instructor_user_id != user_id and (instructor or not db.get(ClassMembership, (classroom_id, user_id)))):
        raise HTTPException(404, "Class not found")
    return record


class AssignmentInput(TitleInput):
    lab_slug: str = Field(max_length=80)
    instructions: str = Field(min_length=10, max_length=10000)
    due_at: datetime


@router.post("/faculty/classes/{class_id}/assignments", status_code=201)
def assign(class_id: str, body: AssignmentInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    authorized_class(db, class_id, auth.user.id, True)
    if body.lab_slug not in LABS or body.due_at.tzinfo is None or body.due_at <= datetime.now(timezone.utc): raise HTTPException(422, "Choose a supported lab and future deadline with a timezone")
    assignment = Assignment(classroom_id=class_id, title=body.title, lab_slug=body.lab_slug, instructions=body.instructions, due_at=body.due_at.astimezone(timezone.utc))
    db.add(assignment); db.commit()
    return {"id": assignment.id}


@router.get("/faculty/classes/{class_id}/assignments")
def assignments(class_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    record = authorized_class(db, class_id, auth.user.id)
    return [{"id": row.id, "title": row.title, "lab_slug": row.lab_slug, "instructions": row.instructions, "due_at": utc_value(row.due_at), "submissions": db.scalar(select(func.count()).select_from(Submission).where(Submission.assignment_id == row.id)) if record.instructor_user_id == auth.user.id else None} for row in db.scalars(select(Assignment).where(Assignment.classroom_id == class_id))]


@router.get("/faculty/classes/{class_id}/analytics")
def class_analytics(class_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    authorized_class(db, class_id, auth.user.id, True)
    students = db.scalar(select(func.count()).select_from(ClassMembership).where(ClassMembership.classroom_id == class_id))
    count = db.scalar(select(func.count()).select_from(Assignment).where(Assignment.classroom_id == class_id))
    submitted, graded, mean = db.execute(select(func.count(Submission.id), func.count(Submission.score), func.avg(Submission.score)).join(Assignment).where(Assignment.classroom_id == class_id)).one()
    return {"students": students, "assignments": count, "submissions": submitted, "graded": graded, "average_score": round(mean, 2) if mean is not None else None, "completion_percent": round(100 * submitted / (students * count), 1) if students and count else 0}


@router.get("/faculty/classes/{class_id}/analytics/export")
def export_class_analytics(class_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    values = class_analytics(class_id, auth, db)
    output = io.StringIO(newline=""); writer = csv.writer(output)
    writer.writerow(values.keys()); writer.writerow(values.values())
    audit(db, auth.user.id, "class.analytics_export", class_id); db.commit()
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="class-analytics.csv"'})


class SubmissionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    run_id: str = Field(max_length=36)
    reflection: str = Field(min_length=20, max_length=10000)


@router.post("/faculty/assignments/{assignment_id}/submissions")
def submit(assignment_id: str, body: SubmissionInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    assignment = db.scalar(select(Assignment).where(Assignment.id == assignment_id).with_for_update())
    if not assignment: raise HTTPException(404, "Assignment not found")
    authorized_class(db, assignment.classroom_id, auth.user.id)
    run = owned_run(db, body.run_id, auth.user.id)
    if run.lab_slug != assignment.lab_slug: raise HTTPException(422, "The saved run must match the assigned lab")
    deadline = assignment.due_at.replace(tzinfo=timezone.utc) if assignment.due_at.tzinfo is None else assignment.due_at
    if datetime.now(timezone.utc) > deadline: raise HTTPException(409, "The assignment deadline has passed")
    existing = db.scalar(select(Submission).where(Submission.assignment_id == assignment_id, Submission.user_id == auth.user.id))
    if existing: raise HTTPException(409, "This assignment has already been submitted")
    record = Submission(assignment_id=assignment_id, user_id=auth.user.id, run_id=run.id, reflection=body.reflection)
    db.add(record); db.commit()
    return {"id": record.id}


@router.get("/faculty/assignments/{assignment_id}/submissions")
def submissions(assignment_id: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    assignment = db.get(Assignment, assignment_id)
    if not assignment: raise HTTPException(404, "Assignment not found")
    classroom = authorized_class(db, assignment.classroom_id, auth.user.id)
    statement = select(Submission).where(Submission.assignment_id == assignment_id)
    if classroom.instructor_user_id != auth.user.id: statement = statement.where(Submission.user_id == auth.user.id)
    rows = list(db.scalars(statement))
    grades = {row.submission_id: row for row in db.scalars(select(SubmissionRubric).where(SubmissionRubric.submission_id.in_([row.id for row in rows])))} if rows else {}
    return [{"id": row.id, "reflection": row.reflection, "score": row.score, "feedback": row.feedback, "run": run_view(db.get(LabRun, row.run_id)), "rubric_grade": {"definition": grades[row.id].definition_snapshot, "ratings": grades[row.id].ratings} if row.id in grades else None} for row in rows]


class GradeInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    score: int = Field(ge=0, le=100)
    feedback: str = Field(max_length=5000)


@router.put("/faculty/submissions/{submission_id}")
def grade(submission_id: str, body: GradeInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    record = db.get(Submission, submission_id)
    if not record: raise HTTPException(404, "Submission not found")
    assignment = db.get(Assignment, record.assignment_id)
    authorized_class(db, assignment.classroom_id, auth.user.id, True)
    if db.get(AssignmentRubric, assignment.id):
        raise HTTPException(409, "Use criterion-based rubric grading for this assignment")
    record.score = body.score; record.feedback = body.feedback; audit(db, auth.user.id, "submission.grade", record.id); db.commit()
    return {"id": record.id, "score": record.score, "feedback": record.feedback}


@router.get("/admin/audit")
def audit_log(offset: int = Query(0, ge=0), auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin"})
    audit(db, auth.user.id, "audit.read", "audit_events"); db.commit()
    return [{"id": row.id, "action": row.action, "target": row.target_id, "created_at": utc_value(row.created_at), "details": row.details} for row in db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).offset(offset).limit(50))]


@router.get("/admin/content")
def content(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    records = {row.slug: row for row in db.scalars(select(LabDefinition))}
    editable = ["title", "question", "objective", "assumptions", "limitations"]
    return [{"slug": slug, "title": lab.title, "version": lab.version, "status": records[slug].status if slug in records else "educational-preview", "limitations": lab.limitations, "draft": {key: records[slug].content.get("draft", records[slug].content.get("published", {})).get(key, getattr(lab, key)) if slug in records else getattr(lab, key) for key in editable}, "content_version": records[slug].content.get("content_version", 0) if slug in records else 0} for slug, lab in LABS.items()]


class ReviewInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["approved", "retired", "draft"]
    rationale: str = Field(min_length=20, max_length=2000)


class ContentDraft(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=3, max_length=120)
    question: str = Field(min_length=10, max_length=500)
    objective: str = Field(min_length=10, max_length=1000)
    assumptions: str = Field(min_length=20, max_length=3000)
    limitations: str = Field(min_length=20, max_length=3000)


@router.put("/admin/content/{slug}/draft")
def save_content_draft(slug: str, body: ContentDraft, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    if slug not in LABS:
        raise HTTPException(404, "Choose an implemented scientific model")
    record = db.scalar(select(LabDefinition).where(LabDefinition.slug == slug))
    if not record:
        record = LabDefinition(slug=slug, version=LABS[slug].version, status="draft", content={}); db.add(record)
    version = record.content.get("content_version", 0) + 1
    record.content = {**record.content, "draft": body.model_dump(), "content_version": version}
    audit(db, auth.user.id, "content.draft_saved", slug, {"content_version": version, "snapshot": body.model_dump()})
    db.commit()
    return {"slug": slug, "content_version": version, "published": False}


@router.get("/admin/content/{slug}/versions")
def content_versions(slug: str, auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    return [{"id": event.id, "created_at": utc_value(event.created_at), **event.details} for event in db.scalars(select(AuditEvent).where(AuditEvent.target_id == slug, AuditEvent.action == "content.draft_saved").order_by(AuditEvent.created_at.desc()).limit(100))]


@router.put("/admin/content/{slug}")
def review(slug: str, body: ReviewInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "reviewer"})
    if slug not in LABS: raise HTTPException(404, "Lab not found")
    record = db.scalar(select(LabDefinition).where(LabDefinition.slug == slug))
    if not record: record = LabDefinition(slug=slug, version=LABS[slug].version, content=definition(LABS[slug])); db.add(record)
    record.status = body.status; record.reviewer_user_id = auth.user.id
    if body.status == "approved":
        record.version = LABS[slug].version
        record.content = {**record.content, "published": record.content.get("draft", record.content.get("published", {})), "published_version": record.content.get("content_version", 0)}
    audit(db, auth.user.id, "content.review", slug, {"status": body.status, "rationale": body.rationale}); db.commit()
    return {"slug": slug, "status": record.status}


class RoleInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str = Field(max_length=36)
    role: Literal["faculty", "reviewer", "moderator"]
    grant: bool


@router.post("/admin/roles")
def set_role(body: RoleInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin"})
    if not db.get(User, body.user_id): raise HTTPException(404, "User not found")
    record = db.get(UserRole, (body.user_id, body.role))
    if body.grant and not record: db.add(UserRole(user_id=body.user_id, role=body.role))
    elif not body.grant and record: db.delete(record)
    audit(db, auth.user.id, "role.change", body.user_id, {"role": body.role, "grant": body.grant}); db.commit()
    return {"updated": True}


@router.get("/admin/community-reports")
def moderation(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "moderator"})
    return [{"id": row.id, "post_id": row.post_id, "reason": row.reason, "title": db.get(CommunityPost, row.post_id).title} for row in db.scalars(select(CommunityReport).order_by(CommunityReport.created_at.desc()).limit(100))]


@router.post("/admin/community/{post_id}/hide")
def hide_post(post_id: str, body: ReasonInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    privileged(db, auth.user.id, {"admin", "moderator"})
    post = db.get(CommunityPost, post_id)
    if not post: raise HTTPException(404, "Post not found")
    post.hidden = True; audit(db, auth.user.id, "community.hide", post_id, {"reason": body.reason}); db.commit()
    return {"hidden": True}


class PlanInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    slug: str = Field(min_length=2, max_length=40, pattern=r"^[a-z][a-z0-9-]+$")
    title: str = Field(min_length=2, max_length=120)
    amount_minor: int = Field(gt=0, le=10000000)
    currency: str = Field(pattern=r"^[a-z]{3}$")
    interval: Literal["month", "year"]
    price_id: str = Field(pattern=r"^price_[A-Za-z0-9]+$", max_length=120)
    features: dict[Literal["lab.run", "report.pdf", "batch.run", "class.dashboard"], int]


@router.put("/admin/plans")
async def publish_plan(body: PlanInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    from billing_routes import stripe
    privileged(db, auth.user.id, {"admin"})
    if body.slug == "explorer" or any(value < 0 or value > 10000 for value in body.features.values()):
        raise HTTPException(422, "Invalid paid plan or allowance")
    price = await stripe("GET", "prices/" + body.price_id)
    if price.get("unit_amount") != body.amount_minor or price.get("currency") != body.currency or price.get("recurring", {}).get("interval") != body.interval or not price.get("active"):
        raise HTTPException(422, "The plan must match an active provider price")
    record = db.scalar(select(Plan).where(Plan.slug == body.slug))
    if not record:
        record = Plan(slug=body.slug, configuration={}); db.add(record); db.flush()
    version = record.configuration.get("version", 0) + 1
    record.configuration = {**body.model_dump(), "version": version}
    for feature, limit in body.features.items():
        entitlement = db.get(PlanEntitlement, (record.id, feature))
        if not entitlement: entitlement = PlanEntitlement(plan_id=record.id, feature=feature, daily_limit=limit); db.add(entitlement)
        entitlement.daily_limit = limit
    audit(db, auth.user.id, "plan.publish", record.id, {"slug": body.slug, "version": version}); db.commit()
    return {"slug": body.slug, "version": version}


class InstitutionGrantInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str = Field(max_length=36)
    plan_slug: str = Field(max_length=40)
    expires_at: datetime
    reason: str = Field(min_length=20, max_length=1000)


@router.post("/admin/institution-grants")
def institution_grant(body: InstitutionGrantInput, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    from entitlements import plans
    privileged(db, auth.user.id, {"admin"})
    if not db.get(User, body.user_id):
        raise HTTPException(404, "User not found")
    if not any(plan["slug"] == body.plan_slug for plan in plans(db)):
        raise HTTPException(422, "Choose a configured plan")
    if body.expires_at.tzinfo is None or not 0 < (body.expires_at - datetime.now(timezone.utc)).total_seconds() <= 366 * 86400:
        raise HTTPException(422, "Grant expiry must be within the next 366 days and include a timezone")
    record = db.scalar(select(Subscription).where(Subscription.owner_user_id == body.user_id).with_for_update())
    if record and record.status not in ("institution_granted", "canceled", "incomplete_expired"):
        raise HTTPException(409, "Resolve the existing provider subscription before applying an institutional grant")
    if not record:
        record = Subscription(owner_user_id=body.user_id, provider_id=f"institution_{body.user_id}", customer_id="institution-grant"); db.add(record)
    record.status = "institution_granted"; record.plan_slug = body.plan_slug
    record.provider_id = f"institution_{body.user_id}"; record.customer_id = "institution-grant"
    record.period_end = int(body.expires_at.timestamp()); record.cancel_at_period_end = False
    audit(db, auth.user.id, "institution.grant", body.user_id, {"plan": body.plan_slug, "expires_at": record.period_end, "reason": body.reason}); db.commit()
    return {"status": record.status, "expires_at": record.period_end}
