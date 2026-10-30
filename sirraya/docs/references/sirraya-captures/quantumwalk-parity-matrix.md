# QuantumWalk ↔ Sirraya parity matrix

**Date:** 2026-10-25  
**Sirraya evidence:** `2026-10-25-comprehensive-recon-report.md`, scenario JSON under this folder (local), `docs/03-evidence-register.md` (E001–E027)  
**QuantumWalk evidence:** Repository inspection and the later [27 October execution audit](../../../../docs/ux-audit/2026-10-27-platform-execution-audit.md). The Sirraya observations below remain historical; current Sirraya tool actions were not reverified.

**Status legend:** `MATCH` | `PARTIAL` | `MISSING` | `BLOCKED` | `UNKNOWN`

---

## Summary table

| Sirraya tool | QW primary surface | Overall parity | P0 gap |
| --- | --- | --- | --- |
| Quantum Explorer | `/explorer/tsp`, `/api/explorer/tsp`, `/api/v3/solve-tsp` | **PARTIAL** (3- and 6-city live solve tested) | QAOA/VQE and configurable shots/iterations remain unimplemented; five-city UI and runtime trends unverified |
| Quantum Mapper | `/explorer/mapper` | **PARTIAL** (IMPLEMENTED+TESTED) | Gate-level Sirraya UI UNKNOWN |
| ML Studio | `/hub/ml-studio` | **PARTIAL** | ResNet/LISA-style demo vs layer toy |
| Doc Editor | `/hub/doc-editor` | **PARTIAL** | CodeMirror, KaTeX, Mermaid, AI |
| Document Pro | `/hub/document-pro` | **PARTIAL** | Template library, docx, e-sign |
| Quantum Academy | `/academy`, `/learn/*`, `/academy/labs/*` | **PARTIAL** (13 lessons + labs) | Full cryptoscale Shor, Characterization campaigns, superdense coding |

---

## 1. Quantum Explorer (`quantumtsp`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TSP problem config (4+ cities, shots, Grover iters) | OBSERVED v3 a11y | Sliders, 4 cities default, algorithm select Grover/QAOA/VQE | Editable 3–6 city matrix; fixed Grover/1,024-shot execution; API returns 501 for unsupported QAOA/VQE | **PARTIAL** | QW local FastAPI; Sirraya local backend in historical capture | Add real QAOA/VQE only with validated implementations; assess five-city UI | P1 | 3- and 6-city live E2E pass; 4- and 6-city API tests pass |
| Backend health check | OBSERVED E021, E026 | `GET http://localhost:8000/health`; Check Status re-triggers probe | Online/offline status and Check status control are wired to QW API | **MATCH** (local behavior) | Local FastAPI | Keep offline recovery visible | P2 | Mock offline/online and live online E2E pass |
| Solve / run quantum job | INFERRED E009; UNKNOWN live | Run disabled when offline | Run sends edited matrix to `POST /api/v3/solve-tsp` and shows returned tours | **PARTIAL** | `sirraya/api/tsp_quantum_grover.py` | Test five-city UI and repeated-run quality | P1 | 3- and 6-city live E2E pass; Sirraya server remained offline in prior capture |
| Results / documentation tabs | OBSERVED v3 a11y | Configuration, Results, Documentation | Configure, Run, Results, Explanation runbook | **PARTIAL** | — | Compare documentation depth | P2 | Browser runbook E2E passes |
| Error mitigation controls | OBSERVED v3 a11y | Checkbox + combobox | Not in QW TSP explorer; local simulation reports mitigation disabled and leaves unmeasured fidelity/quantum volume unset | **MISSING** | — | Implement and validate a real method before exposing controls | P3 | API response assertions pass |
| Distance matrix editing | OBSERVED v3 a11y | Editable spinbuttons | Editable 3–6 city matrix with validation, classical recomputation, and stale-result clearing | **MATCH** (local behavior) | — | Evaluate editing at five-city size | P2 | Matrix edit/validation E2E, six-city live E2E, and API bounds pass |
| SPA URL (no `/quantumtsp` path) | OBSERVED E006 | URL stays `/` | QW uses `/explorer/tsp` (deep link) | **MATCH** (QW superset) | — | Optional hub-only entry | P3 | `/explorer/tsp` loads |

---

## 2. Quantum Mapper (`quantum-mapper`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Classical ↔ quantum mapping explainer | OBSERVED v3 `tool-quantum-mapper-settle` | “Quantum-Classical Mapping”, TSP classical, encoding, concepts | `/explorer/mapper` + `QuantumMapperLab` (`web/lib/quantumMapper.ts`) | **PARTIAL** (IMPLEMENTED+TESTED slice) | — | Sirraya gate-level UI UNKNOWN | P1 | e2e `mapper.spec.ts` |
| Interactive gate mapping lab | UNKNOWN | Not exercised | Mapper + workspace circuit builder | **PARTIAL** | Simulator | Deeper gate mapping if evidence grows | P2 | — |
| Learn-category placement | OBSERVED hub | “Learn” on card | Hub category “Quantum” | **MATCH** | — | Copy/labels only | P3 | Hub card text |

