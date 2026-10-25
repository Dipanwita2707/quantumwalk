# Live TSP backend (Playwright)

The mocked suite in `tsp-backend.spec.ts` stubs `/health` and `/api/v3/solve-tsp`. The **live** project hits a real FastAPI process.

## Why port 8000 can look “stale”

A long-running `uvicorn` on **8000** keeps the Python modules loaded at **process start**. If `api/main.py` later gained `sirraya_v3_router` (`POST /api/v3/solve-tsp`), an old worker without `--reload` (or started before that change) still serves explorer routes but returns **404** for `/api/v3/solve-tsp`.

**Check (no restart required):**

```powershell
(Invoke-RestMethod http://127.0.0.1:8000/openapi.json).paths.PSObject.Properties.Name | Select-String solve-tsp
```

If nothing matches, restart the API (same shell you own):

```powershell
# From D:\quantumwalk — stop the old uvicorn on 8000 (Ctrl+C in its window), then:
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir api --reload --host 127.0.0.1 --port 8000
```

Alternatively, run current code on another port and point Next at it:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir api --host 127.0.0.1 --port 8001
$env:API_INTERNAL_URL = "http://127.0.0.1:8001"
cd web
npm run dev
```

Next.js reads `API_INTERNAL_URL` in `next.config.ts` for rewrites (`/health`, `/api/*`). Browser code uses same-origin paths unless `NEXT_PUBLIC_API_URL` is set.

## Run live Playwright

```powershell
cd D:\quantumwalk\web
$env:API_INTERNAL_URL = "http://127.0.0.1:8000"   # must expose /api/v3/solve-tsp
# If port 3000 is already in use, pick another dev port:
$env:PLAYWRIGHT_DEV_PORT = "3001"
$env:CI = "1"
npm run test:e2e:live-tsp
```

If `next dev` is already running with the correct `API_INTERNAL_URL` (Next allows only one dev server per `web/` directory):

```powershell
$env:PLAYWRIGHT_LIVE_NO_WEBSERVER = "1"
npm run test:e2e:live-tsp
```

Default mocked E2E (CI-friendly):

```powershell
npx playwright test --project=chromium
```
