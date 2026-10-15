-- Apply explicitly before enabling Printing Services on PostgreSQL.
BEGIN;
CREATE TABLE IF NOT EXISTS bornolab_printing (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
-- Records are isolated from bornolab_kv. Mutations take a row lock.
-- Rollback: disable Printing Services first, back up, then DROP TABLE bornolab_printing.
