# QuantumWalk — Codex Project Rules

## Product
QuantumWalk is an educational quantum-computing platform. Tagline: “See inside a quantum algorithm.” Preserve the approved reference-aligned dark navy UI with violet/cyan accents unless asked to change it.

## Context efficiency
- Inspect only files relevant to the current task; do not scan the entire repository by default.
- Check `git status --short` before editing and preserve unrelated user changes.
- Do not dump full files, large logs, dependency trees, or the entire repository tree.
- Do not spawn agents for routine tasks.
- Make one scoped change at a time. Ask before expanding scope.
- Reuse existing documentation and patterns instead of rediscovering architecture.
- Run targeted checks first; do not skip necessary tests or security checks to save context.
- Final response: at most five bullets covering changes, verification, and remaining issues.

## Engineering quality
- Follow the existing architecture, naming, package manager, formatting, and testing conventions.
- Make the smallest complete change; do not rewrite working code without evidence.
- Avoid unnecessary dependencies, abstractions, duplicated logic, dead code, and broad refactors.
- Validate inputs at trust boundaries, use typed interfaces, and handle errors deliberately.
- Never claim tests/checks passed unless actually run. State skipped checks and why.
- Review `git diff --check`, `git diff --stat`, and the actual diff.
- Ask before destructive commands, database resets, production deployment, schema changes, broad refactors, or adding dependencies.

## QuantumWalk product requirements
- Main workspace: circuit builder, Bloch sphere, state vector, step-by-step execution/state evolution.
- Supporting areas: AI tutor, algorithm library, interactive learning, challenges, optional real-hardware integration.
- A local/classical simulator is sufficient for the MVP; real quantum hardware is optional.
- Preserve screenshot/reference fidelity: responsive layout, coherent spacing, readable hierarchy, accessible controls, meaningful empty/loading/error states.

## Planned stack (verify actual repository before assuming)
Next.js + TypeScript frontend; FastAPI backend; Qiskit Aer simulation; PostgreSQL persistence. Reuse the actual repository's stack and conventions.

## Security and privacy
- Google sign-in must use proper OAuth/OIDC, state/nonce and PKCE where applicable, exact redirect URIs, minimal scopes, and secure session handling.
- Enforce authorization server-side on every private resource; prevent IDOR/BOLA.
- Saved circuits/results are private by default.
- Bound simulator resources (qubits, circuit depth, shots, runtime, concurrency, and request rate).
- Never expose arbitrary Python or shell execution to users.
- Apply input validation, safe errors, appropriate CSRF/XSS protections, safe CORS, least-privilege database access, log redaction, dependency checks, and secrets management.
- Never commit credentials, real user data, or production data.
- Do not send private research/user data to third-party AI services without explicit approval and clear disclosure.

## Task workflow
1. Identify acceptance criteria and inspect only relevant files.
2. Make the smallest coherent change.
3. Run targeted verification appropriate to the risk.
4. Review the diff for correctness, maintainability, security, and scope.
5. Summarize concisely; do not claim broader validation than performed.
