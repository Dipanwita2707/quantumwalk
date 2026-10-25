"""Gate-level modular exponentiation on compact orbit work register (Shor educational)."""

from __future__ import annotations

import math
from typing import Literal

from shor_educational import (
    SHOR_MAX_TOTAL_QUBITS,
    SHOR_NUMERIC_TOLERANCE,
    build_pre_iqft_joint_amplitudes,
    compare_counting_probabilities,
    multiplicative_cycle_values,
    plan_quantum_simulation,
    validate_shor_input,
    _apply_iqft_on_joint,
    _index_count_work,
    _joint_total_probability,
    _marginal_counting_probabilities,
)

WorkEncoding = Literal["orbit_compact"]


def orbit_period(a: int, n: int) -> int:
    return len(multiplicative_cycle_values(a, n))


def orbit_index_permutation(step: int, orbit_size: int) -> list[int]:
    """Permutation on orbit indices: i -> (i + step) mod orbit_size (multiply values by a^step)."""
    if orbit_size <= 0:
        return [0]
    step_mod = step % orbit_size
    return [(i + step_mod) % orbit_size for i in range(orbit_size)]


def apply_orbit_permutation_work(
    amplitudes: list[complex],
    counting_bits: int,
    work_dim: int,
    perm_on_orbit: list[int],
) -> list[complex]:
    """Apply i -> perm[i] on work register for orbit indices; identity on work >= orbit_size."""
    orbit_size = len(perm_on_orbit)
    t_dim = 2**counting_bits
    out = [0j] * len(amplitudes)
    for w in range(work_dim):
        for c in range(t_dim):
            idx = _index_count_work(c, w, counting_bits)
            z = amplitudes[idx]
            if abs(z) < 1e-20:
                continue
            if w < orbit_size:
                w2 = perm_on_orbit[w]
            else:
                w2 = w
            out[_index_count_work(c, w2, counting_bits)] += z
    return out


def apply_controlled_orbit_multiply(
    amplitudes: list[complex],
    counting_bits: int,
    work_dim: int,
    control_bit: int,
    step: int,
    orbit_size: int,
) -> list[complex]:
    """If counting qubit control_bit is |1>, apply orbit permutation by step on work."""
    perm = orbit_index_permutation(step, orbit_size)
    t_dim = 2**counting_bits
    out = [0j] * len(amplitudes)
    for w in range(work_dim):
        for c in range(t_dim):
            idx = _index_count_work(c, w, counting_bits)
            z = amplitudes[idx]
            if abs(z) < 1e-20:
                continue
            if ((c >> control_bit) & 1) and w < orbit_size:
                w2 = perm[w]
            else:
                w2 = w
            out[_index_count_work(c, w2, counting_bits)] += z
    return out


def apply_hadamard_counting_qubit(
    amplitudes: list[complex], counting_bits: int, work_dim: int, qubit: int
) -> list[complex]:
    t_dim = 2**counting_bits
    out = [0j] * len(amplitudes)
    s = math.sqrt(2)
    for w in range(work_dim):
        for c in range(t_dim):
            if (c >> qubit) & 1:
                continue
            c1 = c | (1 << qubit)
            i0 = _index_count_work(c, w, counting_bits)
            i1 = _index_count_work(c1, w, counting_bits)
            z0 = amplitudes[i0]
            z1 = amplitudes[i1]
            out[i0] += (z0 + z1) / s
            out[i1] += (z0 - z1) / s
    return out


def validate_modexp_plan(n: int, a: int) -> str | None:
    err = validate_shor_input(n, a)
    if err:
        return err
    plan = plan_quantum_simulation(n, a)
    if plan is None:
        return "Quantum register plan exceeds the 5-qubit educational simulator budget."
    if plan["total_qubits"] > SHOR_MAX_TOTAL_QUBITS:
        return "Total qubits exceed educational bound."
    return None


def build_pre_iqft_via_gates(n: int, a: int) -> tuple[dict[str, int], list[complex], int] | str:
    """|0..0>|1⟩ (orbit index 0) → H^{⊗t} on counting → controlled orbit multiplies a^{2^j}."""
    err = validate_modexp_plan(n, a)
    if err:
        return err
    plan = plan_quantum_simulation(n, a)
    assert plan is not None
    t = plan["counting_qubits"]
    m = plan["work_dimension"]
    r = orbit_period(a, n)
    dim = m * (2**t)
    amps = [0j] * dim
    amps[_index_count_work(0, 0, t)] = 1 + 0j
    for q in range(t):
        amps = apply_hadamard_counting_qubit(amps, t, m, q)
    for j in range(t):
        amps = apply_controlled_orbit_multiply(amps, t, m, j, 2**j, r)
    if abs(_joint_total_probability(amps) - 1.0) > SHOR_NUMERIC_TOLERANCE:
        return "Gate mod-exp path did not preserve unit norm."
    return plan, amps, r


def permutation_is_reversible(perm: list[int]) -> bool:
    n = len(perm)
    seen = [False] * n
    for i in range(n):
        j = perm[i]
        if j < 0 or j >= n or seen[j]:
            return False
        seen[j] = True
    return all(seen)


def state_overlap_fidelity(a: list[complex], b: list[complex]) -> float:
    if len(a) != len(b):
        return 0.0
    inner = sum(x.conjugate() * y for x, y in zip(a, b))
    na = math.sqrt(sum(abs(z) ** 2 for z in a))
    nb = math.sqrt(sum(abs(z) ** 2 for z in b))
    if na < 1e-20 or nb < 1e-20:
        return 0.0
    return abs(inner / (na * nb)) ** 2


def simulate_modexp_comparison(n: int, a: int) -> dict[str, object] | str:
    """Closed-form pre-IQFT vs gate-built (Hadamard + controlled orbit multiplies)."""
    closed = build_pre_iqft_joint_amplitudes(n, a)
    if isinstance(closed, str):
        return closed
    gated = build_pre_iqft_via_gates(n, a)
    if isinstance(gated, str):
        return gated
    plan_c, closed_amps, _ = closed
    plan_g, gate_amps, orbit_size = gated
    if plan_c != plan_g:
        return "Closed-form and gate paths chose different register plans."
    t = plan_c["counting_qubits"]
    m = plan_c["work_dimension"]
    pre_fidelity = state_overlap_fidelity(closed_amps, gate_amps)
    closed_post = _apply_iqft_on_joint(closed_amps[:], t, m, "direct")
    gate_post = _apply_iqft_on_joint(gate_amps[:], t, m, "direct")
    closed_probs = _marginal_counting_probabilities(closed_post, t, m)
    gate_probs = _marginal_counting_probabilities(gate_post, t, m)
    metrics = compare_counting_probabilities(closed_probs, gate_probs)
    return {
        "plan": plan_c,
        "work_encoding": "orbit_compact",
        "orbit_size": orbit_size,
        "closed_pre_norm": _joint_total_probability(closed_amps),
        "gate_pre_norm": _joint_total_probability(gate_amps),
        "pre_iqft_state_fidelity": pre_fidelity,
        "pre_iqft_states_aligned": pre_fidelity >= 1 - SHOR_NUMERIC_TOLERANCE,
        "closed_probabilities": closed_probs,
        "gate_preparation_probabilities": gate_probs,
        "metrics": metrics,
        "distributions_aligned": metrics["bhattacharyya_fidelity"] >= 1 - SHOR_NUMERIC_TOLERANCE,
    }

