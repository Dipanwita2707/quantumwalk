# Low-level design

## Request lifecycle (authenticated simulate)

1. Browser POST `/api/simulate` with CSRF cookie + header  
2. `limits.enforce_rate` + `simulation_slot`  
3. `simulator.simulate` → Qiskit  
4. JSON `SimulationResponse`  

## Sirraya TSP compat

1. POST `/api/v3/solve-tsp` — no auth (public, rate-limited)  
2. Classical tour enumeration + optional 3-qubit Grover sim  
3. Response shaped for observed Explorer client fields  

## Academy progress

1. GET `/api/lessons` — static catalog from `content.py`  
2. POST answer — grades against `LESSON_ANSWERS`, writes `progress` row if authenticated  

## Frontend data

- `useSession` → `/api/me`  
- Public routes via `publicRoutes.ts` + middleware  
