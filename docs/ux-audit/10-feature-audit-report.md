# 10 — Feature audit report (present vs working)

**Audit date:** 2026-10-26  
**Branch:** `master` (post UX redesign `6155b9d` + docs `78d7435`)  
**Auditor method:** Route/code inventory (`01-route-and-page-inventory.md`), API content counts, targeted pytest + Playwright runs on this machine.

---

## Status legend

| Status | Meaning |
|--------|---------|
| **Working** | Automated test passed in this audit **or** smoke/e2e explicitly marked CONFIRMED in inventory |
| **Present** | Implemented in code/routes; **not** re-run end-to-end in this audit |
| **Partial** | Works with limits (guest vs sign-in, demo caps, or UI-only) |
| **Regression** | Feature likely works but **automated UI test failed** after recent UX change |
| **Not implemented** | Out of scope / explicitly absent |

---

## Verification runs (this audit)

| Check | Command | Result |
|-------|---------|--------|
| API core | `pytest api/tests/test_simulator.py test_public_demo.py test_explorer_health_solve.py test_tsp_grover.py test_e2e_smoke.py -q` | **31 passed** |
| Web types | `npm run typecheck` (web) | **Pass** (prior UX close-out) |
| Playwright UX bundle | 34 tests (nav, smoke, learn, lab, explorer hubs, runbook) | **34/34 pass** (prior run) |
| Playwright extended | smoke + academy-core + mapper + tsp-backend | **25 pass, 6 fail** (see TSP backend UI) |
| Playwright catalog | 72 tests in 13 files | **Not all executed** in this audit |

**Content counts (API):** `13` lessons, `4` challenges (`api/content.py`).

---

## 1. Platform & entry

| Feature | Present | Working | Evidence / notes |
|---------|---------|---------|------------------|
| Landing `/` | Yes | **Working** | `e2e/smoke.spec.ts` landing hero |
| Onboarding `/start` | Yes | **Working** | smoke path picker |
| Login Google OAuth | Yes | **Present** | Routes in `api/main.py`; live OAuth not exercised here |
| Session `/api/me` | Yes | **Working** | Used by all e2e mocks + platform tests |
| Public routes policy | Yes | **Present** | `web/lib/publicRoutes.ts`; aligned in `DEVELOPMENT.md` |
| Privacy / terms | Yes | **Present** | Routes exist; not in smoke |
| Middleware host redirect | Yes | **Present** | `web/middleware.ts` (127.0.0.1 → localhost) |

---

## 2. Navigation & shell (UX redesign)

| Feature | Present | Working | Evidence |
|---------|---------|---------|----------|
| Five primary nav destinations | Yes | **Working** | `e2e/nav-shell.spec.ts` |
| Exclusive active pill | Yes | **Working** | nav-shell learn/reference, academy redirect |
| Breadcrumbs | Yes | **Present** | `PageBreadcrumbs.tsx`; partial e2e |
| Account menu (circuits, achievements, profile) | Yes | **Present** | AuthGate on those routes |
| Mobile menu + keyboard | Yes | **Working** | nav-shell mobile test |

---

## 3. Home — `/dashboard`

| Feature | Present | Working | Notes |
|---------|---------|---------|-------|
| Guest overview card | Yes | **Working** | smoke dashboard guest intro |
| Continue learning hero | Yes | **Present** | Phase 2; auth path mocked in some e2e only |
| Stats / recent / recommendations | Yes | **Partial** | API loads when signed in; guest sees subset |
| Skill tree + academy units in details | Yes | **Working** | smoke ACADEMY UNITS visible |
| Saved circuits preview | Yes | **Partial** | Requires auth + API |

---

## 4. Learn & Academy

