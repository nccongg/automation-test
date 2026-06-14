-- Store screenshot bytes directly in the database (Neon) so they survive
-- across services/containers that don't share a filesystem.
ALTER TABLE public.evidences
    ADD COLUMN IF NOT EXISTS file_data bytea;

-- Allow 'db' as a storage_provider value for evidences stored inline.
ALTER TABLE public.evidences
    DROP CONSTRAINT IF EXISTS evidences_storage_provider_check;

ALTER TABLE public.evidences
    ADD CONSTRAINT evidences_storage_provider_check
    CHECK (storage_provider::text = ANY (ARRAY['local'::character varying, 'db'::character varying, 'minio'::character varying, 's3'::character varying]::text[]));
