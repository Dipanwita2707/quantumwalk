"""General TSP Grover sampling (3–6 cities)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app
from sirraya.api.tsp_quantum_grover import grover_tsp_sample

client = TestClient(app)

MATRIX_3 = [[0, 4, 2], [3, 0, 1], [5, 2, 0]]
MATRIX_4 = [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]


def test_grover_sample_three_cities():
    sample = grover_tsp_sample(MATRIX_3, shots=1024, grover_iterations=2)
    assert sample["qubits"] == 3
    assert sum(sample["counts"].values()) == 1024


def test_solve_tsp_four_cities_quantum():
    response = client.post(
        "/api/v3/solve-tsp",
        json={
            "distance_matrix": MATRIX_4,
            "algorithm": "grover",
            "shots": 512,
            "optimization_level": 2,
            "enable_error_mitigation": True,
            "error_mitigation_method": "readout",
            "grover_iterations": 2,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["execution_details"]["qubits_used"] == 5
    assert len(body["quantum_solutions"]) >= 1


def test_solve_tsp_six_cities_bounded():
    n = 6
    matrix = [[0 if i == j else 10 + (i + j) % 7 for j in range(n)] for i in range(n)]
    response = client.post(
        "/api/v3/solve-tsp",
        json={
            "distance_matrix": matrix,
            "algorithm": "grover",
            "shots": 256,
            "optimization_level": 0,
            "enable_error_mitigation": False,
            "error_mitigation_method": "readout",
            "grover_iterations": 1,
        },
    )
    assert response.status_code == 200
    assert response.json()["execution_details"]["qubits_used"] == 10
