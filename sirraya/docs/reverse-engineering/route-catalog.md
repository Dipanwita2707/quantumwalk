# Route catalog

**Target:** https://tools.sirraya.org/  
**Updated:** 2026-10-25

## Server / CDN routes (OBSERVED)

| Path | Method | Behavior | Evidence |
| --- | --- | --- | --- |
| `/` | GET | SPA shell (`index.html`) | E002 |
| `/assets/*` | GET | Version-hashed JS/CSS (Vite build) | E002 |
| `/vite.svg` | GET | Favicon | HTML |
| `/quantum-academy` | GET | **404** (no SSR fallback) | Prior QW fetch + SPA design E006 |
| `/quantum-explorer` | GET | **404** (expected) | INFERRED same pattern |

## Client “routes” (OBSERVED — not URL paths)

Navigation uses React state `activeView` / tool `id`. Equivalent logical routes:

| Logical route ID | Tool | Entry |
| --- | --- | --- |
| `null` / home | Hub home | Default load |
| `document-generator` | Document Pro | Hero CTA, cards, command menu |
| `editor` | Doc Editor | Hub grid |
| `mlexplorer` | ML Studio | Hub grid |
| `quantumtsp` | Quantum Explorer | Hub grid |
| `quantum-academy` | Quantum Academy | Hub grid |
| `quantum-mapper` | Quantum Mapper | Hub grid |

**Keyboard (OBSERVED):** Alt+1…9 switch tools; Alt+H home; `/` and Mod+K open command menu; `?` shortcuts help.

## PROPOSED independent URL design

For shareable links in our implementation:

| Path | Maps to |
| --- | --- |
| `/` | Hub |
| `/tools/document-pro` | `document-generator` |
| `/tools/doc-editor` | `editor` |
| `/tools/ml-studio` | `mlexplorer` |
| `/tools/quantum-explorer` | `quantumtsp` |
| `/tools/quantum-academy` | `quantum-academy` |
| `/tools/quantum-mapper` | `quantum-mapper` |

Use Next.js or React Router with SSR fallback—unlike observed Sirraya CDN behavior.
