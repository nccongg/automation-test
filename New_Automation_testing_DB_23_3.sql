-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.agent_runtime_configs_id_seq;

CREATE SEQUENCE public.agent_runtime_configs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.agent_runtime_configs_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.agent_runtime_configs_id_seq TO postgres;

-- DROP SEQUENCE public.browser_profiles_id_seq;

CREATE SEQUENCE public.browser_profiles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.browser_profiles_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.browser_profiles_id_seq TO postgres;

-- DROP SEQUENCE public.evidences_id_seq;

CREATE SEQUENCE public.evidences_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.evidences_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.evidences_id_seq TO postgres;

-- DROP SEQUENCE public.failure_analyses_id_seq;

CREATE SEQUENCE public.failure_analyses_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.failure_analyses_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.failure_analyses_id_seq TO postgres;

-- DROP SEQUENCE public.healing_applications_id_seq;

CREATE SEQUENCE public.healing_applications_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.healing_applications_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.healing_applications_id_seq TO postgres;

-- DROP SEQUENCE public.healing_suggestions_id_seq;

CREATE SEQUENCE public.healing_suggestions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.healing_suggestions_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.healing_suggestions_id_seq TO postgres;

-- DROP SEQUENCE public.project_secrets_id_seq;

CREATE SEQUENCE public.project_secrets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.project_secrets_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.project_secrets_id_seq TO postgres;

-- DROP SEQUENCE public.projects_id_seq;

CREATE SEQUENCE public.projects_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.projects_id_seq TO postgres;

-- DROP SEQUENCE public.reports_id_seq;

CREATE SEQUENCE public.reports_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.reports_id_seq TO postgres;

-- DROP SEQUENCE public.run_step_logs_id_seq;

CREATE SEQUENCE public.run_step_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.run_step_logs_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.run_step_logs_id_seq TO postgres;

-- DROP SEQUENCE public.scans_id_seq;

CREATE SEQUENCE public.scans_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scans_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.scans_id_seq TO postgres;

-- DROP SEQUENCE public.sessions_id_seq;

CREATE SEQUENCE public.sessions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.sessions_id_seq TO postgres;

-- DROP SEQUENCE public.tags_id_seq;

CREATE SEQUENCE public.tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.tags_id_seq TO postgres;

-- DROP SEQUENCE public.test_case_dataset_bindings_id_seq;

CREATE SEQUENCE public.test_case_dataset_bindings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_case_dataset_bindings_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_case_dataset_bindings_id_seq TO postgres;

-- DROP SEQUENCE public.test_case_versions_id_seq;

CREATE SEQUENCE public.test_case_versions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_case_versions_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_case_versions_id_seq TO postgres;

-- DROP SEQUENCE public.test_cases_id_seq;

CREATE SEQUENCE public.test_cases_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_cases_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_cases_id_seq TO postgres;

-- DROP SEQUENCE public.test_datasets_id_seq;

CREATE SEQUENCE public.test_datasets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_datasets_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_datasets_id_seq TO postgres;

-- DROP SEQUENCE public.test_run_attempts_id_seq;

CREATE SEQUENCE public.test_run_attempts_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_run_attempts_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_run_attempts_id_seq TO postgres;

-- DROP SEQUENCE public.test_run_dataset_bindings_id_seq;

CREATE SEQUENCE public.test_run_dataset_bindings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_run_dataset_bindings_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_run_dataset_bindings_id_seq TO postgres;

-- DROP SEQUENCE public.test_runs_id_seq;

CREATE SEQUENCE public.test_runs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_runs_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_runs_id_seq TO postgres;

-- DROP SEQUENCE public.test_steps_id_seq;

CREATE SEQUENCE public.test_steps_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_steps_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_steps_id_seq TO postgres;

-- DROP SEQUENCE public.test_tree_nodes_id_seq;

CREATE SEQUENCE public.test_tree_nodes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.test_tree_nodes_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.test_tree_nodes_id_seq TO postgres;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;
-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users ( id bigserial NOT NULL, email varchar(255) NOT NULL, "name" varchar(150) NOT NULL, password_hash text NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT users_email_key UNIQUE (email), CONSTRAINT users_pkey PRIMARY KEY (id));
COMMENT ON TABLE public.users IS 'System users';

-- Permissions

ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;


-- public.projects definition

-- Drop table

-- DROP TABLE public.projects;

CREATE TABLE public.projects ( id bigserial NOT NULL, user_id int8 NOT NULL, "name" varchar(255) NOT NULL, description text NULL, base_url text NOT NULL, config jsonb DEFAULT '{}'::jsonb NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT projects_pkey PRIMARY KEY (id), CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_projects_base_url ON public.projects USING btree (base_url);
CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);
COMMENT ON TABLE public.projects IS 'Testing projects created by users';

-- Permissions

ALTER TABLE public.projects OWNER TO postgres;
GRANT ALL ON TABLE public.projects TO postgres;


-- public.scans definition

-- Drop table

-- DROP TABLE public.scans;

