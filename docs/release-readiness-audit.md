# QuantumWalk — Release Readiness and Integration Audit

**Date:** 2026-10-26  
**Audit baseline commits:** `fb2349e` (multi-shot Shor), `3f77ade` (hub duplicate fix)  
**HEAD at audit:** `3f77ade` on `master`  
**Scope:** Evidence collection and defect identification — not a broad rewrite.

---

## Preflight summary

| Item | Value |
|------|--------|
| Branch | `master` @ `3f77ade` |
| Working tree | **Large WIP** — ~50 modified tracked files, extensive untracked dirs (`sirraya/`, `docker-compose.yml`, `api/explorer_routes.py`, `api/tsp_grover.py`, hub/academy routes, e2e specs, `docs/ux-audit/`, etc.) |
| Policy | No reset, clean, stash, or amend performed |
| Primary app | Next.js 16 (`web/app/**`), FastAPI (`api/`), classical simulators (Qiskit Aer / Cirq) |
| Deployment (uncommitted) | `Dockerfile.api`, `Dockerfile.web`, `docker-compose.yml` at repo root |
| Parity reference | `sirraya/docs/references/sirraya-captures/quantumwalk-parity-matrix.md` (updated with 2026-10-26 evidence block) |

**Critical release note (2026-10-26 audit):** Automated checks below ran against the **current working tree** (includes uncommitted integration work). A **clean checkout at `3f77ade` alone was not release-green** for TSP v3 solve (see **RR-001**, now fixed in **`d9b48f8`** — see §9).

---

## 1. Architecture and code quality

### Frontend / API boundaries

- **Proxy:** `web/next.config.ts` rewrites `/api/*`, `/auth/*`, `/health` to `API_INTERNAL_URL` (default `127.0.0.1:8000`). Browser client uses `getApiBase()` (`web/lib/api.ts`) — direct API origin in dev unless `NEXT_PUBLIC_API_URL` is set.
- **Duplicated quantum logic (intentional, drift risk):** Educational Shor/QFT/reservoir/mapper logic exists in **`web/lib/*`** (UI) and mirrored **`api/*.py`** modules for pytest. Documented for Shor in `docs/shor-educational-lab.md`. **Impact:** contract drift if one side changes without the other; mitigated by parallel test suites.
- **Explorer demo path:** Uncommitted `api/explorer_routes.py` + `api/demo_presets.py` add public `/api/explorer/*` simulate/preset endpoints separate from authenticated `/api/simulate`.

### Contracts and validation

- **TSP solve:** Pydantic models in `sirraya/api/sirraya_v3_routes.py` (uncommitted) — matrix shape, algorithm enum, shot bounds, extra fields forbidden.
- **Simulator:** `CircuitRequest` / limits in `api/limits.py` (rate limits, qubit/depth caps — not re-audited line-by-line this pass).
- **TypeScript:** `npm run typecheck` passes on WIP tree.

### Error handling and backend-unavailable behavior

- **`web/lib/api.ts`:** Network failure → `ApiError` status `0` with user-facing “Could not reach the QuantumWalk API”.
- **TSP explorer:** `web/lib/useExplorerBackendHealth.ts` + UI tests cover offline health, validation errors, duplicate submit while loading (`web/e2e/tsp-backend.spec.ts`).
- **Session:** CSRF stale token retry via `/api/me` refresh once.

### Configuration

- **`api/settings.py`:** Production guards (HTTPS origins, `SESSION_SECRET` length, PostgreSQL URL, Google credentials). Dev generates ephemeral `SESSION_SECRET` if unset — **invalidates sessions on API restart** (documented in code).
- **Inconsistency:** `DEVELOPMENT.md` line 28 suggests `GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback` while `.env.example` and line 51 use **`http://localhost:8000/auth/google/callback`**. With Next rewrites, both may work if registered in Google Console, but docs disagree (**RR-002**).

### Dependencies and build

- **Web:** `npm run build` succeeds; Next warns middleware convention deprecated (migrate to “proxy”).
- **API tests run on:** Python **3.14** (host); `DEVELOPMENT.md` specifies **3.13** (**RR-003** risk).
- **npm audit --omit=dev:** 0 vulnerabilities (2026-10-26).

