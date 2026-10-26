# 08 — Exploration coverage

## Environment

| Item | Value |
|------|--------|
| Git HEAD | `3f77ade` |
| Branch | `master` |
| Audit type | Discovery only — **no application code modified** |
| Browser | Chromium via Playwright |
| Viewport | Desktop default; **one mobile case** in ux-audit-authenticated (390×844) |
| Auth | Guest mock in main e2e; **mock signed-in** in `e2e/ux-audit-authenticated.spec.ts` (Playwright route mocks only) |
| API | Assumed running via Playwright `webServer` or dev stack when tests passed |

## Commands executed

```powershell
git log -5 --oneline; git status --short
cd D:\quantumwalk\web; npx playwright test e2e/smoke.spec.ts e2e/academy-core.spec.ts e2e/shor-lab.spec.ts e2e/qft-lab.spec.ts e2e/mapper.spec.ts --reporter=list
```

**Result:** 33 passed, 0 failed (2026-10-26 audit run).

```powershell
cd D:\quantumwalk\web; npx playwright test e2e/ux-audit-authenticated.spec.ts --reporter=list
```

**Result:** 7 passed, 0 failed (2026-10-26 mock-auth follow-up).

## Route coverage matrix

| Route / group | Inspected (code) | Click-tested | Flow-tested | Notes |
|---------------|------------------|--------------|-------------|-------|
| `/` | Yes | Yes | Partial | smoke landing |
| `/start` | Yes | Yes | No | |
| `/login` | Yes | Yes | **Blocked** OAuth | |
| `/dashboard` | Yes | Yes | Guest card | |
| `/workspace` | Yes | Partial | Preset hint | Full lab CO |
| `/hub`, doc-editor | Yes | Yes | Hub→editor | |
| `/academy`, reference | Yes | Yes | — | |
| `/learn` | Yes | Yes | Quiz flow | |
| `/learn/[slug]` | Yes | Partial | 2–3 slugs via e2e | |
| `/explorer` | Yes | Yes | — | |
| `/explorer/mapper` | Yes | Yes | Encode/decode | |
| `/explorer/tsp` | Yes | Yes | Callout | |
| `/explorer/grover` | Yes | No | — | CO |
| Academy labs (5) | Yes | Yes | Run/reset | |
| `/challenges` | Yes | Yes | Banner only | |
| `/algorithms` | Yes | No | — | CO |
| `/coach` | Yes | No | — | CO |
| `/circuits` | Yes | Yes | Mock auth list | ux-audit-authenticated |
| `/achievements` | Yes | Yes | Mock auth tabs | ux-audit-authenticated |
| `/settings/profile` | Yes | Yes | Mock auth form | ux-audit-authenticated |
| `/hardware` | Yes | No | — | CO |
| `/academy/foundations`, `/reservoir` | Yes | No | — | CO |
| Hub document-pro, ml-studio | Yes | No | — | CO |
| `/privacy`, `/terms` | Yes | No | — | CO |

## Interaction coverage

- **Meaningful controls click-tested:** ~40+ (via aggregated e2e specs).
- **Workspace lab gates/toolbar:** code-only enumeration.
- **Keyboard / focus audit:** not performed (UNVERIFIED).
- **Direct URL refresh on nested routes:** UNVERIFIED.
- **Browser back/forward:** UNVERIFIED.

## Screenshots / traces

- Playwright HTML reports may exist under `web/test-results/` from local runs; **not archived** in repo for this audit.
- Redesign phase should attach trace on first pass.

## TSP live integration

- **Skipped:** smoke covers TSP **oracle callout** UI only, not live backend TSP Grover pipeline end-to-end against running API with full integration suite.

## Authenticated session

- **Live OAuth:** Still blocked (no Google test account).
- **Mock session:** `ux-audit-authenticated.spec.ts` — private routes, dashboard without guest card, profile, achievements, lesson quiz, workspace, mobile menu/circuits.
- Remaining authenticated flows (lab save, challenge grade, profile save, logout) **UNVERIFIED**.

## Documentation produced

1. `01-route-and-page-inventory.md`
2. `02-navigation-map.md`
3. `03-page-interaction-matrix.md`
4. `04-user-journeys.md`
5. `05-ux-ui-findings.md`
6. `06-design-system-inventory.md`
7. `07-redesign-baseline.md`
8. `08-exploration-coverage.md`

## Code change confirmation

Initial audit: **no application code** changed (only `docs/ux-audit/*`). Follow-up adds **`web/e2e/ux-audit-authenticated.spec.ts`** and doc updates for mock-auth coverage — still **no production auth bypass**.
