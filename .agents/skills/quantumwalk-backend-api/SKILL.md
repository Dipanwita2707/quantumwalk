---
name: quantumwalk-backend-api
description: Use for FastAPI/backend routes, REST APIs, service logic, validation, authentication, authorization, and error handling in QuantumWalk.
---

# Backend and API engineering

- Verify actual backend framework and existing route/service patterns.
- Keep route handlers thin; put reusable business logic in suitable services without over-layering.
- Define typed request/response schemas and validate untrusted input.
- Enforce authentication and authorization on the server for every protected resource.
- Prevent IDOR/BOLA by checking resource ownership in the operation, not only by hiding UI links.
- Use consistent status codes, error shapes, timeouts, pagination, and idempotency where needed.
- Apply rate limits and explicit resource budgets to expensive operations.
- Avoid leaking stack traces, tokens, secrets, internal IDs, or private data in errors/logs.
- Use transactions for multi-step data changes; handle external failures and retries safely.
- Add targeted tests for valid, invalid, unauthenticated, unauthorized, and edge cases.
