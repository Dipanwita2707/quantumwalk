"""Persistence models and sessions for private user data."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
from uuid import uuid4

from dotenv import load_dotenv
from sqlalchemy import JSON, Boolean, CheckConstraint, ForeignKey, Index, Integer, String, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


load_dotenv(Path(__file__).resolve().parents[1] / ".env")
default_database = f"sqlite:///{(Path(__file__).parent / 'quantumwalk-dev.db').as_posix()}"


def normalize_database_url(value: str) -> str:
    """Use psycopg 3 for both SQLAlchemy and provider-standard Postgres URLs."""
    if value.startswith("postgresql://"):
        value = "postgresql+psycopg://" + value[len("postgresql://"):]
    if value.startswith("postgresql+psycopg://"):
        parts = urlsplit(value)
        if parts.hostname:
            auth = quote(unquote(parts.username or ""), safe="")
            if parts.password is not None:
                auth += ":" + quote(unquote(parts.password), safe="")
            host = parts.hostname
            if ":" in host and not host.startswith("["):
                host = f"[{host}]"
            netloc = f"{auth}@{host}"
            if parts.port:
                netloc += f":{parts.port}"
            query = parts.query or ("sslmode=require" if host.endswith("supabase.co") else "")
            value = f"postgresql+psycopg://{netloc}{parts.path}" + (f"?{query}" if query else "")
    return value


database_url = normalize_database_url(os.getenv("DATABASE_URL") or default_database)
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite:") else {},
    pool_pre_ping=True,
)


if database_url.startswith("sqlite:"):
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    analytics_opt_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utc_now, nullable=False)
    identities: Mapped[list[Identity]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sessions: Mapped[list[UserSession]] = relationship(back_populates="user", cascade="all, delete-orphan")
    circuits: Mapped[list[Circuit]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    progress: Mapped[list[Progress]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Identity(Base):
    __tablename__ = "auth_identities"
    __table_args__ = (Index("uq_provider_subject", "provider", "provider_subject", unique=True),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    user: Mapped[User] = relationship(back_populates="identities")


class UserSession(Base):
    __tablename__ = "user_sessions"
    __table_args__ = (Index("ix_sessions_user", "user_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[int] = mapped_column(Integer, nullable=False)
    revoked_at: Mapped[int | None] = mapped_column(Integer)
    user: Mapped[User] = relationship(back_populates="sessions")


class Circuit(Base):
    __tablename__ = "circuits"
    __table_args__ = (
        Index("ix_circuits_owner_updated", "owner_user_id", "updated_at"),
        CheckConstraint("qubits BETWEEN 1 AND 5", name="ck_circuits_qubits"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    qubits: Mapped[int] = mapped_column(Integer, nullable=False)
    operations_json: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now, nullable=False)
    owner: Mapped[User] = relationship(back_populates="circuits")


class Progress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (
        Index("uq_progress_user_activity", "user_id", "activity_slug", unique=True),
        CheckConstraint("score BETWEEN 0 AND 100", name="ck_progress_score"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_slug: Mapped[str] = mapped_column(String(80), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now, nullable=False)
    user: Mapped[User] = relationship(back_populates="progress")
