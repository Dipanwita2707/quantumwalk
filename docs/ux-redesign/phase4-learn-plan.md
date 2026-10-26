# Phase 4 — Learn / Academy discovery (implemented)

**Depends on:** Phase 1 Learn IA (`primaryNav` groups `/academy` under Learn)

## Problem

- `/learn` and `/academy` both showed curriculum maps, tile grids, and duplicate lesson lists.
- Sidebar linked to a second hub instead of reinforcing `/learn` as the single entry.

## Changes

| Area | Change |
|------|--------|
| `/academy` | Server redirect → `/learn` (labs/foundations URLs unchanged) |
| `/learn` | Unit overview + **Explore further** lanes + collapsible module index |
| Mission cards on index | Wrapped in `<details>`; hidden on ≥900px (sidebar is canonical) |
| Sidebar | “Learn home” → `/learn` |

## Files

- `web/app/academy/page.tsx` — redirect
- `web/components/LearnDiscoveryLanes.tsx`, `LearnModuleIndex.tsx`
- `web/components/LearningTrail.tsx`, `AcademyUnitOverview.tsx`, `LearnPathSidebar.tsx`
- `web/app/learn/learn.css`
- `web/e2e/learn-discovery.spec.ts`, `smoke.spec.ts` (academy case)

## Tests

- `npm run typecheck`
- `npx playwright test e2e/learn-discovery.spec.ts e2e/smoke.spec.ts e2e/nav-shell.spec.ts --project=chromium`
