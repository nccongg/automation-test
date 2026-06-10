-- Add missing columns to test_case_dataset_bindings.
-- The dump was taken before alias and updated_at were added.

ALTER TABLE public.test_case_dataset_bindings
    ADD COLUMN IF NOT EXISTS alias      character varying(100),
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();
