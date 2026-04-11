-- Migration: Add test_collections and test_collection_items tables
-- These are organize-only label/folder groupings (no execution)
-- A test case can belong to multiple collections

CREATE TABLE IF NOT EXISTS test_collections (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  color        VARCHAR(20) NOT NULL DEFAULT 'indigo',
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_test_collections_project ON test_collections(project_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS test_collection_items (
  id             SERIAL PRIMARY KEY,
  collection_id  INTEGER NOT NULL REFERENCES test_collections(id) ON DELETE CASCADE,
  test_case_id   INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_collection_testcase UNIQUE (collection_id, test_case_id)
);

CREATE INDEX IF NOT EXISTS idx_test_collection_items_collection ON test_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_test_collection_items_testcase ON test_collection_items(test_case_id);
