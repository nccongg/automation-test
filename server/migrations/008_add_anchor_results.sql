ALTER TABLE public.run_step_logs
  ADD COLUMN IF NOT EXISTS anchor_results jsonb DEFAULT NULL;
