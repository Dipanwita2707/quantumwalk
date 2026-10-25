"""Scientific validation for educational Shor QPE + IQFT simulation."""

import math

import pytest

from qft_simulator import apply_qft, states_equal_up_to_global_phase
from shor_educational import (
    SHOR_KNOWN_FIXTURES,
    SHOR_NUMERIC_TOLERANCE,
    build_post_iqft_joint_amplitudes,
    build_pre_iqft_joint_amplitudes,
    classical_order_reference,
    expected_peak_outcomes,
    expected_peak_probability,
    expand_period_candidates,
    order_candidates_from_phase,
    phase_order_scan,
    plan_quantum_simulation,
    run_shor_educational_workflow,
    try_extract_factors,
    validate_shor_input,
    verify_orbit_covers_modular_powers,
    _joint_total_probability,
)


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_fixture_pre_iqft_state_normalized(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    built = build_pre_iqft_joint_amplitudes(n, a)
    assert not isinstance(built, str)
    _plan, amps, _cycle = built
    total = _joint_total_probability(amps)
    assert abs(total - 1.0) < SHOR_NUMERIC_TOLERANCE


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_fixture_post_iqft_state_normalized(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    built = build_post_iqft_joint_amplitudes(n, a)
    assert not isinstance(built, str)
    _plan, amps, probs, _cycle = built
    assert abs(_joint_total_probability(amps) - 1.0) < SHOR_NUMERIC_TOLERANCE
    assert abs(sum(probs) - 1.0) < SHOR_NUMERIC_TOLERANCE


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_fixture_orbit_covers_exponent_superposition(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    plan = plan_quantum_simulation(n, a)
    assert plan is not None
    assert verify_orbit_covers_modular_powers(n, a, plan["counting_qubits"])


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_fixture_analytical_peaks_when_period_divides_2t(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    period = int(fixture["period"])
    built = build_post_iqft_joint_amplitudes(n, a)
    assert not isinstance(built, str)
    plan, _amps, probs, _cycle = built
    t = plan["counting_qubits"]
    peaks = expected_peak_outcomes(period, t)
    expected_p = expected_peak_probability(period, t)
    if peaks is None or expected_p is None:
        pytest.skip("Analytical peak formula requires r | 2^t (truncated demo).")
    for c in peaks:
        assert abs(probs[c] - expected_p) < 1e-5
    for c, p in enumerate(probs):
        if c not in peaks:
            assert p < 1e-5


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_fixture_period_recoverable_and_factors_nontrivial(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    expected_period = int(fixture["period"])
    expected_factors = set(fixture["factors"])  # type: ignore[arg-type]
    out = run_shor_educational_workflow(n, a)
    assert out["ok"] and out["quantum"]
    assert out["order_from_measurement"] == expected_period
    fac = out["factors"]
    assert fac and fac["ok"]
    assert fac["p"] > 1 and fac["q"] > 1 and fac["p"] * fac["q"] == n
    assert {fac["p"], fac["q"]} == expected_factors


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_fixture_deterministic_repeat(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    first = run_shor_educational_workflow(n, a)
    second = run_shor_educational_workflow(n, a)
    assert first["measured_counting"] == second["measured_counting"]
    assert first["probabilities"] == second["probabilities"]


def test_iqft_slice_matches_direct_qft_convention():
    """Per-work slice: normalize → IQFT matches qft_simulator inverse DFT."""
    t = 3
    t_dim = 2**t
    scale = 1 / math.sqrt(t_dim)
    uniform = [scale + 0j] * t_dim
    from_direct = apply_qft(uniform, inverse=True)
    manual = apply_qft([z / math.sqrt(sum(abs(x) ** 2 for x in uniform)) for z in uniform], inverse=True)
    assert states_equal_up_to_global_phase(from_direct, manual)
    assert abs(abs(from_direct[0]) ** 2 - 1.0) < SHOR_NUMERIC_TOLERANCE


def test_continued_fraction_exact_phase_recovers_period():
    orders, _, _ = order_candidates_from_phase(2, 3, 7, 15)
    assert 4 in expand_period_candidates(orders, 7, 15) or 4 in orders


def test_phase_scan_finds_valid_period_among_harmonics():
    # c=2, t=3 → phase 1/4; multiple r may match — expanded list must include true order 4
    orders, _, _ = order_candidates_from_phase(2, 3, 7, 15)
    assert 4 in orders


def test_period_candidates_must_satisfy_modular_order():
    orders, _, _ = order_candidates_from_phase(0, 3, 7, 15)
    from shor_educational import mod_pow

    for r in orders:
        assert mod_pow(7, r, 15) == 1


def test_failed_factorization_reports_reason_not_fake_factors():
    out = run_shor_educational_workflow(9, 2)
    assert out["ok"]
    fac = out.get("factors")
    assert fac is None or not fac.get("ok", False)


def test_classical_reference_labeled_separate_from_quantum_measurement():
    out = run_shor_educational_workflow(15, 7)
    assert out["quantum"]
    assert out["classical_reference_order"] == 4
    assert out["measured_counting"] is not None
    assert out["order_from_measurement"] == 4


def test_non_coprime_rejected_before_quantum_simulation():
    assert validate_shor_input(15, 5) is not None
    out = run_shor_educational_workflow(15, 5)
    assert not out["ok"]
    assert "gcd" in out["message"].lower()


def test_invalid_composite_rejected():
    assert validate_shor_input(13, 2) is not None


def test_odd_order_rejected_by_extractor():
    ok, msg, p, q = try_extract_factors(21, 3, 2)
    assert not ok and p is None


def test_nontrivial_factor_product():
    ok, _, p, q = try_extract_factors(15, 4, 7)
    assert ok and p is not None and q is not None
    assert p * q == 15 and p > 1 and q > 1