CREATE TABLE public.scans ( id bigserial NOT NULL, project_id int8 NOT NULL, status varchar(30) NOT NULL, root_url text NOT NULL, sitemap jsonb NULL, interaction_map jsonb NULL, error_message text NULL, started_at timestamptz NULL, finished_at timestamptz NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT scans_pkey PRIMARY KEY (id), CONSTRAINT scans_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))), CONSTRAINT scans_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE);
CREATE INDEX idx_scans_created_at ON public.scans USING btree (created_at DESC);
CREATE INDEX idx_scans_project_id ON public.scans USING btree (project_id);
CREATE INDEX idx_scans_status ON public.scans USING btree (status);
COMMENT ON TABLE public.scans IS 'Website scan/crawl analysis results';

-- Permissions

ALTER TABLE public.scans OWNER TO postgres;
GRANT ALL ON TABLE public.scans TO postgres;


-- public.sessions definition

-- Drop table

-- DROP TABLE public.sessions;

CREATE TABLE public.sessions ( id bigserial NOT NULL, user_id int8 NOT NULL, token_hash text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT sessions_pkey PRIMARY KEY (id), CONSTRAINT sessions_token_hash_key UNIQUE (token_hash), CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);
CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);
COMMENT ON TABLE public.sessions IS 'Authentication sessions';

-- Permissions

ALTER TABLE public.sessions OWNER TO postgres;
GRANT ALL ON TABLE public.sessions TO postgres;


-- public.tags definition

-- Drop table

-- DROP TABLE public.tags;

CREATE TABLE public.tags ( id bigserial NOT NULL, project_id int8 NOT NULL, "name" varchar(100) NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT tags_pkey PRIMARY KEY (id), CONSTRAINT tags_project_id_name_key UNIQUE (project_id, name), CONSTRAINT tags_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE);
CREATE INDEX idx_tags_project_id ON public.tags USING btree (project_id);
COMMENT ON TABLE public.tags IS 'Project-level tags for history filtering';

-- Permissions

ALTER TABLE public.tags OWNER TO postgres;
GRANT ALL ON TABLE public.tags TO postgres;


-- public.test_datasets definition

-- Drop table

-- DROP TABLE public.test_datasets;

CREATE TABLE public.test_datasets ( id bigserial NOT NULL, project_id int8 NOT NULL, "name" varchar(255) NOT NULL, description text NULL, data_mode varchar(20) NOT NULL, schema_json jsonb NULL, data_json jsonb NULL, generator_config jsonb NULL, created_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, deleted_at timestamptz NULL, CONSTRAINT test_datasets_data_mode_check CHECK (((data_mode)::text = ANY ((ARRAY['static_json'::character varying, 'generator'::character varying])::text[]))), CONSTRAINT test_datasets_pkey PRIMARY KEY (id), CONSTRAINT test_datasets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL, CONSTRAINT test_datasets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE);
CREATE INDEX idx_test_datasets_deleted_at ON public.test_datasets USING btree (deleted_at);
CREATE INDEX idx_test_datasets_project_id ON public.test_datasets USING btree (project_id);
COMMENT ON TABLE public.test_datasets IS 'Reusable datasets in JSON or generator mode';

-- Permissions

ALTER TABLE public.test_datasets OWNER TO postgres;
GRANT ALL ON TABLE public.test_datasets TO postgres;


-- public.agent_runtime_configs definition

-- Drop table

-- DROP TABLE public.agent_runtime_configs;

CREATE TABLE public.agent_runtime_configs ( id bigserial NOT NULL, project_id int8 NOT NULL, "name" varchar(255) NOT NULL, description text NULL, llm_provider varchar(50) NOT NULL, llm_model varchar(100) NOT NULL, max_steps int4 DEFAULT 30 NOT NULL, timeout_seconds int4 DEFAULT 300 NOT NULL, use_vision bool DEFAULT true NOT NULL, headless bool DEFAULT true NOT NULL, browser_type varchar(30) DEFAULT 'chromium'::character varying NOT NULL, allowed_domains jsonb DEFAULT '[]'::jsonb NOT NULL, viewport_json jsonb NULL, locale varchar(20) NULL, timezone varchar(100) NULL, proxy_config_json jsonb NULL, output_schema_json jsonb NULL, tool_policy_json jsonb NULL, extra_config_json jsonb DEFAULT '{}'::jsonb NOT NULL, created_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, deleted_at timestamptz NULL, CONSTRAINT agent_runtime_configs_browser_type_check CHECK (((browser_type)::text = ANY ((ARRAY['chromium'::character varying, 'chrome'::character varying, 'firefox'::character varying, 'webkit'::character varying])::text[]))), CONSTRAINT agent_runtime_configs_pkey PRIMARY KEY (id), CONSTRAINT agent_runtime_configs_project_id_name_key UNIQUE (project_id, name), CONSTRAINT agent_runtime_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL, CONSTRAINT agent_runtime_configs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE);
CREATE INDEX idx_agent_runtime_configs_deleted_at ON public.agent_runtime_configs USING btree (deleted_at);
CREATE INDEX idx_agent_runtime_configs_project_id ON public.agent_runtime_configs USING btree (project_id);
COMMENT ON TABLE public.agent_runtime_configs IS 'Reusable browser-use runtime profiles (LLM, timeout, domains, vision, tool policy)';

-- Permissions

ALTER TABLE public.agent_runtime_configs OWNER TO postgres;
GRANT ALL ON TABLE public.agent_runtime_configs TO postgres;


