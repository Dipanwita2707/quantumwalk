# Visual usability refinement report

**Date:** 2026-10-26  
**Branch:** `master` (visual changes uncommitted; large unrelated WIP preserved)  
**Scope:** Calmer hierarchy on **Learn** (`/learn`) and **Explorer hub** (`/explorer`) only — no API, auth, or simulation changes.

---

## 1. Clutter ranking (inspection + code review)

Validated with Playwright full-page captures at 1280×900 and 390×844 (`web/e2e/visual-refinement-capture.spec.ts`).

| Rank | Route | Why it feels crowded |
|------|--------|----------------------|
| 1 | **`/learn`** | Sidebar path + guest banner + long intro + unit overview + discovery lanes + module index + scoreboard + mission cards competed for attention above the fold. |
| 2 | **`/explorer`** | Sidebar catalog + mobile card grid + search + workflow pill strip + long intro + per-demo copy duplicated navigation story. |
| 3 | **`/dashboard`** | Continue hero, stats, quick grid, standalone “Discovery introduction”, and open progress `<details>` overlap Learn content. |
| 4 | **`/hub`** | Tools sidebar + featured row + searchable catalog + hero copy; featured tools repeat in catalog. |
| 5 | **`/workspace`** | Build/Simulate/Analyze helps, but gate palette + canvas + engine + analysis panels remain dense on smaller viewports. |

**Implemented this pass:** ranks **1** and **2**. **Dashboard (rank 3):** see [`DASHBOARD-REFINEMENT-REPORT.md`](./DASHBOARD-REFINEMENT-REPORT.md). Ranks 4–5 deferred.

---

## 2. Before / after screenshots

| Screen | Before | After |
|--------|--------|--------|
| Learn desktop | Not captured pre-edit (session started mid-change) | `docs/ux-refinement/screenshots/after/learn-desktop.png` |
| Learn mobile | — | `docs/ux-refinement/screenshots/after/learn-mobile.png` |
| Explorer desktop | — | `docs/ux-refinement/screenshots/after/explorer-desktop.png` |
| Explorer mobile | — | `docs/ux-refinement/screenshots/after/explorer-mobile.png` |
| Context (unchanged) | — | `dashboard-*`, `hub-*`, `lab-build-*` in same folder |

Re-run captures: `cd web && npx playwright test e2e/visual-refinement-capture.spec.ts --project=chromium`

---

## 3. Changes (Learn + Explorer)

### Learn (`LearningTrail.tsx`, `learn.css`)

- Single page title: **“Learning trail”** (eyebrow **LEARN**); shorter lede with Glossary / Coach links.
- Removed large **RECORDED MASTERY** scoreboard; replaced with one-line progress status.
- **LearnDiscoveryLanes** + **LearnModuleIndex** moved into `<details class="learn-more-panel">` (disclosure).
- Mission card grid remains in `<details class="learn-mission-catalog">` on mobile; desktop still uses sidebar path (existing CSS hides duplicate catalog ≥900px).
- Lesson view: compact back toolbar instead of dual coach row + monospace kicker.

### Explorer (`ExplorerHubCatalog.tsx`, `explorer/page.tsx`, `explorer.css`)

- Removed **EXPLORER_WORKFLOW** pill strip (redundant with sidebar + CRRE on demo pages).
- Shortened hub lede; single-line **Recommended: Three-city routes** hint instead of long paragraph.
- Empty search state unchanged in behavior; copy points to sidebar.

### E2E alignment

- `learn-discovery.spec.ts`, `smoke.spec.ts`: expect **Learning trail** h1; open `details.learn-more-panel > summary` before asserting “More learning resources”.

---

## 4. Files touched (this refinement)

| File |
|------|
| `web/components/LearningTrail.tsx` |
| `web/app/learn/learn.css` |
| `web/components/ExplorerHubCatalog.tsx` |
| `web/app/explorer/page.tsx` |
| `web/app/explorer/explorer.css` |
| `web/e2e/learn-discovery.spec.ts` |
| `web/e2e/smoke.spec.ts` |
| `web/e2e/visual-refinement-capture.spec.ts` |
| `docs/ux-refinement/VISUAL-REFINEMENT-REPORT.md` |
| `docs/ux-refinement/screenshots/after/*.png` |

---

## 5. Verification (commands run)

| Command | Result |
|---------|--------|
| `cd web && npm run typecheck` | **Pass** |
| `cd web && npm run build` | **Pass** (Next.js 16.4.3) |
| `npx playwright test --project=chromium e2e/smoke.spec.ts` | **11/11 pass** |
| `npx playwright test --project=chromium e2e/learn-discovery.spec.ts` | **3/3 pass** |
| `npx playwright test --project=chromium e2e/explorer-tools-hub.spec.ts` | **6/6 pass** |
| `npx playwright test --project=chromium e2e/nav-shell.spec.ts e2e/lab-workflow.spec.ts e2e/explorer-runbook.spec.ts e2e/academy-core.spec.ts` | **23/23 pass** |
| `npx playwright test --project=chromium e2e/visual-refinement-capture.spec.ts` | **10/10 pass** (screenshots written) |

### Not run (outstanding)

- **`e2e/tsp-backend.spec.ts`** (`live-tsp-backend` project — needs API).
- **`e2e/tsp-live-integration.spec.ts`**, **`e2e/ux-audit-authenticated.spec.ts`**, full **`npm run test:e2e`** against all 14 specs.
- **API pytest** subset from prior sessions.
- **Dedicated a11y audit** (axe/lighthouse): not wired in repo; manual keyboard check limited to existing nav/lab e2e coverage.
- **Tablet width** (e.g. 768px): not captured; layouts use existing breakpoints at 900px.

Passing automated tests do **not** imply the product is fully calm or discoverable — especially for first-time users who must expand “More paths” or rely on the sidebar.

---

## 6. Product decisions still open

1. **Naming:** “Learning trail” vs “Quantum Academy” in h1, dashboard continue card, and marketing — align or keep intentional split?
2. **Learn desktop:** Mission `<details>` hidden ≥900px — is sidebar-only discovery enough, or should one “next mission” card stay visible?
3. **Dashboard:** Fold “Discovery introduction” into progress `<details>` and dedupe academy units vs `/learn`.
4. **Hub:** Deduplicate featured tools vs catalog rows; shorten per-tool blurbs.
5. **Lab:** Further separate Simulate/Analyze chrome without hiding Run — likely needs layout mock review, not copy-only tweaks.

---

## 7. Responsive / a11y notes

- No intentional horizontal overflow changes; disclosure panels use native `<details>` / `<summary>` (keyboard activatable).
- Focus styles unchanged (existing design tokens).
- Reduced-motion: no new decorative animation added; site ambience unchanged.
