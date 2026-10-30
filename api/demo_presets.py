"""Whitelisted circuits for unauthenticated demo simulation."""

from __future__ import annotations

from circuit_schema import CircuitRequest, Operation
from tsp_grover import build_tsp_grover_operations

GROVER2_OPS: list[Operation] = [
    Operation(gate="h", target=0),
    Operation(gate="h", target=1),
    Operation(gate="z", target=0),
    Operation(gate="z", target=1),
    Operation(gate="cz", control=0, target=1),
    Operation(gate="h", target=0),
    Operation(gate="h", target=1),
    Operation(gate="x", target=0),
    Operation(gate="x", target=1),
    Operation(gate="cz", control=0, target=1),
    Operation(gate="x", target=0),
    Operation(gate="x", target=1),
    Operation(gate="h", target=0),
    Operation(gate="h", target=1),
]

DEMO_PRESETS: dict[str, CircuitRequest] = {
    "superposition": CircuitRequest(
        qubits=1,
        operations=[Operation(gate="h", target=0), Operation(gate="measure", target=0)],
        shots=1024,
    ),
    "bell": CircuitRequest(
        qubits=2,
        operations=[
            Operation(gate="h", target=0),
            Operation(gate="cx", control=0, target=1),
            Operation(gate="measure", target=0),
            Operation(gate="measure", target=1),
        ],
        shots=1024,
    ),
    "grover2": CircuitRequest(qubits=2, operations=GROVER2_OPS + [Operation(gate="measure", target=0), Operation(gate="measure", target=1)], shots=1024),
    "tsp3": CircuitRequest(
        qubits=3,
        operations=[
            Operation(gate="h", target=0),
            Operation(gate="h", target=1),
            Operation(gate="h", target=2),
            Operation(gate="measure", target=0),
            Operation(gate="measure", target=1),
            Operation(gate="measure", target=2),
        ],
        shots=1024,
    ),
    "tsp3grover": CircuitRequest(qubits=3, operations=build_tsp_grover_operations(), shots=1024),
}
