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


def apply_swap(amplitudes: list[complex], qubit_a: int, qubit_b: int) -> list[complex]:
    n = len(amplitudes)
    out = [0j] * n
    for k in range(n):
        bit_a = (k >> qubit_a) & 1
        bit_b = (k >> qubit_b) & 1
        nk = k ^ (1 << qubit_a) ^ (1 << qubit_b) if bit_a != bit_b else k
        out[nk] = amplitudes[k]
    return out


def build_forward_qft_gate_steps(n_qubits: int) -> list[tuple[str, ...]]:
    steps: list[tuple[str, ...]] = []
    for q in range(n_qubits - 1, -1, -1):
        steps.append(("H", q))
        for j in range(q - 1, -1, -1):
            steps.append(("CP", j, q, math.pi / 2 ** (q - j)))
    for i in range(n_qubits // 2):
        steps.append(("SWAP", i, n_qubits - 1 - i))
    return steps


def build_inverse_qft_gate_steps(n_qubits: int) -> list[tuple[str, ...]]:
    steps = list(reversed(build_forward_qft_gate_steps(n_qubits)))
    out: list[tuple[str, ...]] = []
    for step in steps:
        if step[0] == "CP":
            out.append(("CP", step[1], step[2], -step[3]))
        else:
            out.append(step)
    return out


def apply_qft_gates(amplitudes: list[complex], inverse: bool = False) -> list[complex]:
    n_qubits = int(math.log2(len(amplitudes)))
    state = amplitudes[:]
    steps = build_inverse_qft_gate_steps(n_qubits) if inverse else build_forward_qft_gate_steps(n_qubits)
    for step in steps:
        if step[0] == "H":
            state = apply_h(state, step[1])
        elif step[0] == "CP":
            state = apply_cp(state, step[1], step[2], step[3])
        else:
            state = apply_swap(state, step[1], step[2])
    return state


def gate_vs_direct_fidelity(amplitudes: list[complex], inverse: bool = False) -> float:
    from_gates = apply_qft_gates(amplitudes, inverse=inverse)
    from_direct = apply_qft(amplitudes, inverse=inverse)
    return fidelity(from_gates, from_direct)
