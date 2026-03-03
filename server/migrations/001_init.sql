-- =========================================================
-- AI TESTING PLATFORM DATABASE SCHEMA
-- PostgreSQL
-- =========================================================

-- =========================================================
-- 0) OPTIONAL EXTENSIONS
-- =========================================================
-- Uncomment if needed:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- 1) USERS & SESSIONS
-- =========================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =========================================================
-- 2) PROJECTS
-- =========================================================

CREATE TABLE projects (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    base_url        TEXT NOT NULL,
    config          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_base_url ON projects(base_url);

-- =========================================================
-- 3) WEBSITE ANALYSIS / SCANS
-- =========================================================

CREATE TABLE scans (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status              VARCHAR(30) NOT NULL
                        CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    root_url            TEXT NOT NULL,
    sitemap             JSONB,
    interaction_map     JSONB,
    error_message       TEXT,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scans_project_id ON scans(project_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- =========================================================
-- 4) TEST DATASETS
-- Supports:
-- - static JSON datasets
-- - generator-based datasets
-- =========================================================

CREATE TABLE test_datasets (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    data_mode           VARCHAR(20) NOT NULL
                        CHECK (data_mode IN ('static_json', 'generator')),
    schema_json         JSONB,
    data_json           JSONB,
    generator_config    JSONB,
    created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_test_datasets_project_id ON test_datasets(project_id);
CREATE INDEX idx_test_datasets_deleted_at ON test_datasets(deleted_at);

-- =========================================================
-- 5) TEST CASES
-- Includes soft delete / resurrect for edit-delete-resurrect flow
-- =========================================================

CREATE TABLE test_cases (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scan_id             BIGINT REFERENCES scans(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    goal                TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'ready', 'archived')),
    ai_model            VARCHAR(100),
    created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    current_version_id  BIGINT,
    deleted_at          TIMESTAMPTZ,
    deleted_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    restored_at         TIMESTAMPTZ,
    restored_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX idx_test_cases_scan_id ON test_cases(scan_id);
CREATE INDEX idx_test_cases_deleted_at ON test_cases(deleted_at);
CREATE INDEX idx_test_cases_goal_fts ON test_cases USING GIN (to_tsvector('simple', goal));
CREATE INDEX idx_test_cases_title_fts ON test_cases USING GIN (to_tsvector('simple', title));

-- =========================================================
-- 6) TEST CASE VERSIONS
-- Save AI plan, prompt history, reasoning trace, variable schema
-- =========================================================

CREATE TABLE test_case_versions (
    id                  BIGSERIAL PRIMARY KEY,
    test_case_id        BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    version_no          INT NOT NULL,
    source_type         VARCHAR(30) NOT NULL
                        CHECK (source_type IN ('ai_generated', 'user_edited', 'healed')),
    prompt_text         TEXT,
    reasoning_trace     JSONB,
    plan_snapshot       JSONB NOT NULL,
    variables_schema    JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_model            VARCHAR(100),
    created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_case_id, version_no)
);

CREATE INDEX idx_test_case_versions_test_case_id ON test_case_versions(test_case_id);

ALTER TABLE test_cases
ADD CONSTRAINT fk_test_cases_current_version
FOREIGN KEY (current_version_id)
REFERENCES test_case_versions(id)
ON DELETE SET NULL;

-- =========================================================
-- 7) TEST STEPS
-- Supports direct editing: add/remove/reorder/update steps
-- =========================================================

CREATE TABLE test_steps (
    id                   BIGSERIAL PRIMARY KEY,
    test_case_version_id BIGINT NOT NULL REFERENCES test_case_versions(id) ON DELETE CASCADE,
    step_order           INT NOT NULL,
    action_type          VARCHAR(50) NOT NULL,
    target               JSONB,
    input_data           JSONB,
    expected_result      TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_case_version_id, step_order)
);

CREATE INDEX idx_test_steps_version_id ON test_steps(test_case_version_id);

-- =========================================================
-- 8) DATASET BINDINGS FOR TEST CASE
-- Which datasets are available/default for a test case
-- =========================================================

CREATE TABLE test_case_dataset_bindings (
    id                  BIGSERIAL PRIMARY KEY,
    test_case_id        BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    dataset_id          BIGINT NOT NULL REFERENCES test_datasets(id) ON DELETE CASCADE,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_case_id, dataset_id)
);

CREATE INDEX idx_tc_dataset_bindings_test_case_id
ON test_case_dataset_bindings(test_case_id);

CREATE INDEX idx_tc_dataset_bindings_dataset_id
ON test_case_dataset_bindings(dataset_id);

-- =========================================================
-- 9) TEST TREE NODES
-- Supports folders / grouping / tree structure
-- Node types:
-- - folder
-- - test_case
-- - dataset
-- =========================================================

