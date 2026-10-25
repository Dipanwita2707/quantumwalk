"""Ideal QFT state-vector math (aligned with web/lib/qftSimulator.ts)."""

from __future__ import annotations

import cmath
import math

QFT_MIN_QUBITS = 1
QFT_MAX_QUBITS = 5
QFT_NUMERIC_TOLERANCE = 1e-8


def validate_qubit_count(qubits: int) -> str | None:
    if not isinstance(qubits, int) or qubits < QFT_MIN_QUBITS or qubits > QFT_MAX_QUBITS:
        return f"Qubit count must be {QFT_MIN_QUBITS}–{QFT_MAX_QUBITS}."
    return None


def basis_state(qubits: int, index: int) -> list[complex]:
    dim = 2**qubits
    if index < 0 or index >= dim:
        raise ValueError(f"index must be 0…{dim - 1}")
    amps = [0j] * dim
    amps[index] = 1 + 0j
    return amps


def norm_squared(z: complex) -> float:
    return (z.real * z.real + z.imag * z.imag).real


def validate_state(qubits: int, amplitudes: list[complex]) -> str | None:
    err = validate_qubit_count(qubits)
    if err:
        return err
    dim = 2**qubits
    if len(amplitudes) != dim:
        return f"Expected {dim} amplitudes."
    total = 0.0
    for z in amplitudes:
        if not (math.isfinite(z.real) and math.isfinite(z.imag)):
            return "Amplitudes must be finite."
        total += norm_squared(z)
    if abs(total - 1.0) > QFT_NUMERIC_TOLERANCE:
        return "State must be normalized."
    return None


def apply_qft(amplitudes: list[complex], inverse: bool = False) -> list[complex]:
    n = len(amplitudes)
    scale = 1 / math.sqrt(n)
    out = [0j] * n
    sign = -1 if inverse else 1
    for j in range(n):
        for k in range(n):
            angle = sign * 2 * math.pi * j * k / n
            out[k] += scale * cmath.exp(1j * angle) * amplitudes[j]
    return out


def fidelity(a: list[complex], b: list[complex]) -> float:
    inner = sum(x.conjugate() * y for x, y in zip(a, b))
    return norm_squared(inner)


def states_equal_up_to_global_phase(a: list[complex], b: list[complex], tol: float = QFT_NUMERIC_TOLERANCE) -> bool:
    return abs(fidelity(a, b) - 1.0) <= tol


def hadamard_1qubit(inp: int) -> list[complex]:
    s = 1 / math.sqrt(2)
    if inp == 0:
        return [s + 0j, s + 0j]
    return [s + 0j, -s + 0j]
