"""Multi-shot Shor measurement statistics."""

import math

import pytest

from shor_educational import SHOR_KNOWN_FIXTURES, SHOR_NUMERIC_TOLERANCE, simulate_counting_for_path
from shor_multishot import (
    SHOR_DEFAULT_SHOTS,
    SHOR_MAX_SHOTS,
    SHOR_MIN_SHOTS,
    sample_shor_shot_sequence,
    summarize_histogram_metrics,
    validate_counting_probabilities,
    validate_shor_sample_seed,
    validate_shor_shot_count,
)


def test_same_seed_same_sequence():
    probs = [0.25, 0.25, 0.25, 0.25]
    a = sample_shor_shot_sequence(probs, 12345, 50)
    b = sample_shor_shot_sequence(probs, 12345, 50)
    assert isinstance(a, list) and isinstance(b, list)
    assert a == b


def test_different_seeds_can_differ():
    n, a_base = 15, 7
    sim = simulate_counting_for_path(n, a_base, "closed_direct")
    assert isinstance(sim, dict)
    probs = sim["probabilities"]
    s1 = sample_shor_shot_sequence(probs, 1, 32)
    s2 = sample_shor_shot_sequence(probs, 99991, 32)
    assert isinstance(s1, list) and isinstance(s2, list)
    assert s1 != s2


def test_every_sample_has_positive_probability():
    sim = simulate_counting_for_path(15, 7, "gate_e2e")
    assert isinstance(sim, dict)
    probs = sim["probabilities"]
    seq = sample_shor_shot_sequence(probs, 7, 100)
    assert isinstance(seq, list)
    for c in seq:
        assert probs[c] > 0


def test_zero_probability_never_sampled():
    probs = [0.5, 0.0, 0.5, 0.0]
    seq = sample_shor_shot_sequence(probs, 42, 200)
    assert isinstance(seq, list)
    assert all(c in (0, 2) for c in seq)


def test_empirical_converges_for_large_shot_count():
    sim = simulate_counting_for_path(15, 7, "closed_direct")
    assert isinstance(sim, dict)
    probs = sim["probabilities"]
    shots = 4000
    seq = sample_shor_shot_sequence(probs, 2024, shots)
    assert isinstance(seq, list)
    l1, max_abs = summarize_histogram_metrics(probs, seq, shots)
    # Hoeffding: P(|emp- p| > eps) <= 2 exp(-2 shots eps^2); eps=0.05 -> very small for 4000 shots
    assert max_abs < 0.06
    assert l1 < 0.15


def test_invalid_shot_count_and_seed():
    assert validate_shor_shot_count(0) is not None
    assert validate_shor_shot_count(SHOR_MAX_SHOTS + 1) is not None
    assert validate_shor_sample_seed(-1) is not None
    assert validate_counting_probabilities([0.5, 0.4]) is not None


def test_gate_path_error_no_fallback():
    err = simulate_counting_for_path(4, 2, "gate_e2e")
    assert isinstance(err, str)


def test_shot_bounds_constants():
    assert SHOR_MIN_SHOTS >= 1
    assert SHOR_DEFAULT_SHOTS <= SHOR_MAX_SHOTS


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_multishot_from_each_simulation_path(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    for path in ("closed_direct", "closed_gate", "gate_e2e"):
        sim = simulate_counting_for_path(n, a, path)
        assert isinstance(sim, dict)
        seq = sample_shor_shot_sequence(sim["probabilities"], 11, 64)
        assert isinstance(seq, list)
        assert len(seq) == 64
