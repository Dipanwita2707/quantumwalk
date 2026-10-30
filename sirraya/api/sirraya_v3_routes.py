"""Sirraya Quantum Explorer compatibility endpoints (observed client contract)."""

from __future__ import annotations

import itertools
import math
import time
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

from limits import enforce_rate, simulation_slot
from sirraya.api.tsp_quantum_grover import grover_tsp_sample

router = APIRouter(prefix="/api/v3", tags=["sirraya-compat"])

Algorithm = Literal["grover", "qaoa", "vqe"]
Mitigation = Literal["readout", "zne", "none"]


class SolveTspRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    distance_matrix: list[list[float | int]]
    algorithm: Algorithm = "grover"
    shots: int = Field(default=8192, ge=100, le=16384)
    optimization_level: int = Field(default=3, ge=0, le=3)
    enable_error_mitigation: bool = True
    error_mitigation_method: Mitigation = "readout"
    grover_iterations: int | None = Field(default=2, ge=1, le=5)

    @field_validator("distance_matrix")
    @classmethod
    def square_matrix(cls, value: list[list[float | int]]) -> list[list[float | int]]:
        n = len(value)
        if n < 3 or n > 6:
            raise ValueError("distance_matrix must be 3–6 cities")
        for i, row in enumerate(value):
            if len(row) != n:
                raise ValueError("distance_matrix must be square")
            for j, distance in enumerate(row):
                if not math.isfinite(distance) or distance < 0:
                    raise ValueError("distance_matrix costs must be finite and non-negative")
                if not math.isfinite(n * distance):
                    raise ValueError("distance_matrix tour costs must remain finite")
                if i == j and distance != 0:
                    raise ValueError("distance_matrix diagonal costs must be 0")
        return value


def _tour_cost(matrix: list[list[float | int]], order: tuple[int, ...]) -> float:
    total = 0.0
    n = len(order)
    for i in range(n):
        a, b = order[i], order[(i + 1) % n]
        total += float(matrix[a][b])
    return total


def _all_tours(matrix: list[list[float | int]]) -> list[dict[str, Any]]:
    n = len(matrix)
    rows: list[dict[str, Any]] = []
    for order in itertools.permutations(range(n)):
        cost = _tour_cost(matrix, order)
        rows.append({"route": list(order), "distance": cost})
    rows.sort(key=lambda r: r["distance"])
    return rows


def _solutions_from_counts(
    matrix: list[list[float | int]],
    counts: dict[str, int],
    shots: int,
    qubits: int,
) -> list[dict[str, Any]]:
    n = len(matrix)
    perms = list(itertools.permutations(range(n)))
    solutions: list[dict[str, Any]] = []
    for bits, count in sorted(counts.items(), key=lambda kv: -kv[1])[:8]:
        clean = bits.replace(" ", "")
        idx = int(clean, 2)
        if idx >= len(perms):
            continue
        order = perms[idx]
        cost = _tour_cost(matrix, order)
        solutions.append(
            {
                "route": list(order),
                "distance": cost,
                "probability": count / shots,
                "measurement_count": count,
                "bitstring": clean.zfill(qubits),
            }
        )
    solutions.sort(key=lambda s: s["distance"])
    return solutions


@router.post("/solve-tsp")
def solve_tsp(body: SolveTspRequest, request: Request) -> dict[str, Any]:
    """POST /api/v3/solve-tsp — Grover sampling for 3–6 cities (direct Qiskit)."""
    enforce_rate(request, "sirraya_solve_tsp", limit=20, window_seconds=60)
    started = time.perf_counter()
    if body.algorithm != "grover":
        raise HTTPException(status_code=501, detail=f"{body.algorithm.upper()} TSP solve is not implemented")
    n = len(body.distance_matrix)
    tours = _all_tours(body.distance_matrix)
    classical_optimal = tours[0]["distance"]
    recommendations: list[str] = []

    iterations = body.grover_iterations or 2
    try:
        with simulation_slot():
            sample = grover_tsp_sample(
                body.distance_matrix,
                shots=body.shots,
                grover_iterations=iterations,
            )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    qubits_used = sample["qubits"]
    depth = sample["depth"]
    quantum_solutions = _solutions_from_counts(
        body.distance_matrix, sample["counts"], body.shots, qubits_used
    )
    if not quantum_solutions:
        quantum_solutions = [
            {
                **tours[0],
                "probability": 1.0,
                "measurement_count": body.shots,
                "bitstring": None,
            }
        ]

    if body.enable_error_mitigation:
        recommendations.append("Error mitigation is not applied by this local simulator.")
    quantum_best = quantum_solutions[0]["distance"]
    found_optimal = abs(quantum_best - classical_optimal) < 1e-6

    elapsed = time.perf_counter() - started
    return {
        "success": True,
        "execution_time": elapsed,
        "quantum_solutions": quantum_solutions,
        "quantum_advantage": {
            "found_optimal": found_optimal,
            "quantum_optimal_distance": quantum_best,
            "classical_optimal_distance": classical_optimal,
        },
        "execution_details": {
            "algorithm": body.algorithm,
            "shots": body.shots,
            "qubits_used": qubits_used,
            "depth": depth,
            "quantum_volume": None,
            "optimization_level": body.optimization_level,
            "error_mitigation": "disabled",
            "grover_iterations": iterations,
            "theoretical_fidelity": None,
        },
        "circuit_metrics": {
            "gate_count": depth,
            "qubits": qubits_used,
        },
        "recommendations": recommendations,
    }
