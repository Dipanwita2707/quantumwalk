# Test strategy

| Layer | Tool | Scope |
| --- | --- | --- |
| API unit/integration | pytest | Simulator, auth, explorer, sirraya v3 |
| Web types | `npm run typecheck` | TS strict |
| Web build | `npm run build` | Routes compile |
| E2E | Playwright `web/e2e` | Guest flows, academy, explorer |
| Behavioral compare | Manual + future REA screenshots | Sirraya vs QW — documented differences |

Coverage: not enforced globally; critical paths in `api/tests`.