-- public.browser_profiles definition

-- Drop table

-- DROP TABLE public.browser_profiles;

CREATE TABLE public.browser_profiles ( id bigserial NOT NULL, project_id int8 NOT NULL, "name" varchar(255) NOT NULL, provider varchar(30) NOT NULL, profile_type varchar(40) NOT NULL, profile_ref text NULL, profile_data jsonb NULL, is_default bool DEFAULT false NOT NULL, created_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, deleted_at timestamptz NULL, CONSTRAINT browser_profiles_pkey PRIMARY KEY (id), CONSTRAINT browser_profiles_profile_type_check CHECK (((profile_type)::text = ANY ((ARRAY['system_chrome'::character varying, 'storage_state'::character varying, 'cloud_profile'::character varying, 'ephemeral'::character varying])::text[]))), CONSTRAINT browser_profiles_project_id_name_key UNIQUE (project_id, name), CONSTRAINT browser_profiles_provider_check CHECK (((provider)::text = ANY ((ARRAY['local'::character varying, 'cloud'::character varying])::text[]))), CONSTRAINT browser_profiles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL, CONSTRAINT browser_profiles_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE);
CREATE INDEX idx_browser_profiles_deleted_at ON public.browser_profiles USING btree (deleted_at);
CREATE INDEX idx_browser_profiles_project_id ON public.browser_profiles USING btree (project_id);
CREATE UNIQUE INDEX uq_browser_profiles_one_default_per_project ON public.browser_profiles USING btree (project_id) WHERE ((is_default = true) AND (deleted_at IS NULL));
COMMENT ON TABLE public.browser_profiles IS 'Browser auth/profile references such as storage state or cloud profile';

-- Permissions

ALTER TABLE public.browser_profiles OWNER TO postgres;
GRANT ALL ON TABLE public.browser_profiles TO postgres;


-- public.project_secrets definition

-- Drop table

-- DROP TABLE public.project_secrets;

CREATE TABLE public.project_secrets ( id bigserial NOT NULL, project_id int8 NOT NULL, "name" varchar(150) NOT NULL, scope_domain text NULL, secret_type varchar(30) NOT NULL, encrypted_value text NOT NULL, metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL, created_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, deleted_at timestamptz NULL, CONSTRAINT project_secrets_pkey PRIMARY KEY (id), CONSTRAINT project_secrets_secret_type_check CHECK (((secret_type)::text = ANY ((ARRAY['password'::character varying, 'token'::character varying, 'otp_seed'::character varying, 'api_key'::character varying, 'cookie'::character varying, 'other'::character varying])::text[]))), CONSTRAINT project_secrets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL, CONSTRAINT project_secrets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE);
CREATE INDEX idx_project_secrets_deleted_at ON public.project_secrets USING btree (deleted_at);
CREATE INDEX idx_project_secrets_project_id ON public.project_secrets USING btree (project_id);
CREATE UNIQUE INDEX uq_project_secrets_project_name_scope ON public.project_secrets USING btree (project_id, name, COALESCE(scope_domain, ''::text));
COMMENT ON TABLE public.project_secrets IS 'Encrypted project-level secrets used by browser automation';

-- Permissions

ALTER TABLE public.project_secrets OWNER TO postgres;
GRANT ALL ON TABLE public.project_secrets TO postgres;


-- public.evidences definition

-- Drop table

-- DROP TABLE public.evidences;

CREATE TABLE public.evidences ( id bigserial NOT NULL, test_run_id int8 NOT NULL, run_step_log_id int8 NULL, evidence_type varchar(30) NOT NULL, file_path text NULL, content_json jsonb NULL, created_at timestamptz DEFAULT now() NOT NULL, test_run_attempt_id int8 NULL, storage_provider varchar(20) DEFAULT 'local'::character varying NOT NULL, mime_type varchar(150) NULL, file_size_bytes int8 NULL, checksum varchar(128) NULL, page_url text NULL, artifact_group varchar(50) NULL, captured_at timestamptz NULL, CONSTRAINT evidences_evidence_type_check CHECK (((evidence_type)::text = ANY ((ARRAY['screenshot'::character varying, 'dom_snapshot'::character varying, 'console_log'::character varying, 'network_log'::character varying, 'video'::character varying, 'trace'::character varying])::text[]))), CONSTRAINT evidences_pkey PRIMARY KEY (id), CONSTRAINT evidences_storage_provider_check CHECK (((storage_provider)::text = ANY ((ARRAY['local'::character varying, 'minio'::character varying, 's3'::character varying])::text[]))));
CREATE INDEX idx_evidences_artifact_group ON public.evidences USING btree (artifact_group);
CREATE INDEX idx_evidences_attempt_id ON public.evidences USING btree (test_run_attempt_id);
CREATE INDEX idx_evidences_step_id ON public.evidences USING btree (run_step_log_id);
CREATE INDEX idx_evidences_test_run_id ON public.evidences USING btree (test_run_id);
CREATE INDEX idx_evidences_type ON public.evidences USING btree (evidence_type);
COMMENT ON TABLE public.evidences IS 'Execution evidence such as screenshots and logs';

-- Column comments

