"""Sirraya Quantum Explorer API compatibility."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

MATRIX_3 = [[0, 4, 2], [3, 0, 1], [5, 2, 0]]


def test_solve_tsp_grover_three_cities():
    response = client.post(
        "/api/v3/solve-tsp",
        json={
            "distance_matrix": MATRIX_3,
            "algorithm": "grover",
            "shots": 1024,
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
    assert "classical_optimal_distance" in body["quantum_advantage"]
    assert body["execution_details"]["algorithm"] == "grover"
    assert body["execution_details"]["error_mitigation"] == "disabled"
    assert body["execution_details"]["theoretical_fidelity"] is None
    assert body["execution_details"]["quantum_volume"] is None
    assert "not applied" in body["recommendations"][0]


def test_solve_tsp_qaoa_reports_unimplemented():
    matrix = [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]
    response = client.post(
        "/api/v3/solve-tsp",
        json={
            "distance_matrix": matrix,
            "algorithm": "qaoa",
            "shots": 512,
            "optimization_level": 1,
            "enable_error_mitigation": False,
            "error_mitigation_method": "readout",
        },
    )
    assert response.status_code == 501
    assert "not implemented" in response.json()["detail"]
