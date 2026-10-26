# QuantumWalk — feature status (user-facing)

**Last updated:** October 2026  
**Promise:** “See inside a quantum algorithm.”  
**Hardware:** No live quantum device — simulator + honest hardware **concept** pages only.

---

## Works without sign-in

| Area | What you can do |
| --- | --- |
| Landing / `/start` | Onboarding, tool hub |
| `/learn` | **13 lessons** in API catalog, unit sidebar with completion %, demo sim on whitelisted presets |
| `/explorer` | Grover + TSP + classical charts + demo sim |
| Lab `?preset=` | Run preset via demo API; engine select on Run |
| `/challenges` | Read missions (grading requires sign-in) |

---

## Requires sign-in

Custom lab circuits, save/export, engine compare, transpile preview, progress/XP/tiers, dashboard private data.

---

## Launch-ready wedge (signed-in)

- Full lab: step playback, Bloch, dual noise histogram, Qiskit/Cirq, export  
- **6 lessons**, **4 challenges** (tiers), skill tree, achievements, discovery intro on dashboard  
- Explorers + TSP Grover preset (42 gates) with **honest single-mark** callout  

---

## Not implemented (by design)

- **Real hardware** integration or live device claims  
- Full Sirraya-scale curriculum, streaks, Cirq import, public leaderboard  
- Multi-route TSP oracle in one ≤64-gate circuit  

---

## Automated checks

| Check | Command |
| --- | --- |
| API | `..\.venv\Scripts\python.exe -m pytest api\tests -q` |
| Web | `cd web; npm run typecheck; npm run build` |
| Playwright | `cd web; npm run test:e2e` (9 smoke paths; CI via `.github/workflows/ci.yml`) |
| CI | GitHub Actions: API pytest, web typecheck/build, Playwright |
| All | `powershell -File scripts/e2e_smoke.ps1` |