COMMENT ON COLUMN public.evidences.test_run_attempt_id IS 'Attempt that produced this evidence artifact';

-- Permissions

ALTER TABLE public.evidences OWNER TO postgres;
GRANT ALL ON TABLE public.evidences TO postgres;


-- public.failure_analyses definition

-- Drop table

-- DROP TABLE public.failure_analyses;

CREATE TABLE public.failure_analyses ( id bigserial NOT NULL, test_run_id int8 NOT NULL, failed_step jsonb NULL, analysis text NULL, suggestions jsonb NULL, confidence_score numeric(5, 2) NULL, created_at timestamptz DEFAULT now() NOT NULL, test_run_attempt_id int8 NULL, CONSTRAINT failure_analyses_pkey PRIMARY KEY (id));
CREATE INDEX idx_failure_analyses_test_run_id ON public.failure_analyses USING btree (test_run_id);
CREATE INDEX idx_failure_analyses_test_run_id_nonuniq ON public.failure_analyses USING btree (test_run_id);
CREATE UNIQUE INDEX uq_failure_analyses_attempt_id ON public.failure_analyses USING btree (test_run_attempt_id) WHERE (test_run_attempt_id IS NOT NULL);
COMMENT ON TABLE public.failure_analyses IS 'AI failure analysis for failed runs';

-- Permissions

ALTER TABLE public.failure_analyses OWNER TO postgres;
GRANT ALL ON TABLE public.failure_analyses TO postgres;


-- public.healing_applications definition

-- Drop table

-- DROP TABLE public.healing_applications;

CREATE TABLE public.healing_applications ( id bigserial NOT NULL, healing_suggestion_id int8 NOT NULL, applied_to_version_id int8 NULL, result_test_run_id int8 NULL, result_attempt_id int8 NULL, applied_by int8 NULL, result_status varchar(30) NULL, notes text NULL, applied_at timestamptz DEFAULT now() NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT healing_applications_pkey PRIMARY KEY (id), CONSTRAINT healing_applications_result_status_check CHECK (((result_status)::text = ANY ((ARRAY['pending'::character varying, 'validated'::character varying, 'rejected'::character varying, 'failed'::character varying])::text[]))));
CREATE INDEX idx_healing_applications_result_run_id ON public.healing_applications USING btree (result_test_run_id);
CREATE INDEX idx_healing_applications_suggestion_id ON public.healing_applications USING btree (healing_suggestion_id);
COMMENT ON TABLE public.healing_applications IS 'Audit trail for applying healing suggestions and validating reruns';

-- Permissions

ALTER TABLE public.healing_applications OWNER TO postgres;
GRANT ALL ON TABLE public.healing_applications TO postgres;


-- public.healing_suggestions definition

-- Drop table

-- DROP TABLE public.healing_suggestions;

CREATE TABLE public.healing_suggestions ( id bigserial NOT NULL, failure_analysis_id int8 NOT NULL, suggestion_type varchar(30) NOT NULL, old_value text NULL, new_value text NULL, reason text NULL, confidence_score numeric(5, 2) NULL, is_applied bool DEFAULT false NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT healing_suggestions_pkey PRIMARY KEY (id), CONSTRAINT healing_suggestions_suggestion_type_check CHECK (((suggestion_type)::text = ANY ((ARRAY['locator_replace'::character varying, 'wait_adjust'::character varying, 'assert_update'::character varying, 'step_edit'::character varying, 'retry_strategy'::character varying])::text[]))));
CREATE INDEX idx_healing_suggestions_failure_id ON public.healing_suggestions USING btree (failure_analysis_id);
COMMENT ON TABLE public.healing_suggestions IS 'Fix suggestions after failure analysis';

-- Permissions

ALTER TABLE public.healing_suggestions OWNER TO postgres;
GRANT ALL ON TABLE public.healing_suggestions TO postgres;


-- public.reports definition

-- Drop table

-- DROP TABLE public.reports;

CREATE TABLE public.reports ( id bigserial NOT NULL, test_run_id int8 NOT NULL, format varchar(20) NOT NULL, file_path text NULL, summary jsonb NULL, created_at timestamptz DEFAULT now() NOT NULL, test_run_attempt_id int8 NULL, CONSTRAINT reports_format_check CHECK (((format)::text = ANY ((ARRAY['pdf'::character varying, 'html'::character varying, 'json'::character varying])::text[]))), CONSTRAINT reports_pkey PRIMARY KEY (id));
CREATE INDEX idx_reports_attempt_id ON public.reports USING btree (test_run_attempt_id);
CREATE INDEX idx_reports_test_run_id ON public.reports USING btree (test_run_id);
COMMENT ON TABLE public.reports IS 'Generated execution reports';

-- Permissions

ALTER TABLE public.reports OWNER TO postgres;
GRANT ALL ON TABLE public.reports TO postgres;


-- public.run_step_logs definition

-- Drop table

-- DROP TABLE public.run_step_logs;

