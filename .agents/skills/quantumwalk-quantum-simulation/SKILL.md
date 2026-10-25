---
name: quantumwalk-quantum-simulation
description: Use when implementing quantum circuits, gates, state vectors, Bloch sphere visualization, algorithm execution, or Qiskit Aer simulation.
---

# Quantum simulation correctness

- Verify the existing simulator library/version and current circuit data model before changing implementation.
- Keep simulation logic isolated from UI and API transport.
- Validate supported gates, qubit indices, circuit depth, shots, and parameter ranges.
- Define clear behavior for measurement, stochastic sampling, global phase, normalization, and numerical tolerances.
- Use bounded execution; never run arbitrary user-provided Python or shell code.
- Keep UI state-vector/Bloch visualizations consistent with simulator output and explain conventions.
- Add small known-answer tests for gates/algorithms and edge cases.
- Distinguish simulator results from real-hardware results; hardware integration is optional for MVP.
