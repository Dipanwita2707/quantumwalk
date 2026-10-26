# Phase 5 — Explorer & Tools hubs (implemented)

**Depends on:** Phase 1 primary nav (Explore → `/explorer`, Tools → `/hub`)

## Problem

- Explorer sub-routes had ad-hoc footer links; no shared demo directory.
- Tools hub duplicated featured cards in the “All tools” grid and listed stale `/academy` links.

## Changes

| Area | Change |
|------|--------|
| Explorer | `EXPLORER_DEMOS` registry + sticky **Explorer demos** sidebar on hub and TSP/Grover/Mapper |
| Explorer hub | Workflow strip + mobile-only demo cards (desktop uses sidebar) |
| Tools | **Tools directory** sidebar on hub + tool pages; **Start here** primary row for featured tools |
| Registry | Quantum Academy tool → `/learn` |

## Files

- `web/lib/explorerDemos.ts`, `web/components/ExplorerHubNav.tsx`, `web/components/HubToolsNav.tsx`
- `web/app/explorer/*`, `web/app/explorer/explorer.css`
- `web/sirraya/components/hub/HubHome.tsx`, `HubToolChrome.tsx`, `web/app/hub/hub-home.css`
- `web/sirraya/lib/hubTools.ts`
- `web/e2e/explorer-tools-hub.spec.ts`

## Tests

- `npm run typecheck`
- `npx playwright test e2e/explorer-tools-hub.spec.ts e2e/smoke.spec.ts e2e/nav-shell.spec.ts --project=chromium`