CREATE TABLE test_tree_nodes (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id           BIGINT REFERENCES test_tree_nodes(id) ON DELETE CASCADE,
    node_type           VARCHAR(20) NOT NULL
                        CHECK (node_type IN ('folder', 'test_case', 'dataset')),
    name                VARCHAR(255) NOT NULL,
    test_case_id        BIGINT UNIQUE REFERENCES test_cases(id) ON DELETE CASCADE,
    dataset_id          BIGINT UNIQUE REFERENCES test_datasets(id) ON DELETE CASCADE,
    sort_order          INT NOT NULL DEFAULT 0,
    deleted_at          TIMESTAMPTZ,
    created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_test_tree_node_ref
    CHECK (
        (node_type = 'folder' AND test_case_id IS NULL AND dataset_id IS NULL) OR
        (node_type = 'test_case' AND test_case_id IS NOT NULL AND dataset_id IS NULL) OR
        (node_type = 'dataset' AND test_case_id IS NULL AND dataset_id IS NOT NULL)
    )
);

CREATE INDEX idx_test_tree_nodes_project_id ON test_tree_nodes(project_id);
CREATE INDEX idx_test_tree_nodes_parent_id ON test_tree_nodes(parent_id);
CREATE INDEX idx_test_tree_nodes_deleted_at ON test_tree_nodes(deleted_at);
CREATE INDEX idx_test_tree_nodes_sort_order ON test_tree_nodes(project_id, parent_id, sort_order);

-- =========================================================
-- 10) TEST RUNS
-- Stores one execution instance
-- =========================================================

CREATE TABLE test_runs (
    id                   BIGSERIAL PRIMARY KEY,
    test_case_id         BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    test_case_version_id BIGINT REFERENCES test_case_versions(id) ON DELETE SET NULL,
    status               VARCHAR(30) NOT NULL
                         CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    verdict              VARCHAR(20)
                         CHECK (verdict IN ('pass', 'fail', 'error', 'partial')),
    execution_log        JSONB,
    evidence_summary     JSONB,
    error_message        TEXT,
    triggered_by         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    started_at           TIMESTAMPTZ,
    finished_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_runs_test_case_id ON test_runs(test_case_id);
CREATE INDEX idx_test_runs_test_case_version_id ON test_runs(test_case_version_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);
CREATE INDEX idx_test_runs_verdict ON test_runs(verdict);
CREATE INDEX idx_test_runs_created_at ON test_runs(created_at DESC);

-- =========================================================
-- 11) DATASET BINDINGS FOR TEST RUN
-- Stores the exact dataset snapshot used during a run
-- =========================================================

CREATE TABLE test_run_dataset_bindings (
    id                  BIGSERIAL PRIMARY KEY,
    test_run_id         BIGINT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    dataset_id          BIGINT REFERENCES test_datasets(id) ON DELETE SET NULL,
    alias               VARCHAR(100),
    dataset_snapshot    JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tr_dataset_bindings_run_id
ON test_run_dataset_bindings(test_run_id);

-- =========================================================
-- 12) REALTIME RUN STEP LOGS
-- Supports telemetry / timeline / current action / monitoring
-- =========================================================

CREATE TABLE run_step_logs (
    id                  BIGSERIAL PRIMARY KEY,
    test_run_id         BIGINT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    step_no             INT NOT NULL,
    step_title          TEXT,
    action              VARCHAR(100),
    status              VARCHAR(30) NOT NULL
                        CHECK (status IN ('running', 'passed', 'failed', 'skipped')),
    message             TEXT,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    telemetry           JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_run_step_logs_test_run_id ON run_step_logs(test_run_id);
CREATE INDEX idx_run_step_logs_status ON run_step_logs(status);
CREATE INDEX idx_run_step_logs_step_no ON run_step_logs(test_run_id, step_no);

-- =========================================================
-- 13) EVIDENCES
-- Screenshot / DOM snapshot / logs / video / trace
-- =========================================================

CREATE TABLE evidences (
    id                  BIGSERIAL PRIMARY KEY,
    test_run_id         BIGINT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    run_step_log_id     BIGINT REFERENCES run_step_logs(id) ON DELETE SET NULL,
    evidence_type       VARCHAR(30) NOT NULL
                        CHECK (evidence_type IN (
                            'screenshot',
                            'dom_snapshot',
                            'console_log',
                            'network_log',
                            'video',
                            'trace'
                        )),
    file_path           TEXT,
    content_json        JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidences_test_run_id ON evidences(test_run_id);
CREATE INDEX idx_evidences_step_id ON evidences(run_step_log_id);
CREATE INDEX idx_evidences_type ON evidences(evidence_type);

-- =========================================================
-- 14) FAILURE ANALYSIS
-- Stores AI explanation of why a run failed
-- =========================================================

