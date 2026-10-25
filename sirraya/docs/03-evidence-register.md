# Evidence register

Append-only log. Do not upgrade INFERRED items to OBSERVED without new validation.

| ID | Finding | Class | Source | Date | Confidence | Limitations | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E001 | Hub title “Sirraya Labs”; tagline on research & documents | OBSERVED | https://tools.sirraya.org/ HTML + WebFetch | 2026-10-25 | High | Marketing copy only | HTTP 200 |
| E002 | Built with Vite; entry `/assets/index-BmWPZvib.js`; React + Three.js chunks | OBSERVED | Landing HTML, bundle imports | 2026-10-25 | High | Hashed filenames change on deploy | Direct fetch |
| E003 | Tailwind via CDN on landing HTML | OBSERVED | Landing HTML | 2026-10-25 | High | May differ inside lazy chunks | — |
| E004 | Six hub tools with stable internal IDs | OBSERVED | `index-BmWPZvib.js` via `scripts/sirraya_parse_registry.py` | 2026-10-25 | High | Minified bundle | Script re-run |
| E005 | Tool IDs: `mlexplorer`, `quantumtsp`, `quantum-academy`, `quantum-mapper`, `editor`, `document-generator` | OBSERVED | Same as E004 | 2026-10-25 | High | — | — |
| E006 | No React Router paths for tools; `activeView` state; CDN 404 on `/quantum-academy` | OBSERVED | Bundle + HTTP GET 404 pattern in prior QW doc | 2026-10-25 | High | Deep linking not server-side | — |
| E007 | Command palette Mod+K, shortcuts overlay, recent tools in local state | OBSERVED | `index-BmWPZvib.js` | 2026-10-25 | Medium | Persistence mechanism not fully traced | Static read |
| E008 | Mobile viewport shows “Best on a larger screen” | OBSERVED | Bundle component `He` | 2026-10-25 | High | — | — |
| E009 | Quantum Explorer calls `http://localhost:8000/health` and `http://localhost:8000/api/v3/solve-tsp` | OBSERVED | `QuantumTSPProfessional-BxaYYXVU.js` | 2026-10-25 | High | Production Sirraya may proxy differently; client hard-codes localhost | `sirraya_extract_urls.py` |
| E010 | Document Pro embeds default org profile (name, address, email) in client bundle | OBSERVED | `SirrayaDocumentGenerator-DPSdS57J.js` | 2026-10-25 | High | **Do not copy into our product** — use synthetic fixtures | Static read |
| E011 | Doc Editor uses CodeMirror, lodash, AI slash commands | OBSERVED | `SirrayaProEditor-BNzhYoXe.js` | 2026-10-25 | Medium | AI provider endpoints not extracted this cycle | Partial grep |
| E012 | Quantum Academy chunk ~564 KB; includes embedded lesson/quiz JSON | OBSERVED | Downloaded chunk size + grep | 2026-10-25 | Medium | Full curriculum not inventoried | — |
| E013 | REA MCP live in Cursor (`rea` namespace ready; `rea-agents@6.8.0`) | OBSERVED | `GetDynamicTools`, `binary_session`, `inspect_analysis_settings`, CLI `doctor` | 2026-10-25 | High | `environment_healthy: false` (no Ghidra/Hopper); Sirraya web tools (`analyze_web_bundle`, `inspect_web_page`) available | User setup + agent probe |
| E014 | REA CLI `analyze-javascript-application` runs on downloaded assets | OBSERVED | Terminal exit 0 | 2026-10-25 | Medium | Output mostly progress JSON | — |
| E015 | QuantumWalk already implements TSP/Grover explorer routes (in progress locally) | OBSERVED | Git status `web/app/explorer/tsp/`, `api/tsp_grover.py` | 2026-10-25 | High | Not yet compared behaviorally to Sirraya | — |
| E016 | Sirraya hub stresses browser-local privacy | INFERRED | Hub marketing copy E001 | 2026-10-25 | Low | Backend for AI/docs unknown | — |
| E017 | Academy bundle lists ~150 lesson titles (Virtual Lab, Hardware lab, Grover, QEC, reservoir, etc.) | OBSERVED | `QuantumAcademy-TcZyPuEm.js` + inventory script | 2026-10-25 | Medium | Full UI not traced | `sirraya_academy_inventory.py` |
| E018 | QW maps modules via `academyModules.ts` + `/academy/foundations`, `/academy/reservoir` | PROPOSED | Implementation | 2026-10-25 | High | Original content only | typecheck |
| E019 | REA live CDP capture: hub loads 4 scripts; 6 lazy tool chunks named | OBSERVED | REA `analyze_web_bundle` + exported bundle | 2026-10-25 | High | Landing only; react chunk analysis deadline | `docs/references/sirraya-captures/` |
| E020 | Automated REA scenarios open Explorer, Mapper, ML Studio, Doc Editor UIs | OBSERVED | `2026-10-25-rea-browser-scenario-v3.json` a11y | 2026-10-25 | High | URL stays `/`; guest session | `sirraya-one-command-capture.ps1` |
| E021 | Explorer triggers `http://localhost:8000/health` → `net::ERR_FAILED` (no local API) | OBSERVED | v3 scenario network events | 2026-10-25 | High | Solve endpoint not called (backend offline UI) | — |
| E022 | Document Pro reachable via **Create a document**; template gallery + docx chunk load | OBSERVED | `2026-10-25-rea-document-pro.json` | 2026-10-25 | High | Featured card click timed out separately | — |
| E023 | Quantum Academy opens via command palette; curriculum + lesson list in a11y | OBSERVED | `2026-10-25-rea-academy-v2.json` | 2026-10-25 | High | Lesson playback not clicked | — |
| E024 | Hub tools are large **buttons** with long accessible names (Playwright `exact: true`) | OBSERVED | REA scenario v1/v2 failure analysis + v3 success | 2026-10-25 | High | Use palette / CTA / `goto` reset between tools | — |
| E025 | Production landing pass: **no source maps** retrieved (`source_maps` empty) | OBSERVED | `2026-10-25-rea-landing-web-bundle.json` | 2026-10-25 | Medium | Maps may be absent or blocked on CDN | CLI `--fetch-source-maps` |
| E026 | “Check Status” click sends `GET http://localhost:8000/health` (failed); UI stays offline | OBSERVED | `2026-10-25-rea-check-status-v2.json` | 2026-10-25 | High | No local API on capture host | Fixed Explorer button locator |
| E027 | `https://tools.sirraya.org/assets/index-BmWPZvib.js.map` returns **404** | OBSERVED | `curl -sI` probe | 2026-10-25 | High | Production deploy without public maps | — |

## Tool registry (E004 detail)

| ID | Display name |
| --- | --- |
| mlexplorer | ML Studio |
| quantumtsp | Quantum Explorer |
| quantum-academy | Quantum Academy |
| quantum-mapper | Quantum Mapper |
| editor | Doc Editor |
| document-generator | Document Pro |
