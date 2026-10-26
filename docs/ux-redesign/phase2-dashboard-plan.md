# Phase 2 — Dashboard (implemented)

**Commit:** pending · **Depends on:** Phase 1 (`dad8251`)

## Changes

- Single **Continue learning** primary action with lesson title/objective.
- Compact **3-stat** overview row.
- **Recent experiments** + **Recommendations** secondary grid.
- **Progress details** `<details>` — introduction, academy units, skill path (preserves smoke labels).
- Removed duplicate hero copy, parallel mission/path cards above the fold.

## Tests

- `smoke.spec.ts` dashboard guest card + ACADEMY UNITS + Discovery introduction (inside details, still in DOM).
- `ux-audit-authenticated.spec.ts` — "Your dashboard" h1 + main display name.
