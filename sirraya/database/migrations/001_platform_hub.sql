-- PROPOSED: Sirraya-style hub document storage (not applied by app yet).
-- Run manually on PostgreSQL after review.

CREATE TABLE IF NOT EXISTS hub_document (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(512) NOT NULL,
  kind VARCHAR(32) NOT NULL DEFAULT 'markdown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hub_document_user_updated
  ON hub_document (user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS hub_document_revision (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES hub_document(id) ON DELETE CASCADE,
  revision_no INT NOT NULL,
  body_md TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, revision_no)
);

CREATE TABLE IF NOT EXISTS hub_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  recent_tools JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}'
);
