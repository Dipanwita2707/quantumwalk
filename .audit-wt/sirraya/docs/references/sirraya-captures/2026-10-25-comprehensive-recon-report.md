# Sirraya comprehensive reconnaissance report

**Date:** 2026-10-25  
**Target:** https://tools.sirraya.org/ (public, unauthenticated guest session)  
**Method:** REA MCP + `rea-agents@6.8.0` CLI (`capture_browser_scenario`, `analyze_web_bundle`, `inspect_web_page`, `list_browser_targets`)  
**Automation:** `sirraya/scripts/sirraya-one-command-capture.ps1` (or individual JSON scenarios under `sirraya/scripts/`)

## Executive summary

| Tool | UI opened (automated) | URL bar | Lazy chunks loaded (network) | Notes |
| --- | --- | --- | --- | --- |
| Quantum Explorer | **Yes** | Stays `/` (SPA) | `QuantumTSPProfessional-BxaYYXVU.js` | Backend offline UI; health probe failed |
| Quantum Mapper | **Yes** | `/` | `QuantumClassicalMapper-Bsgyl_P6.js` | Mapping explainer UI captured |
| ML Studio | **Yes** | `/` | `MLPipelineExplorer-DdGdWIso.js` | “LISA Beta” / ResNet-50 demo |
| Doc Editor | **Yes** | `/` | `SirrayaProEditor-BNzhYoXe.js` (+ CodeMirror/KaTeX assets) | Toolbar + title field |
| Document Pro | **Yes** (via **Create a document**) | `/` | `SirrayaDocumentGenerator-DPSdS57J.js`, `docx-*.js` | Featured-card click timed out; alternate path worked |
| Quantum Academy | **Yes** (command palette → Enter) | `/` | `QuantumAcademy-TcZyPuEm.js` | Full curriculum nav + lesson 1 shell |

**Routing (OBSERVED):** No path change when switching tools; `activeView` SPA (consistent with E006).  
**Framework (OBSERVED):** Vite entry `index-BmWPZvib.js`, React chunk `react-KfUPlHYY.js`, Three.js `three-DJLfiW-l.js`.

## Classification key

- **OBSERVED:** Seen in REA capture (accessibility tree, network log, or bundle analysis).
- **INFERRED:** Reasonable interpretation not directly exercised this run.
- **UNKNOWN:** Not established (not tested or capture incomplete).

---

## 1. Landing page

| Item | Class | Evidence |
| --- | --- | --- |
| Title “Sirraya Labs”, hub marketing copy | OBSERVED | `2026-10-25-rea-browser-scenario-v3.json` (`hub-ready`) |
| Featured tool cards as large **buttons** (not `<a href>`) | OBSERVED | Playwright a11y snapshots; v1 scenario failure analysis |
| Command palette (Mod+K) | OBSERVED | Buttons “Open command menu”, “Search everything Ctrl K” |
| Profile control “G” (guest) | OBSERVED | Banner button “Profile” |
| Sign-in / OAuth flow | UNKNOWN | Not exercised (no credentials used) |

**Bundle analysis (landing, CDP):** `2026-10-25-rea-landing-web-bundle.json`, prior `2026-10-25-rea-web-bundle.json`  
**Source maps:** **UNKNOWN / not available on CDN** — CLI evidence shows `source_maps.status: not_requested` with empty items for landing pass; no verified `.map` fetches in network logs.

---

## 2. Per-tool findings

### Quantum Explorer

| Item | Class | Evidence |
| --- | --- | --- |
| Heading “Sirraya Quantum TSP Explorer”, Beta | OBSERVED | `tool-quantum-explorer-settle` in v3 scenario |
| Tabs: Configuration, Results, Documentation | OBSERVED | a11y |
| Controls: city count, shots, Grover iterations, algorithm select (Grover/QAOA/VQE) | OBSERVED | a11y |
| “Backend Offline” / “Backend Server Offline” | OBSERVED | a11y + disabled Run |
| Client message referencing `python quantum_tsp_v3.py --server` | OBSERVED | a11y code snippet |
| `GET http://localhost:8000/health` attempted | OBSERVED | v3 network event `net::ERR_FAILED` |
| `POST /api/v3/solve-tsp` at runtime | UNKNOWN | Not triggered (Run disabled offline); **INFERRED** from static bundle E009 |
| “Check Status” button click | OBSERVED (E026) | `2026-10-25-rea-check-status-v2.json` — retriggers `GET localhost:8000/health` (failed); UI unchanged offline |

### Quantum Mapper

| Item | Class | Evidence |
| --- | --- | --- |
| Heading “Quantum-Classical Mapping” | OBSERVED | `tool-quantum-mapper-settle` |
| Sections: Classical TSP, Mapping, Quantum encoding, Key concepts | OBSERVED | a11y |

### ML Studio

| Item | Class | Evidence |
| --- | --- | --- |
| Product label “LISA Beta” | OBSERVED | `tool-ml-studio-settle` |
| “ResNet-50 Image Classification” | OBSERVED | a11y |

### Doc Editor

| Item | Class | Evidence |
| --- | --- | --- |
| Doc Editor chrome, document toolbar, title textbox | OBSERVED | `tool-doc-editor-settle` |
| CodeMirror / KaTeX / Mermaid chunks loaded | OBSERVED | Network in v3 (`codemirror-*.js`, `mermaid.core-*.js`, KaTeX fonts) |
| AI slash commands / external AI API | UNKNOWN | Not invoked |

### Document Pro

