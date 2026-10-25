"""Health and TSP solve contracts used by Quantum Explorer."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

MATRIX_3 = [[0, 4, 2], [3, 0, 1], [5, 2, 0]]


def test_health_ok_json():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_solve_tsp_validation_rejects_bad_matrix():
    response = client.post(
        "/api/v3/solve-tsp",
        json={
            "distance_matrix": [[0, 1], [1, 0]],
            "algorithm": "grover",
            "shots": 512,
        },
    )
    assert response.status_code == 422


def test_solve_tsp_guest_accessible():
    response = client.post(
        "/api/v3/solve-tsp",
        json={
            "distance_matrix": MATRIX_3,
            "algorithm": "grover",
            "shots": 512,
            "optimization_level": 3,
            "enable_error_mitigation": True,
            "error_mitigation_method": "readout",
            "grover_iterations": 2,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["quantum_solutions"]
