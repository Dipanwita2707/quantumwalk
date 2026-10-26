"""Grover-style TSP sampling for 3–6 cities via direct Qiskit (Sirraya solve-tsp compat)."""

from __future__ import annotations

import itertools
import math
from typing import Any

from qiskit import ClassicalRegister, QuantumCircuit
from qiskit_aer import AerSimulator

MAX_TSP_QUBITS = 10  # 6! = 720 routes


def _tour_cost(matrix: list[list[float | int]], order: tuple[int, ...]) -> float:
    total = 0.0
    n = len(order)
    for i in range(n):
        total += float(matrix[order[i]][order[(i + 1) % n]])
    return total


def _permutations(n: int) -> list[tuple[int, ...]]:
    return list(itertools.permutations(range(n)))


def _index_bits(index: int, qubits: int) -> str:
    return format(index, f"0{qubits}b")


def _apply_phase_oracle(qc: QuantumCircuit, qubits: int, target: int) -> None:
    for q in range(qubits):
        if (target >> q) & 1 == 0:
            qc.x(q)
    if qubits == 1:
        qc.z(0)
    elif qubits == 2:
        qc.cz(0, 1)
    else:
        qc.h(qubits - 1)
        qc.mcx(list(range(qubits - 1)), qubits - 1)
        qc.h(qubits - 1)
    for q in range(qubits):
        if (target >> q) & 1 == 0:
            qc.x(q)


def _apply_diffuser(qc: QuantumCircuit, qubits: int) -> None:
    qc.h(range(qubits))
    qc.x(range(qubits))
    _apply_phase_oracle(qc, qubits, 0)
    qc.x(range(qubits))
    qc.h(range(qubits))


def grover_tsp_sample(
    matrix: list[list[float | int]],
    *,
    shots: int,
    grover_iterations: int = 1,
) -> dict[str, Any]:
    """Return measurement counts and metadata for route indices (basis = route id)."""
    n = len(matrix)
    perms = _permutations(n)
    num_routes = len(perms)
    costs = [_tour_cost(matrix, p) for p in perms]
    optimal = min(costs)
    primary = costs.index(optimal)
    qubits = max(1, (num_routes - 1).bit_length())
    if qubits > MAX_TSP_QUBITS:
        raise ValueError(f"Too many routes ({num_routes}) for bounded simulator ({MAX_TSP_QUBITS} qubits)")

    qc = QuantumCircuit(qubits)
    qc.h(range(qubits))
    iterations = max(1, min(grover_iterations, 5))
    for _ in range(iterations):
        _apply_phase_oracle(qc, qubits, primary)
        _apply_diffuser(qc, qubits)
    qc.add_register(ClassicalRegister(qubits))
    for q in range(qubits):
        qc.measure(q, q)

    backend = AerSimulator(method="statevector", max_parallel_threads=1, max_memory_mb=512)
    result = backend.run(qc, shots=shots).result()
    counts = dict(result.get_counts())

    return {
        "counts": counts,
        "qubits": qubits,
        "depth": qc.depth(),
        "primary_route_index": primary,
        "num_routes": num_routes,
        "classical_optimal": optimal,
    }
