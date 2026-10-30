# Deployment

## Local (primary)

See [DEVELOPMENT.md](../../../DEVELOPMENT.md):

1. API on `127.0.0.1:8000`  
2. Web on `http://localhost:3000`  
3. Migrate: `alembic -c alembic.ini upgrade head`  

## Docker (optional dev stack)

```powershell
docker compose up --build
```

Services: `api`, `web`, `db` (PostgreSQL). Set secrets via `.env` — never commit.

## Production (PROPOSED)

- TLS terminator → web + API  
- `QUANTUMWALK_ENV=production`, strong `SESSION_SECRET`, PostgreSQL  
- See [PRODUCTION_RUNBOOK.md](../../../PRODUCTION_RUNBOOK.md)  

Public Sirraya deployment: **not performed** per charter.
