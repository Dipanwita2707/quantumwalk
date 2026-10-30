# Additive schema for remaining SRS features

Proposed 30 October 2026; explicitly approved by the user. Models and the additive migration are implemented. Upgrade/downgrade tests and the isolated `.preview/srs-browser.sqlite` upgrade have run; no production migration has run.

Existing approved SRS tables and their data remain unchanged. These additions support the remaining lesson-history, structured-rubric, boss-mission and durable-job requirements. Implement and test migrations only against isolated local databases. Production migration execution is excluded.

| Table | Data and constraints |
| --- | --- |
| `lesson_revisions` | UUID primary key; lesson slug; positive revision number; bounded authored content JSON; creator and reviewer user foreign keys; draft/reviewed status; creation time. Unique `(lesson_slug, revision)`. Published/reviewed snapshots cannot be edited in place. |
| `lesson_publications` | Lesson slug primary key; current revision foreign key; active/retired state; update time. Explicit publication pointer preserves prior revisions and makes concurrent publication checkable. Built-in lessons remain the fallback until an authored revision is published. |
| `assignment_rubrics` | Assignment foreign key primary key; bounded criteria JSON with unique criterion IDs, descriptions, available scores and total-weight validation; revision and creation time. Freeze the definition when submissions exist; existing assignments retain ordinary score/feedback behavior. |
| `submission_rubrics` | Submission foreign key primary key; criterion ratings JSON; immutable rubric snapshot; scoring revision and grading time. Server computes the aggregate score and checks instructor ownership. |
| `boss_definitions` | Slug primary key; positive version; bounded ordered checkpoint definition JSON; active/retired state; author foreign key and timestamps. Definitions reference implemented labs/checkpoints, not executable code. |
| `boss_attempts` | UUID primary key; owner user foreign key; boss slug/version and definition snapshot; run evidence JSON; reflection; pass/fail state; timestamps. Owner/creation index; rewards use existing unique RewardEvent keys to prevent repeated XP. |
| `simulation_jobs` | UUID primary key; owner foreign key; unique owner/request key; validated job kind, lab/model version, request hash and parameters JSON; queued/running/completed/failed/cancelled state; result JSON and optional saved-run foreign key; bounded safe error code; lease owner/expiry, heartbeat, attempt count, cancellation request and timestamps. Index state/creation and owner/creation. Database claim/lease checks prevent two workers from finalizing the same attempt. |

All private resources are owner-scoped server-side. Foreign keys and account deletion/export handling must cover the additions. No credentials, arbitrary Python, shell commands, or unbounded payloads are stored. Queued computation must use the existing validated simulation contracts and bounded worker execution.

Alembic upgrade/downgrade tests must preserve an existing user's original circuits, identity and progress. Additional tests cover unauthorized access, duplicate rewards, rubric bounds, immutable published versions, job claims/cancellation/lease recovery and request-key reuse.

Approval requested: implement these additive models, migration files and isolated local migration tests. This does not approve production changes, destructive resets, live payment activation or deployment.