CREATE TABLE public.run_step_logs ( id bigserial NOT NULL, test_run_id int8 NOT NULL, step_no int4 NOT NULL, step_title text NULL, "action" varchar(100) NULL, status varchar(30) NOT NULL, message text NULL, started_at timestamptz NULL, finished_at timestamptz NULL, telemetry jsonb NULL, created_at timestamptz DEFAULT now() NOT NULL, test_run_attempt_id int8 NULL, current_url text NULL, action_input_json jsonb NULL, action_output_json jsonb NULL, model_output_json jsonb NULL, thought_text text NULL, extracted_content text NULL, duration_ms int4 NULL, CONSTRAINT run_step_logs_pkey PRIMARY KEY (id), CONSTRAINT run_step_logs_status_check CHECK (((status)::text = ANY ((ARRAY['running'::character varying, 'passed'::character varying, 'failed'::character varying, 'skipped'::character varying])::text[]))));
CREATE INDEX idx_run_step_logs_attempt_id ON public.run_step_logs USING btree (test_run_attempt_id);
CREATE INDEX idx_run_step_logs_attempt_step_no ON public.run_step_logs USING btree (test_run_attempt_id, step_no);
CREATE INDEX idx_run_step_logs_status ON public.run_step_logs USING btree (status);
CREATE INDEX idx_run_step_logs_step_no ON public.run_step_logs USING btree (test_run_id, step_no);
CREATE INDEX idx_run_step_logs_test_run_id ON public.run_step_logs USING btree (test_run_id);
COMMENT ON TABLE public.run_step_logs IS 'Realtime step-level execution logs';

-- Column comments

COMMENT ON COLUMN public.run_step_logs.test_run_attempt_id IS 'Attempt that emitted this runtime step log';

-- Permissions

ALTER TABLE public.run_step_logs OWNER TO postgres;
GRANT ALL ON TABLE public.run_step_logs TO postgres;


-- public.test_case_dataset_bindings definition

-- Drop table

-- DROP TABLE public.test_case_dataset_bindings;

CREATE TABLE public.test_case_dataset_bindings ( id bigserial NOT NULL, test_case_id int8 NOT NULL, dataset_id int8 NOT NULL, is_default bool DEFAULT false NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT test_case_dataset_bindings_pkey PRIMARY KEY (id), CONSTRAINT test_case_dataset_bindings_test_case_id_dataset_id_key UNIQUE (test_case_id, dataset_id));
CREATE INDEX idx_tc_dataset_bindings_dataset_id ON public.test_case_dataset_bindings USING btree (dataset_id);
CREATE INDEX idx_tc_dataset_bindings_test_case_id ON public.test_case_dataset_bindings USING btree (test_case_id);
CREATE UNIQUE INDEX uq_test_case_one_default_dataset ON public.test_case_dataset_bindings USING btree (test_case_id) WHERE (is_default = true);
COMMENT ON TABLE public.test_case_dataset_bindings IS 'Allowed/default datasets for a test case';

-- Permissions

ALTER TABLE public.test_case_dataset_bindings OWNER TO postgres;
GRANT ALL ON TABLE public.test_case_dataset_bindings TO postgres;


-- public.test_case_versions definition

-- Drop table

-- DROP TABLE public.test_case_versions;

CREATE TABLE public.test_case_versions ( id bigserial NOT NULL, test_case_id int8 NOT NULL, version_no int4 NOT NULL, source_type varchar(30) NOT NULL, prompt_text text NULL, reasoning_trace jsonb NULL, plan_snapshot jsonb NOT NULL, variables_schema jsonb DEFAULT '{}'::jsonb NOT NULL, ai_model varchar(100) NULL, created_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, execution_mode varchar(30) DEFAULT 'step_based'::character varying NOT NULL, runtime_config_id int8 NULL, CONSTRAINT test_case_versions_execution_mode_check CHECK (((execution_mode)::text = ANY ((ARRAY['step_based'::character varying, 'goal_based_agent'::character varying, 'hybrid_agent'::character varying])::text[]))), CONSTRAINT test_case_versions_pkey PRIMARY KEY (id), CONSTRAINT test_case_versions_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['ai_generated'::character varying, 'user_edited'::character varying, 'healed'::character varying])::text[]))), CONSTRAINT test_case_versions_test_case_id_version_no_key UNIQUE (test_case_id, version_no));
CREATE INDEX idx_test_case_versions_execution_mode ON public.test_case_versions USING btree (execution_mode);
CREATE INDEX idx_test_case_versions_runtime_config_id ON public.test_case_versions USING btree (runtime_config_id);
CREATE INDEX idx_test_case_versions_test_case_id ON public.test_case_versions USING btree (test_case_id);
COMMENT ON TABLE public.test_case_versions IS 'Version history for AI-generated or edited test plans';

-- Column comments

COMMENT ON COLUMN public.test_case_versions.execution_mode IS 'How this test version is executed: step-based, goal-based agent, or hybrid';

-- Permissions

ALTER TABLE public.test_case_versions OWNER TO postgres;
GRANT ALL ON TABLE public.test_case_versions TO postgres;


-- public.test_cases definition

-- Drop table

-- DROP TABLE public.test_cases;

