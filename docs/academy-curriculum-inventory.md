# Academy curriculum inventory (2026-10-25, updated)

**Sirraya lesson titles:** OBSERVED in `sirraya/docs/references/sirraya-captures/2026-10-25-rea-academy-v2.json` (a11y curriculum sidebar). Full lesson bodies and quizzes were **not** captured (E017).

**Legend:** Content = QW lesson page or dedicated lab/overview. Quiz = `/api/lessons/{slug}/answer`. Progress: guests = `guestLessonProgress.ts` (device-local); signed-in = server when `saved: true`.

| # | Sirraya title (evidence) | QW route / surface | Content | Quiz | Lab | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Welcome: What Quantum Computing Is (and Isn't) | `/academy`, `/academy/foundations` | Overview prose | — | — | **PARTIAL** |
| 2 | Complex Numbers & Vectors | `/learn/math-amplitudes`, `/academy/foundations` | Lesson + reader | Yes | `/workspace` | **PARTIAL** (QW original) |
| 3 | Matrices, Unitaries & Tensor Products | `/academy/foundations` | Reader spine | — | — | **PARTIAL** |
| 4 | The Physics: Waves, Photons & Spin | `/academy/foundations` | Reader spine | — | — | **PARTIAL** |
| 5 | The Qubit & the Bloch Sphere | `/learn/first-qubit` | Lesson + circuit | Yes | `/workspace` | **IMPLEMENTED+TESTED** |
| 6 | Single-Qubit Gates | `/learn/first-qubit` (overlap) | Shared entry lesson | Yes | `/workspace` | **PARTIAL** |
| 7 | Many Qubits & Tensor Products | `/learn/entanglement` (partial) | Bell / tensor narrative | Yes | `/workspace` | **PARTIAL** |
| 8 | Entanglement, Bell States & CHSH | `/learn/entanglement` | Lesson + circuit | Yes | `/workspace` | **IMPLEMENTED+TESTED** |
| 9 | Measurement, Mixed States and Noise | `/learn/pedagogy-noise` | Lesson + noise panel | Yes | Lab noise | **IMPLEMENTED+TESTED** |
| 10 | The Circuit Model | `/workspace` | Virtual lab | — | Circuit sim | **IMPLEMENTED** |
| 11 | Quantum Teleportation and Superdense Coding | `/learn/quantum-teleportation` | QW original lesson + circuit | Yes | 3-qubit demo | **IMPLEMENTED+TESTED** (teleport only; superdense not split) |
| 12 | Deutsch–Jozsa & Bernstein–Vazirani | `/learn/deutsch-intro` | Lesson + circuit | Yes | Algorithm preset | **IMPLEMENTED+TESTED** |
| 13 | Grover's Search | `/learn/grover-boost` | Lesson | Yes | `/academy/labs/grover`, `/explorer/grover` | **IMPLEMENTED+TESTED** |
| 14 | QFT and Phase Estimation | `/learn/qft-intro`, `/academy/labs/qft` | QW original lesson + direct QFT sim (basis 1–5, custom 1–3) + gate list | Yes | Ideal sim | **IMPLEMENTED+TESTED** (not Sirraya body) |
| 15 | Shor's Algorithm | `/learn/shor-intro`, `/academy/labs/shor` | QW lesson + validated QPE/IQFT lab (fixtures in pytest) | Yes | Ideal sim | **PARTIAL** (educational; not cryptoscale) |
| 16 | VQE and QAOA | `/learn/vqe-intro` | QW original conceptual | Yes | — | **PARTIAL** (QAOA not separate) |
| 17 | Quantum Reservoir Computing & QML | `/learn/quantum-reservoir`, `/academy/reservoir` | Lesson + overview | Yes | `/academy/labs/reservoir` (sim) | **IMPLEMENTED+TESTED** (simulation) |
| 18 | Error Correction & Fault Tolerance | `/learn/qec-bit-flip` | Lesson | Yes | `/academy/labs/qec` (sim) | **IMPLEMENTED+TESTED** (sim) |
| 19 | Hardware Platforms and Quantum Cryptography | `/learn/hardware` | Architecture cards | — | No live device | **PARTIAL** |
| 20 | From Gates to Pulses | `/learn/hardware` (partial) | Copy + cards | — | — | **PARTIAL** |
| 21 | Calibration and Benchmarking | `/learn/hardware` (partial) | Vocabulary only | — | — | **PARTIAL** |
| 22 | Complexity, Advantage and Your Roadmap | `/academy` paths | Hub copy | — | — | **PARTIAL** |

**QuantumWalk-only (Sirraya title not listed):** `/learn/tsp-classical`, `/explorer/tsp`, `/explorer/mapper` — **IMPLEMENTED+TESTED** (QW additions, not Sirraya lesson numbers).

**Sirraya tabs (OBSERVED, not 22 lessons):** Circuit Composer → `/workspace`; Hardware Lab → `/learn/hardware`; Characterization → **PARTIAL**; Playground demos → scattered explorers/labs; Glossary → `/learn/reference`.

**Guest quizzes:** Graded via API; `saved: false`; completion in `localStorage` only. **Signed-in:** server progress when save succeeds.
