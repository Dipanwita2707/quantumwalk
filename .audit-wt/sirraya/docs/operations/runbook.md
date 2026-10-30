# Runbook

| Symptom | Action |
| --- | --- |
| `/readyz` fails | Check `DATABASE_URL`, run migrations |
| OAuth loop | Verify `GOOGLE_REDIRECT_URI` matches browser origin |
| Simulator 503 | Simulation slot saturation — retry or scale workers |
| Explorer offline in Sirraya UI | Start API on port 8000; hit `/health` |
| pytest cache denied (Windows) | Ignore or fix `.pytest_cache` permissions |

Logs: JSON request telemetry per DEVELOPMENT.md; no tokens in logs.
