# Constraints and indexes

## hub_document

- UNIQUE `(user_id, title)` where `deleted_at IS NULL` — optional product rule  
- INDEX `(user_id, updated_at DESC)` — list drafts  

## hub_document_revision

- UNIQUE `(document_id, revision_no)`  
- INDEX `(document_id, created_at DESC)`  

## hub_preferences

- PK `user_id` — one row per user  

Apply via `database/migrations/001_platform_hub.sql` when Document module ships.
