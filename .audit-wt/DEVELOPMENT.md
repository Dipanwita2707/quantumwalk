# Run QuantumWalk locally

QuantumWalk opens on a public landing page with a local interactive 3D qubit concept preview. **Get started** opens `/start`: a five-slide introduction with an experience-level choice, two matching short articles, and two questions with immediate feedback. It then opens Google login, carrying a tailored starter circuit into the private workspace. Introduction answers stay in page memory and are not saved. Google sign-in is required for the private workspace, circuit simulation, algorithms, lessons, challenges, and tutor. Circuits and progress remain private to their owner. Profile controls, data export, and account deletion are available after sign-in.

## Requirements

- Node.js and npm (`npm.cmd` works when PowerShell blocks the npm script).
- Python 3.13 and a Windows-compatible Qiskit Aer wheel.
- SQLite for local development. PostgreSQL is available through `DATABASE_URL`.

## Start the API

From `D:\quantumwalk` in PowerShell:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r api\requirements.txt
.\.venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir api --reload --host 127.0.0.1 --port 8000
```

Copy `.env.example` to `.env` and fill in the Supabase password, session secret, Google OAuth values, and optional `OPENAI_API_KEY` before starting the API. The active `.env` is ignored and must never be committed. The database URL uses `sslmode=require` for Supabase. Provider keys stay server-side. `AI_API_BASE_URL` and `AI_API_STYLE` select OpenAI Responses or a compatible chat endpoint such as OpenRouter. The coach uses local explanations by default; the user must enable the AI checkbox for a question before that question and its circuit are sent to the configured provider.

Run the migration before the API. The default local database is `api/quantumwalk-dev.db`, which is ignored by Git. For PostgreSQL, set `DATABASE_URL` to a `postgresql://...` or `postgresql+psycopg://...` URL before migration and API startup; the app normalizes the standard Supabase form to psycopg 3. Use a database account with only the permissions required by the app; run migrations through a separate controlled role when deploying.

The health endpoint is `http://localhost:8000/health`; interactive API docs are at `/docs` in development.

## Start the web app

In another PowerShell window:

```powershell
cd web
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000` for the landing page. Its preview is self-contained and needs no API calls for simulation. Sign in with Google to enter `/workspace`; select **H**, add it to q0, then run. Explore the algorithm library, learning path, and challenges from the navigation. The web app uses `http://localhost:8000` by default; set `NEXT_PUBLIC_API_URL` to change the API URL. The API's `FRONTEND_ORIGIN` must match the browser origin exactly.

## Google sign-in

The API reads `.env` at startup. Restart the API after changing credentials, then refresh the login page. Updating `.env` alone does not update an already running process. Register the exact callback below in your Google OAuth web client.

To enable Google login, create your own Google OAuth web client and configure its exact authorized redirect URI as `http://localhost:8000/auth/google/callback`. Set these values in the API process environment:

```powershell
$env:GOOGLE_CLIENT_ID = '<your web client ID>'
$env:GOOGLE_CLIENT_SECRET = '<your client secret>'
$env:GOOGLE_REDIRECT_URI = 'http://localhost:8000/auth/google/callback'
$env:SESSION_SECRET = '<a random secret of at least 32 characters>'
```

Do not commit credentials or `.env` files. The app requests only `openid email profile`; it maps accounts by Google's stable subject, requires a verified email, uses state/nonce/PKCE, and stores a hashed, revocable app session. If the credentials are absent, the public landing preview works and the sign-in page explains that account access is unavailable. A real Google provider round trip still needs to be checked with project credentials. A reachable, migrated PostgreSQL database is also required for account creation.

Other API environment variables are `DATABASE_URL`, `FRONTEND_ORIGIN`, and `QUANTUMWALK_ENV`. Production mode requires an explicit strong `SESSION_SECRET` and HTTPS frontend and callback URLs. Set `QUANTUMWALK_ENV=production` only behind an HTTPS deployment with a real PostgreSQL database and operational controls described below.

## Verify

```powershell
.\.venv\Scripts\python.exe -m pytest api\tests -q
.\.venv\Scripts\python.exe -m alembic -c alembic.ini check
cd web
npm.cmd run typecheck
npm.cmd run build
npm.cmd audit --omit=dev
```

Tests cover simulator known answers, invalid inputs, private circuit ownership, CSRF, session revocation, learning and challenge grading, and export compatibility. Browser keyboard, screen reader, responsive, and real OAuth checks still need a hands-on pass before public release.

## Release preparation update — 13 October 2026

The API now exposes `/readyz` for database connectivity and emits safe JSON request telemetry without queries, tokens, identity or request bodies. Start Uvicorn with `--no-access-log` to avoid callback query strings in ordinary access logs. Run `python scripts/monitor.py --api-url http://localhost:8000` to probe liveness/readiness.

See [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md) for deployment and recovery procedures, [SCHEMA_IMPLEMENTATION_REVIEW.md](SCHEMA_IMPLEMENTATION_REVIEW.md) for supplied-design differences, and [MANAGER_WORK_REPORT.md](MANAGER_WORK_REPORT.md) for the status report. These documents distinguish implemented checks from pending deployment, backup scheduling, restore proof and live acceptance work.

## Scope and limits

- The introduction includes local interactive concept previews, plain-language definitions, and exploration XP that resets on reload. Signed-in learning shows mastery XP and a foundations badge derived from server-graded, saved lesson completion; retries do not add duplicate XP.
- Optional public AI help accepts only an allowlisted topic, experience level, and explicit consent. It sends no answers, circuits, or account identity. It checks the frontend origin, caps provider requests at 3/minute and 20/hour per IP, 60/hour per process, and two simultaneous requests, with a 12-second provider timeout and local fallback. These process-local controls must be replaced or supplemented by shared quotas before a multi-worker public deployment.

- 1–5 qubits, at most 64 operations and 4,096 shots per simulation. Gates: H, X, Y, Z, S, T, Rx/Ry/Rz, CX, CZ, SWAP, and terminal measurement.
- Ideal state vectors and probabilities are exact simulator outputs. Measurement counts are finite-shot samples; the displayed state remains the ideal pre-measurement state. Qubit 0 is the rightmost bit of a basis label.
- The five curated circuits include superposition, Bell, GHZ, one-bit Deutsch–Jozsa, and two-qubit Grover. Two beginner lessons and two challenges are implemented.
- The circuit coach gives local curated explanations by default. With explicit user opt-in and a configured provider key, it can request an AI explanation; numerical claims must be verified in the simulator. Real quantum hardware is not connected.
- Saved circuits are private by default. An account can hold up to 100 circuits. Data export and account deletion are available in profile settings.
- The API limits request bodies to 64 KiB and has per-IP, per-process rate controls plus a two-run simulator semaphore. These are local safeguards, not a distributed production quota. Before public traffic, add a shared or gateway rate limiter, worker runtime limits, monitored backups with a restore rehearsal, logging/alerts, and a deployment review.
- The privacy and terms pages are implementation drafts; obtain legal and policy review before public launch. The approved dashboard image referenced by the specification was not supplied, so exact screenshot fidelity and usability acceptance remain open.
