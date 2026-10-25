"""QFT gate decomposition (aligned with web/lib/qftGates.ts)."""

from __future__ import annotations

import cmath
import math

from qft_simulator import apply_qft, fidelity, hadamard_1qubit, states_equal_up_to_global_phase


def apply_h(amplitudes: list[complex], qubit: int) -> list[complex]:
    n = len(amplitudes)
    out = [0j] * n
    s = math.sqrt(2)
    for k in range(n):
        if (k >> qubit) & 1:
            continue
        k1 = k | (1 << qubit)
        out[k] = (amplitudes[k] + amplitudes[k1]) / s
        out[k1] = (amplitudes[k] - amplitudes[k1]) / s
    return out


def apply_cp(amplitudes: list[complex], control: int, target: int, angle: float) -> list[complex]:
    phase = cmath.exp(1j * angle)
    out = []
    for k, z in enumerate(amplitudes):
        if ((k >> control) & 1) and ((k >> target) & 1):
            out.append(z * phase)
        else:
            out.append(z)
    return out


def apply_qft_gates(amplitudes: list[complex], inverse: bool = False) -> list[complex]:
    n_qubits = int(math.log2(len(amplitudes)))
    state = amplitudes[:]
    steps: list[tuple[str, ...]] = []
    for q in range(n_qubits):
        steps.append(("H", q))
        for j in range(q + 1, n_qubits):
            steps.append(("CP", q, j, math.pi / 2 ** (j - q)))
    if inverse:
        steps = list(reversed(steps))
        steps = [
            (s[0], s[1], s[2], -s[3]) if s[0] == "CP" else s
            for s in steps
        ]
    for step in steps:
        if step[0] == "H":
            state = apply_h(state, step[1])
        else:
            state = apply_cp(state, step[1], step[2], step[3])
    return state


def gate_vs_direct_fidelity(amplitudes: list[complex], inverse: bool = False) -> float:
    from_gates = apply_qft_gates(amplitudes, inverse=inverse)
    from_direct = apply_qft(amplitudes, inverse=inverse)
    return fidelity(from_gates, from_direct)
