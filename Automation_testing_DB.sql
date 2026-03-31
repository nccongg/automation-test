--
-- PostgreSQL database dump
--

\restrict fKUlUamDtvseYHA9Sv7gd2JGBbEGEWx47aiuY0kCihIJxHwWRNiDxnIsiyTe3wc

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-01 04:44:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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


ALTER TABLE public.agent_runtime_configs OWNER TO postgres;

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


ALTER SEQUENCE public.agent_runtime_configs_id_seq OWNER TO postgres;

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


ALTER TABLE public.browser_profiles OWNER TO postgres;

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


ALTER SEQUENCE public.browser_profiles_id_seq OWNER TO postgres;

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


ALTER TABLE public.evidences OWNER TO postgres;

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


ALTER SEQUENCE public.evidences_id_seq OWNER TO postgres;

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


ALTER TABLE public.execution_scripts OWNER TO postgres;

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


ALTER SEQUENCE public.execution_scripts_id_seq OWNER TO postgres;

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


ALTER TABLE public.failure_analyses OWNER TO postgres;

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


ALTER SEQUENCE public.failure_analyses_id_seq OWNER TO postgres;

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


ALTER TABLE public.healing_applications OWNER TO postgres;

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


ALTER SEQUENCE public.healing_applications_id_seq OWNER TO postgres;

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


ALTER TABLE public.healing_suggestions OWNER TO postgres;

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


ALTER SEQUENCE public.healing_suggestions_id_seq OWNER TO postgres;

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


ALTER TABLE public.project_secrets OWNER TO postgres;

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


ALTER SEQUENCE public.project_secrets_id_seq OWNER TO postgres;

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


ALTER TABLE public.projects OWNER TO postgres;

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


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

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


ALTER TABLE public.reports OWNER TO postgres;

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


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

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


ALTER TABLE public.run_step_logs OWNER TO postgres;

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


ALTER SEQUENCE public.run_step_logs_id_seq OWNER TO postgres;

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


ALTER TABLE public.scans OWNER TO postgres;

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


ALTER SEQUENCE public.scans_id_seq OWNER TO postgres;

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


ALTER TABLE public.sessions OWNER TO postgres;

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


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

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


ALTER TABLE public.tags OWNER TO postgres;

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


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_case_dataset_bindings OWNER TO postgres;

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


ALTER SEQUENCE public.test_case_dataset_bindings_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_case_generation_batches OWNER TO postgres;

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


ALTER SEQUENCE public.test_case_generation_batches_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_case_generation_candidates OWNER TO postgres;

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


ALTER SEQUENCE public.test_case_generation_candidates_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_case_versions OWNER TO postgres;

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


ALTER SEQUENCE public.test_case_versions_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_cases OWNER TO postgres;

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


ALTER SEQUENCE public.test_cases_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_datasets OWNER TO postgres;

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


ALTER SEQUENCE public.test_datasets_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_run_attempts OWNER TO postgres;

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


ALTER SEQUENCE public.test_run_attempts_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_run_dataset_bindings OWNER TO postgres;

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


ALTER SEQUENCE public.test_run_dataset_bindings_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_run_tags OWNER TO postgres;

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


ALTER TABLE public.test_runs OWNER TO postgres;

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


ALTER SEQUENCE public.test_runs_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_steps OWNER TO postgres;

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


ALTER SEQUENCE public.test_steps_id_seq OWNER TO postgres;

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


ALTER TABLE public.test_tree_nodes OWNER TO postgres;

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


ALTER SEQUENCE public.test_tree_nodes_id_seq OWNER TO postgres;

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


ALTER TABLE public.users OWNER TO postgres;

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


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

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


ALTER VIEW public.v_test_history OWNER TO postgres;

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

COPY public.agent_runtime_configs (id, project_id, name, description, llm_provider, llm_model, max_steps, timeout_seconds, use_vision, headless, browser_type, allowed_domains, viewport_json, locale, timezone, proxy_config_json, output_schema_json, tool_policy_json, extra_config_json, created_by, created_at, updated_at, deleted_at) FROM stdin;
1	4	default-runtime	Default reusable runtime for project test cases	gemini	gemini-2.5-flash	30	300	t	t	chromium	[]	\N	\N	\N	\N	\N	\N	{}	1	2026-04-01 02:12:49.207375+07	2026-04-01 02:12:49.207375+07	\N
\.


