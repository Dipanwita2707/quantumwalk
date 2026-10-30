"""Approved additive persistence for versioned teaching and durable execution."""
from datetime import datetime
from sqlalchemy import JSON, Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database import Base, utc_now
from extended_models import Record


class LessonRevision(Record, Base):
    __tablename__ = "lesson_revisions"
    __table_args__ = (UniqueConstraint("lesson_slug", "revision", name="uq_lesson_revision"), CheckConstraint("revision > 0", name="ck_lesson_revision_positive"))
    lesson_slug: Mapped[str] = mapped_column(String(80))
    revision: Mapped[int] = mapped_column(Integer)
    content: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    creator_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    reviewer_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))


class LessonPublication(Base):
    __tablename__ = "lesson_publications"
    lesson_slug: Mapped[str] = mapped_column(String(80), primary_key=True)
    revision_id: Mapped[str] = mapped_column(ForeignKey("lesson_revisions.id", ondelete="CASCADE"))
    state: Mapped[str] = mapped_column(String(20), default="active")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AssignmentRubric(Base):
    __tablename__ = "assignment_rubrics"
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), primary_key=True)
    definition: Mapped[dict] = mapped_column(JSON)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SubmissionRubric(Base):
    __tablename__ = "submission_rubrics"
    submission_id: Mapped[str] = mapped_column(ForeignKey("submissions.id", ondelete="CASCADE"), primary_key=True)
    definition_snapshot: Mapped[dict] = mapped_column(JSON)
    ratings: Mapped[dict] = mapped_column(JSON)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    graded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class BossDefinition(Base):
    __tablename__ = "boss_definitions"
    __table_args__ = (CheckConstraint("version > 0", name="ck_boss_version_positive"),)
    slug: Mapped[str] = mapped_column(String(80), primary_key=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    content: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="active")
    creator_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class BossAttempt(Record, Base):
    __tablename__ = "boss_attempts"
    __table_args__ = (Index("ix_boss_owner_created", "owner_user_id", "created_at"),)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    boss_slug: Mapped[str] = mapped_column(ForeignKey("boss_definitions.slug"))
    boss_version: Mapped[int] = mapped_column(Integer)
    definition_snapshot: Mapped[dict] = mapped_column(JSON)
    evidence: Mapped[list] = mapped_column(JSON)
    reflection: Mapped[str] = mapped_column(Text)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)


class SimulationJob(Record, Base):
    __tablename__ = "simulation_jobs"
    __table_args__ = (UniqueConstraint("owner_user_id", "request_key", name="uq_job_owner_request"),
                     CheckConstraint("attempt_count >= 0", name="ck_job_attempts_nonnegative"),
                     CheckConstraint("status IN ('queued','running','completed','failed','cancelled')", name="ck_job_status"),
                     Index("ix_job_state_created", "status", "created_at"), Index("ix_job_owner_created", "owner_user_id", "created_at"))
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    request_key: Mapped[str] = mapped_column(String(80))
    request_hash: Mapped[str] = mapped_column(String(64))
    kind: Mapped[str] = mapped_column(String(20))
    lab_slug: Mapped[str | None] = mapped_column(String(80))
    model_version: Mapped[str] = mapped_column(String(40))
    parameters: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="queued")
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    run_id: Mapped[str | None] = mapped_column(ForeignKey("lab_runs.id", ondelete="SET NULL"))
    error_code: Mapped[str | None] = mapped_column(String(60))
    lease_owner: Mapped[str | None] = mapped_column(String(80))
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
