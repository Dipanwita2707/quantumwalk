# Feature coverage matrix

Legend: **Obs** = observed on reference · **Impl** = our implementation · **Test** = automated test · Priority P0–P3

| Feature | Obs | Impl status | Priority | Depends on | Test scenario |
| --- | --- | --- | --- | --- | --- |
| Hub home + tool grid | Yes | **Implemented** `/hub` | P1 | `hubTools.ts` | Open hub, see 6 tools |
| Document Pro | Yes | **Partial** `/hub/document-pro` | P2 | templates | Fill memo, print |
| Doc Editor | Yes | **Partial** `/hub/doc-editor` | P2 | localStorage | Edit MD, preview |
| ML Studio | Partial | **Partial** `/hub/ml-studio` | P3 | layer UI | Add layer |
| Command palette search | Yes | Not started | P2 | Hub | Mod+K, filter tools |
| Recent / jump back in | Yes | Not started | P3 | localStorage | Reopen tool |
| Mobile block screen | Yes | Not started | P3 | Hub | Narrow viewport message |
| Doc Editor markdown + preview | Yes | **Partial** `/hub/doc-editor` | P2 | localStorage | Type MD, preview |
| ML Studio viz | Partial | **Partial** `/hub/ml-studio` | P3 | layer UI | Add layer |
| Quantum Explorer TSP+Grover | Yes | **Partial** (QW `explorer/tsp`, `tsp_grover`) | P0 | `/api/v3/solve-tsp` | Run 4-city TSP |
| Local API health check | Yes | Verify QW `/health` | P0 | API | GET health from explorer |
| Quantum Academy course | Yes | **Partial** — hub + 6 lessons + module map | P1 | `academyModules.ts` | `/academy`, lesson quiz |
| Foundations / reservoir pages | Yes (titles in bundle) | Implemented (original copy) | P2 | `/academy/foundations`, `/reservoir` | Manual |
| Quantum Mapper | Yes | Partial (toolbox) | P2 | Workspace | Map classical gate |
| Google OAuth workspace | No (hub) | QW has OAuth | — | Separate product | Sign in QW |
| Server-side Sirraya API | Unknown | N/A | — | — | — |

## Coverage summary (2026-10-25)

- **Observed hub features:** 6 tools + chrome (~15 UX features)  
- **Implemented in repo:** quantum subset (~40% of quantum features, unverified parity)  
- **Blocked:** REA MCP until `rea-agents setup` (B1), Sirraya-grade e-sign/docx/AI (B2)
