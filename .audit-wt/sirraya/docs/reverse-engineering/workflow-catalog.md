# Workflow catalog

**Target:** tools.sirraya.org · **Updated:** 2026-10-25

## WF-01 Hub → tool (OBSERVED)

1. Land on `/` (SPA shell).  
2. Choose tool via featured card, grid, command menu (Mod+K), or Alt+1…9.  
3. Lazy chunk loads; top bar remains.  
4. Alt+H or home control returns to hub.

## WF-02 Command palette (OBSERVED)

1. Mod+K or `/` opens dialog.  
2. Filter tools/actions; arrows + Enter to open.  
3. Esc closes.

## WF-03 Quantum Explorer + local API (OBSERVED)

1. Open `quantumtsp` tool.  
2. Client probes `GET /health` on `localhost:8000`.  
3. User sets cities (3–6), matrix, algorithm, shots, mitigation.  
4. `POST /api/v3/solve-tsp` with JSON body (see [api-catalog](../architecture/api-catalog.md)).  
5. On `success: true`, results panel shows solutions and advantage metrics.  
6. Offline: error if health check fails.

## WF-04 Document Pro / Doc Editor (PARTIAL)

- Hub entry OBSERVED; full authoring/sign/export flows not traced this cycle.  
- **BLOCKED** for behavioral parity until REA browser capture or manual HAR.

## WF-05 Mobile (OBSERVED)

- Viewport below threshold shows “Best on a larger screen”; no tool access.

## QuantumWalk equivalent (PROPOSED)

| Sirraya WF | QuantumWalk |
| --- | --- |
| WF-03 | `/explorer/tsp` + API on port 8000 |
| WF-01 (quantum only) | `/start` → sign-in → `/workspace` |
