-- Migration 022: Performance tracking columns

-- 1. test_runs: lưu llm provider/model trực tiếp để GROUP BY / filter dễ dàng
ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS llm_model    VARCHAR(100);

-- 2. test_run_dataset_bindings: lưu verdict ngay trên row để biết row nào pass/fail
ALTER TABLE public.test_run_dataset_bindings
  ADD COLUMN IF NOT EXISTS verdict VARCHAR(20);

-- 3. test_suite_runs: tổng token của cả suite run
ALTER TABLE public.test_suite_runs
  ADD COLUMN IF NOT EXISTS total_input_tokens  INTEGER,
  ADD COLUMN IF NOT EXISTS total_output_tokens INTEGER;
