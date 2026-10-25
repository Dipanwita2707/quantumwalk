"""Bounded circuit simulation. Qubit 0 is the rightmost bit in basis labels."""

from __future__ import annotations

from typing import Literal

from circuit_bridge import apply_operation
from circuit_schema import CircuitRequest, Operation  # noqa: F401 — re-export for API imports
from pydantic import BaseModel
from qiskit import ClassicalRegister, QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator


class Amplitude(BaseModel):
    basis: str
    real: float
    imag: float


class Probability(BaseModel):
    basis: str
    probability: float


class BlochVector(BaseModel):
    qubit: int
    x: float
    y: float
    z: float
    purity: float


class StepSnapshot(BaseModel):
    index: int
    amplitudes: list[Amplitude]
    probabilities: list[Probability]
    bloch: list[BlochVector]


class SimulationResponse(BaseModel):
    qubits: int
    shots: int
    steps: list[StepSnapshot]
    counts: dict[str, int] | None
    basis_order: str
    mode: Literal["ideal_simulator"]


def _snapshot(state: Statevector, qubits: int, index: int) -> StepSnapshot:
    amplitudes = []
    probabilities = []
    for basis, value in enumerate(state.data):
        label = format(basis, f"0{qubits}b")
        real = float(value.real)
        imag = float(value.imag)
        probability = float(abs(value) ** 2)
        amplitudes.append({"basis": label, "real": real, "imag": imag})
        probabilities.append({"basis": label, "probability": probability})

    bloch = []
    for qubit in range(qubits):
        coherence = 0j
        z = 0.0
        for basis, amplitude in enumerate(state.data):
            if basis & (1 << qubit):
                z -= float(abs(amplitude) ** 2)
            else:
                z += float(abs(amplitude) ** 2)
                coherence += amplitude.conjugate() * state.data[basis | (1 << qubit)]
        x = 2 * float(coherence.real)
        y = 2 * float(coherence.imag)
        purity = (1 + x * x + y * y + z * z) / 2
        bloch.append({"qubit": qubit, "x": x, "y": y, "z": z, "purity": purity})

    return StepSnapshot(index=index, amplitudes=amplitudes, probabilities=probabilities, bloch=bloch)


def simulate(request: CircuitRequest) -> SimulationResponse:
    circuit = QuantumCircuit(request.qubits)
    snapshots = [_snapshot(Statevector.from_int(0, 2**request.qubits), request.qubits, 0)]
    measurement_targets: list[int] = []

    for index, op in enumerate(request.operations, start=1):
        if apply_operation(circuit, op):
            measurement_targets.append(op.target)
        state = Statevector.from_instruction(circuit)
        snapshots.append(_snapshot(state, request.qubits, index))

    counts: dict[str, int] | None = None
    if measurement_targets:
        sampled = circuit.copy()
        sampled.add_register(ClassicalRegister(request.qubits))
        for qubit in measurement_targets:
            sampled.measure(qubit, qubit)
        result = AerSimulator(method="statevector", max_parallel_threads=1, max_memory_mb=256).run(sampled, shots=request.shots).result()
        counts = dict(sorted(result.get_counts().items()))

    return SimulationResponse(
        qubits=request.qubits,
        shots=request.shots,
        steps=snapshots,
        counts=counts,
        basis_order="Qubit 0 is the rightmost bit in each basis label",
        mode="ideal_simulator",
    )
