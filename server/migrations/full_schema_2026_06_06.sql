-- =========================================================
-- AutoTesting full database schema baseline
-- Created date: 2026-06-06
--
-- Purpose:
--   Consolidates the base schema dump and the current migration chain into
--   one schema-only file for fresh database setup. Existing incremental
--   migration files are intentionally kept unchanged.
--
-- Usage:
--   Run on an empty PostgreSQL database/schema. This file is not intended to
--   be applied on top of an already-migrated database because the base schema
--   contains CREATE TABLE/INDEX/CONSTRAINT statements without IF NOT EXISTS.
--
-- Notes:
--   - COPY data blocks from Automation_testing_DB.sql were removed.
--   - Stale sequence setval(...) calls from the dump were removed.
--   - OWNER TO postgres statements were removed for portability.
--   - Incremental migrations through 023 are appended below.
-- =========================================================


--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-01 04:44:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 258 (class 1259 OID 20074)
-- Name: agent_runtime_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_runtime_configs (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    llm_provider character varying(50) NOT NULL,
    llm_model character varying(100) NOT NULL,
    max_steps integer DEFAULT 30 NOT NULL,
    timeout_seconds integer DEFAULT 300 NOT NULL,
    use_vision boolean DEFAULT true NOT NULL,
    headless boolean DEFAULT true NOT NULL,
    browser_type character varying(30) DEFAULT 'chromium'::character varying NOT NULL,
    allowed_domains jsonb DEFAULT '[]'::jsonb NOT NULL,
    viewport_json jsonb,
    locale character varying(20),
    timezone character varying(100),
    proxy_config_json jsonb,
    output_schema_json jsonb,
    tool_policy_json jsonb,
    extra_config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT agent_runtime_configs_browser_type_check CHECK (((browser_type)::text = ANY ((ARRAY['chromium'::character varying, 'chrome'::character varying, 'firefox'::character varying, 'webkit'::character varying])::text[])))
);



--
-- TOC entry 5511 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE agent_runtime_configs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.agent_runtime_configs IS 'Reusable browser-use runtime profiles (LLM, timeout, domains, vision, tool policy)';


--
-- TOC entry 257 (class 1259 OID 20073)
-- Name: agent_runtime_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agent_runtime_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5512 (class 0 OID 0)
-- Dependencies: 257
-- Name: agent_runtime_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_runtime_configs_id_seq OWNED BY public.agent_runtime_configs.id;


--
-- TOC entry 260 (class 1259 OID 20128)
-- Name: browser_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.browser_profiles (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(30) NOT NULL,
    profile_type character varying(40) NOT NULL,
    profile_ref text,
    profile_data jsonb,
    is_default boolean DEFAULT false NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT browser_profiles_profile_type_check CHECK (((profile_type)::text = ANY ((ARRAY['system_chrome'::character varying, 'storage_state'::character varying, 'cloud_profile'::character varying, 'ephemeral'::character varying])::text[]))),
    CONSTRAINT browser_profiles_provider_check CHECK (((provider)::text = ANY ((ARRAY['local'::character varying, 'cloud'::character varying])::text[])))
);



--
-- TOC entry 5513 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE browser_profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.browser_profiles IS 'Browser auth/profile references such as storage state or cloud profile';


--
-- TOC entry 259 (class 1259 OID 20127)
-- Name: browser_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.browser_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5514 (class 0 OID 0)
-- Dependencies: 259
-- Name: browser_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.browser_profiles_id_seq OWNED BY public.browser_profiles.id;


--
-- TOC entry 246 (class 1259 OID 19934)
-- Name: evidences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evidences (
    id bigint NOT NULL,
    test_run_id bigint NOT NULL,
    run_step_log_id bigint,
    evidence_type character varying(30) NOT NULL,
    file_path text,
    content_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    test_run_attempt_id bigint,
    storage_provider character varying(20) DEFAULT 'local'::character varying NOT NULL,
    mime_type character varying(150),
    file_size_bytes bigint,
    checksum character varying(128),
    page_url text,
    artifact_group character varying(50),
    captured_at timestamp with time zone,
    CONSTRAINT evidences_evidence_type_check CHECK (((evidence_type)::text = ANY ((ARRAY['screenshot'::character varying, 'dom_snapshot'::character varying, 'console_log'::character varying, 'network_log'::character varying, 'video'::character varying, 'trace'::character varying])::text[]))),
    CONSTRAINT evidences_storage_provider_check CHECK (((storage_provider)::text = ANY ((ARRAY['local'::character varying, 'minio'::character varying, 's3'::character varying])::text[])))
);



--
-- TOC entry 5515 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE evidences; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.evidences IS 'Execution evidence such as screenshots and logs';


--
-- TOC entry 5516 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN evidences.test_run_attempt_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.evidences.test_run_attempt_id IS 'Attempt that produced this evidence artifact';


--
-- TOC entry 245 (class 1259 OID 19933)
-- Name: evidences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.evidences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5517 (class 0 OID 0)
-- Dependencies: 245
-- Name: evidences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.evidences_id_seq OWNED BY public.evidences.id;


--
-- TOC entry 272 (class 1259 OID 20368)
-- Name: execution_scripts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.execution_scripts (
    id bigint NOT NULL,
    test_case_version_id bigint,
    source_test_run_id bigint,
    source_attempt_id bigint,
    script_type character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    script_json jsonb NOT NULL,
    params_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    test_case_id bigint
);



--
-- TOC entry 5518 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE execution_scripts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.execution_scripts IS 'Recorded executable scripts for deterministic replay without LLM';


--
-- TOC entry 271 (class 1259 OID 20367)
-- Name: execution_scripts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.execution_scripts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5519 (class 0 OID 0)
-- Dependencies: 271
-- Name: execution_scripts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.execution_scripts_id_seq OWNED BY public.execution_scripts.id;


--
-- TOC entry 248 (class 1259 OID 19962)
-- Name: failure_analyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failure_analyses (
    id bigint NOT NULL,
    test_run_id bigint NOT NULL,
    failed_step jsonb,
    analysis text,
    suggestions jsonb,
    confidence_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    test_run_attempt_id bigint
);



--
-- TOC entry 5520 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE failure_analyses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.failure_analyses IS 'AI failure analysis for failed runs';


--
-- TOC entry 247 (class 1259 OID 19961)
-- Name: failure_analyses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.failure_analyses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5521 (class 0 OID 0)
-- Dependencies: 247
-- Name: failure_analyses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.failure_analyses_id_seq OWNED BY public.failure_analyses.id;


--
-- TOC entry 266 (class 1259 OID 20255)
-- Name: healing_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.healing_applications (
    id bigint NOT NULL,
    healing_suggestion_id bigint NOT NULL,
    applied_to_version_id bigint,
    result_test_run_id bigint,
    result_attempt_id bigint,
    applied_by bigint,
    result_status character varying(30),
    notes text,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT healing_applications_result_status_check CHECK (((result_status)::text = ANY ((ARRAY['pending'::character varying, 'validated'::character varying, 'rejected'::character varying, 'failed'::character varying])::text[])))
);



--
-- TOC entry 5522 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE healing_applications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.healing_applications IS 'Audit trail for applying healing suggestions and validating reruns';


--
-- TOC entry 265 (class 1259 OID 20254)
-- Name: healing_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.healing_applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5523 (class 0 OID 0)
-- Dependencies: 265
-- Name: healing_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.healing_applications_id_seq OWNED BY public.healing_applications.id;


--
-- TOC entry 250 (class 1259 OID 19983)
-- Name: healing_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.healing_suggestions (
    id bigint NOT NULL,
    failure_analysis_id bigint NOT NULL,
    suggestion_type character varying(30) NOT NULL,
    old_value text,
    new_value text,
    reason text,
    confidence_score numeric(5,2),
    is_applied boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT healing_suggestions_suggestion_type_check CHECK (((suggestion_type)::text = ANY ((ARRAY['locator_replace'::character varying, 'wait_adjust'::character varying, 'assert_update'::character varying, 'step_edit'::character varying, 'retry_strategy'::character varying])::text[])))
);



--
-- TOC entry 5524 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE healing_suggestions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.healing_suggestions IS 'Fix suggestions after failure analysis';


--
-- TOC entry 249 (class 1259 OID 19982)
-- Name: healing_suggestions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.healing_suggestions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5525 (class 0 OID 0)
-- Dependencies: 249
-- Name: healing_suggestions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.healing_suggestions_id_seq OWNED BY public.healing_suggestions.id;


--
-- TOC entry 262 (class 1259 OID 20165)
-- Name: project_secrets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_secrets (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    name character varying(150) NOT NULL,
    scope_domain text,
    secret_type character varying(30) NOT NULL,
    encrypted_value text NOT NULL,
    metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_no_login_credentials CHECK (((name)::text <> ALL ((ARRAY['ZING_USERNAME'::character varying, 'ZING_PASSWORD'::character varying])::text[]))),
    CONSTRAINT project_secrets_secret_type_check CHECK (((secret_type)::text = ANY ((ARRAY['password'::character varying, 'token'::character varying, 'otp_seed'::character varying, 'api_key'::character varying, 'cookie'::character varying, 'other'::character varying])::text[])))
);



--
-- TOC entry 5526 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE project_secrets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.project_secrets IS 'Encrypted project-level secrets used by browser automation';


--
-- TOC entry 261 (class 1259 OID 20164)
-- Name: project_secrets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_secrets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5527 (class 0 OID 0)
-- Dependencies: 261
-- Name: project_secrets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_secrets_id_seq OWNED BY public.project_secrets.id;


--
-- TOC entry 224 (class 1259 OID 19581)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    base_url text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5528 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE projects; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.projects IS 'Testing projects created by users';


--
-- TOC entry 223 (class 1259 OID 19580)
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5529 (class 0 OID 0)
-- Dependencies: 223
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- TOC entry 252 (class 1259 OID 20006)
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id bigint NOT NULL,
    test_run_id bigint NOT NULL,
    format character varying(20) NOT NULL,
    file_path text,
    summary jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    test_run_attempt_id bigint,
    CONSTRAINT reports_format_check CHECK (((format)::text = ANY ((ARRAY['pdf'::character varying, 'html'::character varying, 'json'::character varying])::text[])))
);



--
-- TOC entry 5530 (class 0 OID 0)
-- Dependencies: 252
-- Name: TABLE reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.reports IS 'Generated execution reports';


