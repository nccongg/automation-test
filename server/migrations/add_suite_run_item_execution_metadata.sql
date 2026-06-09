ALTER TABLE public.test_suite_run_items
ADD COLUMN IF NOT EXISTS run_mode varchar(20),
ADD COLUMN IF NOT EXISTS dataset_id bigint,
ADD COLUMN IF NOT EXISTS execution_script_id bigint,
ADD COLUMN IF NOT EXISTS dataset_row_index integer;