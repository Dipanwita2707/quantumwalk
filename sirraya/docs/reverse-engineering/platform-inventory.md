# Platform inventory — tools.sirraya.org

**Updated:** 2026-10-25  
**Evidence:** [03-evidence-register.md](../03-evidence-register.md) E001–E012

## Product summary (OBSERVED)

Single-page **tool hub** (“Sirraya Labs”) bundling six lazy-loaded applications. Positioning: fast, private, in-browser workspace for documents and research tooling.

## Tool catalog

| Internal ID | Name | Category (OBSERVED) | Lazy chunk | Primary capabilities (from hub copy + bundle) |
| --- | --- | --- | --- | --- |
| `document-generator` | Document Pro | Documents (featured) | `SirrayaDocumentGenerator-*.js` | Templates, clauses, e-sign, SHA-256 sealing, PDF/Word export, AI drafting/risk (marketing) |
| `editor` | Doc Editor | Documents (featured) | `SirrayaProEditor-*.js` | Markdown + live preview, CodeMirror, math/diagrams, version history, export, AI writing commands |
| `mlexplorer` | ML Studio | Research | `MLPipelineExplorer-*.js` | NN / ML architecture visualization (not downloaded this cycle) |
| `quantumtsp` | Quantum Explorer | Quantum | `QuantumTSPProfessional-*.js` | TSP + Grover workflow; optional local API on port 8000 |
| `quantum-academy` | Quantum Academy | Quantum | `QuantumAcademy-*.js` | Full course: Bloch sphere, composer, algorithms, noise/QEC, reservoir computing (marketing + large embedded content) |
| `quantum-mapper` | Quantum Mapper | Quantum | `QuantumClassicalMapper-*.js` | Classical↔quantum mapping visual guide |

## Hub chrome (OBSERVED)

- Home hero, featured cards, “All tools” grid with category tabs  
- “Jump back in” recents (client state)  
- Top bar: home, tool switcher, search (command menu), keyboard shortcuts dialog  
- Profile display name (defaults “Guest”; editable in UI — persistence UNKNOWN)  
- Footer copyright + Mod+K hint  

## External integrations (partial)

| Integration | Evidence | Notes |
| --- | --- | --- |
| Local FastAPI (TSP) | E009 | `localhost:8000` only in Explorer chunk |
| Google Fonts | Document export HTML generation | OBSERVED in Document Pro chunk |
| Tailwind CDN | Landing `index.html` | OBSERVED |
| Third-party AI | Doc Editor slash commands | Endpoints UNKNOWN this cycle |

## Not observed on public hub

- Server-side login gate for hub entry  
- Multi-tenant cloud sync  
- Sirraya backend hostnames in quantum TSP chunk  

## QuantumWalk mapping (PROPOSED)

| Sirraya tool | QuantumWalk surface |
| --- | --- |
| quantumtsp | `/explorer/tsp`, `api/tsp_grover.py` |
| quantum-academy | `/learn`, `/workspace`, challenges |
| quantum-mapper | Workspace toolbox / mapper components |
| Hub + documents + ML | `sirraya-platform/` (new) |
