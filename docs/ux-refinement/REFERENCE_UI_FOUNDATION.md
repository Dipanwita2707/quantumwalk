# Reference UI foundation

Updated 30 October 2026. Visual source: [Quantum Lab Neon UI Showcase](../srs/Quantum%20Lab%20Neon%20UI%20Showcase.png).

The current priority is reference fidelity and reusable UI, followed by the remaining SRS work. The foundation and continuation change the existing application, preserve URLs and services, and add no dependencies. All twelve showcase areas now use corresponding reference patterns or an explicitly unavailable capability state. This is not a claim that every screen or illustration matches the reference pixels exactly.

## Shared implementation

| File | Responsibility |
| --- | --- |
| `web/components/ui/quantum-ui.css` | Navy surfaces, violet/cyan accents, typography, borders, controls, responsive adapters and visible focus |
| `web/components/ui/QuantumUI.tsx` | PageHeading, Surface, ActionLink, ActionButton, MetricTile and one SVG icon family |
| `web/components/ui/SegmentedControl.tsx` | Native pressed buttons with Left/Right/Home/End keyboard selection |
| `web/components/ui/ReferenceRail.tsx` | Dashboard destinations, current-page indication and secondary account/work links |
| `web/components/ui/ExplorerProfile.tsx` | Generic illustrated explorer and existing confirmed learning XP/level |
| `web/components/ui/ModuleLinks.tsx` | Five direct entry points into existing learning/science routes |
| `web/components/ui/CourseArtwork.tsx` | Decorative course artwork, separate from scientific outputs |
| `web/components/ProductPage.tsx` | Shared heading for missions, notebook, pricing, community and operational pages; supporting links moved below content |
| `web/app/layout.tsx` | Loads the common foundation after existing route-compatible styles |
| `web/components/ui/IdentityLayout.tsx`, `identity.css` | Shared Google/email identity card and journey scene; no unsupported identity providers |
| `web/components/ui/LeaderboardPanel.tsx`, `leaderboard.css` | Shared real ranking, period filtering, guest restriction, loading/error/empty states |
| Route CSS in `community`, `missions`, `pricing`, `hardware`, `challenges`, `learn` | Route composition built on the shared tokens; existing feature handlers retained |

Existing `SiteHeader`, authentication/session provider, protected-route handling, API contracts and simulation handlers remain in use. The old `reference-system.css` remains as a compatibility layer; further conversion should reuse the primitives above rather than add another theme or rewrite modules.

## Reference mapping and current coverage

| Reference screen | Existing route | Current fidelity work / next visual review |
| --- | --- | --- |
| 1. Landing | `/` | Compact two-column hero, white title, concept art and four small entry cards; supporting interactive experiments retained below |
| 2. Onboarding | `/login`, `/account/access`, `/start` | Shared illustrated identity layout for Google and email flows; keyboard account modes and provider restrictions; existing five-step discovery/path flow retained |
| 3. Dashboard | `/dashboard` | Rail, four actual metrics, central continuation, five modules and right explorer profile implemented; qubit demo remains keyboard-accessible in a disclosure |
| 4. Learning paths | `/learn`, `/academy` redirect | Three-column/single-column responsive catalog, actual difficulty filtering, title sorting, resource disclosures and confirmed-progress resume links |
| 5. Lesson | `/learn/[slug]`, existing Academy readers | Explanation beside the experiment on wide screens, narrower path rail, first-qubit controls beside the Bloch visualization, model notes in a disclosure; lesson/quiz/handoff logic retained |
| 6. Scientific simulation | `/lab/[slug]` | Shared heading/actions/section selector; controls left and actual results right; initial state never presents invented detector data |
| 7. Circuit playground | `/workspace`, `/studio` compatibility | Shared heading and compact navy surfaces; existing circuit grid, top tutor, Bloch sphere, state vector, stepping and analysis retained; full composition differs from the simpler reference |
| 8. Quest | `/missions` | Compact confirmed mastery badge, nine actual mission nodes over the existing art, real lock states, and Continue quest selecting the first unfinished unlocked mission |
| 9. Challenges/leaderboard | `/challenges`, `/leaderboard` | Compact challenge rows, grading disclosures and a reusable ranking sidebar with actual opted-in players and 7/30-day filtering |
| 10. Hardware | `/hardware`, `/learn/hardware` | Circuit workflow and actual provider status beside an explicit unavailable execution state; example circuit is labeled unsubmitted; conceptual architecture/characterization tools retained |
| 11. Community | `/community` | Category-filtered feed and separate event-post column; real search, pagination, consent, draft retention after failure, ownership actions and publication/deletion |
| 12. Pricing | `/pricing`, `/billing` | Centered configured plan cards with actual amounts/allowances, working checkout/error handling, and expandable terms; billing retains the common operational layout |
| Supporting product routes | `/explorer`, `/hub`, `/circuits`, account/admin/faculty routes | Shared header/tokens retained; operational routes use PageHeading through ProductPage; route-specific functionality retained |