--
-- TOC entry 251 (class 1259 OID 20005)
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5531 (class 0 OID 0)
-- Dependencies: 251
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- TOC entry 244 (class 1259 OID 19910)
-- Name: run_step_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.run_step_logs (
    id bigint NOT NULL,
    test_run_id bigint NOT NULL,
    step_no integer NOT NULL,
    step_title text,
    action character varying(100),
    status character varying(30) NOT NULL,
    message text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    telemetry jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    test_run_attempt_id bigint,
    current_url text,
    action_input_json jsonb,
    action_output_json jsonb,
    model_output_json jsonb,
    thought_text text,
    extracted_content text,
    duration_ms integer,
    CONSTRAINT run_step_logs_status_check CHECK (((status)::text = ANY ((ARRAY['running'::character varying, 'passed'::character varying, 'failed'::character varying, 'skipped'::character varying])::text[])))
);



--
-- TOC entry 5532 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE run_step_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.run_step_logs IS 'Realtime step-level execution logs';


--
-- TOC entry 5533 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN run_step_logs.test_run_attempt_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.run_step_logs.test_run_attempt_id IS 'Attempt that emitted this runtime step log';


--
-- TOC entry 243 (class 1259 OID 19909)
-- Name: run_step_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.run_step_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5534 (class 0 OID 0)
-- Dependencies: 243
-- Name: run_step_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.run_step_logs_id_seq OWNED BY public.run_step_logs.id;


--
-- TOC entry 226 (class 1259 OID 19607)
-- Name: scans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scans (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    status character varying(30) NOT NULL,
    root_url text NOT NULL,
    sitemap jsonb,
    interaction_map jsonb,
    error_message text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scans_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);



--
-- TOC entry 5535 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE scans; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.scans IS 'Website scan/crawl analysis results';


--
-- TOC entry 225 (class 1259 OID 19606)
-- Name: scans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5536 (class 0 OID 0)
-- Dependencies: 225
-- Name: scans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scans_id_seq OWNED BY public.scans.id;


--
-- TOC entry 222 (class 1259 OID 19557)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5537 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sessions IS 'Authentication sessions';


--
-- TOC entry 221 (class 1259 OID 19556)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5538 (class 0 OID 0)
-- Dependencies: 221
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 254 (class 1259 OID 20027)
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5539 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tags IS 'Project-level tags for history filtering';


--
-- TOC entry 253 (class 1259 OID 20026)
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5540 (class 0 OID 0)
-- Dependencies: 253
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- TOC entry 236 (class 1259 OID 19771)
-- Name: test_case_dataset_bindings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_case_dataset_bindings (
    id bigint NOT NULL,
    test_case_id bigint NOT NULL,
    dataset_id bigint NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5541 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE test_case_dataset_bindings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_case_dataset_bindings IS 'Allowed/default datasets for a test case';


--
-- TOC entry 235 (class 1259 OID 19770)
-- Name: test_case_dataset_bindings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_case_dataset_bindings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5542 (class 0 OID 0)
-- Dependencies: 235
-- Name: test_case_dataset_bindings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_case_dataset_bindings_id_seq OWNED BY public.test_case_dataset_bindings.id;


--
-- TOC entry 268 (class 1259 OID 20307)
-- Name: test_case_generation_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_case_generation_batches (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    source_prompt text NOT NULL,
    status character varying(30) DEFAULT 'generated'::character varying NOT NULL,
    llm_provider character varying(50),
    llm_model character varying(100),
    candidate_count integer DEFAULT 0 NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5543 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE test_case_generation_batches; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_case_generation_batches IS 'One prompt can generate multiple candidate test cases for user selection';


--
-- TOC entry 267 (class 1259 OID 20306)
-- Name: test_case_generation_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_case_generation_batches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5544 (class 0 OID 0)
-- Dependencies: 267
-- Name: test_case_generation_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_case_generation_batches_id_seq OWNED BY public.test_case_generation_batches.id;


--
-- TOC entry 270 (class 1259 OID 20335)
-- Name: test_case_generation_candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_case_generation_candidates (
    id bigint NOT NULL,
    batch_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    goal text NOT NULL,
    display_text text,
    prompt_text text,
    execution_mode character varying(30) DEFAULT 'step_based'::character varying NOT NULL,
    plan_snapshot jsonb NOT NULL,
    variables_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    candidate_order integer NOT NULL,
    is_selected boolean DEFAULT false NOT NULL,
    selected_test_case_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5545 (class 0 OID 0)
-- Dependencies: 270
-- Name: TABLE test_case_generation_candidates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_case_generation_candidates IS 'Candidate test cases shown to users before converting into official test_cases';


--
-- TOC entry 269 (class 1259 OID 20334)
-- Name: test_case_generation_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_case_generation_candidates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5546 (class 0 OID 0)
-- Dependencies: 269
-- Name: test_case_generation_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_case_generation_candidates_id_seq OWNED BY public.test_case_generation_candidates.id;


--
-- TOC entry 232 (class 1259 OID 19711)
-- Name: test_case_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_case_versions (
    id bigint NOT NULL,
    test_case_id bigint NOT NULL,
    version_no integer NOT NULL,
    source_type character varying(30) NOT NULL,
    prompt_text text,
    reasoning_trace jsonb,
    plan_snapshot jsonb NOT NULL,
    variables_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_model character varying(100),
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    execution_mode character varying(30) DEFAULT 'step_based'::character varying NOT NULL,
    runtime_config_id bigint,
    display_text text,
    CONSTRAINT test_case_versions_execution_mode_check CHECK (((execution_mode)::text = ANY ((ARRAY['step_based'::character varying, 'goal_based_agent'::character varying, 'hybrid_agent'::character varying, 'replay_script'::character varying])::text[]))),
    CONSTRAINT test_case_versions_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['ai_generated'::character varying, 'user_edited'::character varying, 'healed'::character varying])::text[])))
);



--
-- TOC entry 5547 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE test_case_versions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_case_versions IS 'Version history for AI-generated or edited test plans';


--
-- TOC entry 5548 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN test_case_versions.execution_mode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.test_case_versions.execution_mode IS 'How this test version is executed: step-based, goal-based agent, or hybrid';


--
-- TOC entry 5549 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN test_case_versions.display_text; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.test_case_versions.display_text IS 'Human-readable test case text shown to users, e.g. Test Case / Steps / Expected Result';


--
-- TOC entry 231 (class 1259 OID 19710)
-- Name: test_case_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_case_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5550 (class 0 OID 0)
-- Dependencies: 231
-- Name: test_case_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_case_versions_id_seq OWNED BY public.test_case_versions.id;


--
-- TOC entry 230 (class 1259 OID 19661)
-- Name: test_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_cases (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    scan_id bigint,
    title character varying(255) NOT NULL,
    goal text NOT NULL,
    status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    ai_model character varying(100),
    created_by bigint,
    current_version_id bigint,
    deleted_at timestamp with time zone,
    deleted_by bigint,
    restored_at timestamp with time zone,
    restored_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_cases_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'ready'::character varying, 'archived'::character varying])::text[])))
);



--
-- TOC entry 5551 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE test_cases; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_cases IS 'Logical test definitions under a project';


--
-- TOC entry 229 (class 1259 OID 19660)
-- Name: test_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_cases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5552 (class 0 OID 0)
-- Dependencies: 229
-- Name: test_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_cases_id_seq OWNED BY public.test_cases.id;


--
-- TOC entry 228 (class 1259 OID 19631)
-- Name: test_datasets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_datasets (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    data_mode character varying(20) NOT NULL,
    schema_json jsonb,
    data_json jsonb,
    generator_config jsonb,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT test_datasets_data_mode_check CHECK (((data_mode)::text = ANY ((ARRAY['static_json'::character varying, 'generator'::character varying])::text[])))
);



--
-- TOC entry 5553 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE test_datasets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_datasets IS 'Reusable datasets in JSON or generator mode';


--
-- TOC entry 227 (class 1259 OID 19630)
-- Name: test_datasets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_datasets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5554 (class 0 OID 0)
-- Dependencies: 227
-- Name: test_datasets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_datasets_id_seq OWNED BY public.test_datasets.id;


--
-- TOC entry 264 (class 1259 OID 20199)
-- Name: test_run_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_run_attempts (
    id bigint NOT NULL,
    test_run_id bigint NOT NULL,
    attempt_no integer NOT NULL,
    status character varying(30) NOT NULL,
    verdict character varying(20),
    trigger_type character varying(30) DEFAULT 'initial'::character varying NOT NULL,
    runtime_config_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    browser_profile_snapshot jsonb,
    scan_context_snapshot jsonb,
    agent_prompt text,
    final_result text,
    structured_output jsonb,
    error_message text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_run_attempts_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT test_run_attempts_trigger_type_check CHECK (((trigger_type)::text = ANY ((ARRAY['initial'::character varying, 'retry'::character varying, 'auto_heal'::character varying, 'manual_replay'::character varying])::text[]))),
    CONSTRAINT test_run_attempts_verdict_check CHECK (((verdict)::text = ANY ((ARRAY['pass'::character varying, 'fail'::character varying, 'error'::character varying, 'partial'::character varying])::text[])))
);



--
-- TOC entry 5555 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE test_run_attempts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_run_attempts IS 'Attempt-level execution records inside one logical test run';


--
-- TOC entry 263 (class 1259 OID 20198)
-- Name: test_run_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_run_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5556 (class 0 OID 0)
-- Dependencies: 263
-- Name: test_run_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_run_attempts_id_seq OWNED BY public.test_run_attempts.id;


