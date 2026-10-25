---
name: quantumwalk-code-review
description: Use to review a QuantumWalk diff for maintainability, correctness, security, performance, and scope creep.
---

# Code review

Review in priority order:
1. Correctness and regressions.
2. Security and privacy.
3. Data integrity and concurrency.
4. Performance and resource use.
5. Maintainability, readability, typing, duplication, dead code.
6. Tests and docs.

For each finding, include severity, exact file/line evidence, impact, and actionable recommendation. Focus on real defects, not stylistic preference. Check error handling, edge cases, authorization, backwards compatibility, migration risks, and accidental scope expansion. Do not rewrite code unless asked. State what wasn't reviewed.