Differences in product names, metrics and available features intentionally reflect QuantumWalk's working data. Illustration is generated concept art and is not identical to the reference pixels. Explorer artwork is generic, not a user portrait. The reference's GitHub login, event registration, populated live-hardware results, yearly billing and popularity badges are not presented as working capabilities when unsupported. Existing advanced scientific controls are retained, so Studio and lesson compositions contain more functionality than the reference.

## Continuation: 30 October

The second pass updates `/login`, `/account/access`, `/learn/[slug]`, `/community`, `/missions`, `/challenges`, `/leaderboard`, `/pricing`, `/hardware`, and `/learn/hardware`. It adds no API routes, schema changes, packages, or production fixtures.

Files changed in this continuation include the shared identity/ranking components and styles above, `QuantumUI.tsx` (typed button refs), `ProductPage.tsx` (heading actions and route class), `MasterySummary.tsx` (compact confirmed progress), `LearningTrail.tsx`, `FirstQubitExperiment.tsx`, their existing styles, and the corresponding route pages. Generic operational-button CSS now yields to the reusable buttons and segmented controls.

Fresh screenshots are `reference-v3-{login,lesson,community,missions,challenges,pricing,hardware}-{1440,390}.png`. The populated community image, `reference-v3-community-populated-fixture.png`, uses browser-test data to inspect a nonempty feed; it is explicitly a fixture, not production content. The ordinary community screenshots show the actual isolated server state.

OAuth return validation, reset/verification token handling, lesson computation, circuit handoff, quiz progress, server-confirmed rewards, private notebook/report flows, subscription checks, and post authorization remain in use. The existing optional login Bloch sphere moved to a disclosure rather than being removed.

Regression coverage adds `reference-pages.spec.ts`, `reference-secondary.spec.ts`, and a real isolated publish/delete flow in `srs-live.spec.ts`. Two test-only changes address observed infrastructure behavior: the smoke test selects the accessible account-status banner rather than Next's hidden retained route tree, and the layout test reuses one actual Bell API result across viewports while checking the circuit request. No production limiter or simulation assertion was removed.

Final continuation verification: **63 selected Chromium tests passed in one run**; standalone TypeScript and the production build passed, generating 47 static pages plus dynamic routes. This includes real first-qubit computation, lesson-to-Lab handoff, prediction/run/notebook/PDF/mission evidence, community publication/deletion, OAuth return validation, keyboard interaction, and responsive layouts from 375 to 1920 px across the relevant suites. The two live Google-provider checks were excluded; external OAuth login, email delivery and hosted checkout/webhook acceptance are not claimed. API-wide tests and the complete browser suite were not repeated for this UI-only change.

The final circuit-layout check also confirmed that all three gates in the first-qubit H/H/readout setup fit their controls without internal clipping. Visual review inspected desktop and mobile identity/community screens, the lesson workspace, the quest map, challenge rows, configured pricing and hardware restrictions. UI-scoped whitespace checks pass; the five existing Markdown trailing-space lines outside this work remain unchanged.

## Verified behavior and screenshots

- Production build and standalone TypeScript check passed after foundation integration.
- One combined Chromium run: **49 passed** across reference foundation, navigation, Learn discovery, redesign regression, smoke, circuit layout, tutor and isolated live SRS tests. Follow-up verification of final heading/label/failure-state changes: **7 passed**, including the live execution/persistence/report workflow and product routes at 390/1440 px.
- Responsive checks cover 375, 390, 768, 1280, 1440, 1600 and 1920 px across the relevant suites. The four-width reference suite checks eight primary destinations for horizontal overflow.
- Live acceptance used an isolated local database and synthetic account: prediction, real model execution, private saved run, PDF report, notebook entry and mission evidence. No live payment/email acceptance is implied.
- The existing Bloch pixel test now opens the intentional disclosure before checking its canvas; the numerical/pixel assertion remains intact.
- Final keyboard/failure-state regression run after the focused-button arrow-navigation adjustment: **3 passed**. Standalone TypeScript check passed again.
- Fresh screenshots: `reference-v2-{home,dashboard,learn,lab,studio}-{1440,390}.png` in this directory. Desktop Home/Dashboard/Learn/Lab/Studio and mobile Learn were inspected against the montage; automated layout checks supplement visual review.
- UI-scoped `git diff --check` passes. The repository-wide check reports five existing Markdown trailing-space lines in untouched `IMPLEMENTATION_BACKLOG.md` and `MARKET_CAPTURE_PLAN.md`; these were preserved. The repository already contains substantial unrelated changes, so the whole-repository diff/stat must not be attributed to this pass.

No backend code or database schema changed in this UI pass. Full API tests and the entire end-to-end suite were not repeated for this UI-only scope. The project has no standalone lint script. Remaining SRS/provider/scientific acceptance is tracked separately in [IMPLEMENTATION_STATUS.md](../srs/IMPLEMENTATION_STATUS.md).
