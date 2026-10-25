# Implementation backlog (executable)

**Document ID:** QW-BACKLOG-004  
**Status:** R1–R4 MVP implemented (Oct 2026)  
**Parent plans:** [MARKET_CAPTURE_PLAN.md](MARKET_CAPTURE_PLAN.md), [CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md](CIRQ_ENGINE_AND_GAMIFICATION_PLAN.md)

---

## Completed (this release)

| Release | Scope | Notes |
| --- | --- | --- |
| **R1** | Cirq export + dual `engine` simulate + parity tests + lab compare UI + landing chip | `cirq-core==1.7.0`, `simulation_types.py` |
| **R2** | Step narrator, glossary drawer, presets, discovery progress API, challenge tiers, tool hub, dashboard skill hint | Play evolution unchanged timing; no Bloch tween yet |
| **R3** | `/explorer/grover`, transpile preview, pedagogical noise counts | Explorer uses teaching curves + lab preset |
| **R4** | `/learn/hardware`, characterization toy, achievement pulse, hardware link | No live device |

---

## Optional follow-ups (not blocking MVP)

- Bloch/probability CSS tween synced to step (R2-4 polish)
- Formal 5-user layman usability pass (market plan §6.7)
- Persist guest discovery to account on first login merge
- Challenge UI shows tier badges on `/challenges/[slug]`
- Full skill tree graph UI (data in `web/lib/skillTree.ts`)

---

## Verify commands

```powershell
cd D:\quantumwalk\api
..\.venv\Scripts\python.exe -m pytest tests/ -q

cd D:\quantumwalk\web
npm run typecheck
```

---

*Ticket IDs R1-1…R4-4 map to commits on `master` after the R1-3 bridge commit.*
