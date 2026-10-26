# 09 — UX redesign implementation status

**As of:** 2026-10-26 · **Branch:** `master` · **Commits:** `dad8251` (Phase 1) through `1274ed7` (Phase 5)

This document maps the five-phase UX redesign brief to shipped code. Use with `docs/ux-redesign/phase*-*.md` for file-level detail.

## Phase validation matrix

| Phase | Objective | Status | Key evidence |
|-------|-----------|--------|--------------|
| 1 — Nav shell | Five destinations, exclusive active state, breadcrumbs, account menu | **Done** | `web/lib/primaryNav.ts`, `SiteHeader.tsx`, `e2e/nav-shell.spec.ts` |
| 2 — Dashboard | One Continue action, compact stats, recommendations, progress details | **Done** | `web/app/dashboard/page.tsx`, smoke dashboard guest card |
| 3 — Lab | Build / Simulate / Analyze, progressive engine panel | **Done** | `web/app/workspace/page.tsx`, `e2e/lab-workflow.spec.ts` |
| 4 — Learn | Single `/learn` hub; `/academy` → redirect | **Done** | `web/app/academy/page.tsx`, `e2e/learn-discovery.spec.ts` |
| 5 — Explorer & Tools | Demo/tool sidebars, categories, catalog search | **Done** (+ search follow-up in working tree) | `ExplorerHubNav`, `HubToolsNav`, `e2e/explorer-tools-hub.spec.ts` |

## Findings addressed (see 05-ux-ui-findings.md)

| ID | Resolution |
|----|------------|
| UX-NAV-01 | Explorer in primary nav (`Explore` → `/explorer`) |
| UX-NAV-03 | Exclusive `getPrimaryNavActiveId()` — one pill active |
| UX-IA-01 | Learn unified; explorer/tools sidebars reduce tile duplication |
| UX-DASH-01 | Dashboard simplified (Phase 2); partial load errors may remain |
| UX-LAB-01 | Workflow views; monolith file retained — further split optional |

## Still open (not blocking redesign v1)

| Item | Notes |
|------|--------|
| UX-AUTH-01 / UX-AUTH-02 | Guest dashboard/lab by design; align DEVELOPMENT.md copy in a docs-only PR |
| UX-NAV-02 | Coach in account/mobile menu, not primary five |
| Explorer CRRE layout | **Done** — `ExplorerRunbookTabs` on Grover, TSP, Mapper (`web/e2e/explorer-runbook.spec.ts`) |
| Full Playwright matrix | Run all e2e before release; this status doc cites targeted suites only |
| `docs/ux-audit/02-navigation-map.md` | Pre-redesign mermaid — see **Primary nav (post-redesign)** below |

## Primary nav (post-redesign)

| Label | Href | Also active for |
|-------|------|-----------------|
| Home | `/dashboard` | `/` |
| Learn | `/learn` | `/academy/*`, `/challenges`, `/algorithms`, `/learn/*` |
| Lab | `/workspace?mode=circuit` | `/workspace`, `/studio` |
| Explore | `/explorer` | `/explorer/*` |
| Tools | `/hub` | `/hub/*` |

**Secondary:** Account menu — saved circuits, achievements, profile, sign in/out; mobile adds Coach and shortcuts.

## Regression commands (executed when updating this doc)

```bash
cd web && npm run typecheck
cd web && npm run build
cd web && npx playwright test e2e/nav-shell.spec.ts e2e/smoke.spec.ts e2e/learn-discovery.spec.ts e2e/lab-workflow.spec.ts e2e/explorer-tools-hub.spec.ts --project=chromium
```

Record actual pass/fail in PR or release notes when cutting a release.
