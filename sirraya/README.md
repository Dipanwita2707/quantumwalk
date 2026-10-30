# Sirraya reimplementation

All Sirraya-related code, docs, and assets live **only under this folder**.

## Layout

| Path | Purpose |
| --- | --- |
| [docs/](docs/) | Specifications, evidence, architecture, handover |
| [api/](api/) | `sirraya_v3_routes.py`, `tsp_quantum_grover.py`, tests |
| [web/](web/) | Hub, Document Pro, Doc Editor, ML Studio, Academy UI |
| [scripts/](scripts/) | Bundle parsers, REA helper |
| [database/](database/) | Proposed hub SQL |
| [openapi/](openapi/) | OpenAPI spec |
| [references/](references/) | Competitive reference notes |

## Runtime wiring (QuantumWalk)

Next.js **routes** stay thin re-exports so URLs work:

- `web/app/hub/**` → `@sirraya/routes/hub/**`
- `web/app/academy/**` → `@sirraya/routes/academy/**`

FastAPI loads the package from repo root:

- `api/main.py` → `from sirraya.api.sirraya_v3_routes import router`

Next.js resolves **`@sirraya/*`** → `sirraya/web/*` (`web/tsconfig.json` + `web/next.config.ts` `outputFileTracingRoot`).

Route stubs: `web/app/hub/*` and `web/app/academy/*` re-export from `@sirraya/routes/...`.

Styles: `web/app/style.css` imports `../../sirraya/web/styles/hub.css`.

After `npm install` in `web/`, run **`sirraya/scripts/link-sirraya-dev.ps1`** (Windows) or **`link-sirraya-dev.sh`** (Linux/macOS) so `sirraya/web/node_modules` points at `web/node_modules` for TypeScript and `next build`.

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest api\tests sirraya\api\tests -q
```

## Docs entry

[sirraya/docs/final/handover-guide.md](docs/final/handover-guide.md)