CREATE TABLE failure_analyses (
    id                  BIGSERIAL PRIMARY KEY,
    test_run_id         BIGINT NOT NULL UNIQUE REFERENCES test_runs(id) ON DELETE CASCADE,
    failed_step         JSONB,
    analysis            TEXT,
    suggestions         JSONB,
    confidence_score    NUMERIC(5,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_failure_analyses_test_run_id ON failure_analyses(test_run_id);

-- =========================================================
-- 15) HEALING SUGGESTIONS
-- AI self-healing / fix recommendations after failure
-- =========================================================

CREATE TABLE healing_suggestions (
    id                  BIGSERIAL PRIMARY KEY,
    failure_analysis_id BIGINT NOT NULL REFERENCES failure_analyses(id) ON DELETE CASCADE,
    suggestion_type     VARCHAR(30) NOT NULL
                        CHECK (suggestion_type IN (
                            'locator_replace',
                            'wait_adjust',
                            'assert_update',
                            'step_edit',
                            'retry_strategy'
                        )),
    old_value           TEXT,
    new_value           TEXT,
    reason              TEXT,
    confidence_score    NUMERIC(5,2),
    is_applied          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_healing_suggestions_failure_id ON healing_suggestions(failure_analysis_id);

-- =========================================================
-- 16) REPORTS
-- HTML / PDF / JSON reports
-- =========================================================

CREATE TABLE reports (
    id                  BIGSERIAL PRIMARY KEY,
    test_run_id         BIGINT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    format              VARCHAR(20) NOT NULL
                        CHECK (format IN ('pdf', 'html', 'json')),
    file_path           TEXT,
    summary             JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_test_run_id ON reports(test_run_id);

-- =========================================================
-- 17) TAGS
-- Used for filtering/searching run history
-- =========================================================

CREATE TABLE tags (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX idx_tags_project_id ON tags(project_id);

CREATE TABLE test_run_tags (
    test_run_id         BIGINT NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    tag_id              BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (test_run_id, tag_id)
);

-- =========================================================
-- 18) VIEW: TEST HISTORY
-- Supports UC-10 Search & Manage Test History
-- =========================================================

CREATE VIEW v_test_history AS
SELECT
    tr.id AS run_id,
    tr.created_at AS run_time,
    tr.status,
    tr.verdict,
    tc.title AS test_title,
    tc.goal,
    p.name AS project_name,
    p.base_url,
    COALESCE(
        json_agg(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL),
        '[]'::json
    ) AS tags
FROM test_runs tr
JOIN test_cases tc ON tr.test_case_id = tc.id
JOIN projects p ON tc.project_id = p.id
LEFT JOIN test_run_tags trt ON tr.id = trt.test_run_id
LEFT JOIN tags tg ON trt.tag_id = tg.id
GROUP BY tr.id, tr.created_at, tr.status, tr.verdict, tc.title, tc.goal, p.name, p.base_url;

-- =========================================================
-- 19) OPTIONAL HELPFUL CONSTRAINTS / NOTES
-- =========================================================
-- Business rule suggestion:
-- Each test case should have at most one default dataset.
-- PostgreSQL partial unique index can enforce that.

CREATE UNIQUE INDEX uq_test_case_one_default_dataset
ON test_case_dataset_bindings(test_case_id)
WHERE is_default = TRUE;

-- =========================================================
-- 20) OPTIONAL SAMPLE COMMENTS
-- =========================================================
COMMENT ON TABLE users IS 'System users';
COMMENT ON TABLE sessions IS 'Authentication sessions';
COMMENT ON TABLE projects IS 'Testing projects created by users';
COMMENT ON TABLE scans IS 'Website scan/crawl analysis results';
COMMENT ON TABLE test_datasets IS 'Reusable datasets in JSON or generator mode';
COMMENT ON TABLE test_cases IS 'Logical test definitions under a project';
COMMENT ON TABLE test_case_versions IS 'Version history for AI-generated or edited test plans';
COMMENT ON TABLE test_steps IS 'Normalized steps per test case version';
COMMENT ON TABLE test_case_dataset_bindings IS 'Allowed/default datasets for a test case';
COMMENT ON TABLE test_tree_nodes IS 'Folder/tree structure for tests and datasets';
COMMENT ON TABLE test_runs IS 'Execution runs of a test case';
COMMENT ON TABLE test_run_dataset_bindings IS 'Exact dataset snapshot used in a run';
COMMENT ON TABLE run_step_logs IS 'Realtime step-level execution logs';
COMMENT ON TABLE evidences IS 'Execution evidence such as screenshots and logs';
COMMENT ON TABLE failure_analyses IS 'AI failure analysis for failed runs';
COMMENT ON TABLE healing_suggestions IS 'Fix suggestions after failure analysis';
COMMENT ON TABLE reports IS 'Generated execution reports';
COMMENT ON TABLE tags IS 'Project-level tags for history filtering';
COMMENT ON TABLE test_run_tags IS 'Many-to-many mapping between runs and tags';
COMMENT ON VIEW v_test_history IS 'Search-oriented aggregated view of test execution history';