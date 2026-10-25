import math
import random

import pytest

from qft_gates import (
    apply_qft_gates,
    build_forward_qft_gate_steps,
    gate_vs_direct_fidelity,
)
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

FidelityFloor = 1 - QFT_NUMERIC_TOLERANCE


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


@pytest.mark.parametrize("n_qubits", [1, 2, 3])
def test_gate_sequence_matches_direct_every_basis_forward(n_qubits: int):
    dim = 2**n_qubits
    for idx in range(dim):
        amps = basis_state(n_qubits, idx)
        gated = apply_qft_gates(amps, inverse=False)
        direct = apply_qft(amps, inverse=False)
        assert states_equal_up_to_global_phase(gated, direct)
        assert gate_vs_direct_fidelity(amps, inverse=False) >= FidelityFloor


@pytest.mark.parametrize("n_qubits", [1, 2, 3])
def test_gate_sequence_matches_direct_every_basis_inverse(n_qubits: int):
    dim = 2**n_qubits
    for idx in range(dim):
        amps = basis_state(n_qubits, idx)
        gated = apply_qft_gates(amps, inverse=True)
        direct = apply_qft(amps, inverse=True)
        assert states_equal_up_to_global_phase(gated, direct)
        assert gate_vs_direct_fidelity(amps, inverse=True) >= FidelityFloor


@pytest.mark.parametrize("n_qubits", [1, 2, 3, 4, 5])
def test_gate_sequence_matches_direct_spot_basis_forward(n_qubits: int):
    for idx in (0, 1, 2**n_qubits - 1):
        amps = basis_state(n_qubits, idx)
        assert states_equal_up_to_global_phase(apply_qft_gates(amps), apply_qft(amps))


def _deterministic_arbitrary_states():
    samples: list[tuple[int, list[complex]]] = []
    for n in (1, 2, 3):
        dim = 2**n
        rng = random.Random(100 + n)
        for _ in range(4):
            vec = [complex(rng.gauss(0, 1), rng.gauss(0, 1)) for _ in range(dim)]
            norm = math.sqrt(sum(abs(z) ** 2 for z in vec))
            samples.append((n, [z / norm for z in vec]))
    samples.extend(
        [
            (2, [0.6 + 0j, 0.8 + 0j, 0j, 0j]),
            (2, [0.5 + 0j, 0.5 + 0j, 0.5 + 0j, 0.5 + 0j]),
            (3, [1 / math.sqrt(3) + 0j, 1 / math.sqrt(3) + 0j, 1 / math.sqrt(3) + 0j, 0j, 0j, 0j, 0j, 0j]),
        ]
    )
    return samples


@pytest.mark.parametrize("n_qubits, amps", _deterministic_arbitrary_states())
def test_gate_sequence_matches_direct_arbitrary(n_qubits: int, amps: list[complex]):
    assert validate_state(n_qubits, amps) is None
    for inverse in (False, True):
        gated = apply_qft_gates(amps, inverse=inverse)
        direct = apply_qft(amps, inverse=inverse)
        assert states_equal_up_to_global_phase(gated, direct)
        assert gate_vs_direct_fidelity(amps, inverse=inverse) >= FidelityFloor


@pytest.mark.parametrize("n_qubits", [1, 2, 3, 4, 5])
def test_gate_forward_inverse_roundtrip(n_qubits: int):
    dim = 2**n_qubits
    rng = random.Random(n_qubits)
    for _ in range(3):
        vec = [complex(rng.gauss(0, 1), rng.gauss(0, 1)) for _ in range(dim)]
        norm = math.sqrt(sum(abs(z) ** 2 for z in vec))
        amps = [z / norm for z in vec]
        fwd = apply_qft_gates(amps, inverse=False)
        back = apply_qft_gates(fwd, inverse=True)
        assert states_equal_up_to_global_phase(back, amps)


def test_forward_gate_steps_include_swap_for_two_qubits():
    steps = build_forward_qft_gate_steps(2)
    assert any(s[0] == "SWAP" for s in steps)


def test_norm_preserved_direct_and_gates():
    for n in (1, 2, 3, 4):
        for idx in range(2**n):
            amps = basis_state(n, idx)
            for out in (apply_qft(amps, inverse=False), apply_qft_gates(amps, inverse=False)):
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
