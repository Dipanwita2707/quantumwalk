# Shor educational lab (QuantumWalk-original)

**Code:** `web/lib/shorEducational.ts`, `web/components/ShorEducationalLab.tsx` · `api/shor_educational.py` (pytest mirror)

## Scope
- Composites **N = 4–21** only; bases **2 ≤ a < N** with **gcd(a, N) = 1** unless demonstrating gcd factoring.
- **≤ 5 qubits** total (same budget as the QFT simulator). Not hardware; no cryptoscale speedup claim.

## Three layers (always labeled in UI)
| Layer | Meaning |
|--------|---------|
| **Classical computation** | Validation, continued fractions, gcd factor extraction, brute-force reference period. |
| **Ideal quantum-state simulation** | Normalized joint state, inverse QFT on counting, Born probabilities, deterministic peak pick for c. |
| **Real hardware** | **Not implemented** — no shots, noise, or cryptoscale registers. |

## Register layout and truncation
- **Counting qubits (t):** q0 … q_{t−1}, LSB-first index **c** (0 … 2^t−1).
- **Work qubits:** **⌈log₂ |orbit|⌉** where the orbit is {a^j mod N} discovered while building the state (compact encoding of values, not a full ⌈log₂ N⌉ register when that would exceed the 5-qubit budget).
- **Total qubits:** t + work ≤ 5. If **t < 1**, the lab uses the **classical reference** path only (labeled; no simulated measurement).
- **Exponent truncation:** j runs 0 … 2^t−1 only (t counting qubits). This matches the truncated QPE superposition used in small demos.

## Quantum state construction (simulation)
1. **Pre-IQFT:** |ψ⟩ = (1/√2^t) Σ_{j=0}^{2^t−1} |j⟩ |orbit(a^j mod N)⟩ with amplitudes on index **c = j**, work = orbit index. **Σ|α|² = 1** (pytest `test_fixture_pre_iqft_state_normalized`).
2. **Orbit check:** every a^j mod N for j in range appears in the discovered cycle (pytest `test_fixture_orbit_covers_exponent_superposition`).
3. **Inverse QFT on counting:** for each work slice with non-zero weight, normalize the counting slice to unit, apply **inverse QFT** (`applyInverseQft` / `apply_qft(inverse=True)` — direct DFT convention in `docs/qft-simulator-conventions.md`), scale back by √weight. Preserves global norm (pytest `test_fixture_post_iqft_state_normalized`).
4. **Marginal probabilities:** P(c) = Σ_work |α(c, work)|²; **Σ P(c) = 1**.

## Analytical checks (when r | 2^t)
If the true period **r** divides **2^t**, ideal QPE peaks at **c = k·2^t/r** with equal probability **1/r** (pytest `test_fixture_analytical_peaks_when_period_divides_2t` on fixtures N=15,a=7,r=4,t=3 etc.).

## Deterministic measurement policy
Among outcomes with probability within **1e−9** of the maximum, pick the **smallest c**; then try tied peaks for continued-fraction + factor extraction (`resolveMeasurementAndOrder`). This is a **teaching default**, not random hardware sampling.

## Classical post-processing
- Continued fractions + phase scan + divisor expansion; every candidate **r** must satisfy **a^r ≡ 1 (mod N)**.
- Factor step rejects **odd r**, **a^{r/2} ≡ −1**, and trivial gcds.
- **Classical reference order:** brute-force r for verification — **never** substituted for c.

## Known deterministic fixtures (pytest)
| N | a | Period r | Factors |
|---|---|----------|---------|
| 15 | 7 | 4 | 3 × 5 |
| 21 | 2 | 6 | 3 × 7 |
| 8 | 3 | 2 | 2 × 4 |

## QFT integration
- Counting register only; **same k index / LSB convention** as `qftSimulator.ts`.
- Gate-sequence QFT (with swap layer) is **not** used on this path — only the direct inverse transform.

## Academy links
- Prerequisites: `/learn/qft-intro`, `/academy/labs/qft`.
- Lab: `/academy/labs/shor` · Lesson: `/learn/shor-intro`.

## Limitations
- State prep uses closed-form QPE amplitudes (not gate-level modular exponentiation).
- Some (N, a) pairs fail factor extraction (e.g. N = 9, a = 2); the lab reports why instead of inventing factors.
- Sirraya parity: **PARTIAL** — see `sirraya/docs/references/sirraya-captures/quantumwalk-parity-matrix.md`.

## Next milestone
Gate-level QPE for the smallest registers where t + work ≤ 5, with IQFT via the **gate** QFT path for end-to-end convention parity — optional future work.