CREATE TABLE public.test_cases ( id bigserial NOT NULL, project_id int8 NOT NULL, scan_id int8 NULL, title varchar(255) NOT NULL, goal text NOT NULL, status varchar(30) DEFAULT 'draft'::character varying NOT NULL, ai_model varchar(100) NULL, created_by int8 NULL, current_version_id int8 NULL, deleted_at timestamptz NULL, deleted_by int8 NULL, restored_at timestamptz NULL, restored_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT test_cases_pkey PRIMARY KEY (id), CONSTRAINT test_cases_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'ready'::character varying, 'archived'::character varying])::text[]))));
CREATE INDEX idx_test_cases_deleted_at ON public.test_cases USING btree (deleted_at);
CREATE INDEX idx_test_cases_goal_fts ON public.test_cases USING gin (to_tsvector('simple'::regconfig, goal));
CREATE INDEX idx_test_cases_project_id ON public.test_cases USING btree (project_id);
CREATE INDEX idx_test_cases_scan_id ON public.test_cases USING btree (scan_id);
CREATE INDEX idx_test_cases_title_fts ON public.test_cases USING gin (to_tsvector('simple'::regconfig, (title)::text));
COMMENT ON TABLE public.test_cases IS 'Logical test definitions under a project';

-- Permissions

ALTER TABLE public.test_cases OWNER TO postgres;
GRANT ALL ON TABLE public.test_cases TO postgres;


-- public.test_run_attempts definition

-- Drop table

-- DROP TABLE public.test_run_attempts;

CREATE TABLE public.test_run_attempts ( id bigserial NOT NULL, test_run_id int8 NOT NULL, attempt_no int4 NOT NULL, status varchar(30) NOT NULL, verdict varchar(20) NULL, trigger_type varchar(30) DEFAULT 'initial'::character varying NOT NULL, runtime_config_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL, browser_profile_snapshot jsonb NULL, scan_context_snapshot jsonb NULL, agent_prompt text NULL, final_result text NULL, structured_output jsonb NULL, error_message text NULL, started_at timestamptz NULL, finished_at timestamptz NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT test_run_attempts_pkey PRIMARY KEY (id), CONSTRAINT test_run_attempts_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))), CONSTRAINT test_run_attempts_test_run_id_attempt_no_key UNIQUE (test_run_id, attempt_no), CONSTRAINT test_run_attempts_trigger_type_check CHECK (((trigger_type)::text = ANY ((ARRAY['initial'::character varying, 'retry'::character varying, 'auto_heal'::character varying, 'manual_replay'::character varying])::text[]))), CONSTRAINT test_run_attempts_verdict_check CHECK (((verdict)::text = ANY ((ARRAY['pass'::character varying, 'fail'::character varying, 'error'::character varying, 'partial'::character varying])::text[]))));
CREATE INDEX idx_test_run_attempts_status ON public.test_run_attempts USING btree (status);
CREATE INDEX idx_test_run_attempts_test_run_id ON public.test_run_attempts USING btree (test_run_id);
CREATE INDEX idx_test_run_attempts_verdict ON public.test_run_attempts USING btree (verdict);
COMMENT ON TABLE public.test_run_attempts IS 'Attempt-level execution records inside one logical test run';

-- Permissions

ALTER TABLE public.test_run_attempts OWNER TO postgres;
GRANT ALL ON TABLE public.test_run_attempts TO postgres;


-- public.test_run_dataset_bindings definition

-- Drop table

-- DROP TABLE public.test_run_dataset_bindings;

CREATE TABLE public.test_run_dataset_bindings ( id bigserial NOT NULL, test_run_id int8 NOT NULL, dataset_id int8 NULL, alias varchar(100) NULL, dataset_snapshot jsonb NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT test_run_dataset_bindings_pkey PRIMARY KEY (id));
CREATE INDEX idx_tr_dataset_bindings_run_id ON public.test_run_dataset_bindings USING btree (test_run_id);
COMMENT ON TABLE public.test_run_dataset_bindings IS 'Exact dataset snapshot used in a run';

-- Permissions

ALTER TABLE public.test_run_dataset_bindings OWNER TO postgres;
GRANT ALL ON TABLE public.test_run_dataset_bindings TO postgres;


-- public.test_run_tags definition

-- Drop table

-- DROP TABLE public.test_run_tags;

CREATE TABLE public.test_run_tags ( test_run_id int8 NOT NULL, tag_id int8 NOT NULL, CONSTRAINT test_run_tags_pkey PRIMARY KEY (test_run_id, tag_id));
COMMENT ON TABLE public.test_run_tags IS 'Many-to-many mapping between runs and tags';

-- Permissions

ALTER TABLE public.test_run_tags OWNER TO postgres;
GRANT ALL ON TABLE public.test_run_tags TO postgres;


-- public.test_runs definition

-- Drop table

-- DROP TABLE public.test_runs;

CREATE TABLE public.test_runs ( id bigserial NOT NULL, test_case_id int8 NOT NULL, test_case_version_id int8 NULL, status varchar(30) NOT NULL, verdict varchar(20) NULL, execution_log jsonb NULL, evidence_summary jsonb NULL, error_message text NULL, triggered_by int8 NULL, started_at timestamptz NULL, finished_at timestamptz NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT test_runs_pkey PRIMARY KEY (id), CONSTRAINT test_runs_status_check CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[]))), CONSTRAINT test_runs_verdict_check CHECK (((verdict)::text = ANY ((ARRAY['pass'::character varying, 'fail'::character varying, 'error'::character varying, 'partial'::character varying])::text[]))));
CREATE INDEX idx_test_runs_created_at ON public.test_runs USING btree (created_at DESC);
CREATE INDEX idx_test_runs_status ON public.test_runs USING btree (status);
CREATE INDEX idx_test_runs_test_case_id ON public.test_runs USING btree (test_case_id);
CREATE INDEX idx_test_runs_test_case_version_id ON public.test_runs USING btree (test_case_version_id);
CREATE INDEX idx_test_runs_verdict ON public.test_runs USING btree (verdict);
COMMENT ON TABLE public.test_runs IS 'Execution runs of a test case';

