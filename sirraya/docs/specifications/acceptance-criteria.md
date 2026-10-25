# Acceptance criteria

## Academy (FR-1, FR-6, FR-7, FR-8)

- [x] `/academy` lists curriculum units and module map  
- [x] `/learn/reference` searchable glossary  
- [x] `/academy/foundations` and `/academy/reservoir` reachable  
- [x] Guest can preview learn path with banner  

## Explorer (FR-4, FR-5)

- [x] `/explorer/tsp` renders stages  
- [x] `POST /api/v3/solve-tsp` returns `success: true` for 3×3 matrix (tests)  
- [ ] Behavioral parity with Sirraya UI — **not claimed**  

## Security (NFR-3)

- [x] Private circuits require session  
- [x] CSRF on mutating routes when authenticated  

## Deployment (NFR-6)

- [x] CI workflow present  
- [x] Docker compose documents local stack  
