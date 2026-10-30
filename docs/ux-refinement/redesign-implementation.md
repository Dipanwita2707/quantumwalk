# Reference redesign implementation — 28 October 2026

## Audit and design mapping

Reference: `docs/srs/Quantum Lab Neon UI Showcase.png` (12 screens). The design uses a compact top navigation, navy surfaces, thin borders, violet primary actions, cyan scientific highlights, and experiment-first workspaces. The existing application already implements much of this direction; preserve that work.

Stack: Next.js App Router, React 19, TypeScript, plain CSS, npm lockfile, Playwright. No installed component or icon library; retain code-native SVG and existing primitives without dependencies. `reference-system.css` is the shared foundation, with route styles for specialist interactions. API rewrites forward `/api` and `/auth` to FastAPI. SessionProvider/AuthGate retain protected-route handling; Google authentication remains server-managed.

| Experience | Existing routes and preserved behaviour | Design treatment |
| --- | --- | --- |
| Introduction | `/`, `/start` — concept preview, onboarding | Existing reference-aligned hero and local calculation retained |
| Dashboard | `/dashboard` — confirmed progress, resume, recent work, retry | Existing primary learning action and secondary discovery retained |
| Learn | `/learn`, `/learn/[slug]`, `/academy` redirect, `/academy/foundations`, `/academy/reservoir`, `/learn/hardware`, `/learn/reference` | Illustrated unit hierarchy; lesson links and confirmed progress preserved |
| Experiments | `/workspace`, `/studio` compatibility redirect, `/academy/labs/{grover,qft,shor,qec,reservoir}` | Compact supporting tutor; circuit and visualization remain prominent |
| Discovery | `/explorer`, `/explorer/{mapper,grover,tsp}`, `/algorithms`, `/algorithms/[slug]` | Remove duplicated navigation on catalog overview; detail navigation preserved |
| Missions | `/challenges`, `/challenges/[slug]`, `/achievements` | Existing server-backed completion and rewards preserved |
| Tools | `/hub`, `/hub/{document-pro,doc-editor,ml-studio}` | Preserve Sirraya compatibility components, local drafts, document transfers and exports |
| Saved work | `/circuits` | Search, chronological sorting, compact metadata and reopen actions over actual API data |
| Account | `/login`, `/settings/profile`, `/privacy`, `/terms`, `/coach`, `/hardware` | Shared surface/focus tokens; existing OAuth, profile, privacy and hardware boundaries preserved |

REA reference captures and compatibility assets are not evidence of a live REA product API. Do not invent an integration. No working production billing, community, faculty or admin routes were found in the route inventory.

## Implementation sequence

1. Audit reference, SRS, routes, shared shell, APIs and existing tests. Baseline: typecheck and six redesign regression tests pass. PowerShell blocks `npm.ps1`; use `npm.cmd`.
2. Extend shared tokens, keyboard skip navigation and responsive surfaces.
3. Improve Academy unit presentation, discovery overview, tutor density and saved-work search/sort.
4. Preserve existing API contracts, session gates, circuit execution, scientific outputs and tool transfers.
5. Run targeted regression tests, production build, route/layout checks and inspect screenshots.
6. Record evidence and remaining requirements below.

## SRS boundaries

The SRS is a draft spanning multiple releases. Payment-provider checkout/webhooks, subscriptions/quotas, faculty cohorts, community moderation, content administration, a universal experiment/report notebook, and the additional physics/cosmology models need separate backend/domain implementation. This UI pass must not represent them as available. Saved circuits lack simulator-version/result metadata; display only actual stored fields. Existing OAuth-only identity must not be presented as email/password registration.

## Delivered changes

