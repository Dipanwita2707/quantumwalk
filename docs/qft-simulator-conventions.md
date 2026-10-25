# QFT simulator conventions (QuantumWalk-original)

**Code:** `web/lib/qftSimulator.ts` (UI) · `api/qft_simulator.py` (pytest mirror)

## Scope
- Ideal state-vector simulation only; **not** quantum hardware.
- **1–5 qubits** (`QFT_MIN_QUBITS` / `QFT_MAX_QUBITS`).

## Indexing
- Computational basis label |b_{n-1}…b_0⟩ with **q0 = least significant bit**.
- Amplitude vector index `k = Σ_i b_i 2^i`.

## Transform
- Forward: `QFT|j⟩ = (1/√N) Σ_k exp(2π i j k / N) |k⟩`, N = 2^n.
- Inverse: sign flip in the exponent.
- **No final swap layer** in this simulator; circuit diagrams that swap bit order may differ.

## Validation
- Normalized inputs only (tolerance `1e-8`).
- Finite amplitudes; matching length 2^n.

## Equality
- Round-trip and tests use **fidelity** |⟨ψ|φ⟩|² ≈ 1 (global phase ignored).

## Limitations
- Does not model noise, shot sampling, or circuit depth on hardware.
- Does not by itself demonstrate quantum advantage.