| Item | Class | Evidence |
| --- | --- | --- |
| Open via hub card long-name button | UNKNOWN | Click **failed** (timeout) in v3/tail |
| Open via **Create a document** CTA | OBSERVED | `2026-10-25-rea-document-pro.json` |
| Tabs Documents / Models, template gallery, Draft with AI | OBSERVED | a11y at `settle` |
| `docx-kPoNnTWA.js` loaded | OBSERVED | network |
| Embedded real org PII in bundle | OBSERVED (prior static E010) | **Not re-copied here** |

### Quantum Academy

| Item | Class | Evidence |
| --- | --- | --- |
| Open via command palette search + Enter | OBSERVED | `2026-10-25-rea-academy-v2.json` |
| Open via grid card click | UNKNOWN | css `:has(h3)` clicks timed out in tail scenario |
| Curriculum sections (Foundations → NISQ), 22+ lessons listed | OBSERVED | a11y at `settle` |
| Start lesson 1 / quizzes / hardware lab | UNKNOWN | Not clicked (non-destructive scope) |

---

## 3. API and network observations

| Endpoint | Method | Status | Class | When |
| --- | --- | --- | --- | --- |
| `https://tools.sirraya.org/` | GET | 200 | OBSERVED | All scenarios |
| `https://tools.sirraya.org/assets/*.js` / `.css` | GET | 200/304 | OBSERVED | Lazy-loaded per tool (see v3 network) |
| `http://localhost:8000/health` | GET | Failed (`net::ERR_FAILED`) | OBSERVED | While Quantum Explorer open (v3) |
| `http://localhost:8000/api/v3/solve-tsp` | — | — | INFERRED | Static bundle E009; not seen on wire this run |
| Third-party analytics | — | — | UNKNOWN | No dedicated third-party hosts in filtered network list |

No Authorization headers or storage secrets were captured (`header_values: false`, storage keys not requested).

---

## 4. JavaScript inventory (selected, OBSERVED via network)

| Chunk | Tool / role |
| --- | --- |
| `index-BmWPZvib.js` | Vite entry |
| `react-KfUPlHYY.js` | React runtime |
| `three-DJLfiW-l.js` | 3D / WebGL |
| `QuantumTSPProfessional-BxaYYXVU.js` | Quantum Explorer |
| `QuantumClassicalMapper-Bsgyl_P6.js` | Quantum Mapper |
| `MLPipelineExplorer-DdGdWIso.js` | ML Studio |
| `SirrayaProEditor-BNzhYoXe.js` | Doc Editor |
| `SirrayaDocumentGenerator-DPSdS57J.js` | Document Pro |
| `QuantumAcademy-TcZyPuEm.js` | Quantum Academy |
| `docx-kPoNnTWA.js` | Word export (Document Pro) |

Hashes for initial landing scripts remain in `2026-10-25-rea-web-bundle.json` (E019).

---

## 5. Limitations and errors

1. **SPA URLs:** `after_url` stays `https://tools.sirraya.org/` for all steps (expected).  
2. **Playwright locators:** `role`+`exact: true` requires full accessible names; hub cards use long button names. **Mitigation:** `goto` hub reset between tools; command palette for Academy; “Create a document” for Document Pro.  
3. **Timeouts:** Featured Document Pro card click and some css `:has(h3)` clicks hit 25–45s step limits.  
4. **Check Status:** Verified in `2026-10-25-rea-check-status-v2.json` (E026); health still fails without local API.  
5. **Source maps:** CDN `.map` URLs return 404 (E027).  
6. **Authentication:** Guest profile only; private flows UNKNOWN.

---

## 6. Reproduce

```powershell
# Optional: CDP for passive bundle pass (user browser)
# Chrome: --remote-debugging-port=9222 --user-data-dir=$env:TEMP\rea-sirraya-cdp

cd D:\quantumwalk\sirraya
.\scripts\sirraya-one-command-capture.ps1

# Landing bundle (with Chrome on 9222 and Sirraya tab open):
npx -y rea-agents@6.8.0 analyze-web-bundle http://127.0.0.1:9222 <targetId> --fetch-source-maps --evidence_output docs/references/sirraya-captures/2026-10-25-rea-landing-web-bundle.json
```

Parse any scenario JSON:

```powershell
python scripts/sirraya-parse-scenario.py docs/references/sirraya-captures/2026-10-25-rea-browser-scenario-v3.json
```

---

## 7. Artifact index

| Path | Description |
| --- | --- |
| `docs/references/sirraya-captures/2026-10-25-rea-web-bundle.json` | First landing `analyze_web_bundle` export |
| `docs/references/sirraya-captures/2026-10-25-rea-landing-web-bundle.json` | Landing bundle + fetch-source-maps CLI pass |
| `docs/references/sirraya-captures/2026-10-25-rea-browser-scenario-v3.json` | Main six-tool tour (partial Document Pro / Academy) |
| `docs/references/sirraya-captures/2026-10-25-rea-document-pro.json` | Document Pro via Create a document |
| `docs/references/sirraya-captures/2026-10-25-rea-academy-v2.json` | Academy via command palette |
| `docs/references/sirraya-captures/2026-10-25-rea-browser-scenario-v2.json` | Failed home-navigation attempt (superseded) |
| `docs/references/sirraya-captures/2026-10-25-rea-check-status.json` | Check Status scenario (explorer open failed) |
| `docs/references/sirraya-captures/2026-10-25-summary.md` | Earlier landing-only summary |
| `scripts/sirraya-full-capture-scenario.json` | Main scenario definition |
| `scripts/sirraya-one-command-capture.ps1` | One-command orchestrator |

---

## 8. Tests

No QuantumWalk application code was modified in this reconnaissance pass. **pytest / npm test not run.**
