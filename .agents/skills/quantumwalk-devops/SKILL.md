---
name: quantumwalk-devops
description: Use for CI/CD, Docker, environment configuration, deployment, observability, backups, and production-readiness changes in QuantumWalk.
---

# DevOps and production readiness

- Inspect current deployment and CI conventions before changing them.
- Keep dev/test/staging/prod settings distinct; fail safely when required configuration is missing.
- Never commit secrets. Provide `.env.example` only with fake placeholders.
- Use reproducible builds, pinned/locked dependencies, health checks, structured logs, and actionable monitoring.
- Apply least privilege, safe network exposure, TLS, backups, and a tested restore approach.
- Use multi-stage/minimal containers where the project already uses Docker; run as non-root where feasible.
- Keep deployments reversible and migrations coordinated.
- Ask before production changes, destructive operations, or credential rotation.
- Do not claim production readiness without checking the relevant evidence.
