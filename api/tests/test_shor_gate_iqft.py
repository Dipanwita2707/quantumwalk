"""Gate-level vs direct IQFT on Shor counting register."""

import math

import pytest

from qft_gates import apply_qft_gates, gate_vs_direct_fidelity
from qft_simulator import QFT_NUMERIC_TOLERANCE, apply_qft, basis_state, fidelity
from shor_educational import (
    SHOR_KNOWN_FIXTURES,
    SHOR_NUMERIC_TOLERANCE,
    build_post_iqft_joint_amplitudes,
    build_pre_iqft_joint_amplitudes,
    compare_counting_probabilities,
    gate_iqft_supported,
    simulate_iqft_comparison,
    _joint_total_probability,
    _marginal_counting_probabilities,
    _apply_iqft_on_joint,
)


@pytest.mark.parametrize("t", (1, 2, 3))
def test_counting_slice_gate_matches_direct_every_basis(t: int):
    dim = 2**t
    for idx in range(dim):
        amps = basis_state(t, idx)
        direct = apply_qft(amps, inverse=True)
        gated = apply_qft_gates(amps, inverse=True)
        assert gate_vs_direct_fidelity(direct, gated) >= 1 - QFT_NUMERIC_TOLERANCE


@pytest.mark.parametrize("t", (1, 2, 3))
def test_counting_slice_gate_matches_direct_uniform(t: int):
    dim = 2**t
    scale = 1 / math.sqrt(dim)
    amps = [scale + 0j] * dim
    direct = apply_qft(amps, inverse=True)
    gated = apply_qft_gates(amps, inverse=True)
    assert gate_vs_direct_fidelity(direct, gated) >= 1 - QFT_NUMERIC_TOLERANCE


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_shor_joint_gate_and_direct_probabilities_align(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    cmp_ = simulate_iqft_comparison(n, a)
    assert isinstance(cmp_, dict)
    assert cmp_["gate_iqft_supported"]
    assert abs(cmp_["pre_iqft_norm"] - 1.0) < SHOR_NUMERIC_TOLERANCE
    assert abs(cmp_["post_iqft_norm_direct"] - 1.0) < SHOR_NUMERIC_TOLERANCE
    assert cmp_["aligned"]
    metrics = cmp_["metrics"]
    assert metrics is not None
    assert metrics["l1"] < SHOR_NUMERIC_TOLERANCE
    assert metrics["bhattacharyya_fidelity"] >= 1 - SHOR_NUMERIC_TOLERANCE


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_pre_and_post_iqft_norms_preserved_per_mode(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    built = build_pre_iqft_joint_amplitudes(n, a)
    assert not isinstance(built, str)
    plan, pre, _ = built
    t, m = plan["counting_qubits"], plan["work_dimension"]
    assert abs(_joint_total_probability(pre) - 1.0) < SHOR_NUMERIC_TOLERANCE
    for mode in ("direct", "gate"):
        post = _apply_iqft_on_joint(pre[:], t, m, mode)
        assert abs(_joint_total_probability(post) - 1.0) < SHOR_NUMERIC_TOLERANCE
        probs = _marginal_counting_probabilities(post, t, m)
        assert abs(sum(probs) - 1.0) < SHOR_NUMERIC_TOLERANCE


def test_gate_iqft_supported_within_qft_bounds():
    assert gate_iqft_supported(1)
    assert gate_iqft_supported(5)
    assert not gate_iqft_supported(0)
    assert not gate_iqft_supported(6)


def test_compare_metric_sensitivity():
    p = [0.5, 0.5]
    q = [0.5, 0.5]
    m = compare_counting_probabilities(p, q)
    assert m["bhattacharyya_fidelity"] == pytest.approx(1.0)
    assert m["l1"] == pytest.approx(0.0)


def test_direct_and_gate_postprocessing_inputs_identical_when_aligned():
    n, a = 15, 7
    cmp_ = simulate_iqft_comparison(n, a)
    assert isinstance(cmp_, dict)
    direct = cmp_["direct_probabilities"]
    gate = cmp_["gate_probabilities"]
    assert gate is not None
    assert all(abs(x - y) < SHOR_NUMERIC_TOLERANCE for x, y in zip(direct, gate))
