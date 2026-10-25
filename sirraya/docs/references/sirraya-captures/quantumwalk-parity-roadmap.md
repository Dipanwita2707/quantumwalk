# QuantumWalk Sirraya parity — implementation roadmap

**Source:** [quantumwalk-parity-matrix.md](./quantumwalk-parity-matrix.md)  
**Date:** 2026-10-25  
**Scope:** Engineering backlog only — no implementation in this document.

---

## Phase 1 — Essential workflows & broken paths (P0)

| ID | Scope | QW paths | Expected behavior | Acceptance criteria | Tests | Depends on |
| --- | --- | --- | --- | --- | --- | --- |
| P0-1 | Explorer backend status | `web/app/explorer/tsp/page.tsx`, `web/lib/api.ts` | Show online/offline for API; enable/disable run | When `GET /health` (or `/api/explorer/tsp`) fails, show offline callout like Sirraya; success clears error | `api/tests/test_public_demo.py` or new web unit; manual REA optional | FastAPI running |
| P0-2 | Wire TSP UI to v3 solve | `web/app/explorer/tsp/`, `sirraya/api/sirraya_v3_routes.py`, `api/main.py` router import | Optional “Run Grover sample” for 3–6 cities posting Sirraya-shaped body | Response displays best tour + probabilities; errors bounded | `sirraya/api/tests/test_sirraya_v3.py`, `api/tests/test_tsp_grover.py` | Qiskit in API env |
| P0-3 | Guest demo path clarity | `web/components/GuestExperienceBanner.tsx`, `web/lib/demoSimulate.ts` | Guest can run demo simulate; signed-in gets lab | Banner text matches actual gates | `web/e2e/smoke.spec.ts` explorer tests | — |

---

## Phase 2 — Core interactions & state (P1)

| ID | Scope | QW paths | Expected behavior | Acceptance criteria | Tests |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Quantum Mapper page | New `web/app/explorer/mapper/page.tsx` or `sirraya/web/routes/...` | Static explainer: classical TSP → encoding → qubits (Sirraya sections) | Headings match OBSERVED Sirraya mapper a11y | e2e smoke link from hub |
| P1-2 | Document Pro templates | `sirraya/web/components/hub/DocumentProClient.tsx` | Expand templates + categories (original text) | ≥10 templates; search filters list | — |
| P1-3 | Academy lesson map | `web/lib/learnUnits.ts`, `sirraya/web/lib/academyModules.ts` | Table mapping Sirraya lesson titles → QW slugs | Document in matrix; no missing P0 lessons | — |
| P1-4 | Hardware lab breadth | `web/app/learn/hardware/page.tsx` | Five platform cards + compare copy | Matches E017 inventory at high level | — |

---

## Phase 3 — Backend & integration boundaries (P1–P2)

| ID | Scope | Notes | Acceptance |
| --- | --- | --- | --- |
| P1-API | Single TSP API surface | Choose `/api/explorer/tsp` vs `/api/v3/solve-tsp` for product UI | One documented contract in `sirraya/openapi/` |
| P2-DOCX | Client docx export | Document Pro only | Download without server |
| P2-EDITOR | CodeMirror + KaTeX | Doc Editor | No third-party AI |

**Blocked:** Sirraya production `localhost:8000` hard-code (E009) — QW must use configurable `NEXT_PUBLIC_API_URL` / rewrites (already in `web/next.config.ts`).

---

## Phase 4 — Visual & UX polish (P2–P3)

- Hub command palette (E007) — optional Mod+K search over `HUB_TOOLS`
- ML Studio branding vs functional ResNet demo — prefer honest layer toy unless model assets approved
- Document Pro tabs (Documents / Models), e-sign marketing disclaimers
- Mobile “large screen” hint (E008) if analytics show mobile traffic

---

## Phase 5 — Regression & parity verification

| Check | Command / artifact |
| --- | --- |
| API | `pytest api/tests sirraya/api/tests -q` |
| Web types/build | `npm run typecheck`, `npm run build` in `web/` after `link-sirraya-dev` |
| E2E smoke | `npm run test:e2e` — extend with hub + `/explorer/tsp` |
| Sirraya recon replay | `sirraya/scripts/sirraya-one-command-capture.ps1` (local; large JSON not in git) |
| Parity audit | Re-diff `quantumwalk-parity-matrix.md` after each phase |

---

## Local vs backend-required

| Can implement locally | Requires backend / third party |
| --- | --- |
| Mapper explainer, templates, editor MD, hub UX, academy routing | TSP v3 solve, health checks, AI draft, e-sign, real ResNet inference |
| Docx via client library | Sirraya-style FastAPI `quantum_tsp_v3.py` message (reference only) |

---

## Recommended next engineering action

Implement **P0-1** and **P0-2**: TSP explorer page that uses QuantumWalk’s existing `/api/v3/solve-tsp` (when API is up) with visible health state — closes the largest functional gap between Sirraya Explorer and current QW UI.
