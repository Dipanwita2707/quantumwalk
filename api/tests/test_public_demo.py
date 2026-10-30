"""Public curriculum reads and bounded demo simulation."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

client = TestClient(app)


def test_guest_can_read_lessons_and_challenges():
    assert client.get("/api/lessons").status_code == 200
    assert client.get("/api/challenges").status_code == 200
    assert len(client.get("/api/lessons").json()) >= 6


def test_demo_simulate_preset_without_session():
    response = client.post("/api/explorer/demo/simulate", json={"preset": "bell", "engine": "qiskit"})
    assert response.status_code == 200
    body = response.json()
    assert body["qubits"] == 2
    assert body["steps"]


def test_demo_simulate_rejects_unknown_preset():
    assert client.post("/api/explorer/demo/simulate", json={"preset": "evil"}).status_code == 422


def test_demo_simulate_custom_circuit_without_session():
    response = client.post(
        "/api/explorer/demo/simulate",
        json={"qubits": 1, "operations": [{"gate": "h", "target": 0}], "engine": "cirq"},
    )
    assert response.status_code == 200
    probs = response.json()["steps"][-1]["probabilities"]
    assert len(probs) == 2
