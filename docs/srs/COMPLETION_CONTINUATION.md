# SRS completion continuation — 30 October 2026

This checkpoint extends the reusable reference-aligned interface in the existing Next.js/FastAPI application. It does not declare the entire SRS accepted.

## Implemented in this continuation

| Capability | Implementation and entry point |
| --- | --- |
| Discovery universe | Owner-specific concept map, prerequisite connections and reveal dates from server-confirmed mastery. `/missions` → Discovery universe. |
| What-If | Saved baseline, at most three changed supported parameters, same seed, private persisted variant, metric differences and grid compatibility. `/notebook` → saved-run analysis. |
| Autopsy | Preserves the original prediction, checks finite/aligned results and parameter boundaries, displays provenance, assumptions and a configuration checksum. Free text is not automatically graded. |
| Lesson history | Immutable authored revisions, reviewer publication/retirement, stale publication checks, public approved history and assessment grading against the opened revision. `/admin` → lessons; lesson history disclosure. |
| Structured rubrics | Weighted criteria, server-computed score, instructor ownership, frozen definition after submissions, saved grading snapshot and ordinary-score bypass protection. `/faculty` assignment and submission controls. |
| Boss missions | Versioned multi-concept definitions, mastery prerequisites, completed private run evidence, checkpoint answers, stored reflections, private history and one reward per mission across revisions. `/missions` → Boss missions; `/admin` → bosses. |
| Operations | Admin-only persisted run/usage/subscription summaries, configuration presence, redacted failure codes and durable job counts. `/admin` → operations. |
| Durable scientific jobs | Opt-in queue, owner-scoped status/history/cancellation, idempotent request keys, atomic quota reservation, two shared database execution slots, expiring leases, three-attempt recovery ceiling and a spawned computation process with a 30-second deadline. `/lab/[slug]` → Background execution. |

The seven additive completion tables were approved explicitly by the user. Their migration has passed an isolated upgrade/downgrade test preserving an existing user, and has been applied only to the isolated browser-review database. New data is covered by account export and foreign-key ownership/deletion rules. No production migration has run.

## Worker operation

Set the same server-only `DATABASE_URL` for the API and worker. Review that target before explicitly applying migrations from the repository root. Enable `QUANTUMWALK_DURABLE_JOBS=1` only after the migration; its default is off. Start the worker with:

```powershell
.venv/Scripts/python.exe api/job_worker.py
```

`--once` processes at most one available job. Multiple worker processes share two execution slots: PostgreSQL advisory transaction locks serialize admission/claims, and SQLite uses its writer lock for local operation. A crashed worker's lease becomes eligible for recovery after 90 seconds. Finalization checks the claim token and unexpired lease; a stale worker cannot save a second result. User cancellation is checked during execution and again before finalization.

Submitting reserves one `lab.run` allowance, including failed/cancelled submissions; retries do not charge again. At most three active jobs per user and 1,000 active global jobs are admitted. A user may retain at most 1,000 job records; operational archival is not implemented. Only the nine allowlisted scientific models use this queue. Circuit/real-hardware execution retains its existing supported path. Queue enablement is not evidence of a healthy worker; an independently supervised worker must actually be running.

## Verification at the checkpoint

- 53 targeted API tests passed across platform, scientific models, workflows, completion features, teaching, boss missions, jobs and migrations.
- Worker tests executed a real spawned calculation and checked timeout, cancellation, lease recovery, stale finalization, ownership, request replay, quota reservation and retry ceiling.
- Standalone frontend TypeScript check passed after the new mission/authoring/background-execution controls.
- Final combined API/Sirraya suite: **273 passed, 1 skipped**. The guest curriculum test now uses the isolated database fixture required for published lesson reads; its guest-access assertions are unchanged.
- Production Next.js build passed, generating 47 static pages plus the existing dynamic detail routes.
- Earlier UI reference/browser results remain documented separately in `../ux-refinement/REFERENCE_UI_FOUNDATION.md`. The newly added controls have not yet completed browser acceptance at this checkpoint; no new pixel-fidelity claim is made.

## Work still open

Hydrogen remains the documented 1s radial/emission model; the full quantum-number orbital explorer is unfinished. PostgreSQL multi-process capacity testing, broader worker kinds, browser acceptance for the latest features, cross-browser certification, complete accessibility review, production backup/restore rehearsal and field performance acceptance remain open. Stripe/SMTP sandbox acceptance, real Google callback, human scientific approval, legal/commercial policy, novice usability and institutional pilot acceptance also remain external gates. No hardware results or provider success have been fabricated.
