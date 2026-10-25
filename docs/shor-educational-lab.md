# Shor educational lab (QuantumWalk-original)

**Code:** `web/lib/shorEducational.ts`, `web/components/ShorEducationalLab.tsx` · `api/shor_educational.py` (pytest mirror)

## Scope
- Composites **N = 4–21** only; bases **2 ≤ a < N** with **gcd(a, N) = 1** unless demonstrating gcd factoring.
- **≤ 5 qubits** total (same budget as the QFT simulator). Not hardware; no cryptoscale speedup claim.

## Classical vs quantum (labeled in UI)
| Stage | What it does |
|--------|----------------|
| Validation | Reject non-composite N, bad a, non-coprime bases. |
| Classical reference order | Brute-force r for **verification only** — never shown as measurement. |
| Quantum simulation | Builds entangled QPE state (1/√2^t) Σ_j \|j⟩\|a^j mod N⟩, **inverse QFT on counting** via `applyInverseQft` / `apply_qft(inverse=True)` (see `docs/qft-simulator-conventions.md`). |
| Measurement | Marginal Born probabilities on counting; demo picks a peak outcome c (tie-break to smaller c). |
| Post-processing | Continued fractions + phase scan + period divisors; gcd factor step. |

## Register layout
- **Counting qubits:** q0 … q_{t−1} (LSB-first index c).
- **Work qubits:** encode orbit index of values a^j mod N (compact orbit discovered while building the state).
- Global index: **c + (work index ≪ t)**.

## QFT integration
- Inverse QFT acts on the counting subspace only, using the **direct** QFT definition (no gate swap layer in this path).
- `qftConventionSelfCheck` in TS/pytest confirms IQFT matches the shared simulator.

## Limitations
- State prep uses modular arithmetic to form the QPE state (standard for small state-vector simulators); gate-level modular exponentiation is not expanded.
- When orbit width leaves no counting qubits, the lab falls back to **classical reference** period and labels it explicitly.
- Squares like N = 9 may fail the gcd extraction step for many bases; try another a.

## Sirraya parity
**PARTIAL** — QW-original lesson + lab; not Sirraya lesson body or full platform Shor run.