### Logging and secrets

- Request JSON logs via middleware (`api/main.py`) — route, status, duration; no bodies in sampled code.
- `.env` gitignored; production secret validation present.

### Accessibility / navigation

- UX audit docs (`docs/ux-audit/`) — guest Playwright 33/33; mock-auth 7/7. **Live OAuth and a11y keyboard audit not done this pass.**

---

## 2. Quantum Explorer and Mapper

| Check | Result |
|-------|--------|
| TSP matrix validation (negative values) | **CONFIRMED** — e2e |
| City count resize | **CONFIRMED** — e2e |
| Edited matrix in solve payload | **CONFIRMED** — e2e (mocked solve) |
| Backend health offline → disable solve | **CONFIRMED** — e2e |
| **Live** solve vs classical optimum (3-city, cost 7) | **CONFIRMED** — `live-tsp-backend` project, API on `:8000` |
| Mapper invalid route / padding | **CONFIRMED** — e2e |
| Guest vs auth for TSP solve | **Guest-accessible** — pytest `test_solve_tsp_guest_accessible` (WIP tree) |

**Not live integration:** `tsp-backend.spec.ts` uses mocked `/api/v3/solve-tsp` — correctly labeled in spec comments.

**Clean `3f77ade` checkout:** `test_explorer_health_solve` **fails** (404 on solve) — implementation not in committed tree (**RR-001**).

---

## 3. Quantum Academy and Shor / QFT

| Check | Result |
|-------|--------|
| Lesson quiz + retry | **CONFIRMED** — `academy-core.spec.ts` |
| Prev/next catalog order | **CONFIRMED** |
| Prerequisites (teleport, shor→qft) | **CONFIRMED** |
| Guest quiz vs signed-in save message | **CONFIRMED (mock auth)** — `ux-audit-authenticated.spec.ts` |
| QFT norm + direct/gate equivalence (n≤2 UI) | **CONFIRMED** — `qft-lab.spec.ts` + `api/tests/test_qft_simulator.py` |
| Shor N=15, paths incl. gate e2e, multi-shot histogram | **CONFIRMED** — `shor-lab.spec.ts`, `api/tests/test_shor_multishot.py` |
| Non-coprime base rejected | **CONFIRMED** — e2e |
| Unsupported register / gate path | Partially covered — `test_shor_phase_validation.py` skips analytical peak when `r ∤ 2^t`; UI e2e for unsupported plan not exhaustive |
| Hardware / Sirraya cryptoscale | **Not claimed** — educational sim only |

Bit-order: see `docs/qft-simulator-conventions.md`.

---

## 4. Security and deployment

