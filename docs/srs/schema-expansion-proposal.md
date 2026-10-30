# SRS persistence expansion proposal

The current database has users, identities, sessions, circuits and activity progress. Completing the requested SRS requires additive tables. Existing routes, circuit records, identities and user IDs remain compatible.

| Migration | Proposed tables | Purpose and constraints |
| --- | --- | --- |
| Learning laboratory | lab_definitions, lab_runs, notebooks, notebook_entries, mission_events, reward_events, report_artifacts, user_preferences | Versioned/reviewed scientific content; owner-scoped runs, seeds, parameters, outputs and reports; private notebooks; unique user/event keys prevent duplicate rewards; bounded metadata |
| Plans and operations | plans, plan_entitlements, subscriptions, usage_events, payment_events, audit_events, user_roles | Configurable prices/quotas; unique provider subscription/event IDs; immutable redacted audit events; no payment card data; server-side roles |
| Institutions and community | organizations, memberships, classes, class_memberships, assignments, submissions, community_posts, community_reports | Explicit organization/class membership, instructor/learner permissions, private feedback, sharing and moderation |
| Identity lifecycle | email_credentials, identity_tokens | Hashed passwords and single-use hashed verification/reset tokens with expiry; configured email delivery; never log credentials/tokens |

Each migration will use Alembic with foreign keys, ownership indexes, checks, unique keys and explicit upgrade/downgrade definitions. Existing data will not be reset or deleted. Account export/deletion must include new private data. Tests will use isolated temporary databases. Production migration execution, payment activation and production deployment require a separate review.

Approval requested: implement these additive model/migration files and verify them against isolated local test databases. This does not authorize production migration execution or destructive rollback.
