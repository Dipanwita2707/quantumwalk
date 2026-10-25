# Security controls

| Control | Location |
| --- | --- |
| OAuth state/nonce/PKCE | `api/auth.py` |
| Session hashing | Settings + DB |
| CSRF | `require_csrf` |
| Body size limit | `BodyLimitMiddleware` |
| CORS allowlist | `settings.cors_allowed_origins` |
| Input validation | Pydantic models |
| Public simulate bounds | `limits.py` |
| solve-tsp rate limit | `sirraya_v3_routes` |

## Remediation backlog

- Run `npm audit` / pip audit before public release  
- Prove OAuth E2E with real credentials (manual)  
