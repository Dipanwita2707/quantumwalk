# QuantumWalk ↔ Sirraya parity matrix

**Date:** 2026-10-25  
**Sirraya evidence:** `2026-10-25-comprehensive-recon-report.md`, scenario JSON under this folder (local), `docs/03-evidence-register.md` (E001–E027)  
**QuantumWalk evidence:** Repository inspection (paths cited below); not runtime-tested in this task.

**Status legend:** `MATCH` | `PARTIAL` | `MISSING` | `BLOCKED` | `UNKNOWN`

---

## Summary table

| Sirraya tool | QW primary surface | Overall parity | P0 gap |
| --- | --- | --- | --- |
| Quantum Explorer | `/explorer/tsp`, `/api/explorer/tsp`, `/api/v3/solve-tsp` | **PARTIAL** | 4–6 city live solve UX + health wiring to QW API |
| Quantum Mapper | `/explorer/mapper` | **PARTIAL** (IMPLEMENTED+TESTED) | Gate-level Sirraya UI UNKNOWN |
| ML Studio | `/hub/ml-studio` | **PARTIAL** | ResNet/LISA-style demo vs layer toy |
| Doc Editor | `/hub/doc-editor` | **PARTIAL** | CodeMirror, KaTeX, Mermaid, AI |
| Document Pro | `/hub/document-pro` | **PARTIAL** | Template library, docx, e-sign |
| Quantum Academy | `/academy`, `/learn/*`, `/academy/labs/*` | **PARTIAL** (13 lessons + labs) | Full QFT/Shor runs, Characterization campaigns, superdense coding |

---

## 1. Quantum Explorer (`quantumtsp`)

| Sirraya feature / workflow | Evidence | Observed Sirraya behavior | QuantumWalk implementation | Status | Backend / deps | Work needed | Pri | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TSP problem config (4+ cities, shots, Grover iters) | OBSERVED v3 a11y | Sliders, 4 cities default, algorithm select Grover/QAOA/VQE | `web/app/explorer/tsp/page.tsx` — **fixed 3-city** narrative; `web/lib/tspExplorer.ts` | **PARTIAL** | QW: `/api/explorer/tsp` demo; Sirraya: `localhost:8000` | Extend city count UI + API or document education scope | P1 | 4-city solve matches `/api/v3/solve-tsp` when API up |
| Backend health check | OBSERVED E021, E026 | `GET http://localhost:8000/health`; Check Status re-triggers probe | No Sirraya-style health banner on TSP page; uses `/api/explorer/tsp` | **PARTIAL** | Local FastAPI | Add optional health to `/api/v3` or proxy; surface offline state | P0 | Health 200 enables run; UI matches state |
| Solve / run quantum job | INFERRED E009; UNKNOWN live | Run disabled when offline | Grover **preset** + demo simulate; not Sirraya POST shape in UI | **PARTIAL** | `sirraya/api/sirraya_v3_routes.py`, `api/tsp_grover.py` | Wire TSP UI to v3 solve or unify APIs | P0 | POST solve-tsp from UI returns tour |
| Results / documentation tabs | OBSERVED v3 a11y | Configuration, Results, Documentation | Stage stepper (Encode→Compare) in TSP page | **PARTIAL** | — | Tabbed results + doc panel | P2 | Tabs present with content |
| Error mitigation controls | OBSERVED v3 a11y | Checkbox + combobox | Not in QW TSP explorer | **MISSING** | — | Omit or label as future | P3 | — |
| Distance matrix editing | OBSERVED v3 a11y | Editable spinbuttons | Static matrix in `tspExplorer.ts` | **PARTIAL** | — | Optional editable matrix (client-only) | P2 | Edit matrix updates classical cost |
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
| Sirraya API compat | OBSERVED E009 | `sirraya/api/sirraya_v3_routes.py` | **PARTIAL** (backend exists; UI not wired) | P0 |
| Privacy / local-first docs | INFERRED E016 | QW docs localStorage hubs | **PARTIAL** | P2 |

---

## Evidence gap closure (2026-10-25 follow-up)

| Gap | Result | Artifact |
| --- | --- | --- |
| Check Status click | **OBSERVED:** click completes; `GET localhost:8000/health` ×2 → `net::ERR_FAILED`; UI remains “Backend Offline” | `2026-10-25-rea-check-status-v2.json`, **E026** |
| Source maps | **OBSERVED:** `index-BmWPZvib.js.map` → HTTP **404** (Vercel) | curl probe, **E027** |
| Locators | **OBSERVED:** Playwright `exact: true` requires full button names; fixed in `sirraya-capture-check-status.json` | Script diff |
| Authentication | **UNKNOWN** (unchanged) | — |
