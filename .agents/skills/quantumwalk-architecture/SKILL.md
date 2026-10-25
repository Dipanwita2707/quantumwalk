---
name: quantumwalk-architecture
description: Use when changing module boundaries, application architecture, major dependencies, system design, or cross-layer flows in QuantumWalk.
---

# Architecture and maintainability

- Inspect current architecture before recommending a new one; verify assumptions against code.
- Prefer clear boundaries: UI/presentation, application/use cases, domain logic, infrastructure/adapters.
- Avoid needless layers, generic frameworks, circular dependencies, duplicated sources of truth, and premature abstractions.
- Define data ownership, API contracts, failure behavior, observability, and security boundaries.
- Document significant decisions briefly (problem, decision, trade-offs).
- Consider migration and rollback, performance, testability, deployment, and operational burden.
- Do not add services, dependencies, queues, caches, or microservices without demonstrated need.
- Propose broad changes before implementing them; preserve working behavior.
- Validate architecture changes with targeted tests and a diff review.
