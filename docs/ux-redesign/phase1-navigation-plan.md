# Phase 1 — Navigation and application shell (plan)

**Date:** 2026-10-26 · **Status:** Implemented in this change set

## Current navigation component map

| Component | Role |
|-----------|------|
| `web/components/SiteHeader.tsx` | Global top bar: brand, 7–8 desktop pills, mobile `<details>`, standalone Coach link, account link |
| `web/lib/api.ts` `SessionProvider` | Guest vs authenticated profile for conditional links |
| `web/components/AuthGate.tsx` | Redirects only `/circuits`, `/achievements`, `/settings/profile` |
| Per-page | Each route embeds `<SiteHeader />` manually (no shared layout shell below root) |
| `web/app/style.css` | `.site-topbar`, `.header-nav-pills`, `.header-mobile-nav`, responsive hide/show |

**Active-state bug:** `academy` and `learn` both match `/learn/*` and `/learn/reference` (academy also matches reference).

**IA gap:** Explorer absent from desktop pills; Coach only in mobile + duplicate desktop link.

## Proposed component structure

```
web/lib/primaryNav.ts          — 5 primary destinations + exclusive active-id logic
web/lib/breadcrumbTrail.ts     — pathname → breadcrumb segments
web/components/PageBreadcrumbs.tsx — accessible ol/li trail
web/components/SiteHeader.tsx    — primary nav + account menu + breadcrumbs
web/e2e/nav-shell.spec.ts      — regression (active state, mobile, direct routes)
```

**Primary nav (all users):** Home → `/dashboard`, Learn → `/learn`, Lab → `/workspace?mode=circuit`, Explore → `/explorer`, Tools → `/hub`.

**Learn active for:** `/learn`, `/academy`, `/challenges`, `/algorithms` (library stays reachable, grouped under Learn IA).

**Account menu (secondary):** Saved circuits, Achievements, Profile, Sign in/out; mobile also lists Coach, Whiteboard, Library shortcut.

## Files to modify

| File | Change |
|------|--------|
| `web/lib/primaryNav.ts` | **New** |
| `web/lib/breadcrumbTrail.ts` | **New** |
| `web/components/PageBreadcrumbs.tsx` | **New** |
| `web/components/SiteHeader.tsx` | Replace pill list; account `<details>`; remove duplicate Coach pill |
| `web/app/style.css` | Account menu + breadcrumb bar styles |
| `web/e2e/nav-shell.spec.ts` | **New** |
| `web/e2e/ux-audit-authenticated.spec.ts` | Expect "Home" not "Dashboard" in primary nav |

**Not in Phase 1:** dashboard layout, workspace modes, academy page content, route deletes.

## Guest / auth behavior impact

| Area | Behavior |
|------|----------|
| Home | `/dashboard` for everyone (guest card unchanged); brand links to Home |
| Lab / Learn / Explore / Tools | Unchanged public access |
| Account menu | Guest: Sign in; Auth: circuits, achievements, profile |
| AuthGate routes | Unchanged — still direct URLs |
| API / simulation | Untouched |

## Regression test plan

1. `npm run typecheck`
2. `npm run build`
3. `npx playwright test e2e/smoke.spec.ts e2e/nav-shell.spec.ts e2e/ux-audit-authenticated.spec.ts --project=chromium`
4. Manual: keyboard Tab through primary nav + account menu; one active pill per route on `/learn/reference`, `/explorer/tsp`, `/academy`
