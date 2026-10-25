# Database design (PROPOSED — independent platform)

Sirraya's database is **UNKNOWN**. This design extends QuantumWalk's existing schema for hub document metadata (future Document Pro) without breaking current tables.

## Existing (OBSERVED — QuantumWalk)

Users, sessions, circuits, progress, challenges — see `api/database.py` and Alembic `api/migrations/`.

## Proposed additions

| Entity | Purpose |
| --- | --- |
| `hub_document` | User-owned markdown/document drafts (Doc Editor) |
| `hub_document_revision` | Version history |
| `hub_preferences` | Recent tools, UI prefs (JSON) |

Not wired to API in this cycle — SQL in `database/migrations/` for review.

## Engine

PostgreSQL production; SQLite dev — unchanged from QuantumWalk.
