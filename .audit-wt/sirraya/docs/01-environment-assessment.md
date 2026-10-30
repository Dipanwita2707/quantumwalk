# Environment assessment

**Date:** 25 October 2026  
**Classification:** OBSERVED (machine checks) + INFERRED (tooling)

## Host

| Item | Value | Source |
| --- | --- | --- |
| OS | Windows 10.0.26200 | User session |
| Shell | PowerShell | User session |
| Workspace | `D:\quantumwalk` | Git root |
| Git branch | `master` (many modified/untracked files) | `git status` |

## Runtimes (verified)

| Tool | Version |
| --- | --- |
| Node.js | v24.22.1 |
| npm | 11.12.1 |
| Python | 3.14.6 (3.13 recommended for Qiskit in DEVELOPMENT.md) |
| Git | 2.51.0.windows.1 |

## Existing product stack (OBSERVED — repo)

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, TypeScript (`web/`) |
| Backend | FastAPI (`api/`) |
| Simulation | Qiskit Aer |
| Database | SQLite dev / PostgreSQL via `DATABASE_URL` |
| Auth | Google OAuth, server sessions |

## Target platform (OBSERVED)

| Check | Result |
| --- | --- |
| URL | https://tools.sirraya.org/ |
| HTTP | 200 OK (HEAD) |
| Auth for hub | Not required for landing (OBSERVED via fetch) |
| App type | Single-page web application (Vite + React) |
| Deep URLs | Paths like `/quantum-academy` return **404 at CDN** — routing is in-app state, not path-based (OBSERVED; aligns with [SIRRAYA_REFERENCE_AND_ROADMAP.md](../references/SIRRAYA_REFERENCE_AND_ROADMAP.md)) |
| Mobile | Dedicated “Best on a larger screen” gate (bundle) |

## REA toolkit

| Item | Status |
| --- | --- |
| Cursor MCP namespace `rea` | **BLOCKED** — not registered in this session (`GetDynamicTools` pattern `rea` → no REA server) |
| `rea-agents` npm (CLI) | **OBSERVED** — `npx rea-agents@latest --help` → v6.8.0 |
| `analyze-javascript-application` | **OBSERVED** — succeeded on downloaded Sirraya chunks under `%TEMP%\sirraya-assets` |
| `analyze-web-bundle` | Requires live CDP `endpoint` + `targetId` (browser capture); not run in this cycle |

**Recommendation:** Run `npx rea-agents setup` and restart Cursor to enable MCP browser/bundle capture for Phase 3–4 depth.

## Auxiliary scripts (this program)

- `scripts/sirraya_parse_registry.py` — extract hub tool IDs from entry bundle  
- `scripts/sirraya_extract_urls.py` — extract hard-coded API URLs from chunks  

## Risks

- Large in-flight QuantumWalk diff — Sirraya changes must stay scoped (`docs/`, `sirraya-platform/`, targeted API extensions).  
- Python 3.14 vs project’s 3.13 Qiskit pin — use `.venv` with 3.13 for simulation tests per DEVELOPMENT.md.
