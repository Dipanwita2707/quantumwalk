import math

import pytest

from qft_gates import apply_qft_gates, gate_vs_direct_fidelity
from qft_simulator import (
    QFT_NUMERIC_TOLERANCE,
    apply_qft,
    basis_state,
    fidelity,
    hadamard_1qubit,
    states_equal_up_to_global_phase,
    validate_qubit_count,
    validate_state,
)


def test_validate_qubit_bounds():
    assert validate_qubit_count(0) is not None
    assert validate_qubit_count(6) is not None
    assert validate_qubit_count(3) is None


def test_basis_state_invalid_index():
    with pytest.raises(ValueError):
        basis_state(2, 4)


def test_non_finite_rejected():
    amps = basis_state(1, 0)
    amps[0] = complex(float("inf"), 0)
    assert validate_state(1, amps) is not None


def test_zero_norm_rejected():
    assert validate_state(2, [0j, 0j, 0j, 0j]) is not None


def test_malformed_length_rejected():
    assert validate_state(2, [1 + 0j, 0j]) is not None


def test_one_qubit_qft_matches_hadamard():
    for idx in (0, 1):
        qft_out = apply_qft(basis_state(1, idx), inverse=False)
        h_out = hadamard_1qubit(idx)
        assert states_equal_up_to_global_phase(qft_out, h_out)


def test_gate_sequence_matches_direct_for_one_qubit():
    for idx in (0, 1):
        amps = basis_state(1, idx)
        gated = apply_qft_gates(amps, inverse=False)
        assert states_equal_up_to_global_phase(gated, apply_qft(amps, inverse=False))
        assert gate_vs_direct_fidelity(amps) > 1 - 1e-10


def test_norm_preserved():
    for n in (1, 2, 3, 4):
        for idx in range(2**n):
            amps = basis_state(n, idx)
            out = apply_qft(amps, inverse=False)
            total = sum(abs(z) ** 2 for z in out)
            assert abs(total - 1.0) < QFT_NUMERIC_TOLERANCE


def test_basis_two_qubit_known_phase():
    out = apply_qft(basis_state(2, 1), inverse=False)
    probs = [abs(z) ** 2 for z in out]
    assert all(abs(p - 0.25) < 1e-6 for p in probs)


def test_forward_then_inverse_returns_original_basis():
    for n in (1, 2, 3):
        for idx in range(2**n):
            original = basis_state(n, idx)
            transformed = apply_qft(original, inverse=False)
            restored = apply_qft(transformed, inverse=True)
            assert states_equal_up_to_global_phase(original, restored)


def test_forward_then_inverse_arbitrary_normalized():
    samples = [
        basis_state(2, 0),
        [0.6 + 0j, 0.8 + 0j, 0j, 0j],
        [0.5 + 0j, 0.5 + 0j, 0.5 + 0j, 0.5 + 0j],
        [1 / math.sqrt(3) + 0j, 1 / math.sqrt(3) + 0j, 1 / math.sqrt(3) + 0j, 0j],
    ]
    for amps in samples:
        n = int(math.log2(len(amps)))
        assert validate_state(n, amps) is None
        transformed = apply_qft(amps, inverse=False)
        restored = apply_qft(transformed, inverse=True)
        assert states_equal_up_to_global_phase(amps, restored)


def test_deterministic():
    a = apply_qft(basis_state(3, 5), inverse=False)
    b = apply_qft(basis_state(3, 5), inverse=False)
    assert all(abs(x - y) < 1e-12 for x, y in zip(a, b))


def test_fidelity_normalized_input():
    amps = basis_state(2, 0)
    assert abs(fidelity(amps, amps) - 1.0) < 1e-12
