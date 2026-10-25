# Technology decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Frontend | Next.js (existing) | Repo convention, SSR for academy SEO |
| Backend | FastAPI (existing) | Simulator + OAuth already integrated |
| DB | PostgreSQL prod / SQLite dev | Existing migrations |
| Sirraya hub clone | Deferred separate Vite app | Avoid duplicate stack; QW covers quantum+academy |
| Redis/K8s | Rejected | No demonstrated need |
| REA | CLI ok; MCP optional | Browser capture when setup |
| Document storage | SQL proposal | Future Doc Editor sync |
