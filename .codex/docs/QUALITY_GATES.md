# QuantumWalk quality gates

Apply gates proportional to the change. Do not claim a gate passed unless it ran successfully.

## Frontend
- TypeScript and lint checks for touched code.
- Responsive behavior at small, medium, and large viewports.
- Keyboard navigation, focus visibility, labels, contrast, and semantic structure.
- Loading, empty, error, disabled, and success states where relevant.
- No console errors or accidental secrets in client bundles.

## Backend
- Request validation and stable response/error contracts.
- Authentication and authorization at the server boundary.
- Correct status codes, timeouts, rate/resource limits, and safe logging.
- Unit/integration tests for changed behavior.
- No secrets in responses or logs.

## Database
- Explicit constraints, indexes justified by access patterns, and transaction correctness.
- Migration is reversible where the framework supports it.
- Verify foreign keys and user/resource ownership.
- Avoid destructive changes without explicit approval.

## Security
- Check authorization/IDOR, input validation, session/OAuth, secrets, injection, CSRF/XSS, CORS, and abuse limits as applicable.
- Do not claim a full audit based on a limited review.

## Final review
- `git diff --check`
- `git diff --stat`
- Inspect the actual diff for scope creep, dead code, duplication, and accidental file changes.
