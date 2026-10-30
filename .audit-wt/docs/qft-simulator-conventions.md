# QFT simulator conventions (QuantumWalk-original)

**Code:** `web/lib/qftSimulator.ts`, `web/lib/qftGates.ts` (UI) · `api/qft_simulator.py`, `api/qft_gates.py` (pytest mirror)

## Scope
- Ideal state-vector simulation only; **not** quantum hardware.
- **Basis workflow:** 1–5 qubits (`QFT_MAX_QUBITS`).
- **Custom amplitude editor:** 1–3 qubits (`QFT_CUSTOM_MAX_QUBITS`).

## Mathematical contract (direct transform — primary definition)

### Indexing
- Register |b_{n−1}…b_0⟩ with wire label **q_i carrying bit b_i**.
- **q0 = least significant bit (LSB)**; q_{n−1} = most significant bit (MSB).
- Amplitude vector index **k = Σ_i b_i 2^i** (same bit order as wire labels).

### Forward and inverse QFT (matrix form)
- N = 2^n.
- **Forward:** QFT|j⟩ = (1/√N) Σ_{k=0}^{N−1} exp(2π i j k / N) |k⟩.
- **Inverse:** replace the exponent with **−2π i j k / N**.
- Implemented as dense DFT on amplitude indices j → k with the formula above.
- **No swap layer** is applied inside this direct transform; output amplitudes use the **same k indexing** as the input.

### Global phase
- States ψ and e^{iφ}ψ are equivalent for probabilities and for **fidelity** F = |⟨ψ|φ⟩|².
- Tests use `states_equal_up_to_global_phase` when F ≈ 1 within `QFT_NUMERIC_TOLERANCE = 1e-8`.

## Gate-sequence decomposition (secondary, must match direct)

The lab simulates a **standard textbook circuit** (Nielsen–Chuang ordering) plus an explicit **output swap layer** so the result matches the direct definition above **without re-indexing amplitudes**.

### Forward gate order (n ≥ 1)
1. For **q = n−1, n−2, …, 0** (MSB wire first):
   - Apply **H(q)**.
   - For **j = q−1, q−2, …, 0**:
     - **CP(π/2^{q−j})** with **control j**, **target q** (phase e^{iπ/2^{q−j}} when both control and target are |1⟩).
2. **Swap layer:** for **i = 0 … ⌊n/2⌋ − 1**, apply **SWAP(q_i, q_{n−1−i})**.

### Inverse gate order
- Reverse the full forward step list (including swaps).
- Negate every controlled-phase angle (CP† uses the opposite sign).

### Distinctions (do not conflate)
| Layer | Role |
|--------|------|
| **Direct QFT** | Mathematical definition; single unitary on index k. |
| **Gate sequence** | Product of H, CP, and SWAP gates in the order above. |
| **Swap layer** | Part of the **gate** path only; compensates wire order so amplitudes align with the direct k index. |
| **Global phase** | Gate vs direct comparison uses fidelity, not element-wise equality. |

### Verified equivalence
- For n = 1…5, gate sequence output matches direct forward/inverse QFT **up to global phase** on all tested computational-basis inputs and on deterministic arbitrary normalized states (see `api/tests/test_qft_simulator.py`).
- The previous ascending loop (H on q0 first, CP control q → target j) **does not** match this direct convention for n ≥ 2.

## Custom input validation
- Finite amplitudes; correct length 2^n.
- **Non-zero** norm required.
- **Normalized** input required to run QFT (Σ|α|² = 1 within `1e-8`); use explicit **Normalize** — no silent rescaling on Run.

## Limitations
- No shot noise or hardware pulse error.
- Other tools may use bit-reversed output ordering; convert indices before comparing raw amplitudes.

## Sirraya parity
- QuantumWalk QFT lab correctness is established here; **Sirraya feature parity remains PARTIAL** (see `sirraya/docs/references/sirraya-captures/quantumwalk-parity-matrix.md`).
