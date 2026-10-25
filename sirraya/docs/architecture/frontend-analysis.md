# Frontend analysis — tools.sirraya.org

**Classification:** OBSERVED from production bundles (2026-10-25)

## Stack

| Layer | Technology | Evidence |
| --- | --- | --- |
| Build | Vite (hashed chunks, `__vite__mapDeps`) | E002 |
| UI | React 18+ (`StrictMode`, hooks, lazy) | Bundle |
| Icons | lucide-react v0.553.0 | Bundle license header |
| 3D | three.js (shared chunk) | HTML preload |
| Hub styling | Custom CSS classes `sx-*` + Tailwind CDN on shell | HTML + bundle |
| Doc Editor | CodeMirror | Chunk filename |
| Document Pro | katex, docx, QR generation | Chunk imports |
| Math | KaTeX CSS | Asset list |

## Architecture pattern

- **Shell app** (`index-*.js`): hub, command menu, keyboard shortcuts, profile string, mobile gate.  
- **Micro-frontends**: six `React.lazy` dynamic imports—no URL router.  
- **State**: React context for active view; recents array; guest profile name.  
- **Persistence**: UNKNOWN (likely `localStorage` for recents — not confirmed this cycle).

## Accessibility (partial OBSERVED)

- Command dialog `role="dialog"`, listbox/options for palette  
- Cards `role="button"` + Enter/Space handlers  
- Some icons `aria-hidden` when decorative  

## Independent implementation notes (PROPOSED)

- Use path-based routing for shareable URLs ([route-catalog](../reverse-engineering/route-catalog.md)).  
- Do not copy Sirraya org defaults from Document Pro bundle (E010).  
- Quantum tools: deep-link into QuantumWalk routes from hub.
