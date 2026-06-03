-- Persist AI analysis (conclusion + suggestions) for test runs and suite runs
-- so a generated analysis survives page reloads / tab switches.
BEGIN;

ALTER TABLE IF EXISTS public.test_runs
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_analysis_at timestamp with time zone DEFAULT NULL;

ALTER TABLE IF EXISTS public.test_suite_runs
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_analysis_at timestamp with time zone DEFAULT NULL;

COMMIT;
