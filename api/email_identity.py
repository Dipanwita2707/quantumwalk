"""Verified email identity, one-use reset tokens and revocable existing sessions."""
import hashlib
import hmac
import os
import re
import secrets
import smtplib
import ssl
import time
from email.message import EmailMessage
from threading import BoundedSemaphore

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from auth import AuthContext, COOKIE_NAME, SESSION_SECONDS, create_session, current_auth, get_db, require_csrf, token_hash
from database import User, UserSession
from extended_models import EmailCredential, IdentityToken
from limits import enforce_rate
from settings import cookie_secure, frontend_origin

router = APIRouter(prefix="/api/v1/auth")
_password_slots = BoundedSemaphore(4)


def derive_password(password, salt):
    if not _password_slots.acquire(blocking=False):
        raise HTTPException(429, "Account sign-in is busy. Please try again shortly")
    try:
        return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600000).hex()
    finally:
        _password_slots.release()


def email_enabled():
    return bool(os.getenv("SMTP_HOST") and os.getenv("SMTP_FROM"))


def password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = derive_password(password, salt)
    return f"pbkdf2_sha256$600000${salt}${digest}"


def password_matches(password, encoded):
    try:
        algorithm, iterations, salt, digest = encoded.split("$")
        return algorithm == "pbkdf2_sha256" and int(iterations) == 600000 and hmac.compare_digest(derive_password(password, salt), digest)
    except (ValueError, TypeError):
        return False


def send_identity_mail(address: str, token: str, purpose: str):
    if not email_enabled():
        raise HTTPException(503, "Email sign-in is not configured")
    message = EmailMessage()
    message["From"] = os.environ["SMTP_FROM"]; message["To"] = address
    message["Subject"] = "Verify your QuantumWalk account" if purpose == "verify" else "Reset your QuantumWalk password"
    message.set_content(f"Open this link to {purpose} your QuantumWalk account. It expires in 30 minutes.\n\n{frontend_origin}/account/access?action={purpose}#token={token}\n\nIf you did not request this, ignore this email.")
    try:
        with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT", "587")), timeout=10) as server:
            server.starttls(context=ssl.create_default_context())
            if os.getenv("SMTP_USERNAME"):
                server.login(os.environ["SMTP_USERNAME"], os.getenv("SMTP_PASSWORD", ""))
            server.send_message(message)
    except (OSError, smtplib.SMTPException):
        raise HTTPException(503, "Email delivery is temporarily unavailable") from None


class EmailInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        value = value.strip()
        if not re.fullmatch(r"[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+", value) or any(c in value for c in "\r\n"):
            raise ValueError("Enter a valid email address")
        return value.casefold()


class Credentials(EmailInput):
    password: str = Field(min_length=12, max_length=128)


class Registration(Credentials):
    display_name: str = Field(min_length=1, max_length=120)


class TokenInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str = Field(min_length=32, max_length=128)


class ResetInput(TokenInput):
    password: str = Field(min_length=12, max_length=128)


def request_origin(request: Request):
    # These unauthenticated POSTs cannot use a session CSRF token. Require same-origin.
    if request.headers.get("origin") != frontend_origin:
        raise HTTPException(403, "Invalid request origin")
    enforce_rate(request, "email-identity", 10)


def issue(db, credential, purpose):
    token = secrets.token_urlsafe(48)
    db.execute(delete(IdentityToken).where(IdentityToken.user_id == credential.user_id, IdentityToken.purpose == purpose))
    db.add(IdentityToken(user_id=credential.user_id, token_hash=token_hash(token), purpose=purpose, expires_at=int(time.time()) + 1800))
    db.flush()
    send_identity_mail(credential.email, token, purpose)


@router.get("/methods")
def methods():
    return {"email_enabled": email_enabled()}


