BEGIN;

ALTER TABLE IF EXISTS public.test_case_generation_batches
  ADD COLUMN IF NOT EXISTS created_by bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE IF EXISTS public.test_case_generation_candidates
  ADD COLUMN IF NOT EXISTS is_selected boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS selected_test_case_id bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE IF EXISTS public.test_cases
  ADD COLUMN IF NOT EXISTS is_ai_draft boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by bigint;

CREATE INDEX IF NOT EXISTS idx_tc_generation_batches_project_created
  ON public.test_case_generation_batches (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tc_generation_batches_created_by
  ON public.test_case_generation_batches (created_by);

CREATE INDEX IF NOT EXISTS idx_tc_generation_candidates_batch_selected
  ON public.test_case_generation_candidates (batch_id, is_selected, selected_test_case_id);

CREATE INDEX IF NOT EXISTS idx_test_cases_project_ai_draft_active
  ON public.test_cases (project_id, created_by, is_ai_draft)
  WHERE deleted_at IS NULL;

COMMIT;