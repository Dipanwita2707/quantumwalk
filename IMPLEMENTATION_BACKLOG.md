# Implementation backlog (executable)

**Document ID:** QW-BACKLOG-004  
**Status:** **partial** — core wedge shipped; Sirraya-scale items remain  
**Verify:** `powershell -File scripts/e2e_smoke.ps1`

---

## Shipped (working in repo)

| ID | Feature | Notes |
| --- | --- | --- |
| M1–M2 | Cirq export + dual-engine simulate + parity tests | API + Lab compare panel |
| M3 | Tool hub links on `/start` | Lab · Path · Explorer · Hardware story |
| M4 | Lesson → Lab preset deep links | `lib/lessonPresets.ts`, LearningTrail |
| M5 | Glossary drawer in Lab | `LabGlossaryDrawer` |
| M6 | Dashboard XP / level / next mission | Derived from progress API |
| M7 | Challenge tiers (simulator-graded) | Backend + submit UI; tier copy on `/challenges` |
| M8–M11 | Step motion, narrator, revision stale UX, landing chip | Lab + landing |
| M9 | Result ↔ circuit revision | `revision` / stale banner in workspace |
| S2 | Pedagogical noise on simulate | `noise_strength` + counts panel |
| S3 | Transpile preview | Lab engine panel |
| S4–S5 | Hardware story + T1 toy | `/learn/hardware` + connectivity SVG |
| S6 | Skill tree UI | Dashboard; ties to `activity_slug` |
| S8 | Engine compare side-by-side | Qiskit vs Cirq probability columns |
| S7 (partial) | Achievement pulse + filters | `/achievements` |
| R3 (partial) | Grover + **TSP** explorers | `/explorer`, `/explorer/tsp`, `/explorer/grover` |
| S1 | TSP Grover lab preset + public `/api/explorer/tsp` | `preset=tsp3grover`, 42 gates; regen via `api/scripts/export_tsp_grover_preset.py` |
| H4 | Dual ideal vs pedagogical noise histogram | Lab measurement panel (same revision) |
| H1 (partial) | Quantum Academy surface | `/academy` hub, `/learn/reference`, unit overview on `/learn`, foundations + reservoir readers, 6-lesson spine in sidebar |
| M5 (expanded) | Glossary + cheat sheets | 31 terms, `CHEAT_SHEETS`, lab drawer + reference page |

---

## Not done / thin (honest gaps)

| ID | Planned | Current gap |
| --- | --- | --- |
| S1 (partial) | Multi-route oracle in one pass (≤64 gates) | Single primary mark |001⟩; threshold may list 001, 010, 101 |
| H1 (partial) | Full Sirraya-scale Academy | More graded lessons per unit; interactive reservoir playground |
| M2 (guest) | Demo presets + engine select on Run | Custom circuits still require sign-in |
| Gamification | Streaks, richer XP ledger | XP = completed activities × 100 |
| L1–L7 | QEC, Cirq import, career paths, real hardware, etc. | Out of scope for current MVP |
| Playwright | Browser E2E | `web/e2e/smoke.spec.ts` (incl. `/academy`, `/learn/reference`) |
| Usability study | Market plan §6.7 | Not run |

---

## Automated checks

| Layer | Command |
| --- | --- |
| API | `..\.venv\Scripts\python.exe -m pytest api\tests -q` |
| Web | `cd web; npm run typecheck; npm run build` |
| All | `powershell -File scripts/e2e_smoke.ps1` |

**Manual:** API + `npm run dev` — sign in, run Lab compare/noise, complete a challenge tier, explorer live circuit.

---

## Suggested next build slice (if continuing)

1. **S1-lite:** 3-city TSP wizard (≤4 qubits) with classical cost chart.  
2. **H4:** Ideal vs noisy dual histogram on same circuit revision.  
3. **H1:** Expand `LESSONS` + learn rail with preset links per unit.  
4. **Guest demo:** Bounded public simulate **or** clear “sign in to run” on all embeds (consistent UX).
