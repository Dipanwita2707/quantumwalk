"""Multi-shot Born sampling for Shor educational lab."""

from __future__ import annotations

from qft_simulator import QFT_NUMERIC_TOLERANCE

SHOR_MIN_SHOTS = 1
SHOR_MAX_SHOTS = 5000
SHOR_DEFAULT_SHOTS = 256


def validate_shor_sample_seed(seed: object) -> str | None:
    if not isinstance(seed, int):
        return "Sample seed must be an integer (uint32)."
    if seed < 0 or seed > 0xFFFFFFFF:
        return "Sample seed must be between 0 and 2^32 − 1."
    return None


def validate_shor_shot_count(shots: object) -> str | None:
    if not isinstance(shots, int):
        return f"Shot count must be an integer {SHOR_MIN_SHOTS}–{SHOR_MAX_SHOTS}."
    if shots < SHOR_MIN_SHOTS or shots > SHOR_MAX_SHOTS:
        return f"Shot count must be between {SHOR_MIN_SHOTS} and {SHOR_MAX_SHOTS} (got {shots})."
    return None


def validate_counting_probabilities(probabilities: list[float]) -> str | None:
    if not probabilities:
        return "Probability distribution is empty."
    total = 0.0
    for i, p in enumerate(probabilities):
        if p < 0 or p != p:
            return f"Invalid probability at outcome c={i}."
        total += p
    if abs(total - 1.0) > QFT_NUMERIC_TOLERANCE:
        return f"Probabilities must sum to 1 (got {total})."
    if not any(p > QFT_NUMERIC_TOLERANCE for p in probabilities):
        return "Probability distribution has no support."
    return None


def _mulberry32(seed: int) -> float:
    state = (seed + 0x6D2B79F5) & 0xFFFFFFFF
    t = state
    t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
    t = (t ^ ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF)) & 0xFFFFFFFF
    return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0


def _advance_mulberry32(state: int) -> tuple[int, float]:
    state = (state + 0x6D2B79F5) & 0xFFFFFFFF
    t = state
    t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
    t = (t ^ ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF)) & 0xFFFFFFFF
    return state, ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0


def sample_counting_with_rnd(probabilities: list[float], rnd: float) -> int:
    cum = 0.0
    last = 0
    for c, p in enumerate(probabilities):
        if p <= 0:
            continue
        last = c
        cum += p
        if rnd < cum - 1e-15:
            return c
    return last


def sample_shor_shot_sequence(probabilities: list[float], seed: int, shots: int) -> list[int] | str:
    err = validate_counting_probabilities(probabilities)
    if err:
        return err
    err = validate_shor_sample_seed(seed)
    if err:
        return err
    err = validate_shor_shot_count(shots)
    if err:
        return err
    state = seed & 0xFFFFFFFF
    out: list[int] = []
    for _ in range(shots):
        state, rnd = _advance_mulberry32(state)
        c = sample_counting_with_rnd(probabilities, rnd)
        if probabilities[c] <= 0:
            return f"Sampled zero-probability outcome c={c}."
        out.append(c)
    return out


def summarize_histogram_metrics(
    probabilities: list[float], sequence: list[int], shots: int
) -> tuple[float, float]:
    counts: dict[int, int] = {}
    for c in sequence:
        counts[c] = counts.get(c, 0) + 1
    l1 = 0.0
    max_abs = 0.0
    for c, p in enumerate(probabilities):
        obs = counts.get(c, 0) / shots
        if p <= 0 and counts.get(c, 0) == 0:
            continue
        delta = obs - p
        l1 += abs(delta)
        max_abs = max(max_abs, abs(delta))
    return l1, max_abs
