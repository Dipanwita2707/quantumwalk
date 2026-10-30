"""Build a bounded 3-qubit Grover preset for the three-city TSP demo (mark near-optimal routes)."""

from __future__ import annotations

import math
from typing import TypedDict

from circuit_schema import CircuitRequest, Operation
from simulator import simulate_qiskit

# Keep in sync with web/lib/tspExplorer.ts
DISTANCE: list[list[int]] = [
    [0, 4, 2],
    [3, 0, 1],
    [5, 2, 0],
]
PERMUTATIONS: list[list[int]] = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
]


class TspRouteMeta(TypedDict):
    id: int
    bits: str
    cost: int


def _tour_cost(order: list[int]) -> int:
    total = 0
    for i in range(len(order)):
        total += DISTANCE[order[i]][order[(i + 1) % len(order)]]
    return total


def tsp_routes() -> list[TspRouteMeta]:
    rows: list[TspRouteMeta] = []
    for route_id, order in enumerate(PERMUTATIONS):
        rows.append({"id": route_id, "bits": format(route_id, "03b"), "cost": _tour_cost(order)})
    return rows


def marked_route_ids(threshold: int | None = None) -> list[int]:
    routes = tsp_routes()
    min_cost = min(row["cost"] for row in routes)
    limit = threshold if threshold is not None else min_cost + 1
    return [row["id"] for row in routes if row["cost"] <= limit]


def _append_toffoli(ops: list[Operation], control_a: int, control_b: int, target: int) -> None:
    """Toffoli (CX, rz as T/Tdg). Caller wraps with H for phase kick."""
    pi4 = math.pi / 4
    ops.extend(
        [
            Operation(gate="cx", control=control_b, target=target),
            Operation(gate="rz", target=target, angle=-pi4),
            Operation(gate="cx", control=control_a, target=target),
            Operation(gate="rz", target=target, angle=pi4),
            Operation(gate="cx", control=control_b, target=target),
            Operation(gate="rz", target=target, angle=-pi4),
            Operation(gate="cx", control=control_a, target=target),
            Operation(gate="rz", target=target, angle=pi4),
        ]
    )


def _append_ccz(ops: list[Operation], control_a: int, control_b: int, target: int) -> None:
    ops.append(Operation(gate="h", target=target))
    _append_toffoli(ops, control_a, control_b, target)
    ops.append(Operation(gate="h", target=target))


def _append_phase_oracle(ops: list[Operation], qubits: int, state: int) -> None:
    for q in range(qubits):
        if (state >> q) & 1 == 0:
            ops.append(Operation(gate="x", target=q))
    _append_ccz(ops, 0, 1, 2)
    for q in range(qubits):
        if (state >> q) & 1 == 0:
            ops.append(Operation(gate="x", target=q))


def _append_diffuser(ops: list[Operation], qubits: int) -> None:
    for q in range(qubits):
        ops.append(Operation(gate="h", target=q))
    for q in range(qubits):
        ops.append(Operation(gate="x", target=q))
    _append_ccz(ops, 0, 1, 2)
    for q in range(qubits):
        ops.append(Operation(gate="x", target=q))
    for q in range(qubits):
        ops.append(Operation(gate="h", target=q))


def build_tsp_grover_operations(threshold: int | None = None) -> list[Operation]:
    """One Grover pass marking a single near-optimal route (gate budget ≤64).

    Classical threshold may include several tours; the lab preset amplifies the lowest-index
    optimal route so the circuit stays within education limits.
    """
    qubits = 3
    marked = marked_route_ids(threshold)
    if not marked:
        raise ValueError("No routes to mark for TSP Grover preset")
    primary = marked[0]
    ops: list[Operation] = []
    for q in range(qubits):
        ops.append(Operation(gate="h", target=q))
    _append_phase_oracle(ops, qubits, primary)
    _append_diffuser(ops, qubits)
    for q in range(qubits):
        ops.append(Operation(gate="measure", target=q))
    if len(ops) > 64:
        raise ValueError(f"TSP Grover preset exceeds gate budget: {len(ops)} ops")
    return ops


def tsp_grover_request(threshold: int | None = None) -> CircuitRequest:
    return CircuitRequest(qubits=3, operations=build_tsp_grover_operations(threshold), shots=1024)


def tsp_grover_ideal_probabilities(threshold: int | None = None) -> dict[str, float]:
    response = simulate_qiskit(tsp_grover_request(threshold))
    final = response.steps[-1].probabilities
    return {item.basis: item.probability for item in final}
