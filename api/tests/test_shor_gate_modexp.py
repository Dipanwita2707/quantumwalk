"""Gate-level modular exponentiation vs closed-form Shor pre-IQFT state."""

import math

import pytest

from shor_educational import (
    SHOR_KNOWN_FIXTURES,
    SHOR_NUMERIC_TOLERANCE,
    build_pre_iqft_joint_amplitudes,
    plan_quantum_simulation,
    _index_count_work,
    _joint_total_probability,
)
from shor_modexp import (
    apply_controlled_orbit_multiply,
    apply_hadamard_counting_qubit,
    apply_orbit_permutation_work,
    build_pre_iqft_via_gates,
    orbit_index_permutation,
    permutation_is_reversible,
    simulate_modexp_comparison,
    state_overlap_fidelity,
    validate_modexp_plan,
)


def test_orbit_permutation_is_reversible():
    for r in (2, 3, 4, 6):
        for step in (1, 2, 3, 5):
            perm = orbit_index_permutation(step, r)
            assert permutation_is_reversible(perm)
            inv = orbit_index_permutation(-step, r)
            composed = [perm[inv[i]] for i in range(r)]
            assert composed == list(range(r))


def test_hadamard_uniform_on_single_counting_qubit():
    t, m = 1, 2
    dim = m * 2**t
    amps = [0j] * dim
    amps[_index_count_work(0, 0, t)] = 1 + 0j
    out = apply_hadamard_counting_qubit(amps, t, m, 0)
    assert abs(out[_index_count_work(0, 0, t)] - 1 / math.sqrt(2)) < 1e-10
    assert abs(out[_index_count_work(1, 0, t)] - 1 / math.sqrt(2)) < 1e-10


def test_controlled_multiply_on_basis_state():
    n, a, t, r = 15, 7, 3, 4
    plan = plan_quantum_simulation(n, a)
    assert plan is not None
    m = plan["work_dimension"]
    amps = [0j] * (m * 2**t)
    amps[_index_count_work(5, 1, t)] = 1 + 0j
    out = apply_controlled_orbit_multiply(amps, t, m, 0, 1, r)
    assert abs(out[_index_count_work(5, 2, t)] - 1) < 1e-10
    amps2 = [0j] * (m * 2**t)
    amps2[_index_count_work(6, 1, t)] = 1 + 0j
    out_off = apply_controlled_orbit_multiply(amps2, t, m, 0, 1, r)
    assert abs(out_off[_index_count_work(6, 1, t)] - 1) < 1e-10


def test_apply_orbit_permutation_reversible_on_slice():
    r = 4
    perm = orbit_index_permutation(2, r)
    inv_perm = orbit_index_permutation(-2, r)
    t, m = 2, 4
    amps = [0j] * (m * 2**t)
    amps[_index_count_work(0, 1, t)] = 0.6 + 0.8j
    fwd = apply_orbit_permutation_work(amps, t, m, perm)
    back = apply_orbit_permutation_work(fwd, t, m, inv_perm)
    for i in range(len(amps)):
        assert abs(back[i] - amps[i]) < 1e-10


@pytest.mark.parametrize("fixture", SHOR_KNOWN_FIXTURES)
def test_gate_pre_iqft_matches_closed_form(fixture: dict):
    n, a = int(fixture["n"]), int(fixture["a"])
    cmp_ = simulate_modexp_comparison(n, a)
    assert isinstance(cmp_, dict)
    assert cmp_["pre_iqft_states_aligned"]
    assert cmp_["distributions_aligned"]
    assert cmp_["pre_iqft_state_fidelity"] >= 1 - SHOR_NUMERIC_TOLERANCE
    metrics = cmp_["metrics"]
    assert metrics["l1"] < SHOR_NUMERIC_TOLERANCE


def test_build_pre_iqft_via_gates_normalized():
    built = build_pre_iqft_via_gates(21, 2)
    assert not isinstance(built, str)
    _, amps, _ = built
    assert abs(_joint_total_probability(amps) - 1.0) < SHOR_NUMERIC_TOLERANCE


def test_invalid_modexp_inputs():
    assert isinstance(validate_modexp_plan(4, 2), str)
    assert isinstance(build_pre_iqft_via_gates(4, 2), str)


def test_modexp_deterministic():
    a, n = 7, 15
    one = simulate_modexp_comparison(n, a)
    two = simulate_modexp_comparison(n, a)
    assert one == two


def test_closed_and_gate_pre_states_same_overlap():
    n, a = 8, 3
    closed = build_pre_iqft_joint_amplitudes(n, a)
    assert not isinstance(closed, str)
    gated = build_pre_iqft_via_gates(n, a)
    assert not isinstance(gated, str)
    _, c_amps, _ = closed
    _, g_amps, _ = gated
    assert state_overlap_fidelity(c_amps, g_amps) >= 1 - SHOR_NUMERIC_TOLERANCE
