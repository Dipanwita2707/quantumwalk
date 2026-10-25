# QuantumWalk platform build plan

**Status:** implementation plan with local build checkpoint, 10 October 2026.  
**Source:** [Complete Product, UI/UX, Security & Authentication Specification](QuantumWalk_Complete_Product_Security_Specification.docx), version 3.0.  
**Schema baseline (12 October 2026):** the user has completed the schema design. Implementation must follow that design, with any gaps or proposed changes identified explicitly before changing the schema. This plan does not establish that the current ORM and migrations fully match the supplied design; that requires a comparison. The implementation outcomes below mean working platform features, not delivery of additional documents.
**Planning baseline:** the workspace initially contained the specification and Codex instructions, but no application source or Git repository. The specification refers to an approved dashboard screenshot; that image is not embedded in the document or present at the workspace root. Visual fidelity needs the actual reference before it can be approved.  
**Implementation checkpoint:** `web/` and `api/` now provide the circuit workspace, bounded simulation, step playback, Bloch and state views, curated algorithms, lessons, challenges, private circuits and progress, account controls, code exports, and a local curated coach. The backend includes Google OIDC integration and PostgreSQL-compatible migrations; a live Google login has not been tested without project credentials. See [DEVELOPMENT.md](DEVELOPMENT.md) for setup and limits. Public launch still needs the approved visual reference, live OAuth/browser/accessibility review, production rate limits, monitoring, backups and restore proof, and policy review. External AI and real hardware are optional later integrations.

## 1. Product outcome and release boundary

**Updated product direction (10 October 2026):** the public entry is a dedicated landing page with an interactive 3D concept preview. Google sign-in is required for all platform content, simulation, circuits, learning, challenges, and tutoring. The earlier guest-lab proposal below is superseded by this explicit user requirement. Saved circuits remain private; external AI requires opt-in for each request.

QuantumWalk should let a person with no quantum background build a small circuit, run it, and understand what changed at each step. The central promise is **“See inside a quantum algorithm.”** Every explanation, animation, and result should connect to the same simulator output. The first public release is a secure, accessible, responsive web application with:

- A limited **Try a circuit** guest experience and a clear Google sign-in path for saving work and tracking progress.
- A circuit builder, state vector and probability view, Bloch sphere where mathematically meaningful, and synchronized step playback.
- Ideal simulation and separate finite-shot measurement results, with explicit labels and bounded resource use.
- Curated starter circuits, a short beginner learning path, a few deterministic challenges, and private saved circuits.
- Profile, privacy controls, logout, account deletion, operational monitoring, backup/recovery, and published legal notices.

**Later releases:** optional AI tutor, noisy simulation, sharing, advanced curriculum, and real hardware. Hardware must never appear to be available in the MVP if it is not connected. Tutor answers must never replace simulator-derived numbers.

## 2. Make it inviting and understandable

Design the first session around a visible result within two minutes, without requiring terms such as *amplitude* or *phase* before the user needs them:

1. Landing page: one sentence about the outcome, a short interactive preview, **Try a circuit** and **Continue with Google**. Explain the guest limit plainly.
2. Open a ready-made one-qubit circuit. A guided hint asks the user to add an H gate. The circuit, step highlight, probability bars, and explanation update together.
3. Offer **What changed?** beside each step: plain-language explanation first, then an optional math/details reveal. Never use decorative animation as a substitute for a real state change.
4. Offer **Make a Bell pair** as the second example. Show why two correlated measurements appear, while distinguishing exact ideal probabilities from sampled counts.
5. End with a useful next action: remix the circuit, save it after sign-in, start a short lesson, or attempt a related challenge.

Interaction rules:

- Direct manipulation plus full keyboard alternatives: add/select/move/remove gates, connect controls, undo/redo, parameter editing, and clear confirmation where data would be lost.
- One selected step is the source of truth for gate highlight, equation, state table, chart, and Bloch display. Hover/focus or row selection can cross-highlight related information without changing the underlying state.
- Friendly validation at the edit point: explain invalid control/target choices, unsupported operations, and limits; suggest a valid next action.
- Keep an explicit **Run Simulation** action and show stale-result status after edits, so users can tell which circuit produced visible results. Small local previews may be added later if performance allows.
- Provide purposeful loading, empty, error, success, disabled, and provider-unavailable states. Keep motion subtle and respect reduced-motion preferences.
- Use a novice/advanced disclosure pattern rather than separate inconsistent tools. Advanced details include complex amplitudes, phase, basis ordering, circuit depth, shot count, and limitations of single-qubit Bloch views for entangled states.
- Verify comprehension with moderated usability sessions: can a new learner explain what H and measurement did, distinguish exact probability from shot counts, and recover from one invalid edit? Fix observed confusion before expanding content.

## 3. Reference-aligned experience

