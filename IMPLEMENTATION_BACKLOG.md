# Implementation backlog (executable)

**Document ID:** QW-BACKLOG-004  
**Status:** active — work from top to bottom within each release  
**Parent plans:** [MARKET_CAPTURE_PLAN.md](MARKET_CAPTURE_PLAN.md) (R1–R4), [CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md](CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md), [SIRRAYA_REFERENCE_AND_ROADMAP.md](SIRRAYA_REFERENCE_AND_ROADMAP.md)

---

## How to use this file

- One ticket = one PR-sized slice. Finish **Verify** before closing.  
- Default engine remains **qiskit** until ticket says otherwise.  
- Layman copy follows [MARKET_CAPTURE_PLAN.md §6](MARKET_CAPTURE_PLAN.md#6-layman-comprehension-gamification-and-animation).

---

## Release R1 — Twin engines (ship first)

| ID | Ticket | Files (primary) | Verify |
| --- | --- | --- | --- |
| R1-1 | Extract Qiskit build from `simulate()` into `api/circuit_bridge.py` (`to_qiskit`, shared validation) | `api/simulator.py`, `api/circuit_bridge.py` | Existing `api/tests/test_simulator.py` green |
| R1-2 | Add `to_cirq()` + string export helper on same bridge | `api/circuit_bridge.py` | Unit test: H on q0 → expected Cirq source snippet |
| R1-3 | `POST /api/export/cirq` (rate limit + CSRF like Qiskit export) | `api/platform_routes.py`, `api/tests/test_platform.py` | HTTP test returns importable-style code |
| R1-4 | Add optional `engine: Literal["qiskit","cirq"]` on `CircuitRequest`; default `qiskit` | `api/simulator.py`, `api/main.py` | OpenAPI/clients unchanged when field omitted |
| R1-5 | Implement Cirq statevector path (step snapshots match Qiskit structure) | `api/simulator.py`, `cirq-core` in `requirements.txt` | `test_cirq_parity.py`: Bell, H, small Grover fixture |
| R1-6 | Extend simulate response with `engine` field | `api/simulator.py`, `web` simulate client types | Typecheck web |
| R1-7 | Lab: Export menu “Download Cirq” | `web/app/workspace/page.tsx` | Manual: copy export, no server exec |
| R1-8 | Lab Advanced: “Also run with Cirq” + **Engines agree** badge (plain caption) | `web/app/workspace/page.tsx` | Both runs; badge when max Δp < 1e-5 |
| R1-9 | Circuit `revision` on simulate response (if not already end-to-end) | `api`, workspace state | Stale banner still correct |
| R1-10 | Landing one-liner chip: dual-engine proof (copy from market plan) | `web/app/page.tsx` | Copy review only |

**R1 exit:** Parity tests in CI; layman string for agree badge: “Both libraries calculated the same chances.”

---

## Release R2 — Your path (retention + layman lab)

| ID | Ticket | Files (primary) | Verify |
| --- | --- | --- | --- |
| R2-1 | `lib/stepNarrator.ts`: plain sentences per gate + step 0 (see market plan §6.4) | new module, `workspace/page.tsx` | Replace \|0⟩ lead in step box for step 0 |
| R2-2 | Rename step buttons: Ground → Start; Tn → “After &lt;gate&gt;” | `workspace/page.tsx` | a11y: `aria-current` on step |
| R2-3 | Play evolution: update narrator on step change; respect reduced motion | `workspace/page.tsx`, CSS | No autoplay on load |
| R2-4 | Probability/Bloch tween from snapshot (reduced motion = instant) | `QuantumSphere`, workspace panels | Values match API after tween ends |
| R2-5 | Glossary drawer in lab (search + anchor links) | new component, workspace | Keyboard trap + Esc |
| R2-6 | Lesson `?preset=` loads seeded circuit | `workspace/page.tsx`, lesson CTAs | `/learn` → lab with gates |
| R2-7 | Persist `/start` discovery count via progress API | `api/platform_routes.py`, `start/page.tsx` | Login merges local count |
| R2-8 | Dashboard: next mission + sentence (not raw XP only) | `dashboard/page.tsx` | Authenticated smoke |
| R2-9 | Challenge tiers in submit response (bronze/silver/gold rules) | `platform_routes.py`, challenges UI | Simulator-only grade |
| R2-10 | Tool hub tiles on `/start` step 0: Lab · Path · Explorer (Explorer links placeholder ok) | `PathPickerSection` or new strip | Links resolve |

**R2 exit:** Section 6.7 usability target (document results in PR).

---

## Release R3 — See the limit (Sirraya Explorer-lite)

| ID | Ticket | Files (primary) | Verify |
| --- | --- | --- | --- |
| R3-1 | Route `/explorer/grover` (4-state marked search, 5 stages) | `web/app/explorer/` | Stages navigable |
| R3-2 | Classical vs quantum probability chart (simulator data) | explorer components | Labels: ideal vs counts |
| R3-3 | “Open in Lab” preset from explorer final circuit | bridge to workspace | Simulate succeeds |
| R3-4 | Ideal vs pedagogical noise histogram (same revision) | `api` noise pass or client-bound | Badge: pedagogical |
| R3-5 | Transpile preview panel (depth, basis gates, bounded) | workspace side panel | Errors graceful |

---

## Release R4 — Machines, honestly

| ID | Ticket | Files (primary) | Verify |
| --- | --- | --- | --- |
| R4-1 | `/learn/hardware` or `/hardware/lab` architecture cards (3) | new page content | No live-device claim |
| R4-2 | Characterization toy (T1/T2 on Bloch) | component + learn link | Pedagogical label |
| R4-3 | Skill tree data + dashboard render | API or static graph | Prerequisites enforced |
| R4-4 | Achievement unlock motion (400ms, reduced-motion off) | `achievements/page.tsx` | `role=status` text present |

---

## Suggested implementation order (next 3 PRs)

1. **PR-A:** R1-1 → R1-3 (bridge + Cirq export only)  
2. **PR-B:** R1-4 → R1-6 + parity tests (dual simulate)  
3. **PR-C:** R1-7 → R1-8 + R2-1 → R2-2 (UI export + layman narrator MVP)

After PR-C, reassess R2 motion (R2-3–R2-4) before Explorer.

---

## Commands (local)

```powershell
cd D:\quantumwalk\api
..\.venv\Scripts\python.exe -m pytest tests/test_simulator.py tests/test_platform.py -q

cd D:\quantumwalk\web
npm run typecheck
```

---

*Update ticket status in commit messages or PR titles (`R1-3: Cirq export endpoint`).*
