"""Canonical circuit request schema shared by simulator and export bridges."""

from __future__ import annotations

from math import pi
from typing import Literal

SimulationEngine = Literal["qiskit", "cirq"]
SimulationMode = Literal["ideal_simulator", "pedagogical_noise"]

from pydantic import BaseModel, ConfigDict, Field, model_validator

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
    engine: Literal["qiskit", "cirq"] = "qiskit"
    noise_strength: float | None = Field(default=None, ge=0, le=1, allow_inf_nan=False)

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
