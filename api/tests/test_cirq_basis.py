import pytest

from circuit_schema import CircuitRequest, Operation
from simulator import simulate


@pytest.mark.parametrize("target", range(5))
def test_cirq_uses_q0_as_the_rightmost_bit(target):
    result = simulate(CircuitRequest(qubits=5, engine="cirq", operations=[Operation(gate="x", target=target)]))
    final = result.steps[-1]
    assert next(row.basis for row in final.probabilities if row.probability > .99) == format(1 << target, "05b")
    assert final.bloch[target].z == pytest.approx(-1)


def test_asymmetric_five_qubit_states_match_between_engines_at_every_step():
    operations = [Operation(gate="h", target=1), Operation(gate="h", target=2), Operation(gate="x", target=3), Operation(gate="x", target=4), Operation(gate="ry", target=0, angle=.31)]
    results = [simulate(CircuitRequest(qubits=5, engine=engine, operations=operations)) for engine in ("qiskit", "cirq")]
    for qiskit, cirq in zip(results[0].steps, results[1].steps):
        assert [row.probability for row in cirq.probabilities] == pytest.approx([row.probability for row in qiskit.probabilities], abs=1e-8)
        for left, right in zip(qiskit.bloch, cirq.bloch):
            assert (right.x, right.y, right.z) == pytest.approx((left.x, left.y, left.z), abs=1e-8)
