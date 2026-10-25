# Requirements traceability matrix

| Req ID | Feature | Evidence | Design | Implementation | Tests |
| --- | --- | --- | --- | --- | --- |
| R-SIR-001 | Hub lists 6 tools | E004–E005 | platform-inventory | `/hub`, `hubTools.ts` | Playwright smoke |
| R-SIR-011 | Document Pro | E010 | screen-specifications | `/hub/document-pro` | Manual |
| R-SIR-012 | Doc Editor | E011 | screen-specifications | `/hub/doc-editor` | Playwright smoke |
| R-SIR-013 | ML Studio | E004 | screen-specifications | `/hub/ml-studio` | Manual |
| R-SIR-014 | solve-tsp 4–6 cities | E009 | api-contracts | `tsp_quantum_grover.py` | `test_tsp_quantum_grover.py` |
| R-SIR-002 | POST `/api/v3/solve-tsp` | E009 | api-contracts | `api/sirraya_v3_routes.py` | `test_sirraya_v3.py` |
| R-SIR-003 | GET `/health` | E009 | api-catalog | `api/main.py` | platform tests |
| R-SIR-004 | 3-city Grover TSP | E009, E015 | low-level-design | `tsp_grover.py`, explorer | `test_tsp_grover.py` |
| R-SIR-005 | Quantum Academy modules | E012, academy inventory | screen-specifications | `/academy`, `academyModules.ts`, foundations/reservoir | Playwright smoke |
| R-SIR-006 | Glossary & cheat sheets | E011 | component-inventory | `/learn/reference`, `glossary.ts` | Playwright smoke |
| R-SIR-007 | Hardware / characterization | Hub copy | screen-specifications | `/learn/hardware` | Manual |
| R-SIR-008 | Document Pro | E010 | FR-9 | Not started | — |
| R-SIR-009 | Doc Editor | E011 | FR-9 | Not started | — |
| R-SIR-010 | ML Studio | E004 | FR-10 | Not started | — |

Updated: 2026-10-25
