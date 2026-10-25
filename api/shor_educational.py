"""Educational Shor workflow (aligned with web/lib/shorEducational.ts)."""

from __future__ import annotations

import math

from qft_simulator import apply_qft

SHOR_N_MIN = 4
SHOR_N_MAX = 21
SHOR_MAX_TOTAL_QUBITS = 5


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


def simulate_quantum_counting_distribution(n: int, a: int) -> tuple[dict[str, int], list[float], int] | str:
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

    for w in range(m):
        slice_amps = [amps[_index_count_work(c, w, t)] for c in range(t_dim)]
        weight = sum(abs(z) ** 2 for z in slice_amps)
        if weight < 1e-14:
            continue
        inv_norm = 1 / math.sqrt(weight)
        normalized = [z * inv_norm for z in slice_amps]
        transformed = apply_qft(normalized, inverse=True)
        scale_back = math.sqrt(weight)
        for c in range(t_dim):
            amps[_index_count_work(c, w, t)] = transformed[c] * scale_back

    probs = [0.0] * t_dim
    for w in range(m):
        for c in range(t_dim):
            z = amps[_index_count_work(c, w, t)]
            probs[c] += abs(z) ** 2
    return plan, probs, len(cycle)


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
