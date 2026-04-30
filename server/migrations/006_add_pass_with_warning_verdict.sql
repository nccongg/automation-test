-- Add 'pass_with_warning' to verdict CHECK constraints
-- Replay runs without assertion steps produce this verdict (steps executed
-- but no assertion to prove correctness).

ALTER TABLE public.test_runs
  DROP CONSTRAINT IF EXISTS test_runs_verdict_check,
  ADD CONSTRAINT test_runs_verdict_check
    CHECK (verdict IN ('pass', 'fail', 'error', 'partial', 'pass_with_warning'));

ALTER TABLE public.test_run_attempts
  DROP CONSTRAINT IF EXISTS test_run_attempts_verdict_check,
  ADD CONSTRAINT test_run_attempts_verdict_check
    CHECK (verdict IN ('pass', 'fail', 'error', 'partial', 'pass_with_warning'));