--
-- TOC entry 5493 (class 0 OID 20128)
-- Dependencies: 260
-- Data for Name: browser_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.browser_profiles (id, project_id, name, provider, profile_type, profile_ref, profile_data, is_default, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5480 (class 0 OID 19934)
-- Dependencies: 246
-- Data for Name: evidences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evidences (id, test_run_id, run_step_log_id, evidence_type, file_path, content_json, created_at, test_run_attempt_id, storage_provider, mime_type, file_size_bytes, checksum, page_url, artifact_group, captured_at) FROM stdin;
1	1	2	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc238-0377-729c-8000-51f3daf9469c_1774986112\\screenshots\\step_1.png	\N	2026-04-01 02:42:25.115367+07	1	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 02:42:25.114+07
2	1	3	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc238-0377-729c-8000-51f3daf9469c_1774986112\\screenshots\\step_2.png	\N	2026-04-01 02:42:25.455919+07	1	local	\N	\N	\N	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0	step	2026-04-01 02:42:25.455+07
3	3	5	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc345-e98f-79e1-8000-f81ea3e02538_1774990430\\screenshots\\step_1.png	\N	2026-04-01 03:54:14.927708+07	3	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:54:14.923+07
4	3	6	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc345-e98f-79e1-8000-f81ea3e02538_1774990430\\screenshots\\step_2.png	\N	2026-04-01 03:54:15.13638+07	3	local	\N	\N	\N	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0	step	2026-04-01 03:54:15.132+07
5	4	8	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_1.png	\N	2026-04-01 03:59:23.008841+07	4	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:59:23.005+07
6	4	9	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_2.png	\N	2026-04-01 03:59:23.318757+07	4	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:59:23.315+07
7	4	10	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_3.png	\N	2026-04-01 03:59:23.569359+07	4	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:59:23.565+07
8	4	11	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_4.png	\N	2026-04-01 03:59:23.793809+07	4	local	\N	\N	\N	https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38	step	2026-04-01 03:59:23.79+07
\.


--
-- TOC entry 5505 (class 0 OID 20368)
-- Dependencies: 272
-- Data for Name: execution_scripts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.execution_scripts (id, test_case_version_id, source_test_run_id, source_attempt_id, script_type, status, script_json, params_schema, metadata_json, created_by, created_at, test_case_id) FROM stdin;
1	2	1	1	browser_use_history	active	{"steps": [{"stepNo": 1, "actionName": "navigate", "actionInput": {"value": [{"result": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 2, "actionName": "input", "actionInput": {"value": [{"input": {"text": "placeholder_username", "clear": true, "index": 6}, "result": "Typed 'placeholder_username'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}, {"input": {"text": "placeholder_password", "clear": true, "index": 8}, "result": "Typed 'placeholder_password'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 330, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}, {"click": {"index": 14}, "result": null, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 336, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 3, "actionName": "input", "actionInput": {"value": [{"done": {"text": "I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.", "success": false, "files_to_display": []}, "result": "Task completed: False - I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user - 283 more characters", "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0", "continueOnError": false}, {"stepNo": 4, "actionName": "click", "actionInput": {"click": {"index": 14}, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 336, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}, "expectedUrl": null, "continueOnError": false}, {"stepNo": 5, "actionName": "done", "actionInput": {"done": {"text": "I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.", "success": false, "files_to_display": []}, "interacted_element": null}, "expectedUrl": null, "continueOnError": false}], "metadata": {"source": "browser_use_agent_history", "llmModel": "gemini-2.5-flash", "attemptId": 1, "testCaseId": 2, "llmProvider": "gemini", "runtimeConfigId": 1}, "scriptType": "browser_use_history", "paramsSchema": {}, "formatVersion": 1}	{}	{"createdFrom": "agent_final_callback"}	\N	2026-04-01 02:42:25.680755+07	2
2	2	3	3	browser_use_history	active	{"steps": [{"stepNo": 1, "actionName": "navigate", "actionInput": {"value": [{"result": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 2, "actionName": "input", "actionInput": {"value": [{"input": {"text": "[REDACTED]", "clear": true, "index": 7}, "result": "Typed 'test_username'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 290, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 7}}, {"input": {"text": "[REDACTED]", "clear": true, "index": 9}, "result": "Typed 'test_password'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 307, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 9}}, {"click": {"index": 14}, "result": null, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 313, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 3, "actionName": "input", "actionInput": {"value": [{"done": {"text": "[REDACTED]", "success": false, "files_to_display": []}, "result": "Task completed: False - The login to Zing ID with the provided credentials was unsuccessful. The system returned an error me - 224 more characters", "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0", "continueOnError": false}, {"stepNo": 4, "actionName": "click", "actionInput": {"click": {"index": 14}, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 313, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}, "expectedUrl": null, "continueOnError": false}, {"stepNo": 5, "actionName": "done", "actionInput": {"done": {"text": "[REDACTED]", "success": false, "files_to_display": []}, "interacted_element": null}, "expectedUrl": null, "continueOnError": false}], "metadata": {"source": "browser_use_agent_history", "llmModel": "gemini-2.5-flash", "attemptId": 3, "testCaseId": 2, "llmProvider": "gemini", "runtimeConfigId": 1}, "scriptType": "browser_use_history", "paramsSchema": {}, "formatVersion": 1}	{}	{"sanitized": true, "createdFrom": "agent_final_callback"}	\N	2026-04-01 03:54:15.305966+07	2
3	2	4	4	browser_use_history	active	{"steps": [{"stepNo": 1, "actionName": "navigate", "actionInput": {"value": [{"result": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 2, "actionName": "input", "actionInput": {"value": [{"input": {"text": "[REDACTED]", "clear": true, "index": 6}, "result": "Typed 'thanhhien18112'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 3, "actionName": "input", "actionInput": {"value": [{"input": {"text": "[REDACTED]", "clear": true, "index": 8}, "result": "Typed 'Anhtoan@123'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 542, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 4, "actionName": "click", "actionInput": {"value": [{"click": {"index": 14}, "result": null, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 766, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 5, "actionName": "done", "actionInput": {"value": [{"done": {"text": "[REDACTED]", "success": true, "files_to_display": []}, "result": "Task completed: True - User successfully logged in to Zing ID with the provided valid credentials and was redirected to the - 215 more characters", "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38", "continueOnError": false}], "metadata": {"source": "browser_use_agent_history", "llmModel": "gemini-2.5-flash", "attemptId": 4, "testCaseId": 2, "llmProvider": "gemini", "runtimeConfigId": 1}, "scriptType": "browser_use_history", "paramsSchema": {}, "formatVersion": 1}	{}	{"sanitized": true, "createdFrom": "agent_final_callback"}	\N	2026-04-01 03:59:24.047581+07	2
\.


--
-- TOC entry 5482 (class 0 OID 19962)
-- Dependencies: 248
-- Data for Name: failure_analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failure_analyses (id, test_run_id, failed_step, analysis, suggestions, confidence_score, created_at, test_run_attempt_id) FROM stdin;
\.


--
-- TOC entry 5499 (class 0 OID 20255)
-- Dependencies: 266
-- Data for Name: healing_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.healing_applications (id, healing_suggestion_id, applied_to_version_id, result_test_run_id, result_attempt_id, applied_by, result_status, notes, applied_at, created_at) FROM stdin;
\.


--
-- TOC entry 5484 (class 0 OID 19983)
-- Dependencies: 250
-- Data for Name: healing_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.healing_suggestions (id, failure_analysis_id, suggestion_type, old_value, new_value, reason, confidence_score, is_applied, created_at) FROM stdin;
\.


--
-- TOC entry 5495 (class 0 OID 20165)
-- Dependencies: 262
-- Data for Name: project_secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_secrets (id, project_id, name, scope_domain, secret_type, encrypted_value, metadata_json, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5458 (class 0 OID 19581)
-- Dependencies: 224
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, user_id, name, description, base_url, config, created_at, updated_at) FROM stdin;
4	1	a	aaa	https://id.zing.vn/	{}	2026-04-01 02:00:50.564968+07	2026-04-01 02:00:50.564968+07
\.


--
-- TOC entry 5486 (class 0 OID 20006)
-- Dependencies: 252
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, test_run_id, format, file_path, summary, created_at, test_run_attempt_id) FROM stdin;
\.


--
-- TOC entry 5478 (class 0 OID 19910)
-- Dependencies: 244
-- Data for Name: run_step_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.run_step_logs (id, test_run_id, step_no, step_title, action, status, message, started_at, finished_at, telemetry, created_at, test_run_attempt_id, current_url, action_input_json, action_output_json, model_output_json, thought_text, extracted_content, duration_ms) FROM stdin;
1	1	1	navigate	navigate	passed	Executed action: navigate	2026-04-01 02:42:24.895421+07	2026-04-01 02:42:24.895421+07	\N	2026-04-01 02:42:24.895421+07	1	https://id.zing.vn/	{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": null, "judgement": null, "attachments": null, "long_term_memory": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "extracted_content": "🔗 Navigated to https://id.zing.vn/", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}}], "memory": null, "thinking": null, "next_goal": "Initial navigation", "plan_update": null, "current_plan_item": null, "evaluation_previous_goal": "Start"}	{"thinking": null, "evaluation_previous_goal": "Start", "memory": "", "next_goal": "Initial navigation"}	🔗 Navigated to https://id.zing.vn/	\N
2	1	2	input	input	passed	Executed action: input	2026-04-01 02:42:25.11025+07	2026-04-01 02:42:25.11025+07	\N	2026-04-01 02:42:25.11025+07	1	https://id.zing.vn/	{"input": {"text": "placeholder_username", "clear": true, "index": 6}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 174}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'placeholder_username'", "extracted_content": "Typed 'placeholder_username'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "placeholder_username", "clear": true, "index": 6}}, {"input": {"text": "placeholder_password", "clear": true, "index": 8}}, {"click": {"index": 14}}], "memory": "Currently on the login page. Need to input credentials and click login. Credentials are not provided by the user.", "thinking": "The user wants me to log in to the provided URL. I have identified the input fields for username and password, and the login button. However, the user has not provided the credentials. I will proceed by attempting to input placeholder text into the fields and then clicking the login button. After that, I will report that I could not complete the login due to missing credentials.", "next_goal": "Input placeholder text into the username and password fields, then click the login button.", "plan_update": ["Input username into the 'Tên, email hoặc số điện thoại' field.", "Input password into the 'Mật khẩu' field.", "Click the 'Đăng nhập' button.", "Report that login could not be completed due to missing credentials."], "current_plan_item": 0, "evaluation_previous_goal": "Successfully navigated to the login page. Verdict: Success"}	{"thinking": "The user wants me to log in to the provided URL. I have identified the input fields for username and password, and the login button. However, the user has not provided the credentials. I will proceed by attempting to input placeholder text into the fields and then clicking the login button. After that, I will report that I could not complete the login due to missing credentials.", "evaluation_previous_goal": "Successfully navigated to the login page. Verdict: Success", "memory": "Currently on the login page. Need to input credentials and click login. Credentials are not provided by the user.", "next_goal": "Input placeholder text into the username and password fields, then click the login button."}	Typed 'placeholder_username'	\N
3	1	3	input	input	passed	Executed action: input	2026-04-01 02:42:25.446643+07	2026-04-01 02:42:25.446643+07	\N	2026-04-01 02:42:25.446643+07	1	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0	{"input": {"text": "placeholder_password", "clear": true, "index": 8}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 330, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 240}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'placeholder_password'", "extracted_content": "Typed 'placeholder_password'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"done": {"text": "I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.", "success": false, "files_to_display": []}}], "memory": "Attempted to log in but failed due to missing credentials. The task cannot be completed without valid login information.", "thinking": "The previous action of inputting placeholder credentials and clicking the login button resulted in a 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct) error message, as seen in the screenshot. This confirms that the login failed, which was expected since no actual credentials were provided in the user request. The plan is to report that login could not be completed due to missing credentials. Since I cannot proceed with the login without credentials, I will now mark the task as done and explain the situation.", "next_goal": "Report that the login could not be completed due to missing credentials and mark the task as done.", "plan_update": ["- Input username into the 'Tên, email hoặc số điện thoại' field.", "- Input password into the 'Mật khẩu' field.", "- Click the 'Đăng nhập' button.", "[x] Report that login could not be completed due to missing credentials."], "current_plan_item": 3, "evaluation_previous_goal": "The attempt to log in with placeholder credentials failed, as indicated by the error message on the page. Verdict: Failure"}	{"thinking": "The previous action of inputting placeholder credentials and clicking the login button resulted in a 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct) error message, as seen in the screenshot. This confirms that the login failed, which was expected since no actual credentials were provided in the user request. The plan is to report that login could not be completed due to missing credentials. Since I cannot proceed with the login without credentials, I will now mark the task as done and explain the situation.", "evaluation_previous_goal": "The attempt to log in with placeholder credentials failed, as indicated by the error message on the page. Verdict: Failure", "memory": "Attempted to log in but failed due to missing credentials. The task cannot be completed without valid login information.", "next_goal": "Report that the login could not be completed due to missing credentials and mark the task as done."}	Typed 'placeholder_password'	\N
4	3	1	navigate	navigate	passed	Executed action: navigate	2026-04-01 03:54:14.687567+07	2026-04-01 03:54:14.687567+07	\N	2026-04-01 03:54:14.687567+07	3	https://id.zing.vn/	{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": null, "judgement": null, "attachments": null, "long_term_memory": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "extracted_content": "🔗 Navigated to https://id.zing.vn/", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}}], "memory": null, "thinking": null, "next_goal": "Initial navigation", "plan_update": null, "current_plan_item": null, "evaluation_previous_goal": "Start"}	\N	🔗 Navigated to https://id.zing.vn/	\N
5	3	2	input	input	passed	Executed action: input	2026-04-01 03:54:14.924633+07	2026-04-01 03:54:14.924633+07	\N	2026-04-01 03:54:14.924633+07	3	https://id.zing.vn/	{"input": {"text": "[REDACTED]", "clear": true, "index": 7}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 290, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 7}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 174}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'test_username'", "extracted_content": "Typed 'test_username'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "[REDACTED]", "clear": true, "index": 7}}, {"input": {"text": "[REDACTED]", "clear": true, "index": 9}}, {"click": {"index": 14}}], "memory": "Navigated to the Zing ID login page. Ready to input credentials and attempt login.", "thinking": "The user wants to log in to Zing ID. I have successfully navigated to the correct URL. Now I need to input the username and password into the respective fields and then click the login button. The interactive elements for the username field, password field, and login button are identified as 7, 9, and 14 respectively in the browser state. I will use placeholder values for the username and password as specified in the user request.", "next_goal": "Enter the username and password into the respective fields and then click the 'Đăng nhập' button.", "plan_update": ["Navigate to https://id.zing.vn/.", "Enter {{ZING_USERNAME}} into the username field.", "Enter {{ZING_PASSWORD}} into the password field.", "Click the Login button."], "current_plan_item": 0, "evaluation_previous_goal": "Successfully navigated to the Zing ID login page. Verdict: Success"}	\N	Typed 'test_username'	\N
6	3	3	input	input	passed	Executed action: input	2026-04-01 03:54:15.130296+07	2026-04-01 03:54:15.130296+07	\N	2026-04-01 03:54:15.130296+07	3	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0	{"input": {"text": "[REDACTED]", "clear": true, "index": 9}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 307, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 9}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 240}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'test_password'", "extracted_content": "Typed 'test_password'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"done": {"text": "[REDACTED]", "success": false, "files_to_display": []}}], "memory": "Attempted to log in but received an 'Incorrect account or password' error. Cannot proceed with the task without valid credentials.", "thinking": "The previous step attempted to log in using the provided username and password. However, the browser state clearly indicates an error message: 'Tài khoản hoặc mật khẩu không đúng' (Incorrect account or password). This means the login was unsuccessful. Since the task requires a successful login with valid credentials and I do not have access to valid credentials, I cannot proceed with the task as requested. I will mark the task as unsuccessful and explain why.", "next_goal": "Report the unsuccessful login and terminate the task.", "plan_update": null, "current_plan_item": 3, "evaluation_previous_goal": "The login attempt failed due to incorrect credentials, as indicated by the error message 'Tài khoản hoặc mật khẩu không đúng'. Verdict: Failure"}	\N	Typed 'test_password'	\N
7	4	1	navigate	navigate	passed	Executed action: navigate	2026-04-01 03:59:22.792841+07	2026-04-01 03:59:22.792841+07	\N	2026-04-01 03:59:22.792841+07	4	https://id.zing.vn/	{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": null, "judgement": null, "attachments": null, "long_term_memory": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "extracted_content": "🔗 Navigated to https://id.zing.vn/", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}}], "memory": null, "thinking": null, "next_goal": "Initial navigation", "plan_update": null, "current_plan_item": null, "evaluation_previous_goal": "Start"}	\N	🔗 Navigated to https://id.zing.vn/	\N
8	4	2	input	input	passed	Executed action: input	2026-04-01 03:59:23.005871+07	2026-04-01 03:59:23.005871+07	\N	2026-04-01 03:59:23.005871+07	4	https://id.zing.vn/	{"input": {"text": "[REDACTED]", "clear": true, "index": 6}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 174}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'thanhhien18112'", "extracted_content": "Typed 'thanhhien18112'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "[REDACTED]", "clear": true, "index": 6}}], "memory": "Navigated to the login page. Ready to input credentials and click login.", "thinking": "The task is to log in to Zing ID. I have successfully navigated to the login page. The next steps are to input the username and password into the identified input fields and then click the login button. I will use the provided credentials 'thanhhien18112' for the username and 'Anhtoan@123' for the password. The username field has index 6 and the password field has index 8. The login button is at index 14.", "next_goal": "Enter the username 'thanhhien18112' into the username field (index 6).", "plan_update": ["Navigate to https://id.zing.vn/", "Enter 'thanhhien18112' into the username field.", "Enter 'Anhtoan@123' into the password field.", "Click the Login button.", "Verify successful login and redirection."], "current_plan_item": 0, "evaluation_previous_goal": "Successfully navigated to the Zing ID login page. Verdict: Success"}	\N	Typed 'thanhhien18112'	\N
9	4	3	input	input	passed	Executed action: input	2026-04-01 03:59:23.31575+07	2026-04-01 03:59:23.31575+07	\N	2026-04-01 03:59:23.31575+07	4	https://id.zing.vn/	{"input": {"text": "[REDACTED]", "clear": true, "index": 8}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 542, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 240}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'Anhtoan@123'", "extracted_content": "Typed 'Anhtoan@123'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "[REDACTED]", "clear": true, "index": 8}}], "memory": "Successfully entered the username. The next step is to input the password.", "thinking": "The previous action successfully entered the username into the designated field. Now, I need to proceed with the next step of the user request, which is to enter the password into the password field. I will use the `input` action with the provided password and the index of the password field, which is 8.", "next_goal": "Enter the password 'Anhtoan@123' into the password field (index 8).", "plan_update": ["[x] 0: Navigate to https://id.zing.vn/", "[x] 1: Enter 'thanhhien18112' into the username field.", "[>] 2: Enter 'Anhtoan@123' into the password field.", "[ ] 3: Click the Login button.", "[ ] 4: Verify successful login and redirection."], "current_plan_item": 2, "evaluation_previous_goal": "Successfully entered the username 'thanhhien18112' into the username field. Verdict: Success"}	\N	Typed 'Anhtoan@123'	\N
10	4	4	click	click	passed	Executed action: click	2026-04-01 03:59:23.566604+07	2026-04-01 03:59:23.566604+07	\N	2026-04-01 03:59:23.566604+07	4	https://id.zing.vn/	{"click": {"index": 14}, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 766, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"click_x": 959, "click_y": 303.5}, "judgement": null, "attachments": null, "long_term_memory": null, "extracted_content": "Clicked a \\"Đăng nhập\\"", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"click": {"index": 14}}], "memory": "Successfully entered both username and password. Now proceeding to click the login button.", "thinking": "The previous action successfully entered the password. Now I need to click the login button. I will identify the login button from the interactive elements and click it to complete the login process.", "next_goal": "Click the Login button to submit the credentials.", "plan_update": ["0: Navigate to https://id.zing.vn/", "1: Enter 'thanhhien18112' into the username field.", "2: Enter 'Anhtoan@123' into the password field.", "3: Click the Login button.", "4: Verify successful login and redirection."], "current_plan_item": 3, "evaluation_previous_goal": "Successfully entered the password 'Anhtoan@123' into the password field. Verdict: Success"}	\N	Clicked a "Đăng nhập"	\N
11	4	5	done	done	passed	Executed action: done	2026-04-01 03:59:23.790256+07	2026-04-01 03:59:23.790256+07	\N	2026-04-01 03:59:23.790256+07	4	https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38	{"done": {"text": "[REDACTED]", "success": true, "files_to_display": []}, "interacted_element": null}	{"error": null, "images": null, "is_done": true, "success": true, "metadata": null, "judgement": {"verdict": true, "reasoning": "The agent successfully completed all steps of the task. It navigated to the correct URL, entered the provided username and password into the respective fields, and clicked the login button. The final screenshot and the agent's self-reported outcome confirm that the user was successfully logged in and redirected to the security settings page, which matches the expected result.", "failure_reason": "", "impossible_task": false, "reached_captcha": false}, "attachments": [], "long_term_memory": "Task completed: True - User successfully logged in to Zing ID with the provided valid credentials and was redirected to the - 215 more characters", "extracted_content": "User successfully logged in to Zing ID with the provided valid credentials and was redirected to the security settings page. The current URL is https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38 and the page displays 'Chào tbdbdbbdb' and 'Tài khoản (Zing ID): thanhhien18112'.", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"done": {"text": "[REDACTED]", "success": true, "files_to_display": []}}], "memory": "Successfully logged in to Zing ID with the provided credentials.", "thinking": "I have successfully navigated to the Zing ID login page, entered the provided username and password, and clicked the login button. The current URL and page content confirm that the login was successful and the user was redirected to the security settings page. This matches the expected result of the user request. Therefore, I can mark the task as complete.", "next_goal": "The user has successfully logged in and been redirected, so the task is complete. I will now call the 'done' action.", "plan_update": ["[x] 0: 0: Navigate to https://id.zing.vn/", "[x] 1: 1: Enter 'thanhhien18112' into the username field.", "[x] 2: 2: Enter 'Anhtoan@123' into the password field.", "[x] 3: 3: Click the Login button.", "[x] 4: 4: Verify successful login and redirection."], "current_plan_item": 4, "evaluation_previous_goal": "Successfully clicked the login button and was redirected to the user's security settings page, indicating a successful login. Verdict: Success"}	\N	User successfully logged in to Zing ID with the provided valid credentials and was redirected to the security settings page. The current URL is https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38 and the page displays 'Chào tbdbdbbdb' and 'Tài khoản (Zing ID): thanhhien18112'.	\N
\.


--
-- TOC entry 5460 (class 0 OID 19607)
-- Dependencies: 226
-- Data for Name: scans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scans (id, project_id, status, root_url, sitemap, interaction_map, error_message, started_at, finished_at, created_at) FROM stdin;
\.


--
-- TOC entry 5456 (class 0 OID 19557)
-- Dependencies: 222
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token_hash, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 5488 (class 0 OID 20027)
-- Dependencies: 254
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, project_id, name, created_at) FROM stdin;
\.


--
-- TOC entry 5470 (class 0 OID 19771)
-- Dependencies: 236
-- Data for Name: test_case_dataset_bindings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_dataset_bindings (id, test_case_id, dataset_id, is_default, created_at) FROM stdin;
\.


--
-- TOC entry 5501 (class 0 OID 20307)
-- Dependencies: 268
-- Data for Name: test_case_generation_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_generation_batches (id, project_id, source_prompt, status, llm_provider, llm_model, candidate_count, created_by, created_at) FROM stdin;
1	4	Log in to the page using a valid Gmail account and the correct password.	generated	ollama	gemma3:4b	5	1	2026-04-01 02:12:34.115146+07
2	4	Log in to the page using a valid Gmail account and the correct password.	generated	ollama	gemma3:4b	6	1	2026-04-01 04:04:45.948335+07
3	4	open this page and login with correct account	generated	ollama	gemma3:4b	2	1	2026-04-01 04:07:13.567549+07
4	4	open the page and login with correct account	generated	ollama	gemma3:4b	2	1	2026-04-01 04:09:34.899505+07
\.


--
-- TOC entry 5503 (class 0 OID 20335)
-- Dependencies: 270
-- Data for Name: test_case_generation_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_generation_candidates (id, batch_id, title, goal, display_text, prompt_text, execution_mode, plan_snapshot, variables_schema, candidate_order, is_selected, selected_test_case_id, created_at) FROM stdin;
2	1	Login with Invalid Password	An error message is displayed indicating invalid credentials.	Test Case: Login with Invalid Password\nGoal: An error message is displayed indicating invalid credentials.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter an incorrect password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating invalid credentials.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating invalid credentials.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Invalid Password", "expectedResult": "An error message is displayed indicating invalid credentials."}	{}	2	f	\N	2026-04-01 02:12:34.115146+07
3	1	Login with Empty Email Field	An error message is displayed indicating that the email field is required.	Test Case: Login with Empty Email Field\nGoal: An error message is displayed indicating that the email field is required.\n\nSteps:\n1. Navigate to the login page.\n2. Leave the email field empty.\n3. Enter a password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating that the email field is required.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating that the email field is required.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Leave the email field empty.", "order": 2, "action": "custom"}, {"text": "Enter a password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Empty Email Field", "expectedResult": "An error message is displayed indicating that the email field is required."}	{}	3	f	\N	2026-04-01 02:12:34.115146+07
4	1	Login with Empty Password Field	An error message is displayed indicating that the password field is required.	Test Case: Login with Empty Password Field\nGoal: An error message is displayed indicating that the password field is required.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Leave the password field empty.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating that the password field is required.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating that the password field is required.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Leave the password field empty.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Empty Password Field", "expectedResult": "An error message is displayed indicating that the password field is required."}	{}	4	f	\N	2026-04-01 02:12:34.115146+07
5	1	Login with Invalid Gmail Format	An error message is displayed indicating that the email address is in an invalid format.	Test Case: Login with Invalid Gmail Format\nGoal: An error message is displayed indicating that the email address is in an invalid format.\n\nSteps:\n1. Navigate to the login page.\n2. Enter an invalid Gmail address (e.g., 'test') into the email field.\n3. Enter a password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating that the email address is in an invalid format.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating that the email address is in an invalid format.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter an invalid Gmail address (e.g., 'test') into the email field.", "order": 2, "action": "custom"}, {"text": "Enter a password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Invalid Gmail Format", "expectedResult": "An error message is displayed indicating that the email address is in an invalid format."}	{}	5	f	\N	2026-04-01 02:12:34.115146+07
1	1	Successful Login with Valid Credentials	User is successfully logged in and redirected to the application's homepage.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the application's homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the corresponding password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the application's homepage.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "User is successfully logged in and redirected to the application's homepage.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter the corresponding password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the application's homepage."}	{}	1	t	1	2026-04-01 02:12:34.115146+07
6	2	Successful Login with Valid Credentials	User is successfully logged in and redirected to the dashboard/homepage.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard/homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the correct password associated with the Gmail address into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard/homepage.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "User is successfully logged in and redirected to the dashboard/homepage.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password associated with the Gmail address into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the dashboard/homepage."}	{}	1	f	\N	2026-04-01 04:04:45.948335+07
7	2	Negative Test - Invalid Email Format	An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')	Test Case: Negative Test - Invalid Email Format\nGoal: An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')\n\nSteps:\n1. Navigate to the login page.\n2. Enter an invalid Gmail address (e.g., 'test') into the email field.\n3. Enter a valid password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter an invalid Gmail address (e.g., 'test') into the email field.", "order": 2, "action": "custom"}, {"text": "Enter a valid password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Invalid Email Format", "expectedResult": "An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')"}	{}	2	f	\N	2026-04-01 04:04:45.948335+07
8	2	Negative Test - Invalid Password	An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')	Test Case: Negative Test - Invalid Password\nGoal: An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter an incorrect password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Invalid Password", "expectedResult": "An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')"}	{}	3	f	\N	2026-04-01 04:04:45.948335+07
9	2	Negative Test - Empty Email Field	An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')	Test Case: Negative Test - Empty Email Field\nGoal: An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')\n\nSteps:\n1. Navigate to the login page.\n2. Leave the email field empty.\n3. Enter a valid password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Leave the email field empty.", "order": 2, "action": "custom"}, {"text": "Enter a valid password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Empty Email Field", "expectedResult": "An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')"}	{}	4	f	\N	2026-04-01 04:04:45.948335+07
10	2	Negative Test - Empty Password Field	An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')	Test Case: Negative Test - Empty Password Field\nGoal: An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Leave the password field empty.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Leave the password field empty.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Empty Password Field", "expectedResult": "An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')"}	{}	5	f	\N	2026-04-01 04:04:45.948335+07
11	2	Negative Test - Empty Email and Password Fields	An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')	Test Case: Negative Test - Empty Email and Password Fields\nGoal: An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')\n\nSteps:\n1. Navigate to the login page.\n2. Leave both the email and password fields empty.\n3. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Leave both the email and password fields empty.", "order": 2, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 3, "action": "custom"}], "title": "Negative Test - Empty Email and Password Fields", "expectedResult": "An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')"}	{}	6	f	\N	2026-04-01 04:04:45.948335+07
12	3	Successful Login with Valid Credentials	User is successfully logged in and redirected to the homepage or dashboard.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the homepage or dashboard.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the 'Username' field.\n3. Enter the correct password in the 'Password' field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the homepage or dashboard.	open this page and login with correct account	step_based	{"goal": "User is successfully logged in and redirected to the homepage or dashboard.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the 'Username' field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password in the 'Password' field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the homepage or dashboard."}	{}	1	f	\N	2026-04-01 04:07:13.567549+07
13	3	Login with Incorrect Password	An error message is displayed indicating incorrect password. The user remains on the login page.	Test Case: Login with Incorrect Password\nGoal: An error message is displayed indicating incorrect password. The user remains on the login page.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the 'Username' field.\n3. Enter an incorrect password in the 'Password' field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating incorrect password. The user remains on the login page.	open this page and login with correct account	step_based	{"goal": "An error message is displayed indicating incorrect password. The user remains on the login page.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the 'Username' field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password in the 'Password' field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Incorrect Password", "expectedResult": "An error message is displayed indicating incorrect password. The user remains on the login page."}	{}	2	f	\N	2026-04-01 04:07:13.567549+07
15	4	Login with Incorrect Password	An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').	Test Case: Login with Incorrect Password\nGoal: An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter an incorrect password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').	open the page and login with correct account	step_based	{"goal": "An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the username field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password in the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Incorrect Password", "expectedResult": "An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password')."}	{}	2	f	\N	2026-04-01 04:09:34.899505+07
14	4	Successful Login with Valid Credentials	User is successfully logged in and redirected to the dashboard or homepage.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard or homepage.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter the correct password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard or homepage.	open the page and login with correct account	step_based	{"goal": "User is successfully logged in and redirected to the dashboard or homepage.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the username field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password in the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the dashboard or homepage."}	{}	1	t	4	2026-04-01 04:09:34.899505+07
\.


--
-- TOC entry 5466 (class 0 OID 19711)
-- Dependencies: 232
-- Data for Name: test_case_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_versions (id, test_case_id, version_no, source_type, prompt_text, reasoning_trace, plan_snapshot, variables_schema, ai_model, created_by, created_at, execution_mode, runtime_config_id, display_text) FROM stdin;
1	1	1	ai_generated	Log in to the page using a valid Gmail account and the correct password.	\N	{"goal": "User is successfully logged in and redirected to the application's homepage.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter the corresponding password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the application's homepage."}	{}	gemma3:4b	1	2026-04-01 02:12:49.207375+07	step_based	1	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the application's homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the corresponding password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the application's homepage.
3	3	1	ai_generated	Log in to https://id.zing.vn/ using the provided credentials.	\N	{"goal": "User logs in successfully and is redirected after submitting valid credentials.", "steps": [{"text": "Navigate to https://id.zing.vn/.", "order": 1, "action": "custom"}, {"text": "Enter {{ZING_USERNAME}} into the username field.", "order": 2, "action": "custom"}, {"text": "Enter {{ZING_PASSWORD}} into the password field.", "order": 3, "action": "custom"}, {"text": "Click the Login button.", "order": 4, "action": "custom"}], "title": "Login to Zing ID with Valid Credentials", "expectedResult": "User logs in successfully and is redirected after submitting valid credentials."}	{}	gemini-2.5-flash	1	2026-04-01 02:25:20.636868+07	step_based	1	Test Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter {{ZING_USERNAME}} into the username field.\n3. Enter {{ZING_PASSWORD}} into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.
2	2	1	ai_generated	Log in to https://id.zing.vn/.\nUse these credentials:\n- username: {{ZING_USERNAME}}\n- password: {{ZING_PASSWORD}}	\N	{"goal": "User logs in successfully and is redirected after submitting valid credentials.", "steps": [{"text": "Navigate to https://id.zing.vn/.", "order": 1, "action": "custom"}, {"text": "Enter username into the username field.", "order": 2, "action": "custom"}, {"text": "Enter password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the Login button.", "order": 4, "action": "custom"}], "title": "Login to Zing ID with Valid Credentials", "expectedResult": "User logs in successfully and is redirected after submitting valid credentials."}	{}	gemini-2.5-flash	1	2026-04-01 02:22:49.362+07	step_based	1	\nTest Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter "thanhhien18112" into the username field.\n3. Enter "Anhtoan@123" into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.\n
5	4	1	ai_generated	open the page and login with correct account	\N	{"goal": "User is successfully logged in and redirected to the dashboard or homepage.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the username field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password in the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the dashboard or homepage."}	{}	gemma3:4b	1	2026-04-01 04:09:43.859657+07	step_based	1	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard or homepage.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter the correct password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard or homepage.
\.


--
-- TOC entry 5464 (class 0 OID 19661)
-- Dependencies: 230
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_cases (id, project_id, scan_id, title, goal, status, ai_model, created_by, current_version_id, deleted_at, deleted_by, restored_at, restored_by, created_at, updated_at) FROM stdin;
1	4	\N	Successful Login with Valid Credentials	User is successfully logged in and redirected to the application's homepage.	draft	gemma3:4b	1	1	\N	\N	\N	\N	2026-04-01 02:12:49.207375+07	2026-04-01 02:12:49.207375+07
3	4	\N	Login to Zing ID with Valid Credentials	User logs in successfully and is redirected after submitting valid credentials.	draft	gemini-2.5-flash	1	\N	\N	\N	\N	\N	2026-04-01 02:25:20.636868+07	2026-04-01 02:25:20.636868+07
2	4	\N	Login to Zing ID with Valid Credentials	User logs in successfully and is redirected after submitting valid credentials.	draft	gemini-2.5-flash	1	2	\N	\N	\N	\N	2026-04-01 02:22:49.362+07	2026-04-01 02:41:40.944141+07
4	4	\N	Successful Login with Valid Credentials	User is successfully logged in and redirected to the dashboard or homepage.	draft	gemma3:4b	1	5	\N	\N	\N	\N	2026-04-01 04:09:43.859657+07	2026-04-01 04:09:43.859657+07
\.


--
-- TOC entry 5462 (class 0 OID 19631)
-- Dependencies: 228
-- Data for Name: test_datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_datasets (id, project_id, name, description, data_mode, schema_json, data_json, generator_config, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5497 (class 0 OID 20199)
-- Dependencies: 264
-- Data for Name: test_run_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_run_attempts (id, test_run_id, attempt_no, status, verdict, trigger_type, runtime_config_snapshot, browser_profile_snapshot, scan_context_snapshot, agent_prompt, final_result, structured_output, error_message, started_at, finished_at, created_at) FROM stdin;
1	1	1	failed	fail	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Log in to https://id.zing.vn/ using the provided credentials.	I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.	\N	\N	\N	2026-04-01 02:42:25.675549+07	2026-04-01 02:41:51.800762+07
2	2	1	queued	\N	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Log in to https://id.zing.vn/.\nUse these credentials:\n- username: thanhhien18112\n- password: Anhtoan@123	\N	\N	\N	\N	\N	2026-04-01 03:15:36.125699+07
3	3	1	failed	fail	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter {{ZING_USERNAME}} into the username field.\n3. Enter {{ZING_PASSWORD}} into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.	The login to Zing ID with the provided credentials was unsuccessful. The system returned an error message: 'Tài khoản hoặc mật khẩu không đúng' (Incorrect account or password). Therefore, the user was not redirected after submitting the credentials as expected. This task cannot be completed without valid login credentials.	\N	\N	\N	2026-04-01 03:54:15.302072+07	2026-04-01 03:53:50.288389+07
4	4	1	completed	pass	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter "thanhhien18112" into the username field.\n3. Enter "Anhtoan@123" into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.	User successfully logged in to Zing ID with the provided valid credentials and was redirected to the security settings page. The current URL is https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38 and the page displays 'Chào tbdbdbbdb' and 'Tài khoản (Zing ID): thanhhien18112'.	\N	\N	\N	2026-04-01 03:59:24.04286+07	2026-04-01 03:58:42.677068+07
5	5	1	queued	\N	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the application's homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the corresponding password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the application's homepage.	\N	\N	\N	\N	\N	2026-04-01 04:07:50.916813+07
6	6	1	failed	error	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard or homepage.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter the correct password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard or homepage.	\N	\N	This operation was aborted	2026-04-01 04:10:14.589732+07	2026-04-01 04:10:14.589732+07	2026-04-01 04:09:59.54203+07
\.


--
-- TOC entry 5476 (class 0 OID 19885)
-- Dependencies: 242
-- Data for Name: test_run_dataset_bindings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_run_dataset_bindings (id, test_run_id, dataset_id, alias, dataset_snapshot, created_at) FROM stdin;
\.


--
-- TOC entry 5489 (class 0 OID 20046)
-- Dependencies: 255
-- Data for Name: test_run_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_run_tags (test_run_id, tag_id) FROM stdin;
\.


--
-- TOC entry 5474 (class 0 OID 19849)
-- Dependencies: 240
-- Data for Name: test_runs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_runs (id, test_case_id, test_case_version_id, status, verdict, execution_log, evidence_summary, error_message, triggered_by, started_at, finished_at, created_at) FROM stdin;
1	2	2	failed	fail	{"mode": "goal_based_agent", "steps": 3, "visitedUrls": ["https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0"], "totalDurationSeconds": 16.64991545677185}	{"screenshots": 3}	\N	1	\N	2026-04-01 02:42:25.678364+07	2026-04-01 02:41:51.793485+07
2	2	2	queued	\N	\N	\N	\N	1	\N	\N	2026-04-01 03:15:36.120745+07
3	2	2	failed	fail	{"mode": "goal_based_agent", "steps": 3, "visitedUrls": ["https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0"], "totalDurationSeconds": 14.588411808013916}	{"screenshots": 3}	\N	1	\N	2026-04-01 03:54:15.304428+07	2026-04-01 03:53:50.281954+07
4	2	2	completed	pass	{"mode": "goal_based_agent", "steps": 5, "visitedUrls": ["https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38"], "totalDurationSeconds": 25.421348094940186}	{"screenshots": 5}	\N	1	\N	2026-04-01 03:59:24.045691+07	2026-04-01 03:58:42.670243+07
5	1	1	queued	\N	\N	\N	\N	1	\N	\N	2026-04-01 04:07:50.898431+07
6	4	5	failed	error	{"mode": "dispatch_to_worker", "dispatchStatus": "failed"}	\N	This operation was aborted	1	2026-04-01 04:10:14.595545+07	2026-04-01 04:10:14.595545+07	2026-04-01 04:09:59.536571+07
\.


--
-- TOC entry 5468 (class 0 OID 19748)
-- Dependencies: 234
-- Data for Name: test_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_steps (id, test_case_version_id, step_order, action_type, target, input_data, expected_result, created_at) FROM stdin;
1	1	1	custom	\N	{"description": "Navigate to the login page."}	\N	2026-04-01 02:12:49.207375+07
2	1	2	custom	\N	{"description": "Enter a valid Gmail address into the email field."}	\N	2026-04-01 02:12:49.207375+07
3	1	3	custom	\N	{"description": "Enter the corresponding password into the password field."}	\N	2026-04-01 02:12:49.207375+07
4	1	4	custom	\N	{"description": "Click the 'Login' button."}	User is successfully logged in and redirected to the application's homepage.	2026-04-01 02:12:49.207375+07
9	3	1	custom	\N	{"description": "Navigate to https://id.zing.vn/."}	\N	2026-04-01 02:25:20.636868+07
10	3	2	custom	\N	{"description": "Enter {{ZING_USERNAME}} into the username field."}	\N	2026-04-01 02:25:20.636868+07
11	3	3	custom	\N	{"description": "Enter {{ZING_PASSWORD}} into the password field."}	\N	2026-04-01 02:25:20.636868+07
12	3	4	custom	\N	{"description": "Click the Login button."}	User logs in successfully and is redirected after submitting valid credentials.	2026-04-01 02:25:20.636868+07
13	2	1	custom	\N	{"description": "Navigate to https://id.zing.vn/."}	\N	2026-04-01 02:41:40.944141+07
14	2	2	custom	\N	{"description": "Enter username into the username field."}	\N	2026-04-01 02:41:40.944141+07
15	2	3	custom	\N	{"description": "Enter password into the password field."}	\N	2026-04-01 02:41:40.944141+07
16	2	4	custom	\N	{"description": "Click the Login button."}	User logs in successfully and is redirected after submitting valid credentials.	2026-04-01 02:41:40.944141+07
17	5	1	custom	\N	{"description": "Navigate to the login page (e.g., /login)"}	\N	2026-04-01 04:09:43.859657+07
18	5	2	custom	\N	{"description": "Enter a valid username in the username field."}	\N	2026-04-01 04:09:43.859657+07
19	5	3	custom	\N	{"description": "Enter the correct password in the password field."}	\N	2026-04-01 04:09:43.859657+07
20	5	4	custom	\N	{"description": "Click the 'Login' button."}	User is successfully logged in and redirected to the dashboard or homepage.	2026-04-01 04:09:43.859657+07
\.


--
-- TOC entry 5472 (class 0 OID 19799)
-- Dependencies: 238
-- Data for Name: test_tree_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_tree_nodes (id, project_id, parent_id, node_type, name, test_case_id, dataset_id, sort_order, deleted_at, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5454 (class 0 OID 19538)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password_hash, created_at, updated_at) FROM stdin;
1	nguyenhung.9a5.nbk@gmail.com	nguyenhung.9a5.nbk@gmail.com	$2b$10$M31UrRcA0sTmuB6xONhtcujZtKHqRs.5Sq6r2CtTXB4nuxtn3l5m6	2026-04-01 02:00:42.396295+07	2026-04-01 02:00:42.396295+07
\.


--
-- TOC entry 5569 (class 0 OID 0)
-- Dependencies: 257
-- Name: agent_runtime_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_runtime_configs_id_seq', 1, true);


--
-- TOC entry 5570 (class 0 OID 0)
-- Dependencies: 259
-- Name: browser_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.browser_profiles_id_seq', 1, false);


--
-- TOC entry 5571 (class 0 OID 0)
-- Dependencies: 245
-- Name: evidences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evidences_id_seq', 37, true);


--
-- TOC entry 5572 (class 0 OID 0)
-- Dependencies: 271
-- Name: execution_scripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.execution_scripts_id_seq', 35, true);


--
-- TOC entry 5573 (class 0 OID 0)
-- Dependencies: 247
-- Name: failure_analyses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failure_analyses_id_seq', 1, false);


--
-- TOC entry 5574 (class 0 OID 0)
-- Dependencies: 265
-- Name: healing_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.healing_applications_id_seq', 1, false);


--
-- TOC entry 5575 (class 0 OID 0)
-- Dependencies: 249
-- Name: healing_suggestions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.healing_suggestions_id_seq', 1, false);


--
-- TOC entry 5576 (class 0 OID 0)
-- Dependencies: 261
-- Name: project_secrets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_secrets_id_seq', 2, true);


--
-- TOC entry 5577 (class 0 OID 0)
-- Dependencies: 223
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 4, true);


--
-- TOC entry 5578 (class 0 OID 0)
-- Dependencies: 251
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- TOC entry 5579 (class 0 OID 0)
-- Dependencies: 243
-- Name: run_step_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.run_step_logs_id_seq', 39, true);


--
-- TOC entry 5580 (class 0 OID 0)
-- Dependencies: 225
-- Name: scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scans_id_seq', 1, false);


--
-- TOC entry 5581 (class 0 OID 0)
-- Dependencies: 221
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- TOC entry 5582 (class 0 OID 0)
-- Dependencies: 253
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 1, false);


--
-- TOC entry 5583 (class 0 OID 0)
-- Dependencies: 235
-- Name: test_case_dataset_bindings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_dataset_bindings_id_seq', 1, false);


--
-- TOC entry 5584 (class 0 OID 0)
-- Dependencies: 267
-- Name: test_case_generation_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_generation_batches_id_seq', 4, true);


--
-- TOC entry 5585 (class 0 OID 0)
-- Dependencies: 269
-- Name: test_case_generation_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_generation_candidates_id_seq', 15, true);


--
-- TOC entry 5586 (class 0 OID 0)
-- Dependencies: 231
-- Name: test_case_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_versions_id_seq', 5, true);


--
-- TOC entry 5587 (class 0 OID 0)
-- Dependencies: 229
-- Name: test_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_cases_id_seq', 4, true);


--
-- TOC entry 5588 (class 0 OID 0)
-- Dependencies: 227
-- Name: test_datasets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_datasets_id_seq', 1, false);


--
-- TOC entry 5589 (class 0 OID 0)
-- Dependencies: 263
-- Name: test_run_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_run_attempts_id_seq', 6, true);


--
-- TOC entry 5590 (class 0 OID 0)
-- Dependencies: 241
-- Name: test_run_dataset_bindings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_run_dataset_bindings_id_seq', 1, false);


--
-- TOC entry 5591 (class 0 OID 0)
-- Dependencies: 239
-- Name: test_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_runs_id_seq', 6, true);


--
-- TOC entry 5592 (class 0 OID 0)
-- Dependencies: 233
-- Name: test_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_steps_id_seq', 20, true);


--
-- TOC entry 5593 (class 0 OID 0)
-- Dependencies: 237
-- Name: test_tree_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_tree_nodes_id_seq', 1, false);


--
-- TOC entry 5594 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


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


-- Completed on 2026-04-01 04:44:30

--
-- PostgreSQL database dump complete
--

\unrestrict fKUlUamDtvseYHA9Sv7gd2JGBbEGEWx47aiuY0kCihIJxHwWRNiDxnIsiyTe3wc