-- Permissions

ALTER TABLE public.test_runs OWNER TO postgres;
GRANT ALL ON TABLE public.test_runs TO postgres;


-- public.test_steps definition

-- Drop table

-- DROP TABLE public.test_steps;

CREATE TABLE public.test_steps ( id bigserial NOT NULL, test_case_version_id int8 NOT NULL, step_order int4 NOT NULL, action_type varchar(50) NOT NULL, "target" jsonb NULL, input_data jsonb NULL, expected_result text NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT test_steps_pkey PRIMARY KEY (id), CONSTRAINT test_steps_test_case_version_id_step_order_key UNIQUE (test_case_version_id, step_order));
CREATE INDEX idx_test_steps_version_id ON public.test_steps USING btree (test_case_version_id);
COMMENT ON TABLE public.test_steps IS 'Normalized steps per test case version';

-- Permissions

ALTER TABLE public.test_steps OWNER TO postgres;
GRANT ALL ON TABLE public.test_steps TO postgres;


-- public.test_tree_nodes definition

-- Drop table

-- DROP TABLE public.test_tree_nodes;

CREATE TABLE public.test_tree_nodes ( id bigserial NOT NULL, project_id int8 NOT NULL, parent_id int8 NULL, node_type varchar(20) NOT NULL, "name" varchar(255) NOT NULL, test_case_id int8 NULL, dataset_id int8 NULL, sort_order int4 DEFAULT 0 NOT NULL, deleted_at timestamptz NULL, created_by int8 NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT chk_test_tree_node_ref CHECK (((((node_type)::text = 'folder'::text) AND (test_case_id IS NULL) AND (dataset_id IS NULL)) OR (((node_type)::text = 'test_case'::text) AND (test_case_id IS NOT NULL) AND (dataset_id IS NULL)) OR (((node_type)::text = 'dataset'::text) AND (test_case_id IS NULL) AND (dataset_id IS NOT NULL)))), CONSTRAINT test_tree_nodes_dataset_id_key UNIQUE (dataset_id), CONSTRAINT test_tree_nodes_node_type_check CHECK (((node_type)::text = ANY ((ARRAY['folder'::character varying, 'test_case'::character varying, 'dataset'::character varying])::text[]))), CONSTRAINT test_tree_nodes_pkey PRIMARY KEY (id), CONSTRAINT test_tree_nodes_test_case_id_key UNIQUE (test_case_id));
CREATE INDEX idx_test_tree_nodes_deleted_at ON public.test_tree_nodes USING btree (deleted_at);
CREATE INDEX idx_test_tree_nodes_parent_id ON public.test_tree_nodes USING btree (parent_id);
CREATE INDEX idx_test_tree_nodes_project_id ON public.test_tree_nodes USING btree (project_id);
CREATE INDEX idx_test_tree_nodes_sort_order ON public.test_tree_nodes USING btree (project_id, parent_id, sort_order);
COMMENT ON TABLE public.test_tree_nodes IS 'Folder/tree structure for tests and datasets';

-- Permissions

ALTER TABLE public.test_tree_nodes OWNER TO postgres;
GRANT ALL ON TABLE public.test_tree_nodes TO postgres;


-- public.evidences foreign keys

ALTER TABLE public.evidences ADD CONSTRAINT evidences_run_step_log_id_fkey FOREIGN KEY (run_step_log_id) REFERENCES public.run_step_logs(id) ON DELETE SET NULL;
ALTER TABLE public.evidences ADD CONSTRAINT evidences_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE CASCADE;
ALTER TABLE public.evidences ADD CONSTRAINT evidences_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.failure_analyses foreign keys

ALTER TABLE public.failure_analyses ADD CONSTRAINT failure_analyses_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE CASCADE;
ALTER TABLE public.failure_analyses ADD CONSTRAINT failure_analyses_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.healing_applications foreign keys

