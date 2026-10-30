# Reference redesign — 28 October 2026

## Scope and audit

Implemented a shared visual foundation and a functional Home / Dashboard / Learn / Tools slice in the existing application. This is not certification that the entire master redesign is complete.

Read the supplied twelve-screen PNG and the DOCX SRS. The reference establishes a compact header, dark navy surfaces, violet actions, cyan scientific highlights, thin panel borders, and restrained effects. Existing scientific canvases and interactions are retained; this pass does not reproduce the reference's illustrated characters, galaxy images, or game maps.

The repository uses Next.js App Router, React, TypeScript, plain CSS, npm, and Playwright. No component or icon package is installed. The brand atom uses inline SVG; no dependencies were added. Root SessionProvider and AuthGate remain intact. Requests continue through the existing Next rewrites to FastAPI. Simulation uses the existing local demo and Qiskit/Cirq contracts. The Sirraya alias and Tools registry, browser drafts, transfer confirmations, and Explorer API adapter remain unchanged.

Inspected the root layout, navigation and breadcrumbs, primary route components, Academy overview, learning trail, Lab, authentication gate and login, Tools components and registry, API adapter, Next config, product overview, and relevant Playwright suites. Existing uncommitted work was present across the application before this task; it was preserved. Aggregate Git diffs include that prior work.

## Route map

| Existing routes | Experience and changes in this pass |
| --- | --- |
| `/` | Same primary navigation as the application; compact hero, violet CTA, orbit illustration; concept selection and local qubit experiment retained. |
| `/dashboard` | Resume learning first, supporting Bloch preview, secondary progress; explicit saved-circuit loading/error/retry/empty states. |
| `/learn`, `/academy` | Existing Academy compatibility redirect retained. Compact unit cards; Start/Resume/Review links; shared confirmed progress instead of an extra request. |
| `/learn/[slug]`, `/academy/foundations`, `/academy/reservoir`, `/academy/labs/*` | Existing lessons and scientific workflows retained, including Deutsch, QFT and reservoir. Shared header/surface typography applies; no lesson or API rewrite. |
| `/workspace`, `/studio` | Existing circuit and whiteboard entry points preserved. Shared header/panel tokens; fixed mobile preset rail retaining desktop minimum height. Existing gate controls, execution, results and exports retained. Dedicated Build/Simulate/Analyze redesign remains outstanding. |
| `/explorer`, `/explorer/grover`, `/explorer/mapper`, `/explorer/tsp` | Existing search, filters, demos and API contracts retained; shared header and card primitives. |
| `/hub`, `/hub/document-pro`, `/hub/doc-editor`, `/hub/ml-studio` | Single searchable catalog replaces duplicated featured cards. Compact tools directory; document workflow disclosed on demand. Draft persistence and document transfers retained. |
| `/challenges`, `/challenges/[slug]`, `/achievements`, `/algorithms`, `/algorithms/[slug]` | Existing progression and algorithm routes retained; shared navigation and surfaces. Dedicated content redesign outstanding. |
| `/circuits`, `/coach`, `/settings/profile` | Existing private data, coach consent, profile and account actions retained; shared styling. Dedicated saved-work layout outstanding. |
| `/login`, `/start`, `/learn/reference`, `/learn/hardware`, `/hardware`, `/privacy`, `/terms` | URLs and existing behavior retained. Auth card uses shared tokens; onboarding and legal content unchanged. |
| Billing and administration | No implemented page routes found. No invented subscriptions, entitlements, or admin controls. |

REA is an available development integration and source for reconstruction/reference material; this pass does not add a user-facing REA service or alter any REA contract. Tools use the existing Sirraya route exports and registry.

## Files changed by this pass

- `web/app/reference-system.css`: shared tokens, responsive shell, typography, panels, route-specific refinements and reduced-motion rules.
- `web/app/layout.tsx`: imports that stylesheet.
- `web/components/SiteHeader.tsx`: shared SVG brand, landing compatibility, close menus after navigation and on Escape, focus restoration.
- `web/app/page.tsx`: reuses SiteHeader and adds code-native orbit illustration.
- `web/app/dashboard/page.tsx`: exposes saved-work failure and empty states.
- `web/components/AcademyUnitOverview.tsx`, `web/components/LearningTrail.tsx`: use existing page progress and provide unit resume links.
- `web/sirraya/components/hub/HubHome.tsx`: one catalog and collapsible workflow guide.
- `web/e2e/redesign-regression.spec.ts`: new behavior regressions.
- `web/scripts/redesign-capture.mjs`: reproducible viewport screenshots and overflow checks.
- This report and screenshots under `docs/ux-refinement/redesign/`.

## Verification

From `web/`:

- Baseline `npm run typecheck`: passed before edits.
- `npm run typecheck`: passed after foundation changes.
- `npm run build`: passed after application changes, including TypeScript and generation of all 36 static pages.
- Playwright Chromium suites: `nav-shell`, `hub-workspace`, `lab-guest-interaction`, `learn-discovery`, `redesign-regression`, `private-actions`, `lesson-lab-handoff`, `lab-workflow`, and `explorer-catalog`. These cover navigation, keyboard menu handling, document transfers and drafts, search/filtering, unit resume, saved-work states, gate editing, run requests, lesson circuit handoffs, save/export requests, challenge verification and account actions.
- `node scripts/redesign-capture.mjs`: Home, Dashboard, Learn, Lab, Explore, Tools, Login at 390, 768, 1440, 1600 px. No document-level horizontal overflow found. Screenshots generated and selected desktop/mobile renders visually inspected. Capture deliberately returns 503 for lesson/challenge APIs to expose offline states; it does not claim live API success.
- `git diff --check`: passed; line-ending notices only. Scoped diff/stat reviewed. New files inspected separately because untracked files do not appear in Git diff.

The first UI run found a hidden Tools directory regression. Restoring a compact directory fixed it and the complete seven-test Hub suite then passed. No existing test was deleted or weakened.

Visual review also found excessive blank space above the mobile working area. Removing the preset rail's inherited desktop minimum height at narrow widths fixes it; a regression now checks rail height and working-area placement, allowing the existing tutor to precede the circuit. The Academy test initially used an incomplete lesson fixture (missing quiz choices); correcting that fixture resolved the test crash.

The OAuth suite had two server-dependent failures: `/auth/google/start` returned 500 instead of 302. No listener was found on the default backend port 8000 during verification. Return-path validation, callback error handling and authenticated login UI checks passed. The auth backend was not edited in this pass. A successful live Google round trip is not verified.

Many interaction tests stub API responses. They establish UI/request contracts, not real database persistence, real cloud export, billing, external AI, or real-device execution. No live hardware results are presented.

## Remaining work

This coherent slice leaves dedicated redesigns of the Lab stages, specialist Academy canvases, missions, saved experiments and operational screens for further implementation. The full Playwright and Python suites were not run; backend-dependent verification requires the configured API/database and OAuth environment. No lint/format scripts exist in the frontend package. Full contrast auditing, chart alternatives and all-route screenshot comparisons remain outstanding. Visual fidelity is directional and was not measured pixel-for-pixel.
