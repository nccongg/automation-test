-- Create test_suites, test_suite_items, test_suite_runs, test_suite_run_items.
-- The dump (Automation_testing_DB.sql) used the old name "test_sheets".
-- Server code was updated to use "test_suites" but no migration was added.
-- All FKs are inline so CREATE TABLE IF NOT EXISTS makes the whole block idempotent.

BEGIN;

-- ── test_suites ───────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.test_suites_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public.test_suites (
    id          bigint NOT NULL DEFAULT nextval('public.test_suites_id_seq'),
    project_id  bigint NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name        character varying(255) NOT NULL,
    description text,
    created_by  bigint REFERENCES public.users(id) ON DELETE SET NULL,
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    updated_at  timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at  timestamp with time zone,
    CONSTRAINT test_suites_pkey PRIMARY KEY (id)
);

ALTER SEQUENCE public.test_suites_id_seq OWNED BY public.test_suites.id;

CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON public.test_suites (project_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_deleted_at  ON public.test_suites (deleted_at);

-- ── test_suite_items ──────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.test_suite_items_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public.test_suite_items (
    id            bigint NOT NULL DEFAULT nextval('public.test_suite_items_id_seq'),
    test_suite_id bigint NOT NULL REFERENCES public.test_suites(id) ON DELETE CASCADE,
    test_case_id  bigint NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
    item_order    integer NOT NULL DEFAULT 0,
    created_at    timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT test_suite_items_pkey PRIMARY KEY (id),
    CONSTRAINT test_suite_items_sheet_case_unique UNIQUE (test_suite_id, test_case_id)
);

ALTER SEQUENCE public.test_suite_items_id_seq OWNED BY public.test_suite_items.id;

CREATE INDEX IF NOT EXISTS idx_test_suite_items_sheet_id ON public.test_suite_items (test_suite_id);

-- ── test_suite_runs ───────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.test_suite_runs_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public.test_suite_runs (
    id            bigint NOT NULL DEFAULT nextval('public.test_suite_runs_id_seq'),
    test_suite_id bigint NOT NULL REFERENCES public.test_suites(id) ON DELETE CASCADE,
    status        character varying(20) NOT NULL DEFAULT 'queued',
    triggered_by  bigint REFERENCES public.users(id) ON DELETE SET NULL,
    trigger_type  character varying(20) NOT NULL DEFAULT 'manual',
    started_at    timestamp with time zone,
    completed_at  timestamp with time zone,
    total_cases   integer NOT NULL DEFAULT 0,
    passed        integer NOT NULL DEFAULT 0,
    failed        integer NOT NULL DEFAULT 0,
    errored       integer NOT NULL DEFAULT 0,
    created_at    timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT test_suite_runs_pkey PRIMARY KEY (id),
    CONSTRAINT test_suite_runs_status_check
        CHECK (status IN ('queued','running','completed','failed','cancelled')),
    CONSTRAINT test_suite_runs_trigger_type_check
        CHECK (trigger_type IN ('manual','scheduled'))
);

ALTER SEQUENCE public.test_suite_runs_id_seq OWNED BY public.test_suite_runs.id;

CREATE INDEX IF NOT EXISTS idx_test_suite_runs_suite_id   ON public.test_suite_runs (test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_runs_status     ON public.test_suite_runs (status);
CREATE INDEX IF NOT EXISTS idx_test_suite_runs_created_at ON public.test_suite_runs (created_at DESC);

-- ── test_suite_run_items ──────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.test_suite_run_items_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public.test_suite_run_items (
    id                bigint NOT NULL DEFAULT nextval('public.test_suite_run_items_id_seq'),
    test_suite_run_id bigint NOT NULL REFERENCES public.test_suite_runs(id) ON DELETE CASCADE,
    test_case_id      bigint NOT NULL REFERENCES public.test_cases(id) ON DELETE CASCADE,
    test_run_id       bigint,
    item_order        integer NOT NULL DEFAULT 0,
    status            character varying(20) NOT NULL DEFAULT 'pending',
    created_at        timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT test_suite_run_items_pkey PRIMARY KEY (id),
    CONSTRAINT test_suite_run_items_status_check
        CHECK (status IN ('pending','queued','running','completed','failed','cancelled'))
);

ALTER SEQUENCE public.test_suite_run_items_id_seq OWNED BY public.test_suite_run_items.id;

CREATE INDEX IF NOT EXISTS idx_test_suite_run_items_run_id   ON public.test_suite_run_items (test_suite_run_id);
CREATE INDEX IF NOT EXISTS idx_test_suite_run_items_test_run ON public.test_suite_run_items (test_run_id);

COMMIT;
