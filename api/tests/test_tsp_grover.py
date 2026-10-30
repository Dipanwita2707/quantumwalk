"""TSP Grover preset stays bounded and boosts the marked route."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402
from tsp_grover import build_tsp_grover_operations, marked_route_ids, tsp_grover_ideal_probabilities  # noqa: E402

client = TestClient(app)


def test_tsp_grover_gate_budget_and_peak():
    ops = build_tsp_grover_operations()
    assert len(ops) <= 64
    primary = format(marked_route_ids()[0], "03b")
    probs = tsp_grover_ideal_probabilities()
    assert probs[primary] == max(probs.values())
    assert probs[primary] > 0.35


def test_tsp_explorer_public_endpoint():
    response = client.get("/api/explorer/tsp")
    assert response.status_code == 200
    body = response.json()
    assert body["qubits"] == 3
    assert len(body["operations"]) <= 64
    assert body["ideal_probabilities"][body["primary_bits"]] > 0.35
