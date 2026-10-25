"""Educational Shor workflow (aligned with web/lib/shorEducational.ts)."""

from __future__ import annotations

import math

from qft_gates import apply_qft_gates
from qft_simulator import QFT_MAX_QUBITS, QFT_MIN_QUBITS, apply_qft

SHOR_N_MIN = 4
SHOR_N_MAX = 21
SHOR_MAX_TOTAL_QUBITS = 5
SHOR_NUMERIC_TOLERANCE = 1e-8

# Deterministic end-to-end fixtures (n, a, expected period, expected factor pair).
SHOR_KNOWN_FIXTURES: list[dict[str, object]] = [
    {"n": 15, "a": 7, "period": 4, "factors": (3, 5)},
    {"n": 21, "a": 2, "period": 6, "factors": (3, 7)},
    {"n": 8, "a": 3, "period": 2, "factors": (2, 4)},
]


def gcd(a: int, b: int) -> int:
    x, y = abs(a), abs(b)
    while y:
        x, y = y, x % y
    return x


def is_composite(n: int) -> bool:
    if not isinstance(n, int) or n < 2:
        return False
    if n % 2 == 0:
        return n > 2
    d = 3
    while d * d <= n:
        if n % d == 0:
            return True
        d += 2
    return False


def mod_pow(base: int, exp: int, mod: int) -> int:
    b = base % mod
    e = exp
    out = 1
    while e > 0:
        if e & 1:
            out = (out * b) % mod
        b = (b * b) % mod
        e >>= 1
    return out


def validate_shor_input(n: int, a: int) -> str | None:
    if not isinstance(n, int) or n < SHOR_N_MIN or n > SHOR_N_MAX:
        return f"N must be a composite integer {SHOR_N_MIN}–{SHOR_N_MAX}."
    if not is_composite(n):
        return f"{n} is not composite (Shor targets composite moduli)."
    if not isinstance(a, int) or a < 2 or a >= n:
        return f"Base a must satisfy 2 ≤ a < N ({n})."
    if gcd(a, n) != 1:
        return f"gcd(a, N) = {gcd(a, n)} ≠ 1. Pick a coprime to N or use gcd directly."
    return None


def multiplicative_cycle_values(a: int, n: int) -> list[int]:
    vals = [1]
    x = 1
    for _ in range(n):
        x = (x * a) % n
        if x == 1:
            break
        vals.append(x)
    return vals


def plan_quantum_simulation(n: int, a: int) -> dict[str, int] | None:
    if gcd(a, n) != 1:
        return None
    cycle = multiplicative_cycle_values(a, n)
    orbit_size = max(2, len(cycle))
    work = max(1, math.ceil(math.log2(orbit_size)))
    counting = SHOR_MAX_TOTAL_QUBITS - work
    if counting < 1:
        return None
    return {
        "counting_qubits": counting,
        "work_qubits": work,
        "total_qubits": work + counting,
        "work_dimension": 2**work,
    }


def classical_order_reference(a: int, n: int) -> int | None:
    if gcd(a, n) != 1:
        return None
    x = 1
    for r in range(1, n + 1):
        x = (x * a) % n
        if x == 1:
            return r
    return None


