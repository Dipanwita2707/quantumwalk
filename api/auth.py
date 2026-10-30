"""Google OIDC sign-in and revocable server-side application sessions."""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
import json
from pathlib import Path
import httpx
from urllib.parse import quote
from dataclasses import dataclass

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import Identity, SessionLocal, User, UserSession
from settings import (
    cookie_secure,
    frontend_origin,
    google_client_id,
    google_client_secret,
    google_enabled,
    google_redirect_uri,
    safe_return_path,
    session_secret,
)

oauth = OAuth()
if google_enabled:
    oauth.register(
        name="google",
        client_id=google_client_id,
        client_secret=google_client_secret,
        # Cached public discovery metadata, verified 2026-10-28 against Google's
        # well-known document. Signing keys are still fetched/rotated by Authlib.
        # Starting sign-in need not make an outbound metadata request.
        **json.loads(Path(__file__).with_name("google_oidc_metadata.json").read_text()),
        client_kwargs={"scope": "openid email profile", "code_challenge_method": "S256"},
    )

SESSION_SECONDS = 60 * 60 * 24 * 7
COOKIE_NAME = "qw_session"


def get_db():
    with SessionLocal() as db:
        yield db


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def csrf_for_token(token: str) -> str:
    return hmac.new(session_secret.encode(), f"csrf:{token}".encode(), hashlib.sha256).hexdigest()


@dataclass(frozen=True)
class AuthContext:
    user: User
    session: UserSession
    token: str


def optional_auth(request: Request, db: Session = Depends(get_db)) -> AuthContext | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    record = db.scalar(select(UserSession).where(UserSession.token_hash == token_hash(token)))
    if record is None or record.revoked_at is not None or record.expires_at <= int(time.time()):
        return None
    user = db.get(User, record.user_id)
    return AuthContext(user, record, token) if user else None


def current_auth(auth: AuthContext | None = Depends(optional_auth)) -> AuthContext:
    if auth is None:
        raise HTTPException(status_code=401, detail="Sign in to continue")
    return auth


def require_csrf(request: Request, auth: AuthContext = Depends(current_auth)) -> AuthContext:
    check_csrf(request, auth)
    return auth


def check_csrf(request: Request, auth: AuthContext) -> None:
    supplied = request.headers.get("X-CSRF-Token", "")
    if not hmac.compare_digest(supplied, csrf_for_token(auth.token)):
        raise HTTPException(status_code=403, detail="Invalid request token")


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(48)
    record = UserSession(user_id=user.id, token_hash=token_hash(token), expires_at=int(time.time()) + SESSION_SECONDS)
    db.add(record)
    db.commit()
    return token


def upsert_google_user(db: Session, profile: dict) -> User:
    subject = profile.get("sub")
    email = profile.get("email")
    if not isinstance(subject, str) or not 1 <= len(subject) <= 255 or not isinstance(email, str) or not 1 <= len(email) <= 320 or profile.get("email_verified") is not True:
        raise HTTPException(status_code=400, detail="A verified Google identity is required")
    identity = db.scalar(select(Identity).where(Identity.provider == "google", Identity.provider_subject == subject))
    if identity:
        user = identity.user
        user.email = email
        user.avatar_url = str(profile.get("picture") or "")[:500] or None
    else:
        user = User(
            display_name=str(profile.get("name") or "QuantumWalk learner")[:120],
            email=email,
            avatar_url=str(profile.get("picture") or "")[:500] or None,
        )
        user.identities.append(Identity(provider="google", provider_subject=subject))
        db.add(user)
    db.commit()
    return user


async def google_redirect(request: Request, return_to: str | None):
    if not google_enabled:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    request.session["return_to"] = safe_return_path(return_to)
    nonce = secrets.token_urlsafe(24)
    verifier = secrets.token_urlsafe(48)
    return await oauth.google.authorize_redirect(
        request, google_redirect_uri, nonce=nonce, code_verifier=verifier,
    )


async def google_callback(request: Request, db: Session):
    from fastapi.responses import RedirectResponse

    if not google_enabled:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as exc:
        request.session.clear()
        reason = "session_expired" if exc.error == "mismatching_state" else "sign_in_failed"
        return RedirectResponse(f"{frontend_origin}/login?error={reason}", status_code=303)
    except httpx.HTTPError:
        request.session.clear()
        return RedirectResponse(f"{frontend_origin}/login?error=provider_unavailable", status_code=303)
    profile = token.get("userinfo")
    if not isinstance(profile, dict):
        return RedirectResponse(f"{frontend_origin}/login?error=sign_in_failed", status_code=303)
    try:
        user = upsert_google_user(db, profile)
        old_token = request.cookies.get(COOKIE_NAME)
        if old_token:
            old_session = db.scalar(select(UserSession).where(UserSession.token_hash == token_hash(old_token)))
            if old_session:
                old_session.revoked_at = int(time.time())
                db.commit()
        session_token = create_session(db, user)
    except SQLAlchemyError:
        db.rollback()
        return_to = quote(safe_return_path(request.session.get("return_to")), safe="")
        return RedirectResponse(f"{frontend_origin}/login?error=account_unavailable&return_to={return_to}", status_code=303)
    destination = safe_return_path(request.session.pop("return_to", "/"))
    response = RedirectResponse(f"{frontend_origin}{destination}", status_code=303)
    response.set_cookie(
        COOKIE_NAME, session_token, max_age=SESSION_SECONDS, httponly=True,
        secure=cookie_secure, samesite="lax", path="/",
    )
    return response
