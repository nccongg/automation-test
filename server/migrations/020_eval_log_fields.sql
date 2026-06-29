-- Migration 020: Evaluation log fields + timing tracking

-- 1. test_runs: chỉ giữ field thực sự cần lưu thủ công
ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS generated_tree_correct VARCHAR(10),
  ADD COLUMN IF NOT EXISTS run_notes              TEXT;

ALTER TABLE public.test_runs
  DROP CONSTRAINT IF EXISTS chk_tree_correct;
ALTER TABLE public.test_runs
  ADD CONSTRAINT chk_tree_correct
    CHECK (generated_tree_correct IS NULL OR generated_tree_correct IN ('yes', 'partial', 'no'));

-- 2. test_case_generation_batches: track thời gian sinh testcase
ALTER TABLE public.test_case_generation_batches
  ADD COLUMN IF NOT EXISTS generation_started_at  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS generation_finished_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS generation_duration_ms INTEGER;

-- 3. Bảng mới: log thời gian sinh dataset bằng AI
CREATE TABLE IF NOT EXISTS public.dataset_generation_logs (
  id            BIGSERIAL PRIMARY KEY,
  project_id    BIGINT,
  dataset_id    BIGINT,
  prompt        TEXT,
  row_count     INTEGER,
  llm_provider  VARCHAR(50),
  llm_model     VARCHAR(100),
  started_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at   TIMESTAMP WITH TIME ZONE,
  duration_ms   INTEGER,
  success       BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dataset_gen_logs_project
  ON public.dataset_generation_logs (project_id, created_at DESC);
