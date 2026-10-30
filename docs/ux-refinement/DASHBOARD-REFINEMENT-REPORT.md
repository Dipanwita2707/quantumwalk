# Dashboard visual refinement — pass 2026-10-26

**Branch:** `master` (uncommitted; unrelated WIP preserved)  
**Scope:** `/dashboard` only — layout, copy, disclosure; no API or auth behavior changes.

---

## What changed and why

The home dashboard now answers three questions above the fold:

1. **What next?** — `h1` is the next lesson title (or honest fallback); primary **Continue learning →** (`data-testid="dashboard-continue"`).
2. **Where you left off?** — Lesson objective under the title; introduction progress moved to **Introduction progress** `<details>`.
3. **Progress?** — Compact stat row + one-line status (`db-progress-line`); guests see catalog preview and “—” for XP/circuits (no fake counts).

### Removed / consolidated

| Before | After |
|--------|--------|
| Duplicate **Your dashboard** h1 + lesson h2 | Single h1 = next action title |
| Standalone **Discovery introduction** card | Collapsed **Introduction progress** details |
| **Progress details** open by default with units + skill tree + 6-lesson list | Collapsed **Units, skill tree & milestones**; removed redundant lesson link list |
| **Recent experiments** card for guests (empty + sign-in copy) | Section only when authenticated and ≥1 saved circuit |
| **Keep exploring** + 3 generic links + explorer footer link | One **NEXT UP** challenge **or** guest **Explorer demo** card |
| Footer **milestones** band | Inside progress details (authenticated only) |
| Guest circuits stat **0** | **—** + sign-in hint (not implied saves) |

### Preserved

- Guest banner (**Guest overview**), API load paths, retry on errors, Bloch demo, motion control.
- Signed-in XP, lessons, circuits, skill tree, unit rails, milestones — same data sources.
- Routes and simulation logic unchanged.

---

## Screenshots

| Phase | Path |
|-------|------|
| **Before** | `docs/ux-refinement/screenshots/dashboard-refinement-20261026/before/dashboard-{desktop,tablet,mobile}.png` |
| **After** | `docs/ux-refinement/screenshots/dashboard-refinement-20261026/after/dashboard-{desktop,tablet,mobile}.png` |

Capture command:

```powershell
cd web
$env:DASHBOARD_CAPTURE_DIR="dashboard-refinement-20261026"
$env:DASHBOARD_CAPTURE_PHASE="before"  # or after
npx playwright test --project=chromium e2e/dashboard-refinement-capture.spec.ts
```

Earlier learn/explorer captures remain under `docs/ux-refinement/screenshots/after/` (unchanged).

---

## Files touched

- `web/app/dashboard/page.tsx`
- `web/app/dashboard/dashboard.css`
- `web/e2e/dashboard-refinement-capture.spec.ts`
- `web/e2e/smoke.spec.ts`
- `web/e2e/ux-audit-authenticated.spec.ts`

---

## Verification

| Command | Result |
|---------|--------|
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| `npx playwright test --project=chromium e2e/smoke.spec.ts e2e/nav-shell.spec.ts e2e/learn-discovery.spec.ts e2e/explorer-tools-hub.spec.ts` | **27/27 pass** |
| `npx playwright test --project=chromium e2e/dashboard-refinement-capture.spec.ts` (before + after) | **6/6 pass** |

### Not run this pass

- Full `npm run test:e2e` (all 14 specs)
- `e2e/ux-audit-authenticated.spec.ts` (requires auth fixtures)
- `e2e/tsp-backend.spec.ts` / live API
- Dedicated axe/Lighthouse pass

---

## Guest vs signed-in

| | Guest | Signed-in |
|---|--------|-----------|
| Continue | First incomplete lesson (or first lesson / `/learn`) | Same from `/api/progress` + lessons |
| Stats | XP/circuits **—**; lesson count = catalog size | Real XP, level, lesson fraction, circuit count |
| Recent | Hidden | Shown if saved circuits exist |
| Recommendations | Explorer TSP when no challenge | Next challenge when available |
| Intro | Local `/start` progress in details | Account `discovery:introduction` in details |
| Deep progress | Units in collapsed details (no fabricated completion) | Units + skill tree + milestones in details |

---

## Open issues

- Authenticated users with **no** saved circuits and **no** open challenges see a very minimal secondary row (by design).
- **Bloch** widget still occupies primary grid space on desktop — product call if it should move behind disclosure on small screens only.
- Reconcile marketing copy that still says “Your dashboard” elsewhere (e.g. audit docs) with lesson-first h1.