def try_extract_factors(n: int, r: int, a: int) -> tuple[bool, str, int | None, int | None]:
    if r % 2 != 0:
        return False, "Order r is odd — need an even r for the usual gcd(a^{r/2} ± 1, N) step.", None, None
    half = mod_pow(a, r // 2, n)
    if half == n - 1:
        return False, "a^{r/2} ≡ −1 (mod N); this trial does not split N (try another base).", None, None
    p = gcd(half - 1, n)
    q = gcd(half + 1, n)
    if p <= 1 or q <= 1 or p * q != n:
        return False, "Candidate gcds did not yield non-trivial factors of N.", None, None
    return True, "ok", min(p, q), max(p, q)


def order_candidates_from_phase(count: int, counting_bits: int, a: int, n: int) -> tuple[list[int], int, int]:
    den = 2**counting_bits
    orders: list[int] = []
    p0, q0 = 0, 1
    p1, q1 = count, den

    def push_if_period(r: int) -> None:
        if 0 < r < n and r not in orders and mod_pow(a, r, n) == 1:
            orders.append(r)

    push_if_period(q1)
    a_rem, b_rem = count, den
    for _ in range(12):
        if b_rem == 0:
            break
        quot = a_rem // b_rem
        p2 = quot * p1 + p0
        q2 = quot * q1 + q0
        push_if_period(q2)
        p0, q0 = p1, q1
        p1, q1 = p2, q2
        a_rem, b_rem = b_rem, a_rem % b_rem
    merged = orders + phase_order_scan(count, den, a, n)
    return expand_period_candidates(merged, a, n), count, den


def phase_order_scan(count: int, den: int, a: int, n: int, tol: float = 1e-6) -> list[int]:
    phase = count / den
    found: list[int] = []
    for r in range(2, n + 1):
        if mod_pow(a, r, n) != 1:
            continue
        for k in range(r):
            target = k / r
            if abs(phase - target) < tol or abs(phase - target - 1) < tol or abs(phase - target + 1) < tol:
                found.append(r)
                break
    return found


def expand_period_candidates(orders: list[int], a: int, n: int) -> list[int]:
    expanded: set[int] = set()
    for q in orders:
        for d in range(1, q + 1):
            if q % d == 0 and mod_pow(a, d, n) == 1:
                expanded.add(d)
    return sorted(expanded)


def _index_count_work(count: int, work: int, counting_bits: int) -> int:
    return count + (work << counting_bits)


def _joint_total_probability(amplitudes: list[complex]) -> float:
    return sum(abs(z) ** 2 for z in amplitudes)


def expected_peak_outcomes(period: int, counting_bits: int) -> list[int] | None:
    """When 2^t is a multiple of r, IQFT peaks at c = k·2^t/r (Shor ideal model)."""
    m = 2**counting_bits
    if period <= 0 or m % period != 0:
        return None
    step = m // period
    return list(range(0, m, step))


def expected_peak_probability(period: int, counting_bits: int) -> float | None:
    peaks = expected_peak_outcomes(period, counting_bits)
    if peaks is None:
        return None
    return 1.0 / len(peaks)


def build_pre_iqft_joint_amplitudes(n: int, a: int) -> tuple[dict[str, int], list[complex], int] | str:
    err = validate_shor_input(n, a)
    if err:
        return err
    plan = plan_quantum_simulation(n, a)
    if plan is None:
        return "Quantum register plan exceeds the 5-qubit educational simulator budget."
    t = plan["counting_qubits"]
    m = plan["work_dimension"]
    cycle = multiplicative_cycle_values(a, n)
    val_to_idx = {v: i for i, v in enumerate(cycle)}
    t_dim = 2**t
    dim = m * t_dim
    scale = 1 / math.sqrt(t_dim)
    amps = [0j] * dim
    for j in range(t_dim):
        val = mod_pow(a, j, n)
        wi = val_to_idx.get(val)
        if wi is None:
            continue
        amps[_index_count_work(j, wi, t)] = scale + 0j
    return plan, amps, len(cycle)


def gate_iqft_supported(counting_bits: int) -> bool:
    return QFT_MIN_QUBITS <= counting_bits <= QFT_MAX_QUBITS


def _transform_counting_slice(normalized: list[complex], counting_bits: int, iqft_mode: str) -> list[complex]:
    if iqft_mode == "gate":
        return apply_qft_gates(normalized, inverse=True)
    return apply_qft(normalized, inverse=True)


def _apply_iqft_on_joint(
    amps: list[complex], counting_bits: int, work_dim: int, iqft_mode: str
) -> list[complex]:
    t = counting_bits
    t_dim = 2**t
    out = amps[:]
    for w in range(work_dim):
        slice_amps = [out[_index_count_work(c, w, t)] for c in range(t_dim)]
        weight = sum(abs(z) ** 2 for z in slice_amps)
        if weight < 1e-14:
            continue
        inv_norm = 1 / math.sqrt(weight)
        normalized = [z * inv_norm for z in slice_amps]
        transformed = _transform_counting_slice(normalized, t, iqft_mode)
        scale_back = math.sqrt(weight)
        for c in range(t_dim):
            out[_index_count_work(c, w, t)] = transformed[c] * scale_back
    return out


def _marginal_counting_probabilities(amps: list[complex], counting_bits: int, work_dim: int) -> list[float]:
    t_dim = 2**counting_bits
    probs = [0.0] * t_dim
    for w in range(work_dim):
        for c in range(t_dim):
            z = amps[_index_count_work(c, w, counting_bits)]
            probs[c] += abs(z) ** 2
    return probs


def compare_counting_probabilities(
    direct: list[float], gate: list[float]
) -> dict[str, float]:
    l1 = sum(abs(a - b) for a, b in zip(direct, gate))
    bc = sum(math.sqrt(max(0.0, a) * max(0.0, b)) for a, b in zip(direct, gate)) ** 2
    max_abs = max(abs(a - b) for a, b in zip(direct, gate))
    return {"l1": l1, "bhattacharyya_fidelity": bc, "max_abs_diff": max_abs}


def verify_orbit_covers_modular_powers(n: int, a: int, counting_bits: int) -> bool:
    cycle = set(multiplicative_cycle_values(a, n))
    for j in range(2**counting_bits):
        if mod_pow(a, j, n) not in cycle:
            return False
    return True


def build_post_iqft_joint_amplitudes(
    n: int, a: int, iqft_mode: str = "direct"
) -> tuple[dict[str, int], list[complex], list[float], int] | str:
    built = build_pre_iqft_joint_amplitudes(n, a)
    if isinstance(built, str):
        return built
    plan, amps, cycle_len = built
    t = plan["counting_qubits"]
    m = plan["work_dimension"]
    if iqft_mode == "gate" and not gate_iqft_supported(t):
        return "Gate-level IQFT unsupported for this counting register width."
    amps = _apply_iqft_on_joint(amps, t, m, iqft_mode)
    probs = _marginal_counting_probabilities(amps, t, m)
    return plan, amps, probs, cycle_len


SHOR_SIMULATION_PATHS = ("closed_direct", "closed_gate", "gate_e2e")


def simulate_counting_for_path(n: int, a: int, path: str) -> dict[str, object] | str:
    from shor_modexp import build_pre_iqft_via_gates

    err = validate_shor_input(n, a)
    if err:
        return err
    plan = plan_quantum_simulation(n, a)
    if plan is None:
        return "Quantum register plan exceeds the 5-qubit educational simulator budget."
    t = plan["counting_qubits"]
    m = plan["work_dimension"]
    if path not in SHOR_SIMULATION_PATHS:
        return f"Unknown simulation path: {path}"
    if path != "closed_direct" and not gate_iqft_supported(t):
        return (
            f'Simulation path "{path}" requires gate IQFT; counting width t={t} '
            f"is outside the gate simulator ({QFT_MIN_QUBITS}–{QFT_MAX_QUBITS})."
        )
    cycle_len: int
    if path == "gate_e2e":
        built = build_pre_iqft_via_gates(n, a)
        if isinstance(built, str):
            return built
        _plan, pre_amps, cycle_len = built
        iqft_mode = "gate"
    else:
        built = build_pre_iqft_joint_amplitudes(n, a)
        if isinstance(built, str):
            return built
        _plan, pre_amps, cycle_len = built
        iqft_mode = "direct" if path == "closed_direct" else "gate"
    pre_norm = _joint_total_probability(pre_amps)
    post_amps = _apply_iqft_on_joint(pre_amps[:], t, m, iqft_mode)
    post_norm = _joint_total_probability(post_amps)
    if abs(post_norm - 1.0) > SHOR_NUMERIC_TOLERANCE:
        return f'Path "{path}" did not preserve unit norm after inverse QFT.'
    probs = _marginal_counting_probabilities(post_amps, t, m)
    if abs(sum(probs) - 1.0) > SHOR_NUMERIC_TOLERANCE:
        return f'Path "{path}" counting marginals do not sum to 1.'
    return {
        "ok": True,
        "plan": plan,
        "path": path,
        "pre_iqft_norm": pre_norm,
        "post_iqft_norm": post_norm,
        "probabilities": probs,
        "cycle_length": cycle_len,
    }


def simulate_three_path_comparison(n: int, a: int) -> dict[str, object] | str:
    direct = simulate_counting_for_path(n, a, "closed_direct")
    if isinstance(direct, str):
        return direct
    plan = direct["plan"]
    assert isinstance(plan, dict)
    supported = gate_iqft_supported(plan["counting_qubits"])
    closed_gate: list[float] | None = None
    gate_e2e: list[float] | None = None
    m1 = m2 = m3 = None
    if supported:
        g1 = simulate_counting_for_path(n, a, "closed_gate")
        if isinstance(g1, str):
            return g1
        closed_gate = g1["probabilities"]  # type: ignore[assignment]
        m1 = compare_counting_probabilities(direct["probabilities"], closed_gate)  # type: ignore[arg-type]
        g2 = simulate_counting_for_path(n, a, "gate_e2e")
        if isinstance(g2, str):
            return g2
        gate_e2e = g2["probabilities"]  # type: ignore[assignment]
        m2 = compare_counting_probabilities(direct["probabilities"], gate_e2e)  # type: ignore[arg-type]
        m3 = compare_counting_probabilities(closed_gate, gate_e2e)  # type: ignore[arg-type]
    return {
        "gate_iqft_supported": supported,
        "gate_e2e_supported": supported,
        "closed_direct_probabilities": direct["probabilities"],
        "closed_gate_probabilities": closed_gate,
        "gate_e2e_probabilities": gate_e2e,
        "closed_direct_vs_closed_gate": m1,
        "closed_direct_vs_gate_e2e": m2,
        "closed_gate_vs_gate_e2e": m3,
        "comparison_note": (
            "Full joint-state overlap is reported separately (closed-form vs gate mod-exp pre-IQFT). "
            "All three paths compare counting-register marginals P(c) after IQFT."
        ),
    }


def _mulberry32(seed: int) -> float:
    state = (seed + 0x6D2B79F5) & 0xFFFFFFFF
    t = state
    t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
    t = (t ^ ((t + ((t ^ (t >> 7)) * (t | 61))) & 0xFFFFFFFF)) & 0xFFFFFFFF
    return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0


def sample_counting_from_distribution(probabilities: list[float], seed: int) -> int:
    rnd = _mulberry32(seed)
    cum = 0.0
    for c, p in enumerate(probabilities):
        cum += p
        if rnd < cum:
            return c
    return len(probabilities) - 1


def simulate_iqft_comparison(n: int, a: int) -> dict[str, object] | str:
    """Direct (reference) vs gate IQFT counting marginals on the same pre-IQFT state."""
    built = build_pre_iqft_joint_amplitudes(n, a)
    if isinstance(built, str):
        return built
    plan, pre_amps, _cycle = built
    t = plan["counting_qubits"]
    m = plan["work_dimension"]
    pre_norm = _joint_total_probability(pre_amps)
    direct_amps = _apply_iqft_on_joint(pre_amps[:], t, m, "direct")
    direct_probs = _marginal_counting_probabilities(direct_amps, t, m)
    post_norm = _joint_total_probability(direct_amps)
    supported = gate_iqft_supported(t)
    gate_probs: list[float] | None = None
    metrics: dict[str, float] | None = None
    if supported:
        gate_amps = _apply_iqft_on_joint(pre_amps[:], t, m, "gate")
        gate_probs = _marginal_counting_probabilities(gate_amps, t, m)
        metrics = compare_counting_probabilities(direct_probs, gate_probs)
        if abs(_joint_total_probability(gate_amps) - 1.0) > SHOR_NUMERIC_TOLERANCE:
            return "Gate IQFT path did not preserve unit norm."
    return {
        "plan": plan,
        "pre_iqft_norm": pre_norm,
        "post_iqft_norm_direct": post_norm,
        "gate_iqft_supported": supported,
        "direct_probabilities": direct_probs,
        "gate_probabilities": gate_probs,
        "metrics": metrics,
        "aligned": metrics is not None and metrics["bhattacharyya_fidelity"] >= 1 - SHOR_NUMERIC_TOLERANCE,
    }


def simulate_quantum_counting_distribution(n: int, a: int) -> tuple[dict[str, int], list[float], int] | str:
    sim = simulate_counting_for_path(n, a, "closed_direct")
    if isinstance(sim, str):
        return sim
    plan = sim["plan"]
    probs = sim["probabilities"]
    cycle_len = sim["cycle_length"]
    assert isinstance(plan, dict) and isinstance(probs, list) and isinstance(cycle_len, int)
    return plan, probs, cycle_len


def pick_deterministic_measurement(probabilities: list[float]) -> int:
    best = 0
    best_p = -1.0
    for c, p in enumerate(probabilities):
        if p > best_p + 1e-12:
            best_p = p
            best = c
        elif abs(p - best_p) <= 1e-12 and c < best:
            best = c
    return best


def resolve_measurement_and_order(
    n: int, a: int, counting_bits: int, probabilities: list[float]
) -> tuple[int, int | None, dict | None]:
    ranked = sorted(enumerate(probabilities), key=lambda x: (-x[1], x[0]))
    top_p = ranked[0][1] if ranked else 0.0
    for c, p in ranked:
        if top_p - p > 1e-9:
            break
        orders, _, _ = order_candidates_from_phase(c, counting_bits, a, n)
        for candidate in orders:
            ok, msg, pfac, qfac = try_extract_factors(n, candidate, a)
            if ok:
                return c, candidate, {"ok": True, "p": pfac, "q": qfac}
    measured = pick_deterministic_measurement(probabilities)
    orders, _, _ = order_candidates_from_phase(measured, counting_bits, a, n)
    r = orders[0] if orders else None
    fac = None
    if r is not None:
        ok, msg, pfac, qfac = try_extract_factors(n, r, a)
        if ok:
            fac = {"ok": True, "p": pfac, "q": qfac}
    return measured, r, fac


def run_shor_educational_workflow(n: int, a: int) -> dict:
    err = validate_shor_input(n, a)
    if err:
        return {"ok": False, "message": err}
    if gcd(a, n) != 1:
        g = gcd(a, n)
        return {
            "ok": True,
            "N": n,
            "a": a,
            "factors": {"ok": True, "p": g, "q": n // g},
            "quantum": False,
        }
    ref = classical_order_reference(a, n)
    plan = plan_quantum_simulation(n, a)
    if plan is None:
        fac = None
        if ref is not None:
            ok, msg, p, q = try_extract_factors(n, ref, a)
            if ok:
                fac = {"ok": True, "p": p, "q": q}
        return {
            "ok": True,
            "N": n,
            "a": a,
            "quantum": False,
            "classical_reference_order": ref,
            "factors": fac,
        }
    sim = simulate_quantum_counting_distribution(n, a)
    if isinstance(sim, str):
        return {"ok": False, "message": sim}
    _, probs, _cycle_len = sim
    measured, r, factors = resolve_measurement_and_order(n, a, plan["counting_qubits"], probs)
    return {
        "ok": True,
        "N": n,
        "a": a,
        "quantum": True,
        "measured_counting": measured,
        "order_from_measurement": r,
        "classical_reference_order": ref,
        "factors": factors,
        "probabilities": probs,
    }


def qft_convention_self_check(counting_bits: int) -> bool:
    t_dim = 2**counting_bits
    scale = 1 / math.sqrt(t_dim)
    amps = [scale + 0j] * t_dim
    out = apply_qft(amps, inverse=True)
    peak = max(range(t_dim), key=lambda i: abs(out[i]) ** 2)
    return peak == 0 and abs(out[0]) ** 2 > 0.99