| File | Change |
| --- | --- |
| `web/app/reference-system.css` | Shared size tokens, skip link, illustrated curriculum cards, compact tutor, single-column discovery overview and responsive saved-work list |
| `web/components/SiteHeader.tsx` | Keyboard skip action focuses the current main landmark |
| `web/components/AcademyUnitOverview.tsx` | Code-native scientific illustrations, descriptions and lesson counts; existing progress/start/resume logic retained |
| `web/components/LearningTrail.tsx` | Catalog no longer repeats lesson navigation; lesson pages retain their course sidebar |
| `web/app/explorer/page.tsx` | Removed duplicated directory on overview; search, filters, preview and actual experiment links remain |
| `web/app/circuits/page.tsx` | Search and chronological/alphabetical sorting over API-returned circuits, count, no-match recovery and compact reopen/delete rows |
| `web/app/login/page.tsx` | Unconfigured sign-in explains availability and links to public lessons rather than showing deployment instructions |
| `web/e2e/reference-redesign.spec.ts` | Eight regression tests: search/sort/reopen, keyboard skip, catalog structure, unavailable login and four viewport matrices |
| `web/e2e/smoke.spec.ts` | Learning entry follows the unit card; stale Tools heading expectation matches the existing product heading |

Existing unrelated working-tree changes were preserved. No API contracts, dependencies, schema, scientific calculation, OAuth implementation, tool-transfer logic or reward calculations were changed.

## Verification and final review

- `npm.cmd run typecheck`: passed before and after implementation.
- `npm.cmd run build`: baseline and final build passed, including Next's TypeScript checks and 36 generated static pages.
- Final targeted Playwright run: **69 passed, 2 failed** across 12 specs. Command: `npm.cmd exec playwright test e2e/reference-redesign.spec.ts e2e/redesign-regression.spec.ts e2e/nav-shell.spec.ts e2e/lab-workflow.spec.ts e2e/lab-tutor.spec.ts e2e/hub-workspace.spec.ts e2e/private-actions.spec.ts e2e/login-oauth-start.spec.ts e2e/lesson-lab-handoff.spec.ts e2e/learn-discovery.spec.ts e2e/lesson-layout.spec.ts e2e/smoke.spec.ts -- --project=chromium --workers=2`.
- Both remaining failures are live `/auth/google/start` requests returning HTTP 500 instead of 302. A direct request reproduces the failure independently of the login UI. Root cause and Google-provider callback completion remain unverified; no auth bypass or mock success was introduced.
- Passed coverage includes guest execution and stepping, circuit edits/stale results, lesson deep links, save/export request contracts, engine/transpilation errors, server-response-driven challenge status, profile operations, document handoffs/storage recovery and mobile navigation. Private API response fixtures test UI contracts; they do not establish live database persistence or provider integration.
- Eight primary routes (`/`, `/dashboard`, `/learn`, `/workspace`, `/explorer`, `/hub`, `/circuits`, `/settings/profile`) fit 375, 768, 1280 and 1600 px with no document-level horizontal overflow. Screenshots wait for the fixture session to load. Captures are stored in [reference-redesign](reference-redesign/); representative [Learn desktop](reference-redesign/learn-1280.png), [Lab mobile](reference-redesign/lab-375.png), and [saved work mobile](reference-redesign/saved-375.png) were visually inspected against the reference's hierarchy and palette. This is not a pixel-perfect reproduction of every showcase illustration.
- Mobile tutor initially shifted as the initial preset loaded; reserving guidance text space fixed the regression without changing its tests.
- Reviewed actual changes against the pre-task file snapshots, plus `git diff --stat` and `git diff --check`. Scoped tracked-file whitespace checks pass. Repository-wide checks report pre-existing trailing whitespace in `IMPLEMENTATION_BACKLOG.md` and `MARKET_CAPTURE_PLAN.md`; those files were left intact.
- No lint script or separate frontend unit-test command exists in `web/package.json`. The complete E2E suite, backend test suite, live database persistence, external Google callback, full screen-reader audit and scientific validation of every specialist model were not run in this UI pass.

All seven workflow phases were applied to this coherent UI pass: audit, route/design mapping, shared foundation, primary screen refinements, existing functional integration, targeted verification and final visual review. Completing every SRS requirement remains separate product/backend work as listed above.