--
-- TOC entry 242 (class 1259 OID 19885)
-- Name: test_run_dataset_bindings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_run_dataset_bindings (
    id bigint NOT NULL,
    test_run_id bigint NOT NULL,
    dataset_id bigint,
    alias character varying(100),
    dataset_snapshot jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5557 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE test_run_dataset_bindings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_run_dataset_bindings IS 'Exact dataset snapshot used in a run';


--
-- TOC entry 241 (class 1259 OID 19884)
-- Name: test_run_dataset_bindings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_run_dataset_bindings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5558 (class 0 OID 0)
-- Dependencies: 241
-- Name: test_run_dataset_bindings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_run_dataset_bindings_id_seq OWNED BY public.test_run_dataset_bindings.id;


--
-- TOC entry 255 (class 1259 OID 20046)
-- Name: test_run_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_run_tags (
    test_run_id bigint NOT NULL,
    tag_id bigint NOT NULL
);



--
-- TOC entry 5559 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE test_run_tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_run_tags IS 'Many-to-many mapping between runs and tags';


--
-- TOC entry 240 (class 1259 OID 19849)
-- Name: test_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_runs (
    id bigint NOT NULL,
    test_case_id bigint NOT NULL,
    test_case_version_id bigint,
    status character varying(30) NOT NULL,
    verdict character varying(20),
    execution_log jsonb,
    evidence_summary jsonb,
    error_message text,
    triggered_by bigint,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_runs_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT test_runs_verdict_check CHECK (((verdict)::text = ANY ((ARRAY['pass'::character varying, 'fail'::character varying, 'error'::character varying, 'partial'::character varying])::text[])))
);



--
-- TOC entry 5560 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE test_runs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_runs IS 'Execution runs of a test case';


--
-- TOC entry 239 (class 1259 OID 19848)
-- Name: test_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5561 (class 0 OID 0)
-- Dependencies: 239
-- Name: test_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_runs_id_seq OWNED BY public.test_runs.id;


--
-- TOC entry 234 (class 1259 OID 19748)
-- Name: test_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_steps (
    id bigint NOT NULL,
    test_case_version_id bigint NOT NULL,
    step_order integer NOT NULL,
    action_type character varying(50) NOT NULL,
    target jsonb,
    input_data jsonb,
    expected_result text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5562 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE test_steps; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_steps IS 'Normalized steps per test case version';


--
-- TOC entry 233 (class 1259 OID 19747)
-- Name: test_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_steps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5563 (class 0 OID 0)
-- Dependencies: 233
-- Name: test_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_steps_id_seq OWNED BY public.test_steps.id;


--
-- TOC entry 238 (class 1259 OID 19799)
-- Name: test_tree_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_tree_nodes (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    parent_id bigint,
    node_type character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    test_case_id bigint,
    dataset_id bigint,
    sort_order integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_test_tree_node_ref CHECK (((((node_type)::text = 'folder'::text) AND (test_case_id IS NULL) AND (dataset_id IS NULL)) OR (((node_type)::text = 'test_case'::text) AND (test_case_id IS NOT NULL) AND (dataset_id IS NULL)) OR (((node_type)::text = 'dataset'::text) AND (test_case_id IS NULL) AND (dataset_id IS NOT NULL)))),
    CONSTRAINT test_tree_nodes_node_type_check CHECK (((node_type)::text = ANY ((ARRAY['folder'::character varying, 'test_case'::character varying, 'dataset'::character varying])::text[])))
);



--
-- TOC entry 5564 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE test_tree_nodes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.test_tree_nodes IS 'Folder/tree structure for tests and datasets';


--
-- TOC entry 237 (class 1259 OID 19798)
-- Name: test_tree_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_tree_nodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5565 (class 0 OID 0)
-- Dependencies: 237
-- Name: test_tree_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_tree_nodes_id_seq OWNED BY public.test_tree_nodes.id;


--
-- TOC entry 220 (class 1259 OID 19538)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(150) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 5566 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'System users';


--
-- TOC entry 219 (class 1259 OID 19537)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5567 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 256 (class 1259 OID 20063)
-- Name: v_test_history; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_test_history AS
 SELECT tr.id AS run_id,
    tr.created_at AS run_time,
    tr.status,
    tr.verdict,
    tc.title AS test_title,
    tc.goal,
    p.name AS project_name,
    p.base_url,
    COALESCE(json_agg(DISTINCT tg.name) FILTER (WHERE (tg.name IS NOT NULL)), '[]'::json) AS tags
   FROM ((((public.test_runs tr
     JOIN public.test_cases tc ON ((tr.test_case_id = tc.id)))
     JOIN public.projects p ON ((tc.project_id = p.id)))
     LEFT JOIN public.test_run_tags trt ON ((tr.id = trt.test_run_id)))
     LEFT JOIN public.tags tg ON ((trt.tag_id = tg.id)))
  GROUP BY tr.id, tr.created_at, tr.status, tr.verdict, tc.title, tc.goal, p.name, p.base_url;


--
-- TOC entry 5568 (class 0 OID 0)
-- Dependencies: 256
-- Name: VIEW v_test_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_test_history IS 'Search-oriented aggregated view of test execution history';


--
-- TOC entry 5037 (class 2604 OID 20077)
-- Name: agent_runtime_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_runtime_configs ALTER COLUMN id SET DEFAULT nextval('public.agent_runtime_configs_id_seq'::regclass);


--
-- TOC entry 5047 (class 2604 OID 20131)
-- Name: browser_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.browser_profiles ALTER COLUMN id SET DEFAULT nextval('public.browser_profiles_id_seq'::regclass);


--
-- TOC entry 5025 (class 2604 OID 19937)
-- Name: evidences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidences ALTER COLUMN id SET DEFAULT nextval('public.evidences_id_seq'::regclass);


--
-- TOC entry 5071 (class 2604 OID 20371)
-- Name: execution_scripts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts ALTER COLUMN id SET DEFAULT nextval('public.execution_scripts_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 19965)
-- Name: failure_analyses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failure_analyses ALTER COLUMN id SET DEFAULT nextval('public.failure_analyses_id_seq'::regclass);


--
-- TOC entry 5059 (class 2604 OID 20258)
-- Name: healing_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications ALTER COLUMN id SET DEFAULT nextval('public.healing_applications_id_seq'::regclass);


--
-- TOC entry 5030 (class 2604 OID 19986)
-- Name: healing_suggestions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_suggestions ALTER COLUMN id SET DEFAULT nextval('public.healing_suggestions_id_seq'::regclass);


--
-- TOC entry 5051 (class 2604 OID 20168)
-- Name: project_secrets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_secrets ALTER COLUMN id SET DEFAULT nextval('public.project_secrets_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 19584)
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- TOC entry 5033 (class 2604 OID 20009)
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- TOC entry 5023 (class 2604 OID 19913)
-- Name: run_step_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.run_step_logs ALTER COLUMN id SET DEFAULT nextval('public.run_step_logs_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 19610)
-- Name: scans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scans ALTER COLUMN id SET DEFAULT nextval('public.scans_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 19560)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 5035 (class 2604 OID 20030)
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- TOC entry 5013 (class 2604 OID 19774)
-- Name: test_case_dataset_bindings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_dataset_bindings ALTER COLUMN id SET DEFAULT nextval('public.test_case_dataset_bindings_id_seq'::regclass);


--
-- TOC entry 5062 (class 2604 OID 20310)
-- Name: test_case_generation_batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_batches ALTER COLUMN id SET DEFAULT nextval('public.test_case_generation_batches_id_seq'::regclass);


--
-- TOC entry 5066 (class 2604 OID 20338)
-- Name: test_case_generation_candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_candidates ALTER COLUMN id SET DEFAULT nextval('public.test_case_generation_candidates_id_seq'::regclass);


--
-- TOC entry 5007 (class 2604 OID 19714)
-- Name: test_case_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_versions ALTER COLUMN id SET DEFAULT nextval('public.test_case_versions_id_seq'::regclass);


--
-- TOC entry 5003 (class 2604 OID 19664)
-- Name: test_cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases ALTER COLUMN id SET DEFAULT nextval('public.test_cases_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 19634)
-- Name: test_datasets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_datasets ALTER COLUMN id SET DEFAULT nextval('public.test_datasets_id_seq'::regclass);


--
-- TOC entry 5055 (class 2604 OID 20202)
-- Name: test_run_attempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_attempts ALTER COLUMN id SET DEFAULT nextval('public.test_run_attempts_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 19888)
-- Name: test_run_dataset_bindings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_dataset_bindings ALTER COLUMN id SET DEFAULT nextval('public.test_run_dataset_bindings_id_seq'::regclass);


--
-- TOC entry 5019 (class 2604 OID 19852)
-- Name: test_runs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_runs ALTER COLUMN id SET DEFAULT nextval('public.test_runs_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 19751)
-- Name: test_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_steps ALTER COLUMN id SET DEFAULT nextval('public.test_steps_id_seq'::regclass);


--
-- TOC entry 5016 (class 2604 OID 19802)
-- Name: test_tree_nodes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes ALTER COLUMN id SET DEFAULT nextval('public.test_tree_nodes_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 19541)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5491 (class 0 OID 20074)
-- Dependencies: 258
-- Data for Name: agent_runtime_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5493 (class 0 OID 20128)
-- Dependencies: 260
-- Data for Name: browser_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5480 (class 0 OID 19934)
-- Dependencies: 246
-- Data for Name: evidences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5505 (class 0 OID 20368)
-- Dependencies: 272
-- Data for Name: execution_scripts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5482 (class 0 OID 19962)
-- Dependencies: 248
-- Data for Name: failure_analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5499 (class 0 OID 20255)
-- Dependencies: 266
-- Data for Name: healing_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5484 (class 0 OID 19983)
-- Dependencies: 250
-- Data for Name: healing_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5495 (class 0 OID 20165)
-- Dependencies: 262
-- Data for Name: project_secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5458 (class 0 OID 19581)
-- Dependencies: 224
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5486 (class 0 OID 20006)
-- Dependencies: 252
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5478 (class 0 OID 19910)
-- Dependencies: 244
-- Data for Name: run_step_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5460 (class 0 OID 19607)
-- Dependencies: 226
-- Data for Name: scans; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5456 (class 0 OID 19557)
-- Dependencies: 222
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5488 (class 0 OID 20027)
-- Dependencies: 254
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5470 (class 0 OID 19771)
-- Dependencies: 236
-- Data for Name: test_case_dataset_bindings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5501 (class 0 OID 20307)
-- Dependencies: 268
-- Data for Name: test_case_generation_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5503 (class 0 OID 20335)
-- Dependencies: 270
-- Data for Name: test_case_generation_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5466 (class 0 OID 19711)
-- Dependencies: 232
-- Data for Name: test_case_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5464 (class 0 OID 19661)
-- Dependencies: 230
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5462 (class 0 OID 19631)
-- Dependencies: 228
-- Data for Name: test_datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5497 (class 0 OID 20199)
-- Dependencies: 264
-- Data for Name: test_run_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5476 (class 0 OID 19885)
-- Dependencies: 242
-- Data for Name: test_run_dataset_bindings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5489 (class 0 OID 20046)
-- Dependencies: 255
-- Data for Name: test_run_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5474 (class 0 OID 19849)
-- Dependencies: 240
-- Data for Name: test_runs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5468 (class 0 OID 19748)
-- Dependencies: 234
-- Data for Name: test_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5472 (class 0 OID 19799)
-- Dependencies: 238
-- Data for Name: test_tree_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5454 (class 0 OID 19538)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5569 (class 0 OID 0)
-- Dependencies: 257
-- Name: agent_runtime_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5570 (class 0 OID 0)
-- Dependencies: 259
-- Name: browser_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5571 (class 0 OID 0)
-- Dependencies: 245
-- Name: evidences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5572 (class 0 OID 0)
-- Dependencies: 271
-- Name: execution_scripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5573 (class 0 OID 0)
-- Dependencies: 247
-- Name: failure_analyses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5574 (class 0 OID 0)
-- Dependencies: 265
-- Name: healing_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5575 (class 0 OID 0)
-- Dependencies: 249
-- Name: healing_suggestions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5576 (class 0 OID 0)
-- Dependencies: 261
-- Name: project_secrets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5577 (class 0 OID 0)
-- Dependencies: 223
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5578 (class 0 OID 0)
-- Dependencies: 251
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5579 (class 0 OID 0)
-- Dependencies: 243
-- Name: run_step_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5580 (class 0 OID 0)
-- Dependencies: 225
-- Name: scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5581 (class 0 OID 0)
-- Dependencies: 221
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5582 (class 0 OID 0)
-- Dependencies: 253
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5583 (class 0 OID 0)
-- Dependencies: 235
-- Name: test_case_dataset_bindings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5584 (class 0 OID 0)
-- Dependencies: 267
-- Name: test_case_generation_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5585 (class 0 OID 0)
-- Dependencies: 269
-- Name: test_case_generation_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5586 (class 0 OID 0)
-- Dependencies: 231
-- Name: test_case_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5587 (class 0 OID 0)
-- Dependencies: 229
-- Name: test_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5588 (class 0 OID 0)
-- Dependencies: 227
-- Name: test_datasets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5589 (class 0 OID 0)
-- Dependencies: 263
-- Name: test_run_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5590 (class 0 OID 0)
-- Dependencies: 241
-- Name: test_run_dataset_bindings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5591 (class 0 OID 0)
-- Dependencies: 239
-- Name: test_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5592 (class 0 OID 0)
-- Dependencies: 233
-- Name: test_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5593 (class 0 OID 0)
-- Dependencies: 237
-- Name: test_tree_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5594 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- TOC entry 5204 (class 2606 OID 20105)
-- Name: agent_runtime_configs agent_runtime_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_runtime_configs
    ADD CONSTRAINT agent_runtime_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 5206 (class 2606 OID 20107)
-- Name: agent_runtime_configs agent_runtime_configs_project_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_runtime_configs
    ADD CONSTRAINT agent_runtime_configs_project_id_name_key UNIQUE (project_id, name);


--
-- TOC entry 5210 (class 2606 OID 20148)
-- Name: browser_profiles browser_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.browser_profiles
    ADD CONSTRAINT browser_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5212 (class 2606 OID 20150)
-- Name: browser_profiles browser_profiles_project_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.browser_profiles
    ADD CONSTRAINT browser_profiles_project_id_name_key UNIQUE (project_id, name);


--
-- TOC entry 5178 (class 2606 OID 19947)
-- Name: evidences evidences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidences
    ADD CONSTRAINT evidences_pkey PRIMARY KEY (id);


--
-- TOC entry 5240 (class 2606 OID 20386)
-- Name: execution_scripts execution_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts
    ADD CONSTRAINT execution_scripts_pkey PRIMARY KEY (id);


--
-- TOC entry 5185 (class 2606 OID 19973)
-- Name: failure_analyses failure_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failure_analyses
    ADD CONSTRAINT failure_analyses_pkey PRIMARY KEY (id);


--
-- TOC entry 5229 (class 2606 OID 20269)
-- Name: healing_applications healing_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications
    ADD CONSTRAINT healing_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 5190 (class 2606 OID 19998)
-- Name: healing_suggestions healing_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_suggestions
    ADD CONSTRAINT healing_suggestions_pkey PRIMARY KEY (id);


--
-- TOC entry 5219 (class 2606 OID 20184)
-- Name: project_secrets project_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_secrets
    ADD CONSTRAINT project_secrets_pkey PRIMARY KEY (id);


--
-- TOC entry 5112 (class 2606 OID 19598)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 5195 (class 2606 OID 20019)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- TOC entry 5174 (class 2606 OID 19924)
-- Name: run_step_logs run_step_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.run_step_logs
    ADD CONSTRAINT run_step_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 19621)
-- Name: scans scans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scans
    ADD CONSTRAINT scans_pkey PRIMARY KEY (id);


--
-- TOC entry 5106 (class 2606 OID 19570)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5108 (class 2606 OID 19572)
-- Name: sessions sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 5198 (class 2606 OID 20037)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- TOC entry 5200 (class 2606 OID 20039)
-- Name: tags tags_project_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_project_id_name_key UNIQUE (project_id, name);


--
-- TOC entry 5144 (class 2606 OID 19783)
-- Name: test_case_dataset_bindings test_case_dataset_bindings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_dataset_bindings
    ADD CONSTRAINT test_case_dataset_bindings_pkey PRIMARY KEY (id);


--
-- TOC entry 5146 (class 2606 OID 19785)
-- Name: test_case_dataset_bindings test_case_dataset_bindings_test_case_id_dataset_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_dataset_bindings
    ADD CONSTRAINT test_case_dataset_bindings_test_case_id_dataset_id_key UNIQUE (test_case_id, dataset_id);


--
-- TOC entry 5234 (class 2606 OID 20323)
-- Name: test_case_generation_batches test_case_generation_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_batches
    ADD CONSTRAINT test_case_generation_batches_pkey PRIMARY KEY (id);


--
-- TOC entry 5237 (class 2606 OID 20356)
-- Name: test_case_generation_candidates test_case_generation_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_candidates
    ADD CONSTRAINT test_case_generation_candidates_pkey PRIMARY KEY (id);


--
-- TOC entry 5133 (class 2606 OID 19728)
-- Name: test_case_versions test_case_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_versions
    ADD CONSTRAINT test_case_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 5135 (class 2606 OID 19730)
-- Name: test_case_versions test_case_versions_test_case_id_version_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_versions
    ADD CONSTRAINT test_case_versions_test_case_id_version_no_key UNIQUE (test_case_id, version_no);


--
-- TOC entry 5128 (class 2606 OID 19679)
-- Name: test_cases test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_pkey PRIMARY KEY (id);


--
-- TOC entry 5121 (class 2606 OID 19647)
-- Name: test_datasets test_datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_datasets
    ADD CONSTRAINT test_datasets_pkey PRIMARY KEY (id);


--
-- TOC entry 5225 (class 2606 OID 20219)
-- Name: test_run_attempts test_run_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_attempts
    ADD CONSTRAINT test_run_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 5227 (class 2606 OID 20221)
-- Name: test_run_attempts test_run_attempts_test_run_id_attempt_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_attempts
    ADD CONSTRAINT test_run_attempts_test_run_id_attempt_no_key UNIQUE (test_run_id, attempt_no);


--
-- TOC entry 5167 (class 2606 OID 19897)
-- Name: test_run_dataset_bindings test_run_dataset_bindings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_dataset_bindings
    ADD CONSTRAINT test_run_dataset_bindings_pkey PRIMARY KEY (id);


--
-- TOC entry 5202 (class 2606 OID 20052)
-- Name: test_run_tags test_run_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_tags
    ADD CONSTRAINT test_run_tags_pkey PRIMARY KEY (test_run_id, tag_id);


--
-- TOC entry 5164 (class 2606 OID 19863)
-- Name: test_runs test_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_pkey PRIMARY KEY (id);


--
-- TOC entry 5138 (class 2606 OID 19761)
-- Name: test_steps test_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_steps
    ADD CONSTRAINT test_steps_pkey PRIMARY KEY (id);


--
-- TOC entry 5140 (class 2606 OID 19763)
-- Name: test_steps test_steps_test_case_version_id_step_order_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_steps
    ADD CONSTRAINT test_steps_test_case_version_id_step_order_key UNIQUE (test_case_version_id, step_order);


--
-- TOC entry 5153 (class 2606 OID 19818)
-- Name: test_tree_nodes test_tree_nodes_dataset_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_dataset_id_key UNIQUE (dataset_id);


--
-- TOC entry 5155 (class 2606 OID 19814)
-- Name: test_tree_nodes test_tree_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_pkey PRIMARY KEY (id);


--
-- TOC entry 5157 (class 2606 OID 19816)
-- Name: test_tree_nodes test_tree_nodes_test_case_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_test_case_id_key UNIQUE (test_case_id);


--
-- TOC entry 5176 (class 2606 OID 20462)
-- Name: run_step_logs uq_run_step_logs_attempt_step; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.run_step_logs
    ADD CONSTRAINT uq_run_step_logs_attempt_step UNIQUE (test_run_attempt_id, step_no);


--
-- TOC entry 5100 (class 2606 OID 19555)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5102 (class 2606 OID 19553)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5207 (class 1259 OID 20119)
-- Name: idx_agent_runtime_configs_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_runtime_configs_deleted_at ON public.agent_runtime_configs USING btree (deleted_at);


--
-- TOC entry 5208 (class 1259 OID 20118)
-- Name: idx_agent_runtime_configs_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agent_runtime_configs_project_id ON public.agent_runtime_configs USING btree (project_id);


--
-- TOC entry 5213 (class 1259 OID 20162)
-- Name: idx_browser_profiles_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_browser_profiles_deleted_at ON public.browser_profiles USING btree (deleted_at);


--
-- TOC entry 5214 (class 1259 OID 20161)
-- Name: idx_browser_profiles_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_browser_profiles_project_id ON public.browser_profiles USING btree (project_id);


--
-- TOC entry 5179 (class 1259 OID 20246)
-- Name: idx_evidences_artifact_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidences_artifact_group ON public.evidences USING btree (artifact_group);


--
-- TOC entry 5180 (class 1259 OID 20245)
-- Name: idx_evidences_attempt_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidences_attempt_id ON public.evidences USING btree (test_run_attempt_id);


--
-- TOC entry 5181 (class 1259 OID 19959)
-- Name: idx_evidences_step_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidences_step_id ON public.evidences USING btree (run_step_log_id);


--
-- TOC entry 5182 (class 1259 OID 19958)
-- Name: idx_evidences_test_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidences_test_run_id ON public.evidences USING btree (test_run_id);


--
-- TOC entry 5183 (class 1259 OID 19960)
-- Name: idx_evidences_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidences_type ON public.evidences USING btree (evidence_type);


--
-- TOC entry 5241 (class 1259 OID 20411)
-- Name: idx_execution_scripts_attempt_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_execution_scripts_attempt_id ON public.execution_scripts USING btree (source_attempt_id);


--
-- TOC entry 5242 (class 1259 OID 20419)
-- Name: idx_execution_scripts_test_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_execution_scripts_test_case_id ON public.execution_scripts USING btree (test_case_id);


--
-- TOC entry 5243 (class 1259 OID 20410)
-- Name: idx_execution_scripts_version_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_execution_scripts_version_id ON public.execution_scripts USING btree (test_case_version_id);


--
-- TOC entry 5186 (class 1259 OID 19981)
-- Name: idx_failure_analyses_test_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_failure_analyses_test_run_id ON public.failure_analyses USING btree (test_run_id);


--
-- TOC entry 5187 (class 1259 OID 20253)
-- Name: idx_failure_analyses_test_run_id_nonuniq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_failure_analyses_test_run_id_nonuniq ON public.failure_analyses USING btree (test_run_id);


--
-- TOC entry 5230 (class 1259 OID 20296)
-- Name: idx_healing_applications_result_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_healing_applications_result_run_id ON public.healing_applications USING btree (result_test_run_id);


--
-- TOC entry 5231 (class 1259 OID 20295)
-- Name: idx_healing_applications_suggestion_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_healing_applications_suggestion_id ON public.healing_applications USING btree (healing_suggestion_id);


--
-- TOC entry 5191 (class 1259 OID 20004)
-- Name: idx_healing_suggestions_failure_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_healing_suggestions_failure_id ON public.healing_suggestions USING btree (failure_analysis_id);


--
-- TOC entry 5216 (class 1259 OID 20196)
-- Name: idx_project_secrets_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_secrets_deleted_at ON public.project_secrets USING btree (deleted_at);


--
-- TOC entry 5217 (class 1259 OID 20195)
-- Name: idx_project_secrets_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_project_secrets_project_id ON public.project_secrets USING btree (project_id);


--
-- TOC entry 5109 (class 1259 OID 19605)
-- Name: idx_projects_base_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_base_url ON public.projects USING btree (base_url);


--
-- TOC entry 5110 (class 1259 OID 19604)
-- Name: idx_projects_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);


--
-- TOC entry 5192 (class 1259 OID 20302)
-- Name: idx_reports_attempt_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_attempt_id ON public.reports USING btree (test_run_attempt_id);


--
-- TOC entry 5193 (class 1259 OID 20025)
-- Name: idx_reports_test_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_test_run_id ON public.reports USING btree (test_run_id);


--
-- TOC entry 5168 (class 1259 OID 20235)
-- Name: idx_run_step_logs_attempt_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_run_step_logs_attempt_id ON public.run_step_logs USING btree (test_run_attempt_id);


--
-- TOC entry 5169 (class 1259 OID 20236)
-- Name: idx_run_step_logs_attempt_step_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_run_step_logs_attempt_step_no ON public.run_step_logs USING btree (test_run_attempt_id, step_no);


--
-- TOC entry 5170 (class 1259 OID 19931)
-- Name: idx_run_step_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_run_step_logs_status ON public.run_step_logs USING btree (status);


--
-- TOC entry 5171 (class 1259 OID 19932)
-- Name: idx_run_step_logs_step_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_run_step_logs_step_no ON public.run_step_logs USING btree (test_run_id, step_no);


--
-- TOC entry 5172 (class 1259 OID 19930)
-- Name: idx_run_step_logs_test_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_run_step_logs_test_run_id ON public.run_step_logs USING btree (test_run_id);


--
-- TOC entry 5113 (class 1259 OID 19629)
-- Name: idx_scans_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scans_created_at ON public.scans USING btree (created_at DESC);


--
-- TOC entry 5114 (class 1259 OID 19627)
-- Name: idx_scans_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scans_project_id ON public.scans USING btree (project_id);


--
-- TOC entry 5115 (class 1259 OID 19628)
-- Name: idx_scans_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scans_status ON public.scans USING btree (status);


--
-- TOC entry 5103 (class 1259 OID 19579)
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- TOC entry 5104 (class 1259 OID 19578)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 5196 (class 1259 OID 20045)
-- Name: idx_tags_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tags_project_id ON public.tags USING btree (project_id);


--
-- TOC entry 5141 (class 1259 OID 19797)
-- Name: idx_tc_dataset_bindings_dataset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_dataset_bindings_dataset_id ON public.test_case_dataset_bindings USING btree (dataset_id);


--
-- TOC entry 5142 (class 1259 OID 19796)
-- Name: idx_tc_dataset_bindings_test_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_dataset_bindings_test_case_id ON public.test_case_dataset_bindings USING btree (test_case_id);


--
-- TOC entry 5232 (class 1259 OID 20407)
-- Name: idx_tc_generation_batches_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_generation_batches_project_id ON public.test_case_generation_batches USING btree (project_id);


--
-- TOC entry 5235 (class 1259 OID 20408)
-- Name: idx_tc_generation_candidates_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tc_generation_candidates_batch_id ON public.test_case_generation_candidates USING btree (batch_id);


--
-- TOC entry 5129 (class 1259 OID 20126)
-- Name: idx_test_case_versions_execution_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_case_versions_execution_mode ON public.test_case_versions USING btree (execution_mode);


--
-- TOC entry 5130 (class 1259 OID 20125)
-- Name: idx_test_case_versions_runtime_config_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_case_versions_runtime_config_id ON public.test_case_versions USING btree (runtime_config_id);


--
-- TOC entry 5131 (class 1259 OID 19741)
-- Name: idx_test_case_versions_test_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_case_versions_test_case_id ON public.test_case_versions USING btree (test_case_id);


--
-- TOC entry 5122 (class 1259 OID 19707)
-- Name: idx_test_cases_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_cases_deleted_at ON public.test_cases USING btree (deleted_at);


--
-- TOC entry 5123 (class 1259 OID 19708)
-- Name: idx_test_cases_goal_fts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_cases_goal_fts ON public.test_cases USING gin (to_tsvector('simple'::regconfig, goal));


--
-- TOC entry 5124 (class 1259 OID 19705)
-- Name: idx_test_cases_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_cases_project_id ON public.test_cases USING btree (project_id);


--
-- TOC entry 5125 (class 1259 OID 19706)
-- Name: idx_test_cases_scan_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_cases_scan_id ON public.test_cases USING btree (scan_id);


--
-- TOC entry 5126 (class 1259 OID 19709)
-- Name: idx_test_cases_title_fts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_cases_title_fts ON public.test_cases USING gin (to_tsvector('simple'::regconfig, (title)::text));


--
-- TOC entry 5118 (class 1259 OID 19659)
-- Name: idx_test_datasets_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_datasets_deleted_at ON public.test_datasets USING btree (deleted_at);


--
-- TOC entry 5119 (class 1259 OID 19658)
-- Name: idx_test_datasets_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_datasets_project_id ON public.test_datasets USING btree (project_id);


--
-- TOC entry 5221 (class 1259 OID 20228)
-- Name: idx_test_run_attempts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_run_attempts_status ON public.test_run_attempts USING btree (status);


--
-- TOC entry 5222 (class 1259 OID 20227)
-- Name: idx_test_run_attempts_test_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_run_attempts_test_run_id ON public.test_run_attempts USING btree (test_run_id);


--
-- TOC entry 5223 (class 1259 OID 20229)
-- Name: idx_test_run_attempts_verdict; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_run_attempts_verdict ON public.test_run_attempts USING btree (verdict);


--
-- TOC entry 5158 (class 1259 OID 19883)
-- Name: idx_test_runs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_runs_created_at ON public.test_runs USING btree (created_at DESC);


--
-- TOC entry 5159 (class 1259 OID 19881)
-- Name: idx_test_runs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_runs_status ON public.test_runs USING btree (status);


--
-- TOC entry 5160 (class 1259 OID 19879)
-- Name: idx_test_runs_test_case_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_runs_test_case_id ON public.test_runs USING btree (test_case_id);


--
-- TOC entry 5161 (class 1259 OID 19880)
-- Name: idx_test_runs_test_case_version_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_runs_test_case_version_id ON public.test_runs USING btree (test_case_version_id);


--
-- TOC entry 5162 (class 1259 OID 19882)
-- Name: idx_test_runs_verdict; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_runs_verdict ON public.test_runs USING btree (verdict);


--
-- TOC entry 5136 (class 1259 OID 19769)
-- Name: idx_test_steps_version_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_steps_version_id ON public.test_steps USING btree (test_case_version_id);


--
-- TOC entry 5148 (class 1259 OID 19846)
-- Name: idx_test_tree_nodes_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_tree_nodes_deleted_at ON public.test_tree_nodes USING btree (deleted_at);


--
-- TOC entry 5149 (class 1259 OID 19845)
-- Name: idx_test_tree_nodes_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_tree_nodes_parent_id ON public.test_tree_nodes USING btree (parent_id);


--
-- TOC entry 5150 (class 1259 OID 19844)
-- Name: idx_test_tree_nodes_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_tree_nodes_project_id ON public.test_tree_nodes USING btree (project_id);


--
-- TOC entry 5151 (class 1259 OID 19847)
-- Name: idx_test_tree_nodes_sort_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_tree_nodes_sort_order ON public.test_tree_nodes USING btree (project_id, parent_id, sort_order);


--
-- TOC entry 5165 (class 1259 OID 19908)
-- Name: idx_tr_dataset_bindings_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tr_dataset_bindings_run_id ON public.test_run_dataset_bindings USING btree (test_run_id);


--
-- TOC entry 5215 (class 1259 OID 20163)
-- Name: uq_browser_profiles_one_default_per_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_browser_profiles_one_default_per_project ON public.browser_profiles USING btree (project_id) WHERE ((is_default = true) AND (deleted_at IS NULL));


--
-- TOC entry 5188 (class 1259 OID 20252)
-- Name: uq_failure_analyses_attempt_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_failure_analyses_attempt_id ON public.failure_analyses USING btree (test_run_attempt_id) WHERE (test_run_attempt_id IS NOT NULL);


--
-- TOC entry 5220 (class 1259 OID 20197)
-- Name: uq_project_secrets_project_name_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_project_secrets_project_name_scope ON public.project_secrets USING btree (project_id, name, COALESCE(scope_domain, ''::text));


--
-- TOC entry 5238 (class 1259 OID 20409)
-- Name: uq_tc_generation_candidates_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_tc_generation_candidates_order ON public.test_case_generation_candidates USING btree (batch_id, candidate_order);


--
-- TOC entry 5147 (class 1259 OID 20068)
-- Name: uq_test_case_one_default_dataset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_test_case_one_default_dataset ON public.test_case_dataset_bindings USING btree (test_case_id) WHERE (is_default = true);


--
-- TOC entry 5284 (class 2606 OID 20113)
-- Name: agent_runtime_configs agent_runtime_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_runtime_configs
    ADD CONSTRAINT agent_runtime_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5285 (class 2606 OID 20108)
-- Name: agent_runtime_configs agent_runtime_configs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_runtime_configs
    ADD CONSTRAINT agent_runtime_configs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5286 (class 2606 OID 20156)
-- Name: browser_profiles browser_profiles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.browser_profiles
    ADD CONSTRAINT browser_profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5287 (class 2606 OID 20151)
-- Name: browser_profiles browser_profiles_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.browser_profiles
    ADD CONSTRAINT browser_profiles_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5273 (class 2606 OID 19953)
-- Name: evidences evidences_run_step_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidences
    ADD CONSTRAINT evidences_run_step_log_id_fkey FOREIGN KEY (run_step_log_id) REFERENCES public.run_step_logs(id) ON DELETE SET NULL;


--
-- TOC entry 5274 (class 2606 OID 20239)
-- Name: evidences evidences_test_run_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidences
    ADD CONSTRAINT evidences_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 5275 (class 2606 OID 19948)
-- Name: evidences evidences_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evidences
    ADD CONSTRAINT evidences_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5300 (class 2606 OID 20402)
-- Name: execution_scripts execution_scripts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts
    ADD CONSTRAINT execution_scripts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5301 (class 2606 OID 20397)
-- Name: execution_scripts execution_scripts_source_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts
    ADD CONSTRAINT execution_scripts_source_attempt_id_fkey FOREIGN KEY (source_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE SET NULL;


--
-- TOC entry 5302 (class 2606 OID 20392)
-- Name: execution_scripts execution_scripts_source_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts
    ADD CONSTRAINT execution_scripts_source_test_run_id_fkey FOREIGN KEY (source_test_run_id) REFERENCES public.test_runs(id) ON DELETE SET NULL;


--
-- TOC entry 5303 (class 2606 OID 20414)
-- Name: execution_scripts execution_scripts_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts
    ADD CONSTRAINT execution_scripts_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE SET NULL;


--
-- TOC entry 5304 (class 2606 OID 20387)
-- Name: execution_scripts execution_scripts_test_case_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.execution_scripts
    ADD CONSTRAINT execution_scripts_test_case_version_id_fkey FOREIGN KEY (test_case_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;


--
-- TOC entry 5276 (class 2606 OID 20247)
-- Name: failure_analyses failure_analyses_test_run_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failure_analyses
    ADD CONSTRAINT failure_analyses_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 5277 (class 2606 OID 19976)
-- Name: failure_analyses failure_analyses_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failure_analyses
    ADD CONSTRAINT failure_analyses_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5249 (class 2606 OID 19742)
-- Name: test_cases fk_test_cases_current_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT fk_test_cases_current_version FOREIGN KEY (current_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;


--
-- TOC entry 5291 (class 2606 OID 20290)
-- Name: healing_applications healing_applications_applied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications
    ADD CONSTRAINT healing_applications_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5292 (class 2606 OID 20275)
-- Name: healing_applications healing_applications_applied_to_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications
    ADD CONSTRAINT healing_applications_applied_to_version_id_fkey FOREIGN KEY (applied_to_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;


--
-- TOC entry 5293 (class 2606 OID 20270)
-- Name: healing_applications healing_applications_healing_suggestion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications
    ADD CONSTRAINT healing_applications_healing_suggestion_id_fkey FOREIGN KEY (healing_suggestion_id) REFERENCES public.healing_suggestions(id) ON DELETE CASCADE;


--
-- TOC entry 5294 (class 2606 OID 20285)
-- Name: healing_applications healing_applications_result_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications
    ADD CONSTRAINT healing_applications_result_attempt_id_fkey FOREIGN KEY (result_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE SET NULL;


--
-- TOC entry 5295 (class 2606 OID 20280)
-- Name: healing_applications healing_applications_result_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_applications
    ADD CONSTRAINT healing_applications_result_test_run_id_fkey FOREIGN KEY (result_test_run_id) REFERENCES public.test_runs(id) ON DELETE SET NULL;


--
-- TOC entry 5278 (class 2606 OID 19999)
-- Name: healing_suggestions healing_suggestions_failure_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.healing_suggestions
    ADD CONSTRAINT healing_suggestions_failure_analysis_id_fkey FOREIGN KEY (failure_analysis_id) REFERENCES public.failure_analyses(id) ON DELETE CASCADE;


--
-- TOC entry 5288 (class 2606 OID 20190)
-- Name: project_secrets project_secrets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_secrets
    ADD CONSTRAINT project_secrets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5289 (class 2606 OID 20185)
-- Name: project_secrets project_secrets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_secrets
    ADD CONSTRAINT project_secrets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5245 (class 2606 OID 19599)
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5279 (class 2606 OID 20297)
-- Name: reports reports_test_run_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE SET NULL;


--
-- TOC entry 5280 (class 2606 OID 20020)
-- Name: reports reports_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5271 (class 2606 OID 20230)
-- Name: run_step_logs run_step_logs_test_run_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.run_step_logs
    ADD CONSTRAINT run_step_logs_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 5272 (class 2606 OID 19925)
-- Name: run_step_logs run_step_logs_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.run_step_logs
    ADD CONSTRAINT run_step_logs_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5246 (class 2606 OID 19622)
-- Name: scans scans_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scans
    ADD CONSTRAINT scans_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5244 (class 2606 OID 19573)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5281 (class 2606 OID 20040)
-- Name: tags tags_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5259 (class 2606 OID 19791)
-- Name: test_case_dataset_bindings test_case_dataset_bindings_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_dataset_bindings
    ADD CONSTRAINT test_case_dataset_bindings_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.test_datasets(id) ON DELETE CASCADE;


--
-- TOC entry 5260 (class 2606 OID 19786)
-- Name: test_case_dataset_bindings test_case_dataset_bindings_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_dataset_bindings
    ADD CONSTRAINT test_case_dataset_bindings_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


--
-- TOC entry 5296 (class 2606 OID 20329)
-- Name: test_case_generation_batches test_case_generation_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_batches
    ADD CONSTRAINT test_case_generation_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5297 (class 2606 OID 20324)
-- Name: test_case_generation_batches test_case_generation_batches_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_batches
    ADD CONSTRAINT test_case_generation_batches_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5298 (class 2606 OID 20357)
-- Name: test_case_generation_candidates test_case_generation_candidates_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_candidates
    ADD CONSTRAINT test_case_generation_candidates_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.test_case_generation_batches(id) ON DELETE CASCADE;


--
-- TOC entry 5299 (class 2606 OID 20362)
-- Name: test_case_generation_candidates test_case_generation_candidates_selected_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_generation_candidates
    ADD CONSTRAINT test_case_generation_candidates_selected_test_case_id_fkey FOREIGN KEY (selected_test_case_id) REFERENCES public.test_cases(id) ON DELETE SET NULL;


--
-- TOC entry 5255 (class 2606 OID 19736)
-- Name: test_case_versions test_case_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_versions
    ADD CONSTRAINT test_case_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5256 (class 2606 OID 20120)
-- Name: test_case_versions test_case_versions_runtime_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_versions
    ADD CONSTRAINT test_case_versions_runtime_config_id_fkey FOREIGN KEY (runtime_config_id) REFERENCES public.agent_runtime_configs(id) ON DELETE SET NULL;


--
-- TOC entry 5257 (class 2606 OID 19731)
-- Name: test_case_versions test_case_versions_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_case_versions
    ADD CONSTRAINT test_case_versions_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


--
-- TOC entry 5250 (class 2606 OID 19690)
-- Name: test_cases test_cases_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5251 (class 2606 OID 19695)
-- Name: test_cases test_cases_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5252 (class 2606 OID 19680)
-- Name: test_cases test_cases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5253 (class 2606 OID 19700)
-- Name: test_cases test_cases_restored_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_restored_by_fkey FOREIGN KEY (restored_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5254 (class 2606 OID 19685)
-- Name: test_cases test_cases_scan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT test_cases_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;


--
-- TOC entry 5247 (class 2606 OID 19653)
-- Name: test_datasets test_datasets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_datasets
    ADD CONSTRAINT test_datasets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5248 (class 2606 OID 19648)
-- Name: test_datasets test_datasets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_datasets
    ADD CONSTRAINT test_datasets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5290 (class 2606 OID 20222)
-- Name: test_run_attempts test_run_attempts_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_attempts
    ADD CONSTRAINT test_run_attempts_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5269 (class 2606 OID 19903)
-- Name: test_run_dataset_bindings test_run_dataset_bindings_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_dataset_bindings
    ADD CONSTRAINT test_run_dataset_bindings_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.test_datasets(id) ON DELETE SET NULL;


--
-- TOC entry 5270 (class 2606 OID 19898)
-- Name: test_run_dataset_bindings test_run_dataset_bindings_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_dataset_bindings
    ADD CONSTRAINT test_run_dataset_bindings_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5282 (class 2606 OID 20058)
-- Name: test_run_tags test_run_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_tags
    ADD CONSTRAINT test_run_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- TOC entry 5283 (class 2606 OID 20053)
-- Name: test_run_tags test_run_tags_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_run_tags
    ADD CONSTRAINT test_run_tags_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


--
-- TOC entry 5266 (class 2606 OID 19864)
-- Name: test_runs test_runs_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


--
-- TOC entry 5267 (class 2606 OID 19869)
-- Name: test_runs test_runs_test_case_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_test_case_version_id_fkey FOREIGN KEY (test_case_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;


--
-- TOC entry 5268 (class 2606 OID 19874)
-- Name: test_runs test_runs_triggered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_runs
    ADD CONSTRAINT test_runs_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5258 (class 2606 OID 19764)
-- Name: test_steps test_steps_test_case_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_steps
    ADD CONSTRAINT test_steps_test_case_version_id_fkey FOREIGN KEY (test_case_version_id) REFERENCES public.test_case_versions(id) ON DELETE CASCADE;


--
-- TOC entry 5261 (class 2606 OID 19839)
-- Name: test_tree_nodes test_tree_nodes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5262 (class 2606 OID 19834)
-- Name: test_tree_nodes test_tree_nodes_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.test_datasets(id) ON DELETE CASCADE;


--
-- TOC entry 5263 (class 2606 OID 19824)
-- Name: test_tree_nodes test_tree_nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.test_tree_nodes(id) ON DELETE CASCADE;


--
-- TOC entry 5264 (class 2606 OID 19819)
-- Name: test_tree_nodes test_tree_nodes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5265 (class 2606 OID 19829)
-- Name: test_tree_nodes test_tree_nodes_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_tree_nodes
    ADD CONSTRAINT test_tree_nodes_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


-- =========================================================
-- Test Collections (added 2026-04-05)
-- =========================================================

--
-- Name: test_sheets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_sheets (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: test_sheets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_sheets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_sheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_sheets_id_seq OWNED BY public.test_sheets.id;


--
-- Name: test_sheets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheets ALTER COLUMN id SET DEFAULT nextval('public.test_sheets_id_seq'::regclass);


--
-- Name: test_sheets test_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheets
    ADD CONSTRAINT test_sheets_pkey PRIMARY KEY (id);


--
-- Name: idx_test_sheets_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheets_project_id ON public.test_sheets USING btree (project_id);


--
-- Name: idx_test_sheets_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheets_deleted_at ON public.test_sheets USING btree (deleted_at);


--
-- Name: test_sheets test_sheets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheets
    ADD CONSTRAINT test_sheets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: test_sheets test_sheets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheets
    ADD CONSTRAINT test_sheets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: test_sheet_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_sheet_items (
    id bigint NOT NULL,
    test_sheet_id bigint NOT NULL,
    test_case_id bigint NOT NULL,
    item_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_sheet_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_sheet_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_sheet_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_sheet_items_id_seq OWNED BY public.test_sheet_items.id;


--
-- Name: test_sheet_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_items ALTER COLUMN id SET DEFAULT nextval('public.test_sheet_items_id_seq'::regclass);


--
-- Name: test_sheet_items test_sheet_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_items
    ADD CONSTRAINT test_sheet_items_pkey PRIMARY KEY (id);


--
-- Name: test_sheet_items test_sheet_items_sheet_case_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_items
    ADD CONSTRAINT test_sheet_items_sheet_case_unique UNIQUE (test_sheet_id, test_case_id);


--
-- Name: idx_test_sheet_items_sheet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheet_items_sheet_id ON public.test_sheet_items USING btree (test_sheet_id);


--
-- Name: test_sheet_items test_sheet_items_test_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_items
    ADD CONSTRAINT test_sheet_items_test_sheet_id_fkey FOREIGN KEY (test_sheet_id) REFERENCES public.test_sheets(id) ON DELETE CASCADE;


--
-- Name: test_sheet_items test_sheet_items_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_items
    ADD CONSTRAINT test_sheet_items_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


--
-- Name: test_sheet_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_sheet_runs (
    id bigint NOT NULL,
    test_sheet_id bigint NOT NULL,
    status character varying(20) DEFAULT 'queued'::character varying NOT NULL,
    triggered_by bigint,
    trigger_type character varying(20) DEFAULT 'manual'::character varying NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    total_cases integer DEFAULT 0 NOT NULL,
    passed integer DEFAULT 0 NOT NULL,
    failed integer DEFAULT 0 NOT NULL,
    errored integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_sheet_runs_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT test_sheet_runs_trigger_type_check CHECK (((trigger_type)::text = ANY ((ARRAY['manual'::character varying, 'scheduled'::character varying])::text[])))
);


--
-- Name: test_sheet_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_sheet_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_sheet_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_sheet_runs_id_seq OWNED BY public.test_sheet_runs.id;


--
-- Name: test_sheet_runs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_runs ALTER COLUMN id SET DEFAULT nextval('public.test_sheet_runs_id_seq'::regclass);


--
-- Name: test_sheet_runs test_sheet_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_runs
    ADD CONSTRAINT test_sheet_runs_pkey PRIMARY KEY (id);


--
-- Name: idx_test_sheet_runs_sheet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheet_runs_sheet_id ON public.test_sheet_runs USING btree (test_sheet_id);


--
-- Name: idx_test_sheet_runs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheet_runs_status ON public.test_sheet_runs USING btree (status);


--
-- Name: idx_test_sheet_runs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheet_runs_created_at ON public.test_sheet_runs USING btree (created_at DESC);


--
-- Name: test_sheet_runs test_sheet_runs_test_sheet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_runs
    ADD CONSTRAINT test_sheet_runs_test_sheet_id_fkey FOREIGN KEY (test_sheet_id) REFERENCES public.test_sheets(id) ON DELETE CASCADE;


--
-- Name: test_sheet_runs test_sheet_runs_triggered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_runs
    ADD CONSTRAINT test_sheet_runs_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: test_sheet_run_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_sheet_run_items (
    id bigint NOT NULL,
    test_sheet_run_id bigint NOT NULL,
    test_case_id bigint NOT NULL,
    test_run_id bigint,
    item_order integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT test_sheet_run_items_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: test_sheet_run_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_sheet_run_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_sheet_run_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_sheet_run_items_id_seq OWNED BY public.test_sheet_run_items.id;


--
-- Name: test_sheet_run_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_run_items ALTER COLUMN id SET DEFAULT nextval('public.test_sheet_run_items_id_seq'::regclass);


--
-- Name: test_sheet_run_items test_sheet_run_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_run_items
    ADD CONSTRAINT test_sheet_run_items_pkey PRIMARY KEY (id);


--
-- Name: idx_test_sheet_run_items_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheet_run_items_run_id ON public.test_sheet_run_items USING btree (test_sheet_run_id);


--
-- Name: idx_test_sheet_run_items_test_run; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_test_sheet_run_items_test_run ON public.test_sheet_run_items USING btree (test_run_id);


--
-- Name: test_sheet_run_items test_sheet_run_items_test_sheet_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_run_items
    ADD CONSTRAINT test_sheet_run_items_test_sheet_run_id_fkey FOREIGN KEY (test_sheet_run_id) REFERENCES public.test_sheet_runs(id) ON DELETE CASCADE;


--
-- Name: test_sheet_run_items test_sheet_run_items_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_run_items
    ADD CONSTRAINT test_sheet_run_items_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


--
-- Name: test_sheet_run_items test_sheet_run_items_test_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_sheet_run_items
    ADD CONSTRAINT test_sheet_run_items_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE SET NULL;


-- Completed on 2026-04-05 00:00:00

--
-- PostgreSQL database dump complete
--


-- =========================================================
-- Consolidated migration: 003_batch_runs.sql
-- =========================================================

-- =========================================================
-- Batch runs: group N test_runs triggered from one dataset
-- Each row in the dataset = 1 test_run inside the batch
-- Equivalent to Katalon's Test Suite Run with data binding
-- =========================================================

CREATE TABLE test_run_batches (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    test_case_id        BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    dataset_id          BIGINT REFERENCES test_datasets(id) ON DELETE SET NULL,
    execution_script_id BIGINT REFERENCES execution_scripts(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    total_rows          INT NOT NULL DEFAULT 0,
    completed_rows      INT NOT NULL DEFAULT 0,
    passed_rows         INT NOT NULL DEFAULT 0,
    failed_rows         INT NOT NULL DEFAULT 0,
    triggered_by        VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_test_run_batches_project   ON test_run_batches(project_id);
CREATE INDEX idx_test_run_batches_test_case ON test_run_batches(test_case_id);
CREATE INDEX idx_test_run_batches_status    ON test_run_batches(status);
CREATE INDEX idx_test_run_batches_created   ON test_run_batches(created_at DESC);

-- Link each test_run back to the batch it belongs to (optional)
ALTER TABLE test_runs ADD COLUMN batch_id BIGINT REFERENCES test_run_batches(id) ON DELETE SET NULL;
CREATE INDEX idx_test_runs_batch_id ON test_runs(batch_id);


-- =========================================================
-- Consolidated migration: 004_failure_taxonomy.sql
-- =========================================================

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


-- =========================================================
-- Consolidated migration: add_test_collections.sql
-- =========================================================

-- Migration: Add test_collections and test_collection_items tables
-- These are organize-only label/folder groupings (no execution)
-- A test case can belong to multiple collections

CREATE TABLE IF NOT EXISTS test_collections (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  color        VARCHAR(20) NOT NULL DEFAULT 'indigo',
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_test_collections_project ON test_collections(project_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS test_collection_items (
  id             SERIAL PRIMARY KEY,
  collection_id  INTEGER NOT NULL REFERENCES test_collections(id) ON DELETE CASCADE,
  test_case_id   INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_collection_testcase UNIQUE (collection_id, test_case_id)
);

CREATE INDEX IF NOT EXISTS idx_test_collection_items_collection ON test_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_test_collection_items_testcase ON test_collection_items(test_case_id);


-- =========================================================
-- Consolidated migration: 005_collection_hierarchy.sql
-- =========================================================

-- Migration: Add parent_id to test_collections for nested folder/tree structure
ALTER TABLE test_collections
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES test_collections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_test_collections_parent
ON test_collections(parent_id) WHERE deleted_at IS NULL;


-- =========================================================
-- Consolidated migration: 006_add_pass_with_warning_verdict.sql
-- =========================================================

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


-- =========================================================
-- Consolidated migration: 007_add_is_ai_draft.sql
-- =========================================================

-- Add is_ai_draft flag to test_cases
-- AI-draft test cases are hidden from the main list until committed by the user.
-- They are created when the user clicks "Run Draft" in the AI Workbench drawer
-- and become visible when the user clicks "Save to Library" (commit).

ALTER TABLE test_cases
  ADD COLUMN IF NOT EXISTS is_ai_draft BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: only index the hidden drafts (false rows don't need indexing)
CREATE INDEX IF NOT EXISTS idx_test_cases_is_ai_draft
  ON test_cases(is_ai_draft)
  WHERE is_ai_draft = TRUE;


-- =========================================================
-- Consolidated migration: 008_add_anchor_results.sql
-- =========================================================

ALTER TABLE public.run_step_logs
  ADD COLUMN IF NOT EXISTS anchor_results jsonb DEFAULT NULL;


-- =========================================================
-- Consolidated migration: 009_ai_generation_persistence.sql
-- =========================================================

BEGIN;

ALTER TABLE IF EXISTS public.test_case_generation_batches
  ADD COLUMN IF NOT EXISTS created_by bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE IF EXISTS public.test_case_generation_candidates
  ADD COLUMN IF NOT EXISTS is_selected boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS selected_test_case_id bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE IF EXISTS public.test_cases
  ADD COLUMN IF NOT EXISTS is_ai_draft boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_by bigint;

CREATE INDEX IF NOT EXISTS idx_tc_generation_batches_project_created
  ON public.test_case_generation_batches (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tc_generation_batches_created_by
  ON public.test_case_generation_batches (created_by);

CREATE INDEX IF NOT EXISTS idx_tc_generation_candidates_batch_selected
  ON public.test_case_generation_candidates (batch_id, is_selected, selected_test_case_id);

CREATE INDEX IF NOT EXISTS idx_test_cases_project_ai_draft_active
  ON public.test_cases (project_id, created_by, is_ai_draft)
  WHERE deleted_at IS NULL;

COMMIT;


-- =========================================================
-- Consolidated migration: 009_test_objects.sql
-- =========================================================

-- Object Repository: reusable element definitions shared across test cases
CREATE TABLE IF NOT EXISTS test_objects (
  id               SERIAL PRIMARY KEY,
  project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  page_key         VARCHAR(255),
  description      TEXT,
  -- [{type, value, priority}] ordered list of locator strategies
  selectors        JSONB NOT NULL DEFAULT '[]',
  -- snapshot of element attributes at record time
  attributes_snapshot JSONB DEFAULT '{}',
  created_from_run_id INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_test_objects_project_id ON test_objects(project_id);
CREATE INDEX IF NOT EXISTS idx_test_objects_page_key   ON test_objects(project_id, page_key);


-- =========================================================
-- Consolidated migration: 010_test_objects_katalon_schema.sql
-- =========================================================

-- Evolve test_objects to Katalon-inspired schema
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS selector_method       VARCHAR(50)  DEFAULT 'xpath',
  ADD COLUMN IF NOT EXISTS selector_collection   JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS element_properties    JSONB        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS selected_properties   JSONB        DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS parent_frame_object_id INTEGER     REFERENCES test_objects(id),
  ADD COLUMN IF NOT EXISTS source_url            TEXT,
  ADD COLUMN IF NOT EXISTS status                VARCHAR(20)  DEFAULT 'auto'
    CHECK (status IN ('auto', 'confirmed'));

-- Migrate existing selectors array → selector_collection dict + selector_method
UPDATE test_objects
SET
  selector_collection = (
    SELECT COALESCE(
      jsonb_object_agg(s->>'type', s->>'value')
        FILTER (WHERE s->>'value' IS NOT NULL AND s->>'value' <> ''),
      '{}'::jsonb
    )
    FROM jsonb_array_elements(selectors) AS s
  ),
  selector_method     = COALESCE(selectors->0->>'type', 'xpath'),
  element_properties  = COALESCE(attributes_snapshot, '{}'::jsonb)
WHERE selectors IS NOT NULL AND selectors <> '[]'::jsonb;

-- Drop old columns
ALTER TABLE test_objects
  DROP COLUMN IF EXISTS selectors,
  DROP COLUMN IF EXISTS attributes_snapshot;


-- =========================================================
-- Consolidated migration: 011_test_objects_fix_constraints.sql
-- =========================================================

-- Fix 1: unique by (project_id, page_key, name) instead of (project_id, name)
ALTER TABLE test_objects DROP CONSTRAINT IF EXISTS test_objects_project_id_name_key;

-- NULL page_key needs COALESCE so NULLs don't bypass uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS test_objects_project_page_name_idx
  ON test_objects(project_id, COALESCE(page_key, ''), name);

-- Additional columns for auditability
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS last_seen_run_id INTEGER,
  ADD COLUMN IF NOT EXISTS last_seen_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by       VARCHAR(10) DEFAULT 'agent'
    CHECK (created_by IN ('agent', 'user')),
  ADD COLUMN IF NOT EXISTS updated_by       VARCHAR(10) DEFAULT 'agent'
    CHECK (updated_by IN ('agent', 'user'));

-- Fix 5: candidate table — new locators from re-runs on confirmed objects
CREATE TABLE IF NOT EXISTS test_object_candidates (
  id                  SERIAL PRIMARY KEY,
  object_id           INTEGER NOT NULL REFERENCES test_objects(id) ON DELETE CASCADE,
  test_run_id         INTEGER NOT NULL,
  selector_collection JSONB   NOT NULL DEFAULT '{}',
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_object_candidates_object_id
  ON test_object_candidates(object_id);


-- =========================================================
-- Consolidated migration: 012_ai_analysis_persistence.sql
-- =========================================================

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


-- =========================================================
-- Consolidated migration: 013_create_test_suites.sql
-- =========================================================

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


-- =========================================================
-- Consolidated migration: add_suite_run_item_execution_metadata.sql
-- =========================================================

ALTER TABLE public.test_suite_run_items
ADD COLUMN IF NOT EXISTS run_mode varchar(20),
ADD COLUMN IF NOT EXISTS dataset_id bigint,
ADD COLUMN IF NOT EXISTS execution_script_id bigint,
ADD COLUMN IF NOT EXISTS dataset_row_index integer;


-- =========================================================
-- Consolidated migration: 014_fix_dataset_bindings_columns.sql
-- =========================================================

-- Add missing columns to test_case_dataset_bindings.
-- The dump was taken before alias and updated_at were added.

ALTER TABLE public.test_case_dataset_bindings
    ADD COLUMN IF NOT EXISTS alias      character varying(100),
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();


-- =========================================================
-- Consolidated migration: 015_add_evidence_file_data.sql
-- =========================================================

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


-- =========================================================
-- Consolidated migration: 016_add_test_run_dataset_bindings_columns.sql
-- =========================================================

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


-- =========================================================
-- Consolidated migration: 017_add_test_suite_runs_ai_analysis.sql
-- =========================================================

-- 017_add_test_suite_runs_ai_analysis.sql
-- Adds AI-analysis columns to test_suite_runs used by the sheet-run analysis feature.
--
-- Referenced by:
--   testSheet.repository.js -> SELECT tsr.ai_analysis
--   testSheet.service.js    -> UPDATE ... SET ai_analysis = $1::jsonb, ai_analysis_at = now()
--
-- Present only in dev DBs (added by hand); never captured in a migration, so
-- production fails with "column tsr.ai_analysis does not exist".
-- Safe to re-run (IF NOT EXISTS guards).

ALTER TABLE public.test_suite_runs
    ADD COLUMN IF NOT EXISTS ai_analysis    jsonb,
    ADD COLUMN IF NOT EXISTS ai_analysis_at timestamp with time zone;


-- =========================================================
-- Consolidated migration: 018_password_reset_otps.sql
-- =========================================================

-- =========================================================
-- 018) PASSWORD RESET OTPs
-- Stores hashed one-time codes for the forgot-password flow.
-- =========================================================

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email
    ON password_reset_otps (email);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
    ON password_reset_otps (expires_at);


-- =========================================================
-- Consolidated migration: 019_add_onboarding_completed.sql
-- =========================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;


-- =========================================================
-- Consolidated migration: 020_eval_log_fields.sql
-- =========================================================

-- Migration 020: Evaluation log fields + timing tracking

-- 1. test_runs: chỉ giữ field thực sự cần lưu thủ công
ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS generated_tree_correct VARCHAR(10),
  ADD COLUMN IF NOT EXISTS run_notes              TEXT;

ALTER TABLE public.test_runs
  DROP CONSTRAINT IF EXISTS chk_tree_correct;
ALTER TABLE public.test_runs
  ADD CONSTRAINT chk_tree_correct
    CHECK (generated_tree_correct IS NULL OR generated_tree_correct IN ('yes', 'partial', 'no'));

-- 2. test_case_generation_batches: track thời gian sinh testcase
ALTER TABLE public.test_case_generation_batches
  ADD COLUMN IF NOT EXISTS generation_started_at  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS generation_finished_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS generation_duration_ms INTEGER;

-- 3. Bảng mới: log thời gian sinh dataset bằng AI
CREATE TABLE IF NOT EXISTS public.dataset_generation_logs (
  id            BIGSERIAL PRIMARY KEY,
  project_id    BIGINT,
  dataset_id    BIGINT,
  prompt        TEXT,
  row_count     INTEGER,
  llm_provider  VARCHAR(50),
  llm_model     VARCHAR(100),
  started_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at   TIMESTAMP WITH TIME ZONE,
  duration_ms   INTEGER,
  success       BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dataset_gen_logs_project
  ON public.dataset_generation_logs (project_id, created_at DESC);


-- =========================================================
-- Consolidated migration: 021_add_agent_token_usage.sql
-- =========================================================

ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS agent_input_tokens  INTEGER,
  ADD COLUMN IF NOT EXISTS agent_output_tokens INTEGER;


-- =========================================================
-- Consolidated migration: 022_performance_tracking.sql
-- =========================================================

-- Migration 022: Performance tracking columns

-- 1. test_runs: lưu llm provider/model trực tiếp để GROUP BY / filter dễ dàng
ALTER TABLE public.test_runs
  ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS llm_model    VARCHAR(100);

-- 2. test_run_dataset_bindings: lưu verdict ngay trên row để biết row nào pass/fail
ALTER TABLE public.test_run_dataset_bindings
  ADD COLUMN IF NOT EXISTS verdict VARCHAR(20);

-- 3. test_suite_runs: tổng token của cả suite run
ALTER TABLE public.test_suite_runs
  ADD COLUMN IF NOT EXISTS total_input_tokens  INTEGER,
  ADD COLUMN IF NOT EXISTS total_output_tokens INTEGER;


-- =========================================================
-- Consolidated migration: 023_dedupe_test_objects.sql
-- =========================================================

-- Dedupe auto-detected test objects that point at the same element.
--
-- The agent used to mint suffixed names (`input_email_1`, `input_email_2`, ...)
-- when the same element was interacted with more than once in a run, so one
-- element could accumulate several rows per page. Keep one row per
-- (project, page, selector_collection) — preferring confirmed rows, then the
-- oldest — and drop the redundant auto rows. Replay scripts that still
-- reference a deleted name fall back to their baked-in `_selectorCollection`.
--
-- Safe to re-run: the DELETE simply matches nothing once duplicates are gone.

WITH ranked AS (
  SELECT
    id,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, COALESCE(page_key, ''), selector_collection
      ORDER BY (status = 'confirmed') DESC, id ASC
    ) AS rn
  FROM test_objects
)
DELETE FROM test_objects t
USING ranked r
WHERE t.id = r.id
  AND r.rn > 1
  AND t.status = 'auto';