| Topic | Finding |
|-------|---------|
| Auth boundaries | `AuthGate` for `/circuits`, `/achievements`, `/settings/profile`; most routes public via `web/lib/publicRoutes.ts` including `/dashboard` (**RR-004** product/UX risk) |
| Authorization | Private circuits/progress expected server-side; not penetration-tested |
| CORS | `cors_allowed_origins()` — dev localhost + 127.0.0.1 |
| Body limit | 64 KiB middleware |
| Cookies | `SessionMiddleware`, `https_only` in production |
| Docker | `Dockerfile.api` **COPY sirraya/** — fails at **committed** `3f77ade` if `sirraya/` absent (**RR-005**) |
| Production runbook | Referenced in `DEVELOPMENT.md`; not re-validated end-to-end |

---

## 5. Test strategy — commands and results

All commands run 2026-10-26 from `D:\quantumwalk` unless noted. Environment: **working tree** + local API on port 8000 for live TSP.

| Command | Result |
|---------|--------|
| `cd api; python -m pytest tests -q` | **217 passed, 1 skipped**, 5 warnings (Python 3.14) |
| Skipped test | `test_shor_phase_validation` — analytical peak when truncated demo period |
| `cd web; npm run typecheck` | **Pass** |
| `cd web; npm run build` | **Pass** (middleware deprecation warning) |
| `npx playwright test e2e/smoke.spec.ts e2e/academy-core.spec.ts e2e/mapper.spec.ts e2e/qft-lab.spec.ts e2e/shor-lab.spec.ts --project=chromium` | **33 passed** |
| `npx playwright test e2e/tsp-backend.spec.ts e2e/ux-audit-authenticated.spec.ts --project=chromium` | **14 passed** |
| `npx playwright test --project=live-tsp-backend` (`PLAYWRIGHT_REUSE_DEV=1`) | **2 passed** — genuine live POST `/api/v3/solve-tsp` |
| Clean `3f77ade` worktree: `pytest tests/test_explorer_health_solve.py` | **2 failed** (404), 1 passed |
| Clean `3f77ade` worktree: full `pytest tests` | **193 passed, 2 failed, 1 skipped, 11 errors** (platform module subset — environment/import; not re-run on WIP) |

**Live integrations genuinely exercised:** FastAPI `/health`, POST `/api/v3/solve-tsp` through browser base URL (Next proxy), classical optimum check for default 3×3 matrix.

**Not exercised:** Real Google OAuth, PostgreSQL production deploy, real quantum hardware, Sirraya ML/Document Pro deep flows.

---

## 6. Defect register

Severity: **P0** release blocker · **P1** high · **P2** medium · **P3** low

### Confirmed defects

| ID | Sev | Summary | Impact | Reproduction | Proposed fix | Test coverage |
|----|-----|---------|--------|--------------|--------------|---------------|
| **RR-001** | P0 | ~~`/api/v3/solve-tsp` missing at git **`3f77ade`**~~ | **RESOLVED `d9b48f8`** — sirraya v3 package committed + `api/main.py` wiring | Was: detached worktree @ `3f77ade` → 404 | Done in `fix(api): include TSP v3 routes in release build` | `test_explorer_health_solve` + `sirraya/api/tests` on clean worktree |
| **RR-002** | P1 | Conflicting OAuth redirect documentation | Misconfigured Google Console blocks login | Compare `DEVELOPMENT.md` L28 vs L51 vs `.env.example` | Single canonical redirect (likely `:8000` API callback per `.env.example`); align DEVELOPMENT | Manual OAuth smoke |
| **RR-003** | P2 | CI/dev Python version drift | 3.14 deprecation warnings; DEVELOPMENT specifies 3.13 | Run pytest on 3.14 vs documented 3.13 | Pin CI to 3.13; document supported versions | CI matrix |
| **RR-004** | P1 | `/dashboard` public while marketing implies private space | Guest/authenticated confusion | Open `/dashboard` signed out — guest card | Product decision: gate route or rename copy | `ux-audit-authenticated` + smoke |
| **RR-005** | P0 | ~~Docker build references uncommitted `sirraya/`~~ | **RESOLVED `d9b48f8`** — `Dockerfile.api` committed with `COPY sirraya/` | Was: build at `3f77ade` only | Same commit as RR-001 | **Docker CLI not available** on audit host — build not executed; Dockerfile reviewed only |
| **RR-006** | P2 | `web/sirraya/node_modules/` not ignored | Accidental commit risk | `git status` shows untracked node_modules | Add `web/sirraya/node_modules/` to `.gitignore` (local WIP, **not committed**) | Follow-up |

### Risks and unknowns (not confirmed bugs)

| ID | Topic | Notes |
|----|-------|-------|
| **RK-001** | TS/Python simulator drift | Dual implementations; rely on paired tests |
| **RK-002** | Session secret rotation in dev | Restarts log users out |
| **RK-003** | FastAPI `@app.on_event("startup")` deprecated | Plan lifespan migration |
| **RK-004** | Next.js middleware → proxy migration | Build warning only today |
| **RK-005** | Platform pytest errors on clean HEAD | 11 errors in full suite — needs isolated rerun (worktree permission cleanup) |
| **RK-006** | Live OAuth + Postgres prod path | Not validated in this audit |

### Improvement opportunities (non-blocking)

- Wire CI to run Playwright groups + live TSP when API service present.
- Expand Shor unsupported-path UI tests.
- Archive Playwright traces for release sign-off.

---

## 7. Implementation performed in this audit

| Change | Rationale |
|--------|-----------|
| `.gitignore` — `web/sirraya/node_modules/` | **RR-006** — prevent accidental commit |
| `quantumwalk-parity-matrix.md` — 2026-10-26 evidence table | Evidence-backed parity update only |
| This document | Deliverable |

No production config changes. No auth bypass. No test assertion weakening.

---

## 8. Prioritized release plan

1. ~~**P0 — Integrate and commit TSP v3 slice**~~ **Done (`d9b48f8`).** Follow-up WIP (not in that commit): `api/explorer_routes.py`, `api/tsp_grover.py`, CORS helper, etc.
2. **P0 — Docker/CI:** Run `docker build -f Dockerfile.api .` in CI; add workflow for `pytest`, `npm run typecheck`, `npm run build`, Playwright chromium + live TSP sidecar.
3. **P1 — OAuth docs + one manual login smoke** on canonical redirect URI.
4. **P1 — Product call on dashboard/guest model** (**RR-004**).
5. **P2 — Python/Next deprecation cleanup** before long-term maintenance.

**Release recommendation:** Use **`d9b48f8` or later** for TSP v3 solve readiness. Remaining blockers: **RR-002**, **RR-004**, **RR-006**, CI/Docker proof, and unstaged product WIP.

---

## 9. TSP v3 integration verification (2026-10-26)

**Commit:** `d9b48f8` — `fix(api): include TSP v3 routes in release build`

**Files in commit (9):** `Dockerfile.api`, `api/main.py`, `sirraya/__init__.py`, `sirraya/api/__init__.py`, `sirraya/api/sirraya_v3_routes.py`, `sirraya/api/tsp_quantum_grover.py`, `sirraya/api/tests/conftest.py`, `sirraya/api/tests/test_sirraya_v3.py`, `sirraya/api/tests/test_tsp_quantum_grover.py`

**Staged diff summary:** +408 / −1 lines; `main.py` adds repo-root `sys.path`, imports `sirraya_v3_router`, `include_router(sirraya_v3_router)` only (no explorer router in this commit).

### Pre-commit tests (minimal `main.py`, staged tree)

| Command | Result |
|---------|--------|
| `cd api; python -m pytest tests/test_explorer_health_solve.py -q` | **3 passed** |
| `python -m pytest sirraya/api/tests -q` (repo root) | **5 passed** |
| `cd web; npx playwright test --project=live-tsp-backend` | **2 passed** (via existing Next dev on `:3000`; **note:** separate process on `:8000` returned **404** for solve — stale backend; proxy on `:3000` returned **200**) |

Typecheck/build **not run** — no frontend files in this commit.

### Clean-checkout worktree (`tsp-v3-verify-wt` @ `d9b48f8`)

| Command | Result |
|---------|--------|
| `pytest tests/test_explorer_health_solve.py` | **3 passed** |
| `pytest sirraya/api/tests` | **5 passed** |
| `uvicorn main:app --app-dir api --host 127.0.0.1 --port 8002` + POST `/api/v3/solve-tsp` | **200**, `success=true`, `classical_optimal_distance=7` |

### Docker

**Skipped** — `docker` not installed on verification host. `Dockerfile.api` copies `api/`, `sirraya/`, sets `PYTHONPATH=/app:/app/api`.

### Remaining release blockers

- **RR-002** OAuth redirect doc mismatch  
- **RR-004** public `/dashboard` vs private messaging  
- **RR-003** Python version documentation vs host  
- **RR-006** `.gitignore` for `web/sirraya/node_modules/` (WIP, unstaged)  
- CI + Docker build smoke  
- Large unstaged WIP (hub, academy, explorer demo routes, etc.)

---

## Appendix — Commits in scope

```
d9b48f8 fix(api): include TSP v3 routes in release build
3f77ade fix(hub): omit featured tools from All grid to avoid duplicate links
fb2349e feat(quantum): add multi-shot shor measurement
```

`fb2349e` adds `api/shor_multishot.py`, `web/lib/shorMultiShot.ts`, Shor lab UI histogram, tests — **present at HEAD** and covered by pytest/e2e on WIP tree.
