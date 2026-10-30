# API catalog (observed + proposed)

## Sirraya Quantum Explorer client (OBSERVED)

Base URL hard-coded in bundle: `http://localhost:8000` (not tools.sirraya.org).

| Method | Path | Auth | Evidence |
| --- | --- | --- | --- |
| GET | `/health` | None | E009 |
| GET | `/docs` | None | OpenAPI UI (FastAPI convention) |
| POST | `/api/v3/solve-tsp` | None | E009 |

### POST `/api/v3/solve-tsp` request (OBSERVED)

```json
{
  "distance_matrix": [[0, 10, 15, 20], ...],
  "algorithm": "grover",
  "shots": 8192,
  "optimization_level": 3,
  "enable_error_mitigation": true,
  "error_mitigation_method": "readout",
  "grover_iterations": 2
}
```

Algorithms in UI select: `grover`, `qaoa`, `vqe` (OBSERVED).

### Response shape (OBSERVED — client consumption)

| Field | Type | UI usage |
| --- | --- | --- |
| `success` | boolean | Gate results view |
| `execution_time` | number | Header timing |
| `quantum_solutions` | array | Top 8 routes |
| `quantum_advantage` | object | `found_optimal`, `quantum_optimal_distance`, `classical_optimal_distance` |
| `execution_details` | object | Algorithm, shots, qubits, depth, mitigation, fidelity |
| `circuit_metrics` | object | With `quantum_advantage` in metrics panel |
| `recommendations` | string[] | Optional yellow callout |

Full server schema on Sirraya backend: **UNKNOWN**.

## QuantumWalk native explorer API (OBSERVED — this repo)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/explorer/tsp` | 3-city Grover preset + ideal probabilities |
| POST | `/api/explorer/demo/simulate` | Public demo circuits |

## Independent implementation (PROPOSED)

| Method | Path | Status |
| --- | --- | --- |
| POST | `/api/v3/solve-tsp` | **Implemented** — `api/sirraya_v3_routes.py` (3-city Grover sim; 4–6 classical fallback + recommendation) |

See [openapi/sirraya-platform.yaml](../../openapi/sirraya-platform.yaml).
