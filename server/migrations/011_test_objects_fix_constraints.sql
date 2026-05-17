-- Fix 1: unique by (project_id, page_key, name) instead of (project_id, name)
ALTER TABLE test_objects DROP CONSTRAINT IF EXISTS test_objects_project_id_name_key;

-- NULL page_key needs COALESCE so NULLs don't bypass uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS test_objects_project_page_name_idx
  ON test_objects(project_id, COALESCE(page_key, ''), name);

-- Additional columns for auditability
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS last_seen_run_id INTEGER,
  ADD COLUMN IF NOT EXISTS last_seen_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by       VARCHAR(10) DEFAULT 'agent'
    CHECK (created_by IN ('agent', 'user')),
  ADD COLUMN IF NOT EXISTS updated_by       VARCHAR(10) DEFAULT 'agent'
    CHECK (updated_by IN ('agent', 'user'));

-- Fix 5: candidate table — new locators from re-runs on confirmed objects
CREATE TABLE IF NOT EXISTS test_object_candidates (
  id                  SERIAL PRIMARY KEY,
  object_id           INTEGER NOT NULL REFERENCES test_objects(id) ON DELETE CASCADE,
  test_run_id         INTEGER NOT NULL,
  selector_collection JSONB   NOT NULL DEFAULT '{}',
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_object_candidates_object_id
  ON test_object_candidates(object_id);
