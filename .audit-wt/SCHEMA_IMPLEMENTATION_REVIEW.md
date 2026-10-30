# QuantumWalk — schema implementation review

**Reviewed:** 13 October 2026. **Baseline:** section 8 of the supplied product/security specification. If the completed schema is a separate file, that file is still needed for the final comparison.

The user completed the schema design. This review compares that design with the current SQLAlchemy models; it does not redefine the schema or apply database changes.

| Designed entity | Current implementation | Difference requiring a decision |
| --- | --- | --- |
| users | Internal UUID strings, display name, email, avatar, analytics consent, creation time | `email` replaces `primary_email`; `updated_at` and account `status` are absent; identifiers use string columns rather than native PostgreSQL UUID columns. |
| auth_identities | User foreign key, provider, provider subject, unique provider/subject | `provider_email` and `created_at` absent. |
| user_sessions | User foreign key, hashed opaque token, expiry, revocation | `token_hash` replaces `session_hash`; creation time absent. |
| circuits | Ownership, name, schema version, qubits, operations JSON, timestamps | `qubits` replaces `qubit_count`; no visibility column. All access is private by policy; sharing is not implemented. |
| simulation_runs | Results returned directly to the client | No persisted run table or retained result history. |
| lessons | Reviewed curriculum in `api/content.py` | No lessons database table, content-version field, or lesson foreign key. |
| user_progress | Per-user activity slug, completed flag, score, update time; unique user/activity | Activity slugs support both lessons and challenges, replacing `lesson_id` and status. |
| ai_interactions (optional) | Opt-in provider requests, local fallback | No persisted usage/retention records. Prompts and replies are not deliberately stored in the application database. |
| hardware_jobs (later phase) | Hardware integration is labelled unavailable | No table or live hardware submission. |
| audit_events | Safe request telemetry added separately | No durable, actor-linked security audit-event table. Request logs do not replace it. |

**Conclusion:** the implemented database supports the present local platform, but it does not fully implement every entity and field in the supplied design. A successful Alembic consistency check only proves migration/model consistency; it does not prove compliance with this design.

**Local search result:** no separate schema SQL/Prisma file or application deployment configuration was located in the project. The initial Alembic migration matches the current ORM; `.env` uses localhost frontend and OAuth callback URLs. The supplied specification remains the available design reference for this review.

**Next action:** confirm the authoritative completed schema, field mappings, retained run/audit data, and content storage requirements; prepare a reviewed migration and backfill plan. No production schema change or data reset was performed in this review.
