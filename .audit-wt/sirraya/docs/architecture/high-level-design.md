# High-level design

## Layers

1. **Presentation** — Next.js App Router (`web/app`)  
2. **API** — FastAPI (`api/`)  
3. **Simulation** — Qiskit Aer + pedagogical noise  
4. **Persistence** — SQLAlchemy + PostgreSQL/SQLite  

## Major subsystems

| Subsystem | Routes / modules |
| --- | --- |
| Academy | `/academy`, `/learn`, `/learn/reference` |
| Lab | `/workspace` |
| Explorer | `/explorer`, `sirraya_v3_routes` |
| Account | OAuth, `/dashboard`, private circuits |

## Deployment unit

Monolith API + static/SSR web — no microservices (PROPOSED).
