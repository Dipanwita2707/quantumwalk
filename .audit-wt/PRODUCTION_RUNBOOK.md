# QuantumWalk — release operations

Prepared 13 October 2026. Hosting account, domain, HTTPS routing, alert destination, backup storage and isolated restore database must be selected before this becomes an executed deployment. No production deployment or restore has been performed.

## 1. Build and configuration

Use the locked frontend dependencies (`npm ci` in `web/`) and pinned `api/requirements.txt`. Run the backend tests and frontend production build before release. Preserve the current schema; resolve the differences in `SCHEMA_IMPLEMENTATION_REVIEW.md` before proposing migrations.

Keep production secrets in the hosting provider's secret store, separate from local `.env`. Configure `QUANTUMWALK_ENV=production`, `DATABASE_URL`, a strong stable `SESSION_SECRET`, `FRONTEND_ORIGIN`, Google client credentials and the exact HTTPS callback URL. Set `NEXT_PUBLIC_API_URL` before building the frontend. Optional AI credentials stay on the API only.

Use an HTTPS application domain and an API hostname within the same site, such as `app.example.com` and `api.example.com`, for the current SameSite=Lax cookie flow. Unrelated frontend/API domains require a reviewed cookie and CSRF design. Register the exact callback in Google Cloud and restrict CORS to the selected frontend origin.

Start the API behind the hosting platform's trusted HTTPS proxy:

```text
python -m uvicorn main:app --app-dir api --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
```

This command is for a proxy on the same machine. A managed host may require its assigned bind address and port. Disable ordinary access logs because callback query strings contain OAuth codes. The application emits JSON request records with a generated request ID, route template, method, status and duration; it excludes query strings, cookies, bodies and user identity. Configure equivalent redaction at the proxy. Retain logs for an agreed period and restrict access.

Start the built frontend using `npm exec next start -- --hostname 127.0.0.1 --port 3000` from `web/`, behind the proxy. Use a managed process supervisor, automatic restart and separate migration credentials. Do not use development servers or reload mode for production.

Keep one API worker while quotas and simulator slots are process-local. Before scaling, implement shared quotas and a job/runtime isolation strategy. Configure trusted-proxy handling, gateway request limits, the existing 64 KiB payload limit, and host CPU/memory limits. Do not expose the API process directly to public traffic.

## 2. Monitoring and alerts

- `/health`: process liveness. `/readyz`: database connectivity; returns 503 on a database error without revealing connection details. Readiness does not prove migration or external-provider readiness.
- Probe every minute with `python scripts/monitor.py --api-url https://api.example.com`. It returns JSON and exits 1 on a failed check. Configure the host's scheduler and monitoring system to alert after three consecutive failures, and test notification delivery.
- Alert on sustained 5xx errors, slow requests, database connection exhaustion, backup failures and unexpected AI spending. Set thresholds after measuring normal traffic.
- Keep readiness available to the monitor; rate-limit or restrict public access at the gateway. Route templates in application logs avoid user-controlled path values as metric labels.

## 3. Backup and restore rehearsal

Enable the database provider's managed backups/PITR as available in the selected plan. Confirm retention, recovery objectives and billing in that account. An application-schema archive is an additional portable export, not a replacement for managed recovery or a complete Supabase project backup.

Install PostgreSQL client tools compatible with the server. Create an access-restricted backup directory, then run:

```powershell
.venv\Scripts\python.exe scripts\backup.py --output backups\quantumwalk-2026-10-13.dump
```

The script uses `DATABASE_URL`, passes credentials through the child environment, exports only `public`, refuses existing filenames, suppresses sensitive tool errors, validates archive readability and writes a SHA-256 checksum. Archive inspection is not a restore test. Failed outputs are incomplete and must not be treated as backups. Store successful exports in encrypted, access-controlled storage outside the application host. Arrange scheduling and retention through the chosen provider; neither is configured yet.

For a rehearsal, provision an **empty, isolated PostgreSQL database**, with a restricted temporary role. Set PostgreSQL connection variables for that destination in a controlled shell; never reuse the source connection. After checking the destination and receiving approval for the restore, run:

```text
pg_restore --exit-on-error --single-transaction --no-owner --no-acl --dbname quantumwalk_restore_check backups/quantumwalk-2026-10-13.dump
```

Do not use `--clean` or `--create` against an existing database. Check restored table counts and Alembic revision against the source, constraints/foreign keys, and a staging application using the restored database. Verify private ownership, saved circuits and progress with controlled test accounts. Record elapsed recovery time, evidence and cleanup approval. Compare with agreed recovery objectives before approving release.

## 4. Live acceptance and rollback

Complete Google sign-in/cancel/logout/session-expiry checks on the real HTTPS deployment. Check new detail-page return destinations. With controlled test accounts, save and reload a circuit, confirm another account cannot access it, complete a lesson and challenge, and try opt-in AI and provider failure. Do not send private research data for testing.

Record the release artifact, configuration version and migration revision. Keep the previous application artifact ready. Prefer application rollback while retaining a compatible database; do not downgrade or restore production data without a reviewed plan and explicit approval. Conduct keyboard, screen-reader and user comprehension review, plus privacy/terms approval.

Sources: [PostgreSQL pg_dump documentation](https://www.postgresql.org/docs/current/app-pgdump.html), [PostgreSQL pg_restore documentation](https://www.postgresql.org/docs/current/app-pgrestore.html). Archive exports can exclude other schemas and global roles; dependency and permissions checks remain part of recovery testing.
