import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from circuit_schema import CircuitRequest, Operation  # noqa: E402
from simulator import simulate  # noqa: E402


def _final_probs(body: dict) -> dict[str, float]:
    return {item["basis"]: item["probability"] for item in body["steps"][-1]["probabilities"]}


def test_cirq_matches_qiskit_bell():
    payload = CircuitRequest(
        qubits=2,
        operations=[Operation(gate="h", target=0), Operation(gate="cx", control=0, target=1)],
    )
    qiskit = simulate(payload.model_copy(update={"engine": "qiskit"}))
    cirq = simulate(payload.model_copy(update={"engine": "cirq"}))
    assert _final_probs(qiskit.model_dump()) == pytest.approx(_final_probs(cirq.model_dump()), abs=1e-5)


def test_cirq_matches_qiskit_h_superposition():
    payload = CircuitRequest(qubits=1, operations=[Operation(gate="h", target=0)])
    qiskit = simulate(payload.model_copy(update={"engine": "qiskit"}))
    cirq = simulate(payload.model_copy(update={"engine": "cirq"}))
    assert _final_probs(qiskit.model_dump())["0"] == pytest.approx(0.5, abs=1e-5)
    assert _final_probs(cirq.model_dump())["0"] == pytest.approx(0.5, abs=1e-5)
