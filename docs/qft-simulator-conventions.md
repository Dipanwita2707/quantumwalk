# QFT simulator conventions (QuantumWalk-original)

**Code:** `web/lib/qftSimulator.ts`, `web/lib/qftGates.ts` (UI) · `api/qft_simulator.py`, `api/qft_gates.py` (pytest mirror)

## Scope
- Ideal state-vector simulation only; **not** quantum hardware.
- **Basis workflow:** 1–5 qubits (`QFT_MAX_QUBITS`).
- **Custom amplitude editor:** 1–3 qubits (`QFT_CUSTOM_MAX_QUBITS`).

## Indexing
- Computational basis |b_{n-1}…b_0⟩ with **q0 = least significant bit**.
- Amplitude vector index `k = Σ_i b_i 2^i`.

## Transform (direct)
- Forward: `QFT|j⟩ = (1/√N) Σ_k exp(2π i j k / N) |k⟩`, N = 2^n.
- Inverse: exponent sign flipped.
- **No final swap layer** in this simulator.

## Gate decomposition (documented + simulated)
- Forward order: for `q = 0…n−1`, apply **H(q)**, then **CP(π/2^{j−q})** with control `q`, target `j` (`j > q`).
- Inverse: reverse gate list with negated CP angles.
- **Equivalence:** gate sequence matches direct DFT **exactly (up to global phase) for n = 1** (Hadamard). For n ≥ 2 the lab reports **fidelity** |⟨ψ_gate|ψ_direct⟩|² when you run an experiment; textbook circuits with swap layers may differ.

## Custom input validation
- Finite amplitudes; correct length 2^n.
- **Non-zero** norm required.
- **Normalized** input required to run QFT (Σ|α|² = 1 within `1e-8`); use explicit **Normalize** — no silent rescaling on Run.
- Global phase: multiplying all amplitudes by e^{iφ} does not change measurement probabilities.

## Equality in tests
- Fidelity |⟨ψ|φ⟩|² ≈ 1 ⇒ equal up to global phase (`QFT_NUMERIC_TOLERANCE = 1e-8`).

## Limitations
- No shot noise or hardware pulse error.
- Gate list does not include swap gates; do not assume bit-reversed output ordering from other tools without conversion.
