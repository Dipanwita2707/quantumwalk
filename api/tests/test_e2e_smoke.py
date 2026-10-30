"""End-to-end API smoke: public routes, simulate, export, tiers, discovery."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from auth import require_csrf  # noqa: E402
from main import app  # noqa: E402
from tests.test_platform import signed_client  # noqa: E402

client = TestClient(app)


def test_health_smoke():
    assert client.get("/health").status_code == 200


def test_simulate_qiskit_and_cirq_smoke():
    app.dependency_overrides[require_csrf] = lambda: None
    try:
        payload = {"qubits": 1, "operations": [{"gate": "h", "target": 0}], "shots": 64}
        q = client.post("/api/simulate", json={**payload, "engine": "qiskit"})
        c = client.post("/api/simulate", json={**payload, "engine": "cirq"})
        assert q.status_code == 200 and c.status_code == 200
        qbody, cbody = q.json(), c.json()
        assert qbody["engine"] == "qiskit"
        assert cbody["engine"] == "cirq"
        assert qbody["steps"][-1]["probabilities"][0]["probability"] == pytest.approx(
            cbody["steps"][-1]["probabilities"][0]["probability"], abs=1e-5
        )
    finally:
        app.dependency_overrides.pop(require_csrf, None)


def test_export_and_transpile_smoke(store):
    owner, _, csrf = signed_client(store)
    payload = {"qubits": 2, "operations": [{"gate": "h", "target": 0}, {"gate": "cx", "control": 0, "target": 1}]}
    cirq = owner.post("/api/export/cirq", json=payload)
    assert cirq.status_code == 200
    assert "import cirq" in cirq.json()["code"]
    transpile = owner.post("/api/transpile-preview", json=payload)
    assert transpile.status_code == 200
    body = transpile.json()
    assert body["depth"] >= 1


def test_discovery_progress_and_challenge_tiers_smoke(store):
    owner, _, csrf = signed_client(store)
    discovery = owner.post("/api/discovery/progress", json={"explored": 3}, headers=csrf)
    assert discovery.status_code == 200
    assert discovery.json()["score"] == 75
    circuit = {"qubits": 2, "operations": [{"gate": "h", "target": 0}, {"gate": "cx", "control": 0, "target": 1}]}
    graded = owner.post("/api/challenges/make-bell-pair/submit", json={"circuit": circuit}, headers=csrf)
    assert graded.status_code == 200
    body = graded.json()
    assert body["tier"] == "gold"
    assert body["xp_awarded"] == 100


def test_pedagogical_noise_field_smoke():
    app.dependency_overrides[require_csrf] = lambda: None
    try:
        payload = {
            "qubits": 1,
            "shots": 128,
            "noise_strength": 0.05,
            "operations": [{"gate": "h", "target": 0}, {"gate": "measure", "target": 0}],
        }
        response = client.post("/api/simulate", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["mode"] == "pedagogical_noise"
        assert body["noisy_counts"] is not None
        assert body["counts"] is not None
        assert set(body["counts"].keys()) == set(body["noisy_counts"].keys())
    finally:
        app.dependency_overrides.pop(require_csrf, None)
