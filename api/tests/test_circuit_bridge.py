import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from circuit_bridge import export_cirq_python, export_qiskit_python  # noqa: E402
from circuit_schema import CircuitRequest, Operation  # noqa: E402


def test_cirq_export_bell_pair():
    request = CircuitRequest(
        qubits=2,
        operations=[
            Operation(gate="h", target=0),
            Operation(gate="cx", control=0, target=1),
        ],
    )
    code = export_cirq_python(request)
    assert "import cirq" in code
    assert "cirq.H(qubits[0])" in code
    assert "cirq.CNOT(qubits[0], qubits[1])" in code
    assert "exec(" not in code


def test_qiskit_export_uses_bridge():
    request = CircuitRequest(qubits=1, operations=[Operation(gate="h", target=0)])
    assert "circuit.h(0)" in export_qiskit_python(request)