---

## 3. ML Studio (`mlexplorer`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Product shell “LISA Beta” | OBSERVED v3 a11y | Brand + ResNet-50 classification | `sirraya/web/components/hub/MLStudioClient.tsx` — generic layer stack toy | **PARTIAL** | — | Rename/marketing optional; not functional parity | P3 | — |
| ResNet-50 / image classification demo | OBSERVED v3 a11y | Named model demo | Not implemented | **MISSING** | Would need model weights or fake demo | Static architecture diagram only or skip | P2 | No false “training” claims |
| Layer editor (dense/relu/dropout) | UNKNOWN Sirraya | Not fully traced in a11y | QW ML studio has layer list + shape trace | **PARTIAL** | — | Validate against Sirraya bundle if needed | P2 | Layer add/remove works |
| Training / inference execution | UNKNOWN | Not tested | None | **MISSING** | Backend or WASM | Out of scope unless required | P3 | — |

---

## 4. Doc Editor (`editor`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Markdown live preview | OBSERVED v3 a11y | Toolbar + title | `DocEditorClient.tsx` — split MD/HTML preview | **PARTIAL** | — | Title field, toolbar polish | P2 | Preview updates |
| CodeMirror editor | OBSERVED network v3 | `codemirror-*.js` loaded | Plain `<textarea>` | **MISSING** | npm codemirror | Add CodeMirror or keep simple MD | P2 | Syntax highlight |
| KaTeX / Mermaid | OBSERVED network | Chunks loaded | Not in QW editor | **MISSING** | Client libs | Optional math/diagram | P2 | Render `$...$` and mermaid blocks |
| AI writing assistant | OBSERVED E011 (static) | Slash / AI commands | Not implemented | **MISSING** | External AI + disclosure | Omit or gated tutor | P3 | — |
| Local persistence | INFERRED | Unknown storage | `localStorage` key `qw-hub-doc-editor` | **PARTIAL** | — | — | — | Reload restores draft |
| Export PDF/Word/HTML | OBSERVED marketing | PDF, Word, HTML | HTML export + print | **PARTIAL** | — | PDF/DOCX client export | P2 | Download works |

---

## 5. Document Pro (`document-generator`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Entry: Create a document CTA | OBSERVED E022 | Opens Document Pro | Hub card → `/hub/document-pro` | **PARTIAL** | — | Add hub CTA alias | P2 | CTA opens same UI |
| Template gallery (20+ legal/business) | OBSERVED document-pro a11y | Many template buttons, categories | 3 templates in `DocumentProClient.tsx` | **PARTIAL** | — | Expand template set (original copy) | P1 | ≥10 templates, categories |
| Draft with AI / verify / bulk | OBSERVED a11y | Buttons present | Not implemented | **MISSING** | AI / backend | Omit or stub with disclaimer | P3 | — |
| DOCX export | OBSERVED network | `docx-*.js` | Print/PDF only | **MISSING** | docx lib | Client docx generation | P2 | Download .docx |
| E-signatures / SHA-256 sealing | OBSERVED marketing | Claimed on cards | Not implemented | **MISSING** | Crypto + legal | Do not fake; document gap | P3 | — |
| Documents / Models tabs | OBSERVED a11y | tablist | Single-page templates | **MISSING** | — | Tab shell | P2 | Models tab exists or scoped out |

---

## 6. Quantum Academy (`quantum-academy`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Command palette open | OBSERVED E023 | Mod+K search | No global palette; direct routes | **PARTIAL** | — | Optional palette; routes suffice | P3 | — |
| 22 lesson curriculum sidebar | OBSERVED academy-v2 a11y | 22 titled lessons listed | `docs/academy-curriculum-inventory.md`, 8 `/learn/*` slugs | **PARTIAL** | Content | Teleport, QFT, Shor, VQE titles only | P1 | Inventory + e2e |
| Reservoir computing lab | OBSERVED title L17 | Interactive QRC in marketing | `/academy/labs/reservoir` echo-state sim | **PARTIAL** (IMPLEMENTED+TESTED sim) | — | Not Sirraya proprietary demo | P0 | pytest + e2e |
| Bit-flip QEC lab | OBSERVED title L18 | Error correction in marketing | `/academy/labs/qec` s01/s12 toy + teaching correction | **PARTIAL** (IMPLEMENTED+TESTED sim) | — | Single-X pedagogical; not hardware | P0 | pytest + e2e |
| QFT lab | OBSERVED title L14 | Phase estimation in curriculum | `/academy/labs/qft` direct QFT + NC gate seq + swap layer (pytest parity n≤5) | **PARTIAL** (IMPLEMENTED+TESTED sim) | — | QW-original; not Sirraya lesson body | P0 | pytest + e2e |
| Shor lab | OBSERVED title L15 | Factoring / period finding in curriculum | `/academy/labs/shor` QPE+IQFT validation fixtures (pytest phase tests) | **PARTIAL** (IMPLEMENTED+TESTED sim) | — | QW-original; not cryptoscale Sirraya run | P0 | pytest + e2e |
| Start here / guided paths | OBSERVED a11y | Three persona paths | Academy hub tiles (`sirraya/web/routes/academy/page.tsx`) | **PARTIAL** | — | Persona copy alignment | P2 | Paths link correctly |
| Circuit composer in-browser | OBSERVED E017 | Virtual lab in bundle | `/workspace` lab | **PARTIAL** | Simulator | Already core QW | P0 | Guest demo simulate works |
| Hardware lab (5 platforms) | OBSERVED E017 | Hardware Lab tab | `/learn/hardware`, `ArchitectureConnectivity.tsx` | **PARTIAL** | — | Expand platform compare UI | P1 | Five platform cards |
| Characterization campaigns | OBSERVED E017 | Characterization tab | Hardware lesson toys | **PARTIAL** | — | Interactive campaign UI | P2 | Scored calibration toy |
| Quizzes per lesson | UNKNOWN | Not clicked | Some lesson interactives | **UNKNOWN** | — | Audit `/learn` | P2 | Quiz submits locally |
| Bloch / composer / playground tabs | OBSERVED a11y nav | Section nav buttons | Lab + explorer split | **PARTIAL** | — | Nav grouping on academy | P2 | — |

