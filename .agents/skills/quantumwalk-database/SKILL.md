---
name: quantumwalk-database
description: Use for PostgreSQL schema design, ORM models, SQL queries, migrations, indexes, transactions, and data integrity in QuantumWalk.
---

# Database engineering

- Inspect existing database, ORM, migration tool, naming conventions, and schema before proposing changes.
- Model entities and relationships explicitly; use primary/foreign keys, unique constraints, not-null checks, and check constraints where appropriate.
- Design indexes from real query/filter/join patterns; avoid speculative index proliferation.
- Use parameterized queries and safe ORM APIs.
- Keep migrations small, reviewable, and consistent with existing tooling; consider rollback and existing production data.
- Use transactions for operations requiring atomicity.
- Enforce user/resource ownership in data access paths.
- Avoid N+1 queries, unbounded result sets, and selecting unnecessary columns.
- Never reset/drop a database or destroy data without explicit user approval.
- Test constraints, migrations, and key query paths where practical.
