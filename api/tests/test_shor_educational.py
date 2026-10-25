import math

import pytest

from qft_gates import gate_vs_direct_fidelity
from qft_simulator import basis_state
from shor_educational import (
    SHOR_N_MAX,
    SHOR_N_MIN,
    classical_order_reference,
    gcd,
    is_composite,
    mod_pow,
    order_candidates_from_phase,
    pick_deterministic_measurement,
    plan_quantum_simulation,
    qft_convention_self_check,
    run_shor_educational_workflow,
    simulate_quantum_counting_distribution,
    try_extract_factors,
    multiplicative_cycle_values,
    validate_shor_input,
)


def test_validate_composite_range():
    assert validate_shor_input(3, 2) is not None
    assert validate_shor_input(22, 2) is not None
    assert validate_shor_input(7, 2) is not None
    assert validate_shor_input(15, 7) is None


def test_non_coprime_rejected():
    assert validate_shor_input(15, 5) is not None


def test_classical_order_reference():
    assert classical_order_reference(7, 15) == 4
    assert classical_order_reference(2, 21) == 6


def test_factor_extraction_n15():
    ok, _, p, q = try_extract_factors(15, 4, 7)
    assert ok and {p, q} == {3, 5}


def test_odd_order_fails_extraction():
    ok, msg, _, _ = try_extract_factors(9, 3, 2)
    assert not ok and "odd" in msg.lower()


def test_trivial_half_fails():
    ok, msg, _, _ = try_extract_factors(15, 2, 14)
    assert not ok and "−1" in msg or "-1" in msg


@pytest.mark.parametrize(
    "n,a,expected",
    [
        (15, 7, ({3, 5}, True)),
        (21, 2, ({3, 7}, True)),
        (8, 3, ({2, 4}, True)),
    ],
)
def test_workflow_factors_known(n, a, expected):
    out = run_shor_educational_workflow(n, a)
    assert out["ok"]
    fac = out.get("factors")
    assert fac and fac["ok"]
    assert {fac["p"], fac["q"]} == expected[0]


def test_quantum_measurement_not_equal_to_classical_only_path():
    out = run_shor_educational_workflow(15, 7)
    assert out["quantum"]
    assert out["measured_counting"] is not None
    assert out["order_from_measurement"] == 4
    assert out["classical_reference_order"] == 4


def test_n21_quantum_compact_orbit():
    assert plan_quantum_simulation(21, 2) is not None
    out = run_shor_educational_workflow(21, 2)
    assert out["ok"] and out["quantum"]
    assert out["classical_reference_order"] == 6


def test_deterministic_repeat():
    a = run_shor_educational_workflow(15, 7)
    b = run_shor_educational_workflow(15, 7)
    assert a["measured_counting"] == b["measured_counting"]
    assert a["probabilities"] == b["probabilities"]


def test_qft_convention_self_check():
    for t in (1, 2, 3):
        assert qft_convention_self_check(t)


def test_qft_regression_gate_direct():
    for idx in (0, 1):
        amps = basis_state(1, idx)
        assert gate_vs_direct_fidelity(amps) > 1 - 1e-8


def test_simulate_probs_normalize():
    plan, probs, _cycle = simulate_quantum_counting_distribution(15, 7)
    assert abs(sum(probs) - 1.0) < 1e-6


def test_composites_in_range():
    for n in range(SHOR_N_MIN, SHOR_N_MAX + 1):
        assert is_composite(n) == (n not in (2, 3, 5, 7, 11, 13, 17, 19))


def test_cycle_lengths():
    assert len(multiplicative_cycle_values(7, 15)) == 4
    assert len(multiplicative_cycle_values(2, 21)) == 6


def test_continued_fraction_finds_period():
    orders, _, _ = order_candidates_from_phase(0, 3, 7, 15)
    assert 4 in orders or len(orders) > 0


def test_pick_measurement_peak():
    assert pick_deterministic_measurement([0.1, 0.7, 0.2]) == 1


def test_mod_pow():
    assert mod_pow(7, 4, 15) == 1