---

## Cross-cutting

| Topic | Sirraya | QuantumWalk | Status | Pri |
| --- | --- | --- | --- | --- |
| Hub tool registry (6 ids) | OBSERVED E004–E005 | `sirraya/web/lib/hubTools.ts` | **MATCH** | — |
| Hub recent tools / Mod+K | OBSERVED E007 | Partial via hub only | **PARTIAL** | P2 |
| Guest vs signed-in | UNKNOWN auth | `AuthGate`, guest banners | **PARTIAL** | P1 |
| Sirraya API compat | OBSERVED E009 | QW UI calls its local `/api/v3/solve-tsp`; Sirraya's backend was offline in the historical capture | **PARTIAL** (local flow tested; live Sirraya interoperability unverified) | P1 |
| Privacy / local-first docs | INFERRED E016 | QW docs localStorage hubs | **PARTIAL** | P2 |

---

## Evidence gap closure (2026-10-25 follow-up)

| Gap | Result | Artifact |
| --- | --- | --- |
| Check Status click | **OBSERVED:** click completes; `GET localhost:8000/health` ×2 → `net::ERR_FAILED`; UI remains “Backend Offline” | `2026-10-25-rea-check-status-v2.json`, **E026** |
| Source maps | **OBSERVED:** `index-BmWPZvib.js.map` → HTTP **404** (Vercel) | curl probe, **E027** |
| Locators | **OBSERVED:** Playwright `exact: true` requires full button names; fixed in `sirraya-capture-check-status.json` | Script diff |
| Authentication | **UNKNOWN** (unchanged) | — |

---

## Release audit evidence (2026-10-26)

**Git baseline audited:** `3f77ade` (includes `fb2349e` multi-shot Shor). **Test execution:** current working tree (large unstaged delta — see `docs/release-readiness-audit.md`).

| Area | Prior status | Audit result | Evidence |
| --- | --- | --- | --- |
| TSP health + solve UI | PARTIAL | **CONFIRMED (WIP tree)** — offline/validation/loading e2e; **live** POST `/api/v3/solve-tsp` via Next proxy | `web/e2e/tsp-backend.spec.ts` (7/7), `web/e2e/tsp-live-integration.spec.ts` (2/2), API `127.0.0.1:8000/health` 200 |
| TSP at clean `3f77ade` | — | **FAIL** — `/api/v3/solve-tsp` 404; router only in uncommitted `sirraya/api` + `api/main.py` | Detached worktree pytest `test_explorer_health_solve` 2 failed |
| Quantum Mapper encode/decode | PARTIAL (TESTED) | **CONFIRMED** | `web/e2e/mapper.spec.ts` (4/4) |
| QFT lab direct/gate | PARTIAL (TESTED) | **CONFIRMED** | `web/e2e/qft-lab.spec.ts` (4/4), `api/tests/test_qft_simulator.py` |
| Shor paths + multi-shot | PARTIAL (TESTED) | **CONFIRMED** for N=15 demo; not cryptoscale | `web/e2e/shor-lab.spec.ts` (5/5), `api/tests/test_shor_multishot.py`, `fb2349e` |
| Guest vs signed-in UX | PARTIAL / UNKNOWN | **CONFIRMED (mock auth only)** — not live OAuth | `web/e2e/ux-audit-authenticated.spec.ts` (7/7) |
| Sirraya API compat | PARTIAL backend | **WIP only** — v3 routes not in committed tree at `3f77ade` | Same as TSP clean-checkout failure |
| ML Studio / Doc Editor / Document Pro | PARTIAL | **UNVERIFIED** this run (smoke hub only) | `web/e2e/smoke.spec.ts` hub + doc-editor |

**Sirraya parity claim:** Still **PARTIAL** overall; no hardware execution; no pixel/behavioral Sirraya clone.
