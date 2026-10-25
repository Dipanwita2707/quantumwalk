import sys
from math import pi
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from main import app, simulation_slots  # noqa: E402
from auth import require_csrf  # noqa: E402

client = TestClient(app)


@pytest.fixture(autouse=True)
def authenticated_science_requests():
    # Authentication is exercised separately in the platform integration tests.
    app.dependency_overrides[require_csrf] = lambda: None
    yield
    app.dependency_overrides.pop(require_csrf, None)


def test_development_frontend_can_call_simulator():
    response = client.options(
        "/api/simulate",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_oversized_request_body_is_rejected_before_parsing():
    response = client.post("/api/simulate", content=b"x" * 65537, headers={"Content-Type": "application/json"})
    assert response.status_code == 413


def test_busy_simulator_rejects_extra_run():
    assert simulation_slots.acquire(blocking=False)
    assert simulation_slots.acquire(blocking=False)
    try:
        response = client.post("/api/simulate", json={"qubits": 1, "operations": []})
        assert response.status_code == 429
    finally:
        simulation_slots.release()
        simulation_slots.release()


def test_bell_state_and_steps():
    response = client.post(
        "/api/simulate",
        json={"qubits": 2, "operations": [{"gate": "h", "target": 0}, {"gate": "cx", "control": 0, "target": 1}]},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["steps"]) == 3
    probabilities = {item["basis"]: item["probability"] for item in body["steps"][-1]["probabilities"]}
    assert probabilities == pytest.approx({"00": 0.5, "01": 0, "10": 0, "11": 0.5})
    assert body["steps"][-1]["bloch"][0]["purity"] == pytest.approx(0.5)


def test_measurement_counts_are_separate_from_exact_probabilities():
    response = client.post("/api/simulate", json={"qubits": 1, "shots": 128, "operations": [{"gate": "h", "target": 0}, {"gate": "measure", "target": 0}]})
    assert response.status_code == 200
    body = response.json()
    assert sum(body["counts"].values()) == 128
    assert body["steps"][-1]["probabilities"][0]["probability"] == pytest.approx(0.5)


def test_y_and_rotation_phases_are_simulator_derived():
    y = client.post("/api/simulate", json={"qubits": 1, "operations": [{"gate": "y", "target": 0}]}).json()
    amplitude = y["steps"][-1]["amplitudes"][1]
    assert amplitude["real"] == pytest.approx(0)
    assert amplitude["imag"] == pytest.approx(1)
    rx = client.post("/api/simulate", json={"qubits": 1, "operations": [{"gate": "rx", "target": 0, "angle": pi}]}).json()
    assert rx["steps"][-1]["amplitudes"][1]["imag"] == pytest.approx(-1)


def test_swap_and_cz_known_states():
    swapped = client.post("/api/simulate", json={"qubits": 2, "operations": [{"gate": "x", "target": 0}, {"gate": "swap", "control": 0, "target": 1}]}).json()
    assert swapped["steps"][-1]["probabilities"][2]["probability"] == pytest.approx(1)
    phased = client.post("/api/simulate", json={"qubits": 2, "operations": [{"gate": "x", "target": 0}, {"gate": "x", "target": 1}, {"gate": "cz", "control": 0, "target": 1}]}).json()
    assert phased["steps"][-1]["amplitudes"][3]["real"] == pytest.approx(-1)


@pytest.mark.parametrize("payload", [
    {"qubits": 6, "operations": []},
    {"qubits": 1, "shots": 5000},
    {"qubits": True, "operations": []},
    {"qubits": 1, "operations": [{"gate": "h", "target": 0}] * 65},
    {"qubits": 1, "operations": [{"gate": "cx", "target": 0, "control": 0}]},
    {"qubits": 1, "operations": [{"gate": "measure", "target": 0}, {"gate": "h", "target": 0}]},
    {"qubits": 1, "operations": [{"gate": "python", "target": 0}]},
    {"qubits": 1, "operations": [{"gate": "rx", "target": 0}]},
    {"qubits": 1, "operations": [{"gate": "h", "target": 0, "angle": 1.0}]},
    {"qubits": 1, "operations": [{"gate": "rz", "target": 0, "angle": 100.0}]},
])
def test_rejects_invalid_circuits(payload):
    assert client.post("/api/simulate", json=payload).status_code == 422
