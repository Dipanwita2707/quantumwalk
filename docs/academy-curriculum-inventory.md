# Academy curriculum inventory (2026-10-25)

| Module / lesson | Evidence | QW route | Quiz | Lab | Status |
| --- | --- | --- | --- | --- | --- |
| Virtual lab / gate composer | E017, E023 | `/workspace` | — | Circuit sim | **IMPLEMENTED** |
| Grover lesson | E017 | `/learn/grover-boost` | API `/api/lessons/*/answer` | `/academy/labs/grover`, `/explorer/grover` | **IMPLEMENTED+TESTED** |
| QEC lesson | E017 | `/learn/qec-bit-flip` | API | `/academy/labs/qec` | **IMPLEMENTED+TESTED** (simulator) |
| Reservoir | E017 | `/academy/reservoir` | — | Concept | **IMPLEMENTED** (overview) |
| Hardware lab | E017 | `/learn/hardware` | — | Cards only | **PARTIAL** (no live device) |
| Quantum mapper | E020 a11y | `/explorer/mapper` | — | Encodings | **IMPLEMENTED+TESTED** |
| Full Sirraya lesson list (~150 titles) | E017 | Partial map in `academyModules.ts` | — | — | **PARTIAL** |

Guest quizzes: graded via API; `saved: false`; device progress in `guestLessonProgress.ts`. Signed-in: server progress + XP.