The supplied specification describes a dark navy desktop workspace with violet/cyan accents, top navigation, gate-library sidebar, three main visualization panels, three lower panels, and bottom feature cards. Preserve that composition when the reference image is available. Adapt, rather than squeeze, the workspace on narrow screens: collapsible sidebar on tablet; circuit canvas first and results in tabs or sheets on mobile. The login page uses the same visual language with a simpler, accessible split layout on desktop and centered card on mobile.

Create a clickable prototype before implementation. Its review must cover layout proportions, spacing, typography, motion, touch targets, focus states, contrast, screen-reader names/status, and real interaction affordances. Do not mark screenshot fidelity complete until the actual reference has been compared at desktop and responsive widths.

## 4. Technical shape and contracts

The document proposes Next.js/TypeScript, FastAPI/Python, Qiskit Aer, and PostgreSQL. Treat these as a **proposed** stack because no application code exists here to confirm conventions. At kickoff, record the package manager, supported runtimes, hosting boundary, and one authentication approach. Choose individual UI libraries only after the prototype shows a need; SVG is a reasonable first circuit/Bloch rendering option, with no 3D dependency by default.

| Boundary | Responsibility and contract |
| --- | --- |
| Browser | Typed circuit editing, accessible interaction, derived display state, session-aware navigation. Never stores provider secrets or treats hidden controls as authorization. |
| Auth/session boundary | Maintained Google OIDC authorization-code flow with PKCE where applicable, state/nonce validation, exact callbacks, minimal identity scopes, secure server-managed session, safe internal return paths, logout/revocation. |
| API | Versioned structured circuit schema; validation, authentication, ownership, quota and rate checks; stable errors; response identifiers linking results to circuit revision and simulation mode. |
| Simulator | Translate allowlisted gates into bounded Qiskit/Aer operations. Return normalized basis ordering, amplitudes, probabilities, step snapshots, and sampled counts. Never execute submitted Python or shell code. |
| Database | Internal UUID identity; provider subject mapping; private-by-default circuits; progress and minimal run metadata; retention and deletion workflows. Migrations and access rules are reviewed before implementation. |
| Optional providers | AI and hardware live behind explicit consent/action, server-held credentials, quotas, clear status, and failure isolation. Neither is on the MVP critical path. |

Implement the canonical circuit format against the supplied design: check schema version, qubit count, ordered operations, gate type, target/control indexes, validated numeric parameters, and measurement semantics. Identify any missing fields or compatibility questions rather than replacing the user's schema. Document little/big-endian display convention and test it against backend fixtures. Keep circuit draft/revision, selected step, and simulation result identities explicit to prevent panels from showing mixed versions. Use synchronous simulation while the bounded MVP workload fits its timeout; introduce a job queue only when measured load requires one.

Initial API families: identity/session, algorithm templates, simulation and step snapshots, private circuit CRUD, lesson/progress, account export/deletion. Publish request/response examples and safe error codes. QASM export is released only after compatibility tests; generated Qiskit Python may be downloaded but never executed by the service.

## 5. Platform implementation sequence and acceptance checks

The durations below are historical planning estimates for a small team, not commitments or a current list of unfinished work. Re-estimate remaining implementation after checking the existing platform against the user's schema and requirements.

| Phase | Estimated time | Working platform outcomes | Acceptance check |
| --- | --- | --- | --- |
| 0. Discovery and design | 3–5 working days | Acquire/reference screenshot, clickable responsive prototype, first-session script, route map, auth decision, data classification, threat model, implementation mapping to the supplied schema/API design, baseline accessibility review. | Stakeholders can complete the novice flow in prototype; layout and security design approved. |
| 1. Core lab vertical slice | 2–3 weeks | App foundation; one-qubit editor; H/X/measurement; ideal and sampled simulation; step snapshots; probability/state panels; honest Bloch view; error/limit states. | Circuit → API → simulator → synchronized panels works; scientific fixtures and keyboard path pass. |
| 2. Secure account and project release | 2–3 weeks | Google login/logout, session and protected routes, profile/privacy pages, private circuit CRUD, PostgreSQL, account deletion/export path, backup setup, observability. | OAuth failure paths, session expiry, ownership/IDOR, CSRF, secrets, limits, and restore tests pass. |
| 3. Beginner product and public MVP | 2–3 weeks | Remaining core gates and controlled operations; curated Bell/GHZ and other supported templates; beginner lessons; deterministic challenges; responsive polish; privacy/terms; release runbooks. | New learner completes onboarding; Bell-state and shot-count tests pass; accessibility, responsive, security, and release checklist pass. |
| 4. Opt-in enhancements | 2–4 weeks per scoped increment | Contextual AI tutor with disclosed data flow and provider failure behavior; then noise models, sharing, advanced exports/content if justified. | Each increment has usage caps, privacy review, numerical grounding and feature-specific tests. |
| 5. Hardware integration | 2–4 weeks after a stable core | Provider adapter, explicit job confirmation, queue/status, result comparison, quota and credential controls. | Real supported small job and failure/retry paths pass; costs and provider limitations are documented. |

Security, accessibility, resource controls, monitoring and recovery start in the first applicable phase. They are not deferred to a final “hardening” pass. Implement in scoped vertical slices; avoid a broad framework buildout before the first circuit works.

## 6. Minimum data and privacy design

Start with users, provider identities, circuits, algorithm/lesson content and user progress. Add session storage only if the selected auth system requires it; add retained simulation metadata only for a clear user or operational need. Every user-owned record carries an owner ID, and every access checks the acting user on the server. Circuit sharing, if later introduced, is explicit and revocable; the default stays private.

Document exact fields and retention for profile data, circuits, progress, simulation metadata, logs, and optional AI interactions. Store no full AI prompt/response by default. Do not send private circuits, questions, identity details, or research data to a third-party AI service without explicit approval and disclosure. Provide data export/deletion behavior and account-deletion consequences in the product and policy. Use aggregated analytics when possible and disclose collection.

## 7. Security and reliability gates

- **Identity and access:** maintained OIDC library/provider; state/nonce/PKCE as applicable; issuer/audience/signature and exact redirect checks; secure HttpOnly/SameSite cookies, HTTPS, expiry, session rotation/revocation; protected routes and server-side object ownership. Test a second user's forged resource IDs.
- **Simulation abuse:** strict structured schema, allowed gates only; configure and test maximum qubits, operation/depth count, shots, payload size, CPU time, memory, concurrent runs, and per-user/IP request rates. The document suggests 1–5 qubits initially; benchmark before finalizing exact limits.
- **Web/API:** typed validation, parameterized database access, safe errors, CSRF protection for cookie-authenticated mutations, safe tutor rendering, restrictive CORS/CSP and security headers, no open redirects, no secret-bearing client bundles or logs.
- **Operations:** separate dev/production secrets and OAuth callbacks; least-privilege DB access; dependency/secret scanning; health checks, error and cost alerts, backup/restore test, incident and rollback runbooks. Enable quotas and budget alerts before public traffic.
- **Release proof:** targeted unit, integration and end-to-end tests plus a focused security review. A narrow checklist is not a certification or full penetration test.

## 8. Test and acceptance matrix

| Area | Required evidence |
| --- | --- |
| Science | H on `|0⟩`; Bell state `( |00⟩ + |11⟩ ) / √2` with 0.5/0.5 ideal probabilities; controlled-gate and phase fixtures; normalization and stable basis ordering; step states match final state; sampling shown separately. |
| Editing | Mouse, touch and keyboard paths to add/move/remove gates; control/target validation; parameter boundaries; undo/redo; stale-result behavior; clear/reset behavior. |
| Experience | First-time user flow, mobile/tablet/desktop layouts, real empty/loading/error/success states, visible focus, screen-reader status, contrast and reduced motion. |
| Auth/data | Login success/cancel/provider failure/invalid state, protected-route return, session expiry/logout, private saved circuits, cross-user IDOR tests, account export/deletion. |
| Abuse/privacy | Oversized circuit/shots, request rate and timeout/concurrency tests; CSRF/XSS-safe rendering checks; scans; log review; backup restore; AI consent/provider outage tests if AI ships. |

Before launch, run the project's applicable TypeScript/lint, Python/unit/integration, browser end-to-end, accessibility and dependency checks, then inspect the actual diff. Preserve a reproducible release candidate and rollback path.

## 9. Decisions and dependencies to resolve at kickoff

1. Obtain the **actual approved dashboard screenshot**; the document describes it but does not contain it. Confirm visual acceptance at desktop and mobile.
2. Confirm guest demo versus fully account-gated lab. This plan recommends a bounded guest demo for lower friction; saving and progress require sign-in.
3. Select one managed or library-based Google OIDC/session solution and hosting topology. Then finalize callback URLs, CSRF approach, cookie domain, session store and account lifecycle.
4. Confirm the MVP gate set, 1–5 qubit cap, exact payload/shots/time limits, supported measurement placement, and Bloch behavior for entanglement. Benchmark before setting production quotas.
5. Approve whether AI is excluded from first public release and, if later enabled, its provider, consent text, data sent, retention and spend cap. Hardware stays later unless a provider and budget are committed.
6. Decide content ownership: who writes/reviews lessons and verifies explanations for scientific accuracy. Resolve the specification's cover title **“QUANTUMLENS AI”** against the consistent product name **QuantumWalk** before publishing brand assets.

The document's price ranges are rough planning figures, not current vendor quotes. Obtain current quotes and load measurements before making a hosting or budget commitment.
