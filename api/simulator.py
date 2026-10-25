"""Bounded circuit simulation. Qubit 0 is the rightmost bit in basis labels."""

from __future__ import annotations

from circuit_bridge import apply_operation, build_qiskit_circuit
from circuit_schema import CircuitRequest, Operation  # noqa: F401 — re-export for API imports
from qiskit import ClassicalRegister, QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error

from simulation_types import Amplitude, BlochVector, Probability, SimulationResponse, StepSnapshot, snapshot_from_statevector

# Re-export response types for existing imports.
__all__ = [
    "Amplitude",
    "BlochVector",
    "CircuitRequest",
    "Operation",
    "Probability",
    "SimulationResponse",
    "StepSnapshot",
    "simulate",
    "snapshot_from_statevector",
]


def _noisy_counts(request: CircuitRequest, measurement_targets: list[int]) -> dict[str, int] | None:
    if not measurement_targets or request.noise_strength is None or request.noise_strength <= 0:
        return None
    strength = request.noise_strength
    noise_model = NoiseModel()
    error = depolarizing_error(strength, 1)
    for name in ("h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "cx", "cz", "swap"):
        noise_model.add_all_qubit_quantum_error(error, [name])
    sampled = build_qiskit_circuit(
        CircuitRequest(qubits=request.qubits, operations=[op for op in request.operations if op.gate != "measure"], shots=request.shots)
    )
    sampled.add_register(ClassicalRegister(request.qubits))
    for qubit in measurement_targets:
        sampled.measure(qubit, qubit)
    backend = AerSimulator(noise_model=noise_model, method="automatic", max_parallel_threads=1, max_memory_mb=256)
    result = backend.run(sampled, shots=request.shots).result()
    return dict(sorted(result.get_counts().items()))


def simulate_qiskit(request: CircuitRequest) -> SimulationResponse:
    circuit = QuantumCircuit(request.qubits)
    snapshots = [snapshot_from_statevector(Statevector.from_int(0, 2**request.qubits), request.qubits, 0)]
    measurement_targets: list[int] = []

    for index, op in enumerate(request.operations, start=1):
        if apply_operation(circuit, op):
            measurement_targets.append(op.target)
        state = Statevector.from_instruction(circuit)
        snapshots.append(snapshot_from_statevector(state, request.qubits, index))

    counts: dict[str, int] | None = None
    if measurement_targets:
        sampled = circuit.copy()
        sampled.add_register(ClassicalRegister(request.qubits))
        for qubit in measurement_targets:
            sampled.measure(qubit, qubit)
        result = AerSimulator(method="statevector", max_parallel_threads=1, max_memory_mb=256).run(sampled, shots=request.shots).result()
        counts = dict(sorted(result.get_counts().items()))

    noisy = _noisy_counts(request, measurement_targets)
    mode = "pedagogical_noise" if noisy is not None else "ideal_simulator"

    return SimulationResponse(
        qubits=request.qubits,
        shots=request.shots,
        steps=snapshots,
        counts=counts,
        basis_order="Qubit 0 is the rightmost bit in each basis label",
        mode=mode,
        engine="qiskit",
        noisy_counts=noisy,
    )


def simulate(request: CircuitRequest) -> SimulationResponse:
    if request.engine == "cirq":
        from cirq_engine import simulate_cirq

        response = simulate_cirq(request)
        if request.noise_strength and request.noise_strength > 0:
            measurement_targets = [op.target for op in request.operations if op.gate == "measure"]
            noisy = _noisy_counts(request, measurement_targets)
            if noisy is not None:
                response = response.model_copy(update={"noisy_counts": noisy, "mode": "pedagogical_noise"})
        return response
    return simulate_qiskit(request)
