-- Object Repository: reusable element definitions shared across test cases
CREATE TABLE IF NOT EXISTS test_objects (
  id               SERIAL PRIMARY KEY,
  project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  page_key         VARCHAR(255),
  description      TEXT,
  -- [{type, value, priority}] ordered list of locator strategies
  selectors        JSONB NOT NULL DEFAULT '[]',
  -- snapshot of element attributes at record time
  attributes_snapshot JSONB DEFAULT '{}',
  created_from_run_id INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_test_objects_project_id ON test_objects(project_id);
CREATE INDEX IF NOT EXISTS idx_test_objects_page_key   ON test_objects(project_id, page_key);
