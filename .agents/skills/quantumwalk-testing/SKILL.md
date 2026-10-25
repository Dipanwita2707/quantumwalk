---
name: quantumwalk-testing
description: Use when adding or changing tests, diagnosing regressions, selecting test scope, or defining quality gates for QuantumWalk.
---

# Testing and verification

- Follow the existing test framework and conventions; don't add a new framework without approval.
- Test observable behavior and edge cases rather than implementation details.
- For API changes, cover success, invalid input, authentication, authorization, and relevant failures.
- For UI changes, cover key interactions, empty/loading/error states, keyboard access, and responsive layout when tooling permits.
- For database changes, cover constraints, migrations, and transactional behavior where practical.
- Start with targeted tests; expand to full suites/builds when the change risk or failures warrant it.
- Distinguish tests run from tests recommended but not run.
- Never weaken/remove a test solely to make the suite pass; explain legitimate changes.
- Do not claim a build, lint, or test passed unless its output confirms success.
