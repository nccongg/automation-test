-- 017_add_test_suite_runs_ai_analysis.sql
-- Adds AI-analysis columns to test_suite_runs used by the sheet-run analysis feature.
--
-- Referenced by:
--   testSheet.repository.js -> SELECT tsr.ai_analysis
--   testSheet.service.js    -> UPDATE ... SET ai_analysis = $1::jsonb, ai_analysis_at = now()
--
-- Present only in dev DBs (added by hand); never captured in a migration, so
-- production fails with "column tsr.ai_analysis does not exist".
-- Safe to re-run (IF NOT EXISTS guards).

ALTER TABLE public.test_suite_runs
    ADD COLUMN IF NOT EXISTS ai_analysis    jsonb,
    ADD COLUMN IF NOT EXISTS ai_analysis_at timestamp with time zone;
