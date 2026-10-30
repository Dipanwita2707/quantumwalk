# Performance report

**Date:** 2026-10-25 · **Method:** Local smoke only — not production benchmarks.

| Check | Result |
| --- | --- |
| pytest sirraya + tsp | ~0.2s (4 tests) |
| Academy pages | Static SSR/SSG — no heavy client bundle added |
| QuantumAcademy Sirraya chunk | ~564 KB — reference only |

## Thresholds (PROPOSED)

- API simulate p95 < 2s for ≤3 qubits, 1024 shots on dev laptop  
- Web LCP acceptable on `/academy` — not measured this cycle  

Skipped: load testing, bundle analysis CI.
