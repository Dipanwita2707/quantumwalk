"""Export account-owned product data without authentication secrets or other users' work."""
from sqlalchemy import select

from extended_models import Assignment, ClassMembership, Classroom, CommunityPost, CommunityReport, LabRun, Membership, MissionEvent, Notebook, NotebookEntry, Organization, ReportArtifact, RewardEvent, Submission, Subscription, UsageBucket, UserPreference, UserRole
from completion_models import AssignmentRubric, BossAttempt, BossDefinition, LessonRevision, SimulationJob, SubmissionRubric


def account_product_data(db, user_id):
    def serialize(record):
        return {column.name: getattr(record, column.name) for column in record.__table__.columns if column.name not in {"lease_owner", "request_hash"}}
    owned = [(LabRun, "owner_user_id"), (Notebook, "owner_user_id"), (MissionEvent, "user_id"), (RewardEvent, "user_id"), (ReportArtifact, "owner_user_id"), (Subscription, "owner_user_id"), (UsageBucket, "user_id"), (UserPreference, "user_id"), (UserRole, "user_id"), (Organization, "owner_user_id"), (Membership, "user_id"), (ClassMembership, "user_id"), (Submission, "user_id"), (CommunityPost, "owner_user_id"), (CommunityReport, "reporter_user_id")]
    output = {model.__tablename__: [serialize(record) for record in db.scalars(select(model).where(getattr(model, owner_field) == user_id))] for model, owner_field in owned}
    output["notebook_entries"] = [serialize(record) for record in db.scalars(select(NotebookEntry).join(Notebook).where(Notebook.owner_user_id == user_id))]
    output["classes_taught"] = [serialize(record) for record in db.scalars(select(Classroom).where(Classroom.instructor_user_id == user_id))]
    output["assignments_created"] = [serialize(record) for record in db.scalars(select(Assignment).join(Classroom).where(Classroom.instructor_user_id == user_id))]
    for model in (BossAttempt, SimulationJob):
        output[model.__tablename__] = [serialize(record) for record in db.scalars(select(model).where(model.owner_user_id == user_id))]
    output["authored_lesson_revisions"] = [serialize(record) for record in db.scalars(select(LessonRevision).where(LessonRevision.creator_user_id == user_id))]
    output["authored_boss_definitions"] = [serialize(record) for record in db.scalars(select(BossDefinition).where(BossDefinition.creator_user_id == user_id))]
    output["submission_rubrics"] = [serialize(record) for record in db.scalars(select(SubmissionRubric).join(Submission).where(Submission.user_id == user_id))]
    output["assignment_rubrics_created"] = [serialize(record) for record in db.scalars(select(AssignmentRubric).join(Assignment).join(Classroom).where(Classroom.instructor_user_id == user_id))]
    return output
