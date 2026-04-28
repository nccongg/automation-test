-- =========================================================
-- Failure taxonomy: structured reason code on each failed step
-- Enables analytics, retry policy, flaky detection
-- =========================================================

ALTER TABLE public.run_step_logs
  ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(50);

-- Values: assertion_mismatch | element_not_found | element_not_visible |
--         timeout | navigation_failed | value_not_set |
--         selector_invalid | unexpected_error | NULL (step passed)

CREATE INDEX IF NOT EXISTS idx_run_step_logs_failure_reason
  ON public.run_step_logs (failure_reason)
  WHERE failure_reason IS NOT NULL;
