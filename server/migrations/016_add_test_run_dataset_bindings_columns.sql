-- 016_add_test_run_dataset_bindings_columns.sql
-- Adds columns to test_run_dataset_bindings that the code expects but were never
-- captured in a migration (only present in dev DBs that were edited by hand).
--
-- Referenced by:
--   testSheet.repository.js  -> INSERT (row_index, row_key) + SELECT trdb.row_index
--   agent.repository.js      -> INSERT (test_run_attempt_id, row_index, row_key)
--
-- Without these, getSheetRunDetail / findSheetRunItems fail with
-- "column trdb.row_index does not exist" (and inserts fail too).
-- Safe to re-run (IF NOT EXISTS guards).

ALTER TABLE public.test_run_dataset_bindings
    ADD COLUMN IF NOT EXISTS row_index           integer,
    ADD COLUMN IF NOT EXISTS row_key             character varying(255),
    ADD COLUMN IF NOT EXISTS test_run_attempt_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'test_run_dataset_bindings_attempt_id_fkey'
          AND table_name = 'test_run_dataset_bindings'
    ) THEN
        ALTER TABLE public.test_run_dataset_bindings
            ADD CONSTRAINT test_run_dataset_bindings_attempt_id_fkey
            FOREIGN KEY (test_run_attempt_id)
            REFERENCES public.test_run_attempts(id) ON DELETE SET NULL;
    END IF;
END$$;
