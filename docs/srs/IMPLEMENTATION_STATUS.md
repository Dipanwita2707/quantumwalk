# QuantumWalk SRS implementation and acceptance

Updated 30 October 2026. Source requirements: `QuantumWalk_Lab_SRS_v1.docx`. Visual source: `Quantum Lab Neon UI Showcase.png`.

The latest implementation checkpoint is [COMPLETION_CONTINUATION.md](COMPLETION_CONTINUATION.md): lesson versions, weighted rubrics, boss missions, Discovery Universe, What-If/Autopsy, operations and opt-in durable scientific jobs have now been added. The tables and test results below describe the preceding baseline where they differ; outstanding acceptance is explicitly listed in the continuation note.

This is a working implementation in the existing Next.js/FastAPI application. It is not a claim that live payment/email providers, scientific review, institutional pilot acceptance or production deployment have been completed.

The detailed requirement ledger is [requirement-traceability.csv](requirement-traceability.csv). It explicitly separates implemented behaviour from partial requirements and external acceptance.

Current user priority: finish reference-aligned reusable UI before further SRS feature expansion. The latest foundation, route mapping, screenshots, verification and remaining visual gaps are recorded in [REFERENCE_UI_FOUNDATION.md](../ux-refinement/REFERENCE_UI_FOUNDATION.md). Shared styling does not imply exact visual completion of every reference screen.

The 30 October UI continuation covers identity, lessons, community, missions, challenges/ranking, pricing and hardware layouts using shared components and actual data. Its final selected Chromium run passed **63 tests**; TypeScript and production build passed. Live provider acceptance and exact illustration/pixel matching remain separate from this result. No backend or schema work was added during this UI pass.

| SRS release | Implementation state | Exit gate still requiring acceptance |
| --- | --- | --- |
| R0 Audit/design | Repository, routes, reference image, SRS and existing tests audited; reusable architecture retained | Product-owner visual acceptance |
| R1 Core learning | Identity, guided models, catalog, prediction, mission and confirmed progress implemented | Real email/OAuth callback and novice usability acceptance |
| R2 Lab productivity | Atomic/tunnelling models, Studio, notebooks, reports, comparison and privacy checks implemented | Scientific review and full export/accessibility acceptance |
| R3 Monetization | Configurable plans, hosted checkout, signed events, usage and cancellation adapter implemented | Real sandbox checkout/webhook/email setup and approved commercial policy |
| R4 Differentiation | Bell, cosmology toy model, explanatory result interpretation and parameter sweeps implemented | Scientific acceptance; further depth of What-If/Autopsy tooling |
| R5 Institution | Class/assignment/submission/feedback and aggregate analytics implemented | Institution pilot, richer rubric authoring and policy sign-off |
| R6 Scale/hardware | Existing bounds and deployment/backup runbooks retained | Capacity testing, distributed workers and optional real-hardware provider integration |

## Implemented product flows

| Area | Routes / implementation | Evidence |
| --- | --- | --- |
| Shared interface | Existing Home, Dashboard, Learn, Lab, Explore and Tools routes; shared navy/violet/cyan tokens, responsive navigation, keyboard skip link; new hero and quest illustrations | `reference-system.css`, `SiteHeader.tsx`, responsive browser suites |
| Scientific catalog | `/lab`: search, domain/difficulty/duration/preparation filters and sorting; nine model definitions with objectives, units, versions, assumptions and references | `science_models.py`, `science_routes.py`, `test_science_laboratory.py` |
| Guided experiment | `/lab/[slug]`: prediction, validated inputs, seed, real execution, reset, plots, numerical tables, interpretation, limits, related concepts and parameter sweeps | `srs-live.spec.ts`, model regression tests |
| Scientific models | Double-slit, rectangular-barrier tunnelling, hydrogen 1s radial density/emission, harmonic oscillator, singlet Bell correlations, weak-field lensing, linear cosmic-structure toy model, proton-pair Gamow factor, synthetic spectrum | Finite/reproducible known-answer tests; each model states its approximation |
| Saved research | `/notebook`: owner-scoped runs, search/pagination, compatible run comparison, duplication, named notebooks, notes and report exports | Real API browser journey; ownership, report and quota tests |
| Reports | PDF with vector plot and model/method/parameters/prediction/results/interpretation/limits; CSV numerical series; JSON full model/run metadata | Downloaded PDF header verified in browser; private download tests |
| Missions | `/missions`: objectives, prerequisites, hints, recorded run evidence, checkpoint, reflection, unique reward events and completion status | Replay/idempotency and matching-run tests |
| Progress and privacy | Server-confirmed mastery, XP, earned mission badges and UTC mastery streaks without XP removal; `/leaderboard` is opt-in and time-bounded; `/settings/preferences` persists experience/interests/motion/consent | Leaderboard consent, streak and reward tests |
| Identity | Existing Google OIDC retained; `/account/access` adds registration, verification, password reset and email sign-in; existing sessions are reused and revocable | Password/token reuse/origin checks; OIDC state/nonce/PKCE browser tests |
| Billing | `/pricing`, `/billing`: configurable plans, real hosted checkout adapter, signed/idempotent webhook, provider-state reconciliation, cancellation request, expiry, audited institutional access grants and server usage quotas | Provider-contract and grant authorization/expiry tests using controlled fixtures; no client-side entitlement grants |
| Community | `/community`: searchable discussions/projects/events, explicit sharing consent, own-post deletion, reports and role-scoped moderation | Ownership, consent and moderation tests |
| Classes | `/faculty`: organization/class creation under role and allowance checks; hashed invitations, assignments/deadlines, private submissions/feedback, instructor aggregate analytics and CSV | Class membership, cross-user denial, evidence and grading tests |
| Administration | `/admin`: create/edit content drafts for implemented models, immutable revision history, approval/publication/retirement, scoped roles, moderation, audited actions and provider-backed plan publishing | Authorization, revision snapshot and retired-model tests |
| Existing tools | Circuit builder, whiteboard, Qiskit/Cirq, Academy including Deutsch/QFT/reservoir, Document Pro, Doc Editor and ML Studio retained | Existing API and browser regression suites |

## Verification

- Final combined API/Sirraya run: **261 passed, 1 skipped**. This includes the final content revision, streak, grant, UTC, checksum, privacy and migration changes.
- Production build passes: Next.js generated **47 static pages**, plus dynamic detail routes, with TypeScript checks.
- Full Chromium run: **184 passed, 4 failed** during the interrupted/contended run. The four circuit tests were rerun unchanged with one worker: **4 passed**, including all 13 gates and five-qubit alignment at 1920, 1280 and 390 px. This is not represented as a single uninterrupted green run.
- The real API journey passed: prediction → computed double-slit result → private persisted run → PDF download → notebook notes → mission checkpoint.
- OIDC start tests now pass with state, nonce, S256 PKCE and minimal scopes. Completing an actual Google account callback remains an external acceptance check.
- Reference/responsive checks cover representative mobile/tablet/desktop/large widths; new scientific screens also have real-API mobile/desktop checks.
- Shared token contrast checks: body text 15.38:1, muted text 8.16:1, violet text 7.14:1, cyan text 11.19:1 against the card surface. White text against both primary button endpoints exceeds 4.5:1. This is a scoped token check, not a complete WCAG certification.
- No frontend lint script exists in the repository. No linter dependency was added. Existing FastAPI/Authlib/Starlette deprecation warnings remain.
- Final follow-up: the four circuit retests passed unchanged; the 768 px layout test also passed on its focused rerun. The later twelve-test redesign/live-API run had eleven passes and one interrupted/timeout layout check, followed by that successful focused rerun. Builds and targeted API checks were repeated after the final control-spacing, UTC and report-checksum fixes.
- Final scientific/workflow/migration suite: **25 passed**, including content revision publication/snapshot retention, institutional grant authorization/expiry, private deletion, and leaderboard consent. Final explicit TypeScript check passed.

## Database and operations

The user approved additive schema/model implementation and verification in isolated local databases. Three migrations add 26 new tables plus private leaderboard consent. The existing five tables and user IDs remain compatible. Upgrade/downgrade tests preserve a pre-existing user.

New migrations are **not automatically applied** to an existing developer/production database. Default startup only ensures the original development tables. Review the migration target before applying `alembic upgrade head` to any real database. Production migration and destructive rollback still need explicit approval.

The review instance uses `.preview/srs-browser.sqlite`, API port 8011 and web port 3011. Synthetic browser cookies are written only under ignored `.preview/`. `api/scripts/prepare_srs_test_session.py` refuses non-preview/non-SQLite databases.

CI now prepares an isolated migrated API and synthetic learner before the browser suite. A separate `.next-srs` development output keeps browser verification separate from the production build directory.

## Provider activation

Only placeholders were added to `.env.example`; the real `.env` was not edited. Presence-only inspection found Stripe, webhook, paid-plan and SMTP configuration absent at review time. No secret values were printed. The user said they would configure the local environment; readiness has not yet been confirmed.

Set server-only values:

```dotenv
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
QUANTUMWALK_PAID_PLANS=[]
SMTP_HOST=
SMTP_PORT=587
SMTP_FROM=
SMTP_USERNAME=
SMTP_PASSWORD=
QUANTUMWALK_ADMIN_GOOGLE_SUBJECTS=
```

Example **shape only** for a paid-plan entry; replace it with an actual sandbox provider price and approved limits:

```json
[{"slug":"quantum-plus","title":"Quantum Plus","amount_minor":1000,"currency":"usd","interval":"month","price_id":"price_REPLACE_WITH_SANDBOX_PRICE","features":{"lab.run":100,"report.pdf":20,"batch.run":10,"class.dashboard":0}}]
```

The server reconciles the configured amount, currency and period with Stripe before checkout. The example is not an approved commercial price. Hosted checkout redirects never grant access. Subscription webhooks are verified against the raw payload and current provider state; daily usage reservations are atomic. Checkout reservations prevent multiple client keys from producing simultaneous duplicate checkouts.

Forward Stripe sandbox subscription events to `/api/v1/billing/webhook` using a controlled test endpoint/Stripe CLI. Never use live-mode credentials for acceptance tests. SMTP uses STARTTLS. Verification/reset tokens are single-use, hashed in storage and sent in URL fragments to avoid normal request-query logging. Actual email delivery requires an explicitly chosen controlled recipient; none has been sent by the agent.

Google discovery metadata is cached from the official public document, verified on 28 October 2026. Authlib still performs token validation and signing-key retrieval/rotation. Source: [Google OIDC metadata](https://accounts.google.com/.well-known/openid-configuration). Payment integration contracts follow [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create) and [subscription retrieval](https://docs.stripe.com/api/subscriptions/retrieve).

## Acceptance that remains external or incomplete

1. **Live sandbox/provider acceptance:** configure Stripe/SMTP, complete sandbox checkout/cancel/expiry and actual email delivery, and complete a real Google callback. Provider fixtures do not prove those live integrations.
2. **Scientific acceptance:** models remain clearly labelled educational previews until an authorized reviewer records approval. Toy models are not research-grade physical/cosmological solvers. No expert approval was fabricated.
3. **Release governance:** choose approved prices/currencies, legal/tax terms, launch region, retention, RPO/RTO and operating budget. Existing backup/restore runbooks remain relevant; no production database restore, load test, field LCP measurement, student usability study or institution pilot was performed.
4. **Scale/hardware:** simulations are bounded, synchronous classical models. Durable heavy-job queues, distributed simulator concurrency and real-hardware adapters remain future work; the SRS explicitly treats hardware as optional. Existing per-process resource gates must not be described as a distributed worker system.
5. **Further product depth:** community is discussions/projects/events with moderation rather than a complete social network; classroom grading uses rubric instructions and scores rather than a configurable rubric engine; hydrogen is a documented 1s radial model plus emission calculation rather than a full orbital explorer. PDF scientific notation is rendered in readable text form; JSON preserves exact Unicode data.

These limits prevent a truthful declaration that every SRS release gate is complete. The implementation, tests and review screens are concrete; the remaining acceptance work is listed rather than disguised as working production functionality.

## Changed implementation areas

- API: `science_models.py`, `science_routes.py`, `laboratory_routes.py`, `science_reports.py`, `extended_models.py`, `entitlements.py`, `billing_routes.py`, `email_identity.py`, `collaboration_routes.py`, `privacy_export.py`, cached Google OIDC metadata, and their registration/auth/database integration.
- Persistence: three additive Alembic revisions, a frozen initial expansion schema snapshot, migration environment registration, and isolated upgrade/downgrade tests.
- Web routes: `/lab`, `/lab/[slug]`, `/missions`, `/notebook`, `/pricing`, `/billing`, `/community`, `/faculty`, `/admin`, `/leaderboard`, `/account/access`, `/settings/preferences`, plus existing shared shell/landing/auth/account refinements.
- Shared UI: scientific charts and accessible data tables, detector visualization, model illustrations, parameter sweeps, mastery/session/preference controls, content revision editor, plan editor and institutional grant controls.
- Verification and operations: science/workflow/migration tests, real-API browser journey, reference regression tests, port-independent existing tests, isolated test-session script, CI API setup, example environment variables and requirement ledger.
- Artwork: project-local generated hero/quest assets; see `web/public/images/README.md` for provenance. Reference comparison screenshots are in `docs/ux-refinement/srs-*.png`.

Unrelated pre-existing working-tree changes were preserved. No production deployment, production migration, destructive reset or live payment was performed.
