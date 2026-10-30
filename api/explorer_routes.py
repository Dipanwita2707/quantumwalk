"""Public explorer metadata (no account required)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator

from circuit_schema import CircuitRequest, Operation
from demo_presets import DEMO_PRESETS
from limits import enforce_rate, simulation_slot
from simulator import simulate
from tsp_grover import build_tsp_grover_operations, marked_route_ids, tsp_grover_ideal_probabilities, tsp_routes

router = APIRouter(prefix="/api/explorer", tags=["explorer"])

DemoPreset = Literal["superposition", "bell", "grover2", "tsp3", "tsp3grover"]


class DemoSimulateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    preset: DemoPreset | None = None
    qubits: int | None = Field(default=None, ge=1, le=5)
    operations: list[Operation] | None = None
    shots: int = Field(default=1024, ge=1, le=4096)
    engine: Literal["qiskit", "cirq"] = "qiskit"
    noise_strength: float | None = Field(default=None, ge=0, le=0.15)

    @model_validator(mode="after")
    def preset_xor_circuit(self) -> "DemoSimulateRequest":
        has_preset = self.preset is not None
        has_circuit = self.qubits is not None and self.operations is not None
        if has_preset == has_circuit:
            raise ValueError("Provide either preset or qubits and operations")
        return self


@router.get("/presets")
def demo_preset_catalog() -> dict:
    return {
        "presets": list(DEMO_PRESETS.keys()),
        "note": "Unauthenticated demo runs — fixed circuits only. Sign in for the full lab.",
    }


@router.post("/demo/simulate")
def demo_simulate(body: DemoSimulateRequest, request: Request) -> dict:
    enforce_rate(request, "demo_simulate", limit=30, window_seconds=60)
    if body.preset is not None:
        base = DEMO_PRESETS[body.preset]
        circuit = base.model_copy(update={"engine": body.engine, "noise_strength": body.noise_strength})
    else:
        circuit = CircuitRequest(
            qubits=body.qubits,
            operations=body.operations or [],
            shots=body.shots,
            engine=body.engine,
            noise_strength=body.noise_strength,
        )
    with simulation_slot():
        response = simulate(circuit)
    return response.model_dump()


def _min_tour_cost() -> int:
    return min(row["cost"] for row in tsp_routes())


@router.get("/tsp")
def tsp_explorer_reference() -> dict:
    threshold = _min_tour_cost() + 1
    marked = marked_route_ids(threshold)
    primary = marked[0]
    operations = build_tsp_grover_operations(threshold)
    ideal = tsp_grover_ideal_probabilities(threshold)
    return {
        "routes": tsp_routes(),
        "min_cost": _min_tour_cost(),
        "threshold": threshold,
        "marked_route_ids": marked,
        "primary_route_id": primary,
        "primary_bits": format(primary, "03b"),
        "qubits": 3,
        "operations": [op.model_dump(exclude_none=True) for op in operations],
        "ideal_probabilities": ideal,
        "note": (
            "Grover preset marks one near-optimal route (lowest id at threshold) to stay within the gate budget. "
            "Classical chart lists every tour."
        ),
    }
