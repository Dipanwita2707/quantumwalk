"""Bounded circuit simulation. Qubit 0 is the rightmost bit in basis labels."""

from __future__ import annotations

from math import pi
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from qiskit import ClassicalRegister, QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

Gate = Literal["h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "cx", "cz", "swap", "measure"]
TWO_QUBIT_GATES = {"cx", "cz", "swap"}
ROTATION_GATES = {"rx", "ry", "rz"}


class Operation(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    gate: Gate
    target: int = Field(ge=0, le=4)
    control: int | None = Field(default=None, ge=0, le=4)
    angle: float | None = Field(default=None, ge=-2 * pi, le=2 * pi, allow_inf_nan=False)


class CircuitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    qubits: int = Field(ge=1, le=5)
    operations: list[Operation] = Field(default_factory=list, max_length=64)
    shots: int = Field(default=1024, ge=1, le=4096)

    @model_validator(mode="after")
    def validate_circuit(self) -> "CircuitRequest":
        measured: set[int] = set()
        for op in self.operations:
            if op.target >= self.qubits or (op.control is not None and op.control >= self.qubits):
                raise ValueError("A gate refers to a qubit outside this circuit")
            if op.gate in TWO_QUBIT_GATES:
                if op.control is None or op.control == op.target:
                    raise ValueError("Two-qubit gates need different qubit indexes")
            elif op.control is not None:
                raise ValueError("Only two-qubit gates use a second qubit")
            if op.gate in ROTATION_GATES and op.angle is None:
                raise ValueError("Rotation gates require an angle in radians")
            if op.gate not in ROTATION_GATES and op.angle is not None:
                raise ValueError("Only rotation gates use an angle")
            if op.gate == "measure":
                if op.target in measured:
                    raise ValueError("A qubit can only be measured once")
                measured.add(op.target)
            elif measured:
                raise ValueError("Measurement must be at the end of the circuit")
        return self


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
        if op.gate == "h":
            circuit.h(op.target)
        elif op.gate == "x":
            circuit.x(op.target)
        elif op.gate == "y":
            circuit.y(op.target)
        elif op.gate == "z":
            circuit.z(op.target)
        elif op.gate == "s":
            circuit.s(op.target)
        elif op.gate == "t":
            circuit.t(op.target)
        elif op.gate == "rx":
            circuit.rx(op.angle, op.target)
        elif op.gate == "ry":
            circuit.ry(op.angle, op.target)
        elif op.gate == "rz":
            circuit.rz(op.angle, op.target)
        elif op.gate == "cx":
            circuit.cx(op.control, op.target)
        elif op.gate == "cz":
            circuit.cz(op.control, op.target)
        elif op.gate == "swap":
            circuit.swap(op.control, op.target)
        else:
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