@router.post("/register", dependencies=[Depends(request_origin)])
def register(body: Registration, db: Session = Depends(get_db)):
    if not email_enabled():
        raise HTTPException(503, "Email registration is not configured")
    hashed = password_hash(body.password)
    credential = db.scalar(select(EmailCredential).where(EmailCredential.email == body.email))
    if not credential:
        user = User(display_name=body.display_name, email=body.email)
        db.add(user); db.flush()
        credential = EmailCredential(user_id=user.id, email=body.email, password_hash=hashed, verified=False)
        db.add(credential); db.flush()
        issue(db, credential, "verify"); db.commit()
    # Do not disclose existing accounts, replace credentials or link by matching email.
    return {"message": "If registration is available for this address, a verification email has been sent."}


@router.post("/login", dependencies=[Depends(request_origin)])
def login(body: Credentials, response: Response, db: Session = Depends(get_db)):
    credential = db.scalar(select(EmailCredential).where(EmailCredential.email == body.email))
    dummy = "pbkdf2_sha256$600000$invalid$" + "0" * 64
    valid = password_matches(body.password, credential.password_hash if credential else dummy)
    if not credential or not valid or not credential.verified:
        raise HTTPException(401, "Sign-in failed. Check your credentials and verify your email.")
    user = db.get(User, credential.user_id)
    token = create_session(db, user)
    response.set_cookie(COOKIE_NAME, token, max_age=SESSION_SECONDS, httponly=True, secure=cookie_secure, samesite="lax", path="/")
    return {"authenticated": True}


@router.post("/verify", dependencies=[Depends(request_origin)])
def verify(body: TokenInput, db: Session = Depends(get_db)):
    statement = delete(IdentityToken).where(IdentityToken.token_hash == token_hash(body.token), IdentityToken.purpose == "verify", IdentityToken.expires_at > time.time()).returning(IdentityToken.user_id)
    user_id = db.scalar(statement)
    if not user_id:
        raise HTTPException(400, "This verification link is invalid or expired")
    credential = db.get(EmailCredential, user_id); credential.verified = True; db.commit()
    return {"message": "Email verified. You can now sign in."}


@router.post("/forgot", dependencies=[Depends(request_origin)])
def forgot(body: EmailInput, db: Session = Depends(get_db)):
    if not email_enabled():
        raise HTTPException(503, "Password recovery is not configured")
    credential = db.scalar(select(EmailCredential).where(EmailCredential.email == body.email))
    if credential:
        issue(db, credential, "reset" if credential.verified else "verify"); db.commit()
    return {"message": "If this address has an account, a recovery email has been sent."}


@router.post("/reset", dependencies=[Depends(request_origin)])
def reset(body: ResetInput, db: Session = Depends(get_db)):
    user_id = db.scalar(delete(IdentityToken).where(IdentityToken.token_hash == token_hash(body.token), IdentityToken.purpose == "reset", IdentityToken.expires_at > time.time()).returning(IdentityToken.user_id))
    if not user_id:
        raise HTTPException(400, "This password reset link is invalid or expired")
    credential = db.get(EmailCredential, user_id); credential.password_hash = password_hash(body.password)
    db.execute(update(UserSession).where(UserSession.user_id == user_id).values(revoked_at=int(time.time())))
    db.commit()
    return {"message": "Password changed. Previous sessions have been signed out."}


@router.get("/sessions")
def sessions(auth: AuthContext = Depends(current_auth), db: Session = Depends(get_db)):
    return [{"id": row.id, "expires_at": row.expires_at, "current": row.id == auth.session.id} for row in db.scalars(select(UserSession).where(UserSession.user_id == auth.user.id, UserSession.revoked_at.is_(None), UserSession.expires_at > time.time()).limit(100))]


@router.post("/sessions/revoke-others")
def revoke_others(auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)):
    result = db.execute(update(UserSession).where(UserSession.user_id == auth.user.id, UserSession.id != auth.session.id, UserSession.revoked_at.is_(None)).values(revoked_at=int(time.time())))
    db.commit()
    return {"revoked": result.rowcount}
