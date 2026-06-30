ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS agent_input_tokens  INTEGER,
  ADD COLUMN IF NOT EXISTS agent_output_tokens INTEGER;
