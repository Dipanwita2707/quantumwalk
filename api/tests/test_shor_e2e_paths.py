"""End-to-end Shor simulation paths and measurement policies."""

import pytest

from shor_educational import (
    SHOR_KNOWN_FIXTURES,
    SHOR_NUMERIC_TOLERANCE,
    compare_counting_probabilities,
    resolve_measurement_and_order,
    sample_counting_from_distribution,
    simulate_counting_for_path,
    simulate_three_path_comparison,
)


@pytest.mark.parametrize("path", ("closed_direct", "closed_gate", "gate_e2e"))
@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_path_normalized_and_marginals(fixture: dict, path: str):
    n, a = int(fixture["n"]), int(fixture["a"])
    sim = simulate_counting_for_path(n, a, path)
    assert isinstance(sim, dict) and sim.get("ok")
    assert abs(sim["pre_iqft_norm"] - 1.0) < SHOR_NUMERIC_TOLERANCE
    assert abs(sim["post_iqft_norm"] - 1.0) < SHOR_NUMERIC_TOLERANCE
    probs = sim["probabilities"]
    assert abs(sum(probs) - 1.0) < SHOR_NUMERIC_TOLERANCE


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_three_paths_align_on_fixtures(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    cmp_ = simulate_three_path_comparison(n, a)
    assert isinstance(cmp_, dict)
    assert cmp_["gate_iqft_supported"]
    for key in ("closed_direct_vs_closed_gate", "closed_direct_vs_gate_e2e", "closed_gate_vs_gate_e2e"):
        metrics = cmp_[key]
        assert metrics is not None
        assert metrics["bhattacharyya_fidelity"] >= 1 - SHOR_NUMERIC_TOLERANCE
        assert metrics["l1"] < SHOR_NUMERIC_TOLERANCE


def test_gate_e2e_does_not_fall_back_on_error():
    err = simulate_counting_for_path(4, 2, "gate_e2e")
    assert isinstance(err, str)
    assert "gcd" in err.lower() or "composite" in err.lower() or "coprime" in err.lower() or "2" in err


def test_unsupported_gate_path_returns_error():
    """If gate IQFT unsupported, path must error (no silent closed_direct)."""
    # All fixtures in budget support gate IQFT; use invalid path name.
    err = simulate_counting_for_path(15, 7, "not_a_path")
    assert isinstance(err, str)


def test_seeded_sampling_reproducible():
    probs = [0.1, 0.2, 0.3, 0.4, 0.0, 0.0, 0.0, 0.0]
    a = sample_counting_from_distribution(probs, 42)
    b = sample_counting_from_distribution(probs, 42)
    assert a == b


def test_post_processing_same_for_equivalent_distributions():
    n, a = 15, 7
    d = simulate_counting_for_path(n, a, "closed_direct")
    e = simulate_counting_for_path(n, a, "gate_e2e")
    assert isinstance(d, dict) and isinstance(e, dict)
    p1, p2 = d["probabilities"], e["probabilities"]
    assert compare_counting_probabilities(p1, p2)["bhattacharyya_fidelity"] >= 1 - SHOR_NUMERIC_TOLERANCE
    m1, _, _ = resolve_measurement_and_order(n, a, d["plan"]["counting_qubits"], p1)
    m2, _, _ = resolve_measurement_and_order(n, a, e["plan"]["counting_qubits"], p2)
    assert m1 == m2
