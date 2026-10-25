# API contracts

## Sirraya Explorer compatibility (OBSERVED client)

### POST `/api/v3/solve-tsp`

**Request:** `distance_matrix`, `algorithm`, `shots`, `optimization_level`, `enable_error_mitigation`, `error_mitigation_method`, `grover_iterations?`

**Response:** `success`, `execution_time`, `quantum_solutions[]`, `quantum_advantage`, `execution_details`, `circuit_metrics`, `recommendations[]`

**Implementation:** `api/sirraya_v3_routes.py` — Grover simulation for 3×3 matrices; 4–6 cities classical ranking with recommendation string.

### GET `/health`

QuantumWalk: existing liveness endpoint.

## QuantumWalk native

| Endpoint | Contract |
| --- | --- |
| GET `/api/lessons` | Lesson[] |
| POST `/api/lessons/{slug}/answer` | `{ correct, score, saved }` |
| GET `/api/explorer/tsp` | Grover preset metadata |
| POST `/api/explorer/demo/simulate` | SimulationResponse |

OpenAPI: [openapi/sirraya-platform.yaml](../../openapi/sirraya-platform.yaml) + FastAPI `/docs` for full API.
