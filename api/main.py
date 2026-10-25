"""QuantumWalk API entry point."""

import json
import logging
from time import perf_counter, time
from uuid import uuid4

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from auth import AuthContext, COOKIE_NAME, get_db, google_callback, google_redirect, require_csrf
from body_limit import BodyLimitMiddleware
from database import User, UserSession
from discovery_routes import router as discovery_router
from limits import enforce_rate, simulation_slot, _simulation_slots
from platform_routes import router
from settings import cookie_secure, environment, frontend_origin, session_secret
from simulator import CircuitRequest, SimulationResponse, simulate


app = FastAPI(title="QuantumWalk API")
app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret,
    same_site="lax",
    https_only=cookie_secure,
    max_age=600,
)
app.add_middleware(BodyLimitMiddleware, max_bytes=65536)
app.include_router(router)
app.include_router(discovery_router)

# Stable test hook for saturation behavior.
simulation_slots = _simulation_slots
request_logger = logging.getLogger("uvicorn.error")


@app.middleware("http")
async def request_observability(request: Request, call_next):
    request_id = str(uuid4())
    started = perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        route = request.scope.get("route")
        request_logger.info(json.dumps({
            "event": "http_request", "request_id": request_id,
            "method": request.method, "route": getattr(route, "path", "unmatched"),
            "status": status, "duration_ms": round((perf_counter() - started) * 1000, 2),
        }))


@app.middleware("http")
async def protective_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.url.path.startswith(("/api/", "/auth/")):
        response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz", include_in_schema=False)
def readiness(db: Session = Depends(get_db)):
    """Check database connectivity without exposing connection details."""
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse({"status": "unavailable"}, status_code=503, headers={"Cache-Control": "no-store"})
    return JSONResponse({"status": "ready"}, headers={"Cache-Control": "no-store"})


@app.post("/api/simulate", response_model=SimulationResponse)
def run_simulation(request: CircuitRequest, http_request: Request, auth: AuthContext = Depends(require_csrf)) -> SimulationResponse:
    enforce_rate(http_request, "simulate", 30)
    with simulation_slot():
        return simulate(request)


@app.get("/auth/google/start")
async def start_google(request: Request, return_to: str | None = None):
    enforce_rate(request, "auth", 10)
    return await google_redirect(request, return_to)


@app.get("/auth/google/callback")
async def finish_google(request: Request, db: Session = Depends(get_db)):
    return await google_callback(request, db)


@app.post("/api/logout", status_code=204)
def logout(request: Request, auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)) -> Response:
    record = db.get(UserSession, auth.session.id)
    if record:
        record.revoked_at = int(time())
        db.commit()
    request.session.clear()
    response = Response(status_code=204)
    response.delete_cookie(COOKIE_NAME, path="/", secure=cookie_secure, httponly=True, samesite="lax")
    return response


@app.delete("/api/account", status_code=204)
def delete_account(auth: AuthContext = Depends(require_csrf), db: Session = Depends(get_db)) -> Response:
    user = db.get(User, auth.user.id)
    db.delete(user)
    db.commit()
    response = Response(status_code=204)
    response.delete_cookie(COOKIE_NAME, path="/", secure=cookie_secure, httponly=True, samesite="lax")
    return response


# Add CORS last so even early size-limit errors carry the approved frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)
