-- Add is_ai_draft flag to test_cases
-- AI-draft test cases are hidden from the main list until committed by the user.
-- They are created when the user clicks "Run Draft" in the AI Workbench drawer
-- and become visible when the user clicks "Save to Library" (commit).

ALTER TABLE test_cases
  ADD COLUMN IF NOT EXISTS is_ai_draft BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: only index the hidden drafts (false rows don't need indexing)
CREATE INDEX IF NOT EXISTS idx_test_cases_is_ai_draft
  ON test_cases(is_ai_draft)
  WHERE is_ai_draft = TRUE;