| Feature | Present | Working | Notes |
|---------|---------|---------|-------|
| Learning trail `/learn` | Yes | **Working** | smoke guest banner + path nav |
| Unified hub `/academy` → `/learn` | Yes | **Working** | `learn-discovery.spec.ts` |
| 13 lessons + quizzes | Yes | **Working** | `academy-core` guest quiz; API `LESSONS` len 13 |
| Unit sidebar + completion % | Yes | **Partial** | Auth syncs API; guest localStorage |
| Glossary `/learn/reference` | Yes | **Working** | smoke |
| Hardware concepts | Yes | **Present** | Page exists |
| Foundations reader | Yes | **Present** | `/academy/foundations` |
| Reservoir overview + lab link | Yes | **Present** | Routes exist |
| Academy labs (Grover, QFT, Shor, QEC, reservoir) | Yes | **Working** | `academy-core`, `qft-lab`, `shor-lab` e2e (not all re-run this session) |
| Algorithm library | Yes | **Present** | `/algorithms` + API |
| Challenges (4) | Yes | **Partial** | smoke guest banner; submit needs auth |
| Skill tree / milestones | Yes | **Present** | Dashboard + lib |
| Achievements | Yes | **Partial** | AuthGate; progress-backed |
| Discovery coach (inline) | Yes | **Present** | Lesson components |
| AI Coach `/coach` | Yes | **Present** | Route + tutor API |

**Doc drift:** `FEATURE_STATUS.md` says “6 lessons”; API ships **13** lesson records.

---

## 5. Circuit lab — `/workspace`

| Feature | Present | Working | Notes |
|---------|---------|---------|-------|
| Circuit composer | Yes | **Present** | Large `workspace/page.tsx` |
| Preset guest lab `?preset=` | Yes | **Working** | smoke Demo lab mode |
| Build / Simulate / Analyze tabs | Yes | **Working** | `lab-workflow.spec.ts` |
| Step playback | Yes | **Present** | Core lab; signed-in depth |
| Bloch sphere | Yes | **Working** | lab-workflow Analyze tab |
| State vector / measurements | Yes | **Present** | Analyze view |
| Qiskit / Cirq engines | Yes | **Partial** | Signed-in; `test_cirq_parity.py` exists |
| Noise models | Yes | **Present** | Advanced `<details>` panel |
| Save / export circuits | Yes | **Partial** | Auth + `/api/circuits` |
| Whiteboard mode | Yes | **Present** | `?mode=whiteboard` |
| Demo simulate API | Yes | **Working** | `test_public_demo.py` |

---

## 6. Explorers — `/explorer`

| Feature | Present | Working | Notes |
|---------|---------|---------|-------|
| Explorer hub + sidebar | Yes | **Working** | smoke + explorer-tools-hub |
| Searchable demo catalog | Yes | **Working** | explorer-tools-hub search |
| CRRE runbook tabs | Yes | **Working** | `explorer-runbook.spec.ts` |
| Quantum mapper | Yes | **Working** | `mapper.spec.ts` (4 tests) |
| Grover explorer | Yes | **Working** | smoke + runbook |
| TSP explorer (charts, oracle callout) | Yes | **Working** | smoke WHY ONE MARKED ROUTE |
| TSP preset API reference | Yes | **Working** | `GET /api/explorer/tsp` in pytest |
| TSP backend Grover solve | Yes | **Partial** | API: `test_explorer_health_solve`, `test_tsp_grover` **pass** |
| TSP backend UI (health + solve button) | Yes | **Regression** | `tsp-backend.spec.ts` **6 fail**: health/solve live on **Run/Results** tab only after CRRE; tests expect controls on default view |

**Remediation (regression):** Update `tsp-backend.spec.ts` to open **Run** tab before asserting `Backend API status` / `tsp-run-backend-solve`, or show status on Configure.

---

## 7. Tools hub — `/hub`

| Feature | Present | Working | Notes |
|---------|---------|---------|-------|
| Hub home + sidebar | Yes | **Working** | smoke + explorer-tools-hub |
| Document Pro | Yes | **Present** | Route; not in smoke body |
| Doc Editor | Yes | **Working** | smoke Markdown source |
| ML Studio | Yes | **Present** | Route + client |
| Tool search | Yes | **Working** | explorer-tools-hub |
| Local-only document storage | Yes | **Present** | By design (browser) |