ALTER TABLE public.healing_applications ADD CONSTRAINT healing_applications_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.healing_applications ADD CONSTRAINT healing_applications_applied_to_version_id_fkey FOREIGN KEY (applied_to_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;
ALTER TABLE public.healing_applications ADD CONSTRAINT healing_applications_healing_suggestion_id_fkey FOREIGN KEY (healing_suggestion_id) REFERENCES public.healing_suggestions(id) ON DELETE CASCADE;
ALTER TABLE public.healing_applications ADD CONSTRAINT healing_applications_result_attempt_id_fkey FOREIGN KEY (result_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE SET NULL;
ALTER TABLE public.healing_applications ADD CONSTRAINT healing_applications_result_test_run_id_fkey FOREIGN KEY (result_test_run_id) REFERENCES public.test_runs(id) ON DELETE SET NULL;


-- public.healing_suggestions foreign keys

ALTER TABLE public.healing_suggestions ADD CONSTRAINT healing_suggestions_failure_analysis_id_fkey FOREIGN KEY (failure_analysis_id) REFERENCES public.failure_analyses(id) ON DELETE CASCADE;


-- public.reports foreign keys

ALTER TABLE public.reports ADD CONSTRAINT reports_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD CONSTRAINT reports_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.run_step_logs foreign keys

ALTER TABLE public.run_step_logs ADD CONSTRAINT run_step_logs_test_run_attempt_id_fkey FOREIGN KEY (test_run_attempt_id) REFERENCES public.test_run_attempts(id) ON DELETE CASCADE;
ALTER TABLE public.run_step_logs ADD CONSTRAINT run_step_logs_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.test_case_dataset_bindings foreign keys

ALTER TABLE public.test_case_dataset_bindings ADD CONSTRAINT test_case_dataset_bindings_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.test_datasets(id) ON DELETE CASCADE;
ALTER TABLE public.test_case_dataset_bindings ADD CONSTRAINT test_case_dataset_bindings_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


-- public.test_case_versions foreign keys

ALTER TABLE public.test_case_versions ADD CONSTRAINT test_case_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.test_case_versions ADD CONSTRAINT test_case_versions_runtime_config_id_fkey FOREIGN KEY (runtime_config_id) REFERENCES public.agent_runtime_configs(id) ON DELETE SET NULL;
ALTER TABLE public.test_case_versions ADD CONSTRAINT test_case_versions_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


-- public.test_cases foreign keys

ALTER TABLE public.test_cases ADD CONSTRAINT fk_test_cases_current_version FOREIGN KEY (current_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;
ALTER TABLE public.test_cases ADD CONSTRAINT test_cases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.test_cases ADD CONSTRAINT test_cases_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.test_cases ADD CONSTRAINT test_cases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.test_cases ADD CONSTRAINT test_cases_restored_by_fkey FOREIGN KEY (restored_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.test_cases ADD CONSTRAINT test_cases_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;


-- public.test_run_attempts foreign keys

ALTER TABLE public.test_run_attempts ADD CONSTRAINT test_run_attempts_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.test_run_dataset_bindings foreign keys

ALTER TABLE public.test_run_dataset_bindings ADD CONSTRAINT test_run_dataset_bindings_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.test_datasets(id) ON DELETE SET NULL;
ALTER TABLE public.test_run_dataset_bindings ADD CONSTRAINT test_run_dataset_bindings_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.test_run_tags foreign keys

ALTER TABLE public.test_run_tags ADD CONSTRAINT test_run_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE public.test_run_tags ADD CONSTRAINT test_run_tags_test_run_id_fkey FOREIGN KEY (test_run_id) REFERENCES public.test_runs(id) ON DELETE CASCADE;


-- public.test_runs foreign keys

ALTER TABLE public.test_runs ADD CONSTRAINT test_runs_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;
ALTER TABLE public.test_runs ADD CONSTRAINT test_runs_test_case_version_id_fkey FOREIGN KEY (test_case_version_id) REFERENCES public.test_case_versions(id) ON DELETE SET NULL;
ALTER TABLE public.test_runs ADD CONSTRAINT test_runs_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- public.test_steps foreign keys

ALTER TABLE public.test_steps ADD CONSTRAINT test_steps_test_case_version_id_fkey FOREIGN KEY (test_case_version_id) REFERENCES public.test_case_versions(id) ON DELETE CASCADE;


-- public.test_tree_nodes foreign keys

ALTER TABLE public.test_tree_nodes ADD CONSTRAINT test_tree_nodes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.test_tree_nodes ADD CONSTRAINT test_tree_nodes_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.test_datasets(id) ON DELETE CASCADE;
ALTER TABLE public.test_tree_nodes ADD CONSTRAINT test_tree_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.test_tree_nodes(id) ON DELETE CASCADE;
ALTER TABLE public.test_tree_nodes ADD CONSTRAINT test_tree_nodes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.test_tree_nodes ADD CONSTRAINT test_tree_nodes_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.test_cases(id) ON DELETE CASCADE;


-- public.v_test_history source

CREATE OR REPLACE VIEW public.v_test_history
AS SELECT tr.id AS run_id,
    tr.created_at AS run_time,
    tr.status,
    tr.verdict,
    tc.title AS test_title,
    tc.goal,
    p.name AS project_name,
    p.base_url,
    COALESCE(json_agg(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL), '[]'::json) AS tags
   FROM test_runs tr
     JOIN test_cases tc ON tr.test_case_id = tc.id
     JOIN projects p ON tc.project_id = p.id
     LEFT JOIN test_run_tags trt ON tr.id = trt.test_run_id
     LEFT JOIN tags tg ON trt.tag_id = tg.id
  GROUP BY tr.id, tr.created_at, tr.status, tr.verdict, tc.title, tc.goal, p.name, p.base_url;

COMMENT ON VIEW public.v_test_history IS 'Search-oriented aggregated view of test execution history';

-- Permissions

ALTER TABLE public.v_test_history OWNER TO postgres;
GRANT ALL ON TABLE public.v_test_history TO postgres;




-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;