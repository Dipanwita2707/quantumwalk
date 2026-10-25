"""Simulation response models and snapshot helpers."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel
from qiskit.quantum_info import Statevector

SimulationMode = Literal["ideal_simulator", "pedagogical_noise"]


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
    mode: SimulationMode = "ideal_simulator"
    engine: Literal["qiskit", "cirq"] = "qiskit"
    noisy_counts: dict[str, int] | None = None


def snapshot_from_statevector(state: Statevector, qubits: int, index: int) -> StepSnapshot:
    amplitudes = []
    probabilities = []
    for basis, value in enumerate(state.data):
        label = format(basis, f"0{qubits}b")
        real = float(value.real)
        imag = float(value.imag)
        probability = float(abs(value) ** 2)
        amplitudes.append(Amplitude(basis=label, real=real, imag=imag))
        probabilities.append(Probability(basis=label, probability=probability))

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
        bloch.append(BlochVector(qubit=qubit, x=x, y=y, z=z, purity=purity))

    return StepSnapshot(index=index, amplitudes=amplitudes, probabilities=probabilities, bloch=bloch)