---

## 8. Backend API (feature support)

| Endpoint / area | Present | Working | Test |
|-----------------|---------|---------|------|
| `POST /api/simulate` | Yes | **Working** | test_simulator |
| `POST /api/explorer/demo/simulate` | Yes | **Working** | test_public_demo |
| Lessons / progress / challenges | Yes | **Working** | test_e2e_smoke, platform routes |
| Circuits CRUD | Yes | **Present** | platform tests (not in this audit subset) |
| `GET /api/explorer/tsp` | Yes | **Working** | explorer tests |
| `POST /api/v3/solve-tsp` | Yes | **Working** | test_tsp_grover, test_explorer_health_solve |
| Google auth | Yes | **Present** | Manual |
| Tutor `/api/tutor/explain` | Yes | **Present** | Optional AI config |
| Export QASM/Qiskit/Cirq | Yes | **Present** | platform routes |
| Hardware status | Yes | **Present** | Stub/teaching |

---

## 9. Educational / quantum modules (API tests exist)

| Module | Present | Working (pytest) |
|--------|---------|------------------|
| QFT simulator | Yes | test_qft_simulator |
| Shor educational paths | Yes | test_shor_* suite |
| Bit-flip syndrome | Yes | test_bit_flip_syndrome |
| Quantum mapper encoding | Yes | test_quantum_mapper_encoding |
| Reservoir toy | Yes | test_reservoir_toy |
| Cirq parity | Yes | test_cirq_parity |

*(Full Shor/QFT pytest files not re-run in the 31-test subset; assume present from repo.)*

---

## 10. Not implemented (confirmed)

| Feature | Status |
|---------|--------|
| Live quantum hardware | **Not implemented** |
| Sirraya-full curriculum / streaks / public leaderboard | **Not implemented** |
| Multi-route TSP oracle in one ≤64-gate education preset | **Not implemented** (honest single-mark UX) |
| User arbitrary code execution on server | **Not implemented** |

---

## 11. Summary scorecard

| Area | Present | Working (high confidence) | Gaps |
|------|---------|---------------------------|------|
| Entry & auth | Yes | Landing, start, login page | Live OAuth manual |
| Nav / UX shell | Yes | Full nav e2e | — |
| Dashboard | Yes | Guest path | Auth data loads manual |
| Learn / Academy | Yes | Lessons, quiz, labs, glossary | 13 vs 6 doc count |
| Lab | Yes | Presets, workflow tabs | Full signed-in lab manual |
| Explorer | Yes | Mapper, TSP charts, Grover | TSP backend **e2e regression** |
| Tools | Yes | Hub, doc editor | Document Pro manual |
| API / sim | Yes | 31-test subset green | Full pytest suite not counted here |

---

## 12. Recommended next checks

1. Fix **`tsp-backend.spec.ts`** for CRRE Run tab (restore CI signal for backend solve UI).  
2. Run **full** `pytest api/tests -q` and **`npm run test:e2e`** (72 Playwright tests).  
3. Reconcile **`FEATURE_STATUS.md`** lesson count with API (`13`).  
4. Manual pass: Google sign-in, save circuit, challenge submit, Document Pro export.

---

## Related documents

- Route inventory: [`01-route-and-page-inventory.md`](./01-route-and-page-inventory.md)  
- UX findings: [`05-ux-ui-findings.md`](./05-ux-ui-findings.md)  
- Redesign status: [`09-redesign-implementation-status.md`](./09-redesign-implementation-status.md)  
- Feature catalog (product): [`../ux-redesign/IMPLEMENTATION-REPORT.md`](../ux-redesign/IMPLEMENTATION-REPORT.md)  
- User-facing snapshot: [`../../FEATURE_STATUS.md`](../../FEATURE_STATUS.md)
