"""Educational echo-state reservoir (aligned with web/lib/reservoirLab.ts)."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class ReservoirParams:
    hidden_size: int = 16
    leak_rate: float = 0.35
    input_scale: float = 0.8
    spectral_radius: float = 0.9
    train_steps: int = 120
    seed: int = 42


def _mulberry32(seed: int):
    t = seed & 0xFFFFFFFF

    def rand():
        nonlocal t
        t = (t + 0x6D2B79F5) & 0xFFFFFFFF
        r = ((t ^ (t >> 15)) * (1 | t)) & 0xFFFFFFFF
        r ^= (r + ((r ^ (r >> 7)) * (61 | r))) & 0xFFFFFFFF
        return ((r ^ (r >> 14)) & 0xFFFFFFFF) / 4294967296.0

    return rand


def synthetic_series(length: int, seed: int) -> list[float]:
    rand = _mulberry32(seed)
    phase = rand() * math.pi * 2
    return [math.sin(2 * math.pi * t / 17 + phase) for t in range(length)]


def run_reservoir_mse(params: ReservoirParams) -> tuple[float, float, float]:
    """Return (train_mse, test_mse, test_baseline_mse) for regression checks."""
    rand = _mulberry32(params.seed)
    h = params.hidden_size
    w_in = [(rand() * 2 - 1) * params.input_scale for _ in range(h)]
    w = [[(rand() * 2 - 1) / h for _ in range(h)] for _ in range(h)]
    norm = math.sqrt(sum(w[i][j] ** 2 for i in range(h) for j in range(h))) or 1.0
    scale = params.spectral_radius / norm
    w = [[w[i][j] * scale for j in range(h)] for i in range(h)]

    series = synthetic_series(params.train_steps + 40, params.seed)
    state = [0.0] * h
    features: list[list[float]] = []
    train_y: list[float] = []
    test_y: list[float] = []
    test_x: list[list[float]] = []
    washout = 20

    for t in range(len(series) - 1):
        x = series[t]
        pre = [w_in[i] * x + sum(w[i][j] * state[j] for j in range(h)) for i in range(h)]
        state = [
            (1 - params.leak_rate) * state[i] + params.leak_rate * math.tanh(pre[i]) for i in range(h)
        ]
        if t < washout:
            continue
        target = series[t + 1]
        row = state[:]
        if t < params.train_steps + washout:
            features.append(row)
            train_y.append(target)
        else:
            test_x.append(row)
            test_y.append(target)

    # Ridge with small lambda (normal equations, tiny dim)
    lam = 1e-4
    d = h
    a = [[0.0] * d for _ in range(d)]
    b = [0.0] * d
    for row, y in zip(features, train_y):
        for i in range(d):
            b[i] += row[i] * y
            for j in range(d):
                a[i][j] += row[i] * row[j]
    for i in range(d):
        a[i][i] += lam
    # Gauss elimination
    for i in range(d):
        pivot = a[i][i]
        if abs(pivot) < 1e-12:
            continue
        for j in range(i, d):
            a[i][j] /= pivot
        b[i] /= pivot
        for r in range(d):
            if r == i:
                continue
            factor = a[r][i]
            for c in range(i, d):
                a[r][c] -= factor * a[i][c]
            b[r] -= factor * b[i]
    weights = b[:]

    def predict(row: list[float]) -> float:
        return sum(row[i] * weights[i] for i in range(d))

    train_pred = [predict(row) for row in features]
    test_pred = [predict(row) for row in test_x]

    def mse(actual: list[float], pred: list[float]) -> float:
        return sum((a - p) ** 2 for a, p in zip(actual, pred)) / max(1, len(actual))

    train_mean = sum(train_y) / max(1, len(train_y))
    test_baseline = mse(test_y, [train_mean] * len(test_y))
    return mse(train_y, train_pred), mse(test_y, test_pred), test_baseline
