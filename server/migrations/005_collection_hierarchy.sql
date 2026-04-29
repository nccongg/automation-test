-- Migration: Add parent_id to test_collections for nested folder/tree structure
ALTER TABLE test_collections
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES test_collections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_test_collections_parent
ON test_collections(parent_id) WHERE deleted_at IS NULL;
