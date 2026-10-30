# Data dictionary (proposed hub extensions)

## hub_document

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| user_id | UUID FK → users | Owner |
| title | VARCHAR(512) | |
| kind | VARCHAR(32) | `markdown`, `document_pro` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ NULL | Soft delete |

## hub_document_revision

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID PK | |
| document_id | UUID FK | |
| revision_no | INT | Monotonic per document |
| body_md | TEXT | Synthetic/test content only in seeds |
| created_at | TIMESTAMPTZ | |

## hub_preferences

| Column | Type | Notes |
| --- | --- | --- |
| user_id | UUID PK FK | |
| recent_tools | JSONB | Tool id array |
| settings | JSONB | Theme, etc. |
