# 07 — Redesign baseline

## Current product structure

QuantumWalk is a **Next.js** dark-navy educational quantum platform: **landing/onboarding**, **guest-accessible lab and curriculum**, **optional Google account** for persistence, plus a **Sirraya-style tools hub** (documents/ML) under the same header.

Post-login is not a separate app: **session enriches** the same routes (dashboard link, circuits, progress API, profile).

## Strong patterns to preserve

- Cohesive **visual brand** (navy/violet/cyan, ambience, circuit atmosphere).
- **Honest labeling** of simulator vs hardware (explorer, labs, FEATURE_STATUS).
- **Educational labs** with step traces, validation messages, and e2e test IDs.
- **Guest try-before-login** for lessons and demos (low friction).
- **Accessibility hooks**: `aria-label` on nav, `role=status/alert`, focus-visible outline.
- **Security-aware auth** implementation (OAuth, CSRF on mutations) in API layer.

## Major UX problems (evidence-backed)

1. **Guest vs signed-in boundary** is unclear at routing level (dashboard/workspace public).
2. **Information architecture** splits discovery across Academy, Learn, Explorer, Hub, and Lab without a single map.
3. **Navigation inconsistency** (Coach, Explorer, mobile-only items).
4. **Workspace complexity** resists comprehension and redesign.
5. **Progress semantics** differ guest (localStorage) vs authenticated (API) on same lesson UI.

## Cross-module inconsistencies

- Documentation (DEVELOPMENT.md) vs `publicRoutes.ts` on who needs sign-in.
- Sirraya hub visual system vs core QuantumWalk content cards.
- Algorithm “Library” vs Academy algorithm modules vs Explorer presets — three metaphors.

## Technical constraints for redesign

- Do not break **Playwright** suites (33+ paths) — preserve `data-testid` or update tests in same PRs.
- **AuthGate** is path-prefix based — changing public/private routes requires coordinated API auth review.
- **Monolithic workspace page** — high risk; consider strangling by mode, not big-bang rewrite.
- **API proxy** via Next rewrites — CORS/cookie host must stay `localhost` not `127.0.0.1` (middleware redirect).
- **Sirraya re-exports** (`@sirraya/routes/*`) — academy/hub pages live in `web/sirraya/`.

## Open product questions

1. Should **dashboard** be authenticated-only or explicitly “Progress hub (guest + signed-in)”?
2. Should **Explorer** be top-level nav?
3. Is **Hub** part of QuantumWalk brand or a separate “tools” product area?
4. What is the **single primary action** after login: lab, next lesson, or dashboard?
5. Mobile-first lab controls — target devices for v1 redesign?

## Suggested redesign priorities (no implementation)

1. **IA & nav map** — unify labels; expose Explorer; resolve Academy/Learn overlap.
2. **Auth story** — align copy, routes, and FEATURE_STATUS; clarify guest capabilities on each page.
3. **Dashboard** — simplify loading/error; single “continue learning” hero.
4. **Workspace** — modularize UI; progressive disclosure for engines/noise.
5. **Design tokens** — document breakpoints; consolidate Sirraya hub with core cards where appropriate.
6. **Authenticated e2e** — add safe mocked session tests before redesign regressions.

## Sirraya parity reference

See `sirraya/docs/references/sirraya-captures/quantumwalk-parity-matrix.md` for module-by-module parity (Academy partial, hardware not live, etc.). Redesign should not imply Sirraya feature parity unless product approves.
