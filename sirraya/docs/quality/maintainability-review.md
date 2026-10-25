# Maintainability review

**Strengths:** Clear split `web/` / `api/`; typed TS; Pydantic boundaries; docs under `docs/`.

**Risks:** Large workspace page; Sirraya program docs drift without evidence register updates.

**Recommendations:** Wire hub SQL only when Doc API lands; keep compat routes isolated in `sirraya_v3_routes.py`.
