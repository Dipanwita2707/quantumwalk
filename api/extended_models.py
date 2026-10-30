"""Additive SRS persistence. All private objects carry an explicit owner scope."""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, CheckConstraint, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from database import Base, utc_now


class Record:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(default=utc_now, nullable=False)


class UserPreference(Base):
    __tablename__ = "user_preferences"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    experience: Mapped[str] = mapped_column(String(20), default="beginner")
    interests: Mapped[list] = mapped_column(JSON, default=list)
    reduced_motion: Mapped[bool] = mapped_column(Boolean, default=False)
    leaderboard_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)


class LabDefinition(Record, Base):
    __tablename__ = "lab_definitions"
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    version: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), default="draft")
    content: Mapped[dict] = mapped_column(JSON)
    reviewer_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))


class LabRun(Record, Base):
    __tablename__ = "lab_runs"
    __table_args__ = (Index("ix_runs_owner_created", "owner_user_id", "created_at"),)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lab_slug: Mapped[str] = mapped_column(String(80))
    model_version: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(20))
    prediction: Mapped[str] = mapped_column(Text)
    result: Mapped[dict] = mapped_column(JSON)


class Notebook(Record, Base):
    __tablename__ = "notebooks"
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))


class NotebookEntry(Record, Base):
    __tablename__ = "notebook_entries"
    notebook_id: Mapped[str] = mapped_column(ForeignKey("notebooks.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("lab_runs.id", ondelete="CASCADE"))
    notes: Mapped[str] = mapped_column(Text, default="")


class MissionEvent(Record, Base):
    __tablename__ = "mission_events"
    __table_args__ = (UniqueConstraint("user_id", "mission_slug", name="uq_mission_user_slug"),)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    mission_slug: Mapped[str] = mapped_column(String(80))
    run_id: Mapped[str] = mapped_column(ForeignKey("lab_runs.id", ondelete="CASCADE"))
    choice: Mapped[int] = mapped_column(Integer)
    reflection: Mapped[str] = mapped_column(Text)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)


class RewardEvent(Record, Base):
    __tablename__ = "reward_events"
    __table_args__ = (UniqueConstraint("user_id", "event_key", name="uq_reward_user_event"), CheckConstraint("xp >= 0", name="ck_reward_xp"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    event_key: Mapped[str] = mapped_column(String(120))
    xp: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(200))


class ReportArtifact(Record, Base):
    __tablename__ = "report_artifacts"
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("lab_runs.id", ondelete="CASCADE"))
    format: Mapped[str] = mapped_column(String(10))
    checksum: Mapped[str] = mapped_column(String(64))


class Plan(Record, Base):
    __tablename__ = "plans"
    slug: Mapped[str] = mapped_column(String(40), unique=True)
    configuration: Mapped[dict] = mapped_column(JSON)


class PlanEntitlement(Base):
    __tablename__ = "plan_entitlements"
    plan_id: Mapped[str] = mapped_column(ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True)
    feature: Mapped[str] = mapped_column(String(80), primary_key=True)
    daily_limit: Mapped[int] = mapped_column(Integer)


class Subscription(Record, Base):
    __tablename__ = "subscriptions"
    __table_args__ = (UniqueConstraint("owner_user_id", name="uq_subscription_user"),)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    provider_id: Mapped[str] = mapped_column(String(120), unique=True)
    customer_id: Mapped[str] = mapped_column(String(120))
    plan_slug: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(40))
    period_end: Mapped[int] = mapped_column(Integer, default=0)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)


class CheckoutIntent(Base):
    __tablename__ = "checkout_intents"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    request_key: Mapped[str] = mapped_column(String(80), unique=True)
    plan_slug: Mapped[str] = mapped_column(String(40))
    expires_at: Mapped[int] = mapped_column(Integer)
    checkout_url: Mapped[str | None] = mapped_column(String(1000))


class UsageBucket(Base):
    __tablename__ = "usage_buckets"
    __table_args__ = (CheckConstraint("used >= 0", name="ck_usage_nonnegative"),)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    feature: Mapped[str] = mapped_column(String(80), primary_key=True)
    period: Mapped[str] = mapped_column(String(10), primary_key=True)
    used: Mapped[int] = mapped_column(Integer, default=0)


class PaymentEvent(Record, Base):
    __tablename__ = "payment_events"
    provider_event_id: Mapped[str] = mapped_column(String(120), unique=True)
    event_type: Mapped[str] = mapped_column(String(80))
    provider_created: Mapped[int] = mapped_column(Integer)


class AuditEvent(Record, Base):
    __tablename__ = "audit_events"
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(100))
    target_id: Mapped[str] = mapped_column(String(120))
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String(30), primary_key=True)


class Organization(Record, Base):
    __tablename__ = "organizations"
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))


class Membership(Base):
    __tablename__ = "memberships"
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String(30))


class Classroom(Record, Base):
    __tablename__ = "classrooms"
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    instructor_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(120))
    join_code_hash: Mapped[str] = mapped_column(String(64), unique=True)


class ClassMembership(Base):
    __tablename__ = "class_memberships"
    classroom_id: Mapped[str] = mapped_column(ForeignKey("classrooms.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)


class Assignment(Record, Base):
    __tablename__ = "assignments"
    classroom_id: Mapped[str] = mapped_column(ForeignKey("classrooms.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    lab_slug: Mapped[str] = mapped_column(String(80))
    instructions: Mapped[str] = mapped_column(Text)
    due_at: Mapped[datetime] = mapped_column(nullable=False)


class Submission(Record, Base):
    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("assignment_id", "user_id", name="uq_submission_assignment_user"),)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    run_id: Mapped[str] = mapped_column(ForeignKey("lab_runs.id", ondelete="CASCADE"))
    reflection: Mapped[str] = mapped_column(Text)
    feedback: Mapped[str] = mapped_column(Text, default="")
    score: Mapped[int | None] = mapped_column(Integer)


class CommunityPost(Record, Base):
    __tablename__ = "community_posts"
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(30))
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)


class CommunityReport(Record, Base):
    __tablename__ = "community_reports"
    __table_args__ = (UniqueConstraint("post_id", "reporter_user_id", name="uq_community_report"),)
    post_id: Mapped[str] = mapped_column(ForeignKey("community_posts.id", ondelete="CASCADE"))
    reporter_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    reason: Mapped[str] = mapped_column(String(500))


class EmailCredential(Base):
    __tablename__ = "email_credentials"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


class IdentityToken(Record, Base):
    __tablename__ = "identity_tokens"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    purpose: Mapped[str] = mapped_column(String(20))
    expires_at: Mapped[int] = mapped_column(Integer)
