---
name: quantumwalk-performance
description: Use for profiling, optimizing slow UI/API/database behavior, bundle size, caching, or resource-intensive quantum simulation.
---

# Performance engineering

- Measure or identify a credible bottleneck before optimizing.
- Prefer targeted profiling, timings, query plans, bundle analysis, and repeatable benchmarks.
- Avoid speculative caches, premature memoization, and extra infrastructure.
- Frontend: watch bundle size, waterfall requests, image loading, rendering, and unnecessary rerenders.
- Backend: bound expensive work, use timeouts, pagination, concurrency limits, and efficient serialization.
- Database: inspect query patterns and plans before adding indexes or rewriting queries.
- Quantum simulation: cap qubits/depth/shots/runtime and prevent resource exhaustion.
- Preserve correctness and security. Compare before/after where feasible and report measured results honestly.
