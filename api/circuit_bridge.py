"""Map canonical CircuitRequest to Qiskit circuits and Cirq export strings."""

from __future__ import annotations

from qiskit import QuantumCircuit

from circuit_schema import ROTATION_GATES, TWO_QUBIT_GATES, CircuitRequest, Operation


def apply_operation(circuit: QuantumCircuit, op: Operation) -> bool:
    """Apply one gate to a Qiskit circuit. Returns True if the op was a measurement."""
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
    elif op.gate == "measure":
        return True
    return False


def to_qiskit(request: CircuitRequest) -> QuantumCircuit:
    circuit = QuantumCircuit(request.qubits)
    for op in request.operations:
        if not apply_operation(circuit, op):
            continue
    return circuit


def export_qiskit_python(request: CircuitRequest) -> str:
    lines = ["from qiskit import QuantumCircuit", f"circuit = QuantumCircuit({request.qubits}, {request.qubits})"]
    for operation in request.operations:
        if operation.gate in TWO_QUBIT_GATES:
            lines.append(f"circuit.{operation.gate}({operation.control}, {operation.target})")
        elif operation.gate in ROTATION_GATES:
            lines.append(f"circuit.{operation.gate}({operation.angle!r}, {operation.target})")
        elif operation.gate == "measure":
            lines.append(f"circuit.measure({operation.target}, {operation.target})")
        else:
            lines.append(f"circuit.{operation.gate}({operation.target})")
    return "\n".join(lines) + "\n"


def _cirq_gate_line(op: Operation) -> str:
    q = f"qubits[{op.target}]"
    if op.gate == "h":
        return f"cirq.H({q})"
    if op.gate == "x":
        return f"cirq.X({q})"
    if op.gate == "y":
        return f"cirq.Y({q})"
    if op.gate == "z":
        return f"cirq.Z({q})"
    if op.gate == "s":
        return f"cirq.S({q})"
    if op.gate == "t":
        return f"cirq.T({q})"
    if op.gate == "rx":
        return f"cirq.rx({op.angle!r})({q})"
    if op.gate == "ry":
        return f"cirq.ry({op.angle!r})({q})"
    if op.gate == "rz":
        return f"cirq.rz({op.angle!r})({q})"
    if op.gate == "cx":
        return f"cirq.CNOT(qubits[{op.control}], {q})"
    if op.gate == "cz":
        return f"cirq.CZ(qubits[{op.control}], {q})"
    if op.gate == "swap":
        return f"cirq.SWAP(qubits[{op.control}], {q})"
    if op.gate == "measure":
        return f"cirq.measure({q}, key='q{op.target}')"
    raise ValueError(f"Unsupported gate for Cirq export: {op.gate}")


def export_cirq_python(request: CircuitRequest) -> str:
    n = request.qubits
    lines = [
        "import cirq",
        "",
        f"qubits = cirq.LineQubit.range({n})",
        "circuit = cirq.Circuit(",
    ]
    gate_lines = [_cirq_gate_line(op) for op in request.operations]
    if gate_lines:
        for index, gate in enumerate(gate_lines):
            suffix = "," if index < len(gate_lines) - 1 else ""
            lines.append(f"    {gate}{suffix}")
    lines.append(")")
    lines.append("")
    lines.append("# Qubit index i maps to LineQubit(i). Basis labels in QuantumWalk use qubit 0 as the rightmost bit.")
    return "\n".join(lines) + "\n"
