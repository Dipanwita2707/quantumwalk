"""Cirq statevector simulation aligned with QuantumWalk basis labels."""

from __future__ import annotations

import cirq
from qiskit.quantum_info import Statevector

from circuit_schema import CircuitRequest, Operation
from simulation_types import SimulationResponse, snapshot_from_statevector


def _cirq_gate(op: Operation, qubits: list[cirq.Qid]) -> cirq.Operation:
    q = qubits[op.target]
    if op.gate == "h":
        return cirq.H(q)
    if op.gate == "x":
        return cirq.X(q)
    if op.gate == "y":
        return cirq.Y(q)
    if op.gate == "z":
        return cirq.Z(q)
    if op.gate == "s":
        return cirq.S(q)
    if op.gate == "t":
        return cirq.T(q)
    if op.gate == "rx":
        return cirq.rx(op.angle)(q)
    if op.gate == "ry":
        return cirq.ry(op.angle)(q)
    if op.gate == "rz":
        return cirq.rz(op.angle)(q)
    if op.gate == "cx":
        return cirq.CNOT(qubits[op.control], q)
    if op.gate == "cz":
        return cirq.CZ(qubits[op.control], q)
    if op.gate == "swap":
        return cirq.SWAP(qubits[op.control], q)
    raise ValueError(f"Unsupported gate for Cirq simulation: {op.gate}")


def simulate_cirq(request: CircuitRequest) -> SimulationResponse:
    line = cirq.LineQubit.range(request.qubits)
    circuit = cirq.Circuit()
    simulator = cirq.Simulator(dtype=complex)
    snapshots = [
        snapshot_from_statevector(Statevector.from_int(0, dims=[2] * request.qubits), request.qubits, 0)
    ]
    measurement_targets: list[int] = []

    for index, op in enumerate(request.operations, start=1):
        if op.gate == "measure":
            measurement_targets.append(op.target)
        else:
            circuit.append(_cirq_gate(op, line))
        # Cirq orders its first qubit as the most significant tensor axis;
        # QuantumWalk/Qiskit label q0 as the rightmost (least significant) bit.
        raw = simulator.simulate(circuit, qubit_order=list(reversed(line))).final_state_vector
        state = Statevector(raw, dims=[2] * request.qubits)
        snapshots.append(snapshot_from_statevector(state, request.qubits, index))

    counts: dict[str, int] | None = None
    if measurement_targets:
        measured = circuit + [cirq.measure(line[q], key=f"q{q}") for q in measurement_targets]
        samples = simulator.run(measured, repetitions=request.shots)
        counts = {}
        for rep in range(request.shots):
            chars = ["0"] * request.qubits
            for q in measurement_targets:
                chars[request.qubits - 1 - q] = str(int(samples.measurements[f"q{q}"][rep][0]))
            label = "".join(chars)
            counts[label] = counts.get(label, 0) + 1
        counts = dict(sorted(counts.items()))

    return SimulationResponse(
        qubits=request.qubits,
        shots=request.shots,
        steps=snapshots,
        counts=counts,
        basis_order="Qubit 0 is the rightmost bit in each basis label",
        mode="ideal_simulator",
        engine="cirq",
        noisy_counts=None,
    )
