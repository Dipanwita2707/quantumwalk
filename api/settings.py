"""Environment configuration. No production secret has a built-in value."""

import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

environment = os.getenv("QUANTUMWALK_ENV", "development")
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").rstrip("/")
google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
session_secret = os.getenv("SESSION_SECRET", "")
openai_api_key = os.getenv("OPENAI_API_KEY", "")
openai_model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
openai_enabled = bool(openai_api_key)
ai_api_base_url = os.getenv("AI_API_BASE_URL", "https://api.openai.com/v1").rstrip("/")
ai_api_style = os.getenv("AI_API_STYLE", "responses")

if environment == "production":
    if not session_secret or len(session_secret) < 32:
        raise RuntimeError("SESSION_SECRET must have at least 32 characters in production")
    for value in (frontend_origin, google_redirect_uri):
        if urlsplit(value).scheme != "https":
            raise RuntimeError("Production origins and redirects must use HTTPS")
    if not (google_client_id and google_client_secret):
        raise RuntimeError("Google OAuth credentials are required in production")
    if not os.getenv("DATABASE_URL", "").startswith(("postgresql://", "postgresql+psycopg://")):
        raise RuntimeError("A PostgreSQL DATABASE_URL is required in production")
else:
    # Local-only fallback. Restarting the API invalidates OAuth-in-progress state.
    session_secret = session_secret or secrets.token_urlsafe(48)

google_enabled = bool(google_client_id and google_client_secret)
cookie_secure = environment == "production"


def safe_return_path(value: str | None) -> str:
    """Allow only local paths, never arbitrary redirect URLs or protocol-relative URLs."""
    if not value or not value.startswith("/") or value.startswith("//") or "\\" in value:
        return "/"
    if any(ord(char) < 32 for char in value) or len(value) > 300:
        return "/"
    return value
