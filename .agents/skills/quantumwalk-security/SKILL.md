---
name: quantumwalk-security
description: Use for security review or changes involving Google OAuth, sessions, authorization, APIs, privacy, secrets, or quantum simulation abuse prevention.
---

# Security engineering

- OAuth/OIDC: use a proper flow, validate state/nonce and PKCE where applicable, exact redirect URIs, minimal scopes, secure session cookies, and safe logout.
- Authorization: enforce server-side for every protected object; prevent IDOR/BOLA and privilege escalation.
- Inputs: validate types, ranges, size, and semantics at trust boundaries; use parameterized database access.
- Web: assess XSS, CSRF, CORS, open redirects, clickjacking, and security headers as applicable.
- Secrets: use environment/secret management; never log or commit credentials.
- Privacy: minimize collection and retention; redact logs; disclose third-party AI data flows and obtain approval before sending private research data.
- Simulation: never expose arbitrary Python/shell execution. Bound qubits, depth, shots, runtime, concurrency, and request rate.
- Dependencies: prefer established, maintained packages; review vulnerabilities and permissions.
- Report severity, evidence, impact, and minimal fix. Scope limitations must be explicit; a narrow review is not a full audit.
