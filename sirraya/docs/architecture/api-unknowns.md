# API unknowns

| ID | Unknown | Impact | Mitigation |
| --- | --- | --- | --- |
| U1 | Sirraya production TSP backend URL | Explorer on CDN may differ from localhost | Compatibility route on QW API |
| U2 | Document Pro AI provider | Cannot replicate AI drafting | PROPOSED: optional user API key + disclosure |
| U3 | Doc Editor sync / storage | Persistence model unknown | PROPOSED: IndexedDB + export |
| U4 | User accounts on Sirraya hub | Guest profile string only observed | QW uses Google OAuth separately |
| U5 | ML Studio backend | Chunk not analyzed | Defer ML module |
| U6 | Full solve-tsp response for qaoa/vqe | UI selects algorithms; server schema unknown | 501 from compat layer |
