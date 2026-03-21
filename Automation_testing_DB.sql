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

-- =========================================================
-- 21) SAMPLE DATA FOR DASHBOARD DEMO
-- =========================================================
-- Insert sample user for testing
INSERT INTO users (email, name, password_hash) VALUES
('demo@example.com', 'Demo User', '$2b$10$rQZ9vXJXL8K5qN3mH7yP8.vK8zLxR9wQ2nF5tY6uI3oP7sA1bC2dE');

-- Insert sample projects (10 realistic projects)
INSERT INTO projects (user_id, name, description, base_url, config) VALUES
(1, 'Mobile Banking App', 'Comprehensive testing for login, transactions, and account management features', 'https://mobile-banking.example.com', '{}'),
(1, 'E-commerce Website', 'End-to-end testing for product search, cart, and checkout flow', 'https://shop.example.com', '{}'),
(1, 'Admin Dashboard', 'User management, analytics, and reporting system validation', 'https://admin.example.com', '{}'),
(1, 'Social Media Platform', 'Post creation, feed interactions, and messaging features', 'https://social.example.com', '{}'),
(1, 'Healthcare Portal', 'Patient records, appointment scheduling, and telemedicine features', 'https://healthcare.example.com', '{}'),
(1, 'CRM Management System', 'Customer relationship management and sales pipeline tracking', 'https://crm.example.com', '{}'),
(1, 'Learning Platform', 'Online courses, quizzes, and progress tracking system', 'https://learning.example.com', '{}'),
(1, 'Booking System', 'Hotel and flight booking with payment integration', 'https://booking.example.com', '{}'),
(1, 'Food Delivery App', 'Restaurant browsing, ordering, and delivery tracking', 'https://food-delivery.example.com', '{}'),
(1, 'Real Estate Platform', 'Property listings, virtual tours, and agent contact system', 'https://realestate.example.com', '{}');

-- Insert sample test cases for projects (varying counts)
INSERT INTO test_cases (project_id, title, goal, status, created_at, updated_at) VALUES
-- Mobile Banking App (8 test cases)
(1, 'User Login Validation', 'Verify user can login with valid credentials', 'ready', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
(1, 'Fund Transfer', 'Test domestic fund transfer between accounts', 'ready', NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day'),
(1, 'Bill Payment', 'Verify bill payment functionality with multiple providers', 'ready', NOW() - INTERVAL '13 days', NOW() - INTERVAL '3 days'),
(1, 'Account Balance Check', 'Test balance inquiry displays correct amount', 'ready', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),
(1, 'Transaction History', 'Verify transaction list loads with proper filtering', 'ready', NOW() - INTERVAL '11 days', NOW() - INTERVAL '1 day'),
(1, 'Card Management', 'Test card blocking and unblocking features', 'ready', NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 days'),
(1, 'Profile Update', 'Verify user can update contact information', 'ready', NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days'),
(1, 'Two-Factor Authentication', 'Test 2FA setup and verification flow', 'ready', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

-- E-commerce Website (7 test cases)
(2, 'Product Search', 'Verify search returns relevant products', 'ready', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
(2, 'Add to Cart', 'Test adding products to shopping cart', 'ready', NOW() - INTERVAL '19 days', NOW() - INTERVAL '4 days'),
(2, 'Checkout Process', 'Verify complete checkout flow with payment', 'ready', NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days'),
(2, 'User Registration', 'Test new user account creation', 'ready', NOW() - INTERVAL '17 days', NOW() - INTERVAL '6 days'),
(2, 'Product Review', 'Verify customers can leave product reviews', 'ready', NOW() - INTERVAL '16 days', NOW() - INTERVAL '2 days'),
(2, 'Wishlist Management', 'Test adding and removing items from wishlist', 'ready', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
(2, 'Order Tracking', 'Verify order status and tracking information', 'ready', NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day'),

-- Admin Dashboard (6 test cases)
(3, 'Dashboard Analytics', 'Verify analytics widgets display correct data', 'ready', NOW() - INTERVAL '25 days', NOW() - INTERVAL '7 days'),
(3, 'User Management', 'Test CRUD operations for user accounts', 'ready', NOW() - INTERVAL '24 days', NOW() - INTERVAL '5 days'),
(3, 'Role Assignment', 'Verify admin can assign roles to users', 'ready', NOW() - INTERVAL '23 days', NOW() - INTERVAL '4 days'),
(3, 'Report Generation', 'Test generating and exporting reports', 'ready', NOW() - INTERVAL '22 days', NOW() - INTERVAL '6 days'),
(3, 'System Settings', 'Verify configuration settings can be updated', 'ready', NOW() - INTERVAL '21 days', NOW() - INTERVAL '3 days'),
(3, 'Audit Logs', 'Test viewing and filtering audit logs', 'ready', NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),

-- Social Media Platform (6 test cases)
(4, 'Create Post', 'Verify users can create text and image posts', 'ready', NOW() - INTERVAL '18 days', NOW() - INTERVAL '4 days'),
(4, 'News Feed', 'Test feed displays posts from followed users', 'ready', NOW() - INTERVAL '17 days', NOW() - INTERVAL '3 days'),
(4, 'Like and Comment', 'Verify engagement features work correctly', 'ready', NOW() - INTERVAL '16 days', NOW() - INTERVAL '2 days'),
(4, 'Direct Messaging', 'Test sending and receiving messages', 'ready', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
(4, 'Profile Customization', 'Verify users can update profile and cover photo', 'ready', NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days'),
(4, 'Notification System', 'Test push and email notifications', 'ready', NOW() - INTERVAL '13 days', NOW() - INTERVAL '1 day'),

-- Healthcare Portal (5 test cases)
(5, 'Patient Registration', 'Verify new patient can register', 'ready', NOW() - INTERVAL '22 days', NOW() - INTERVAL '6 days'),
(5, 'Appointment Booking', 'Test scheduling appointments with doctors', 'ready', NOW() - INTERVAL '21 days', NOW() - INTERVAL '4 days'),
(5, 'Medical Records Access', 'Verify patients can view their records', 'ready', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
(5, 'Prescription Management', 'Test viewing and requesting prescriptions', 'ready', NOW() - INTERVAL '19 days', NOW() - INTERVAL '3 days'),
(5, 'Video Consultation', 'Verify telemedicine video calls work', 'ready', NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),

-- CRM Management System (5 test cases)
(6, 'Lead Creation', 'Verify sales team can create new leads', 'ready', NOW() - INTERVAL '28 days', NOW() - INTERVAL '8 days'),
(6, 'Pipeline Management', 'Test moving deals through sales stages', 'ready', NOW() - INTERVAL '27 days', NOW() - INTERVAL '6 days'),
(6, 'Contact Management', 'Verify contact information can be updated', 'ready', NOW() - INTERVAL '26 days', NOW() - INTERVAL '5 days'),
(6, 'Email Integration', 'Test sending emails from CRM', 'ready', NOW() - INTERVAL '25 days', NOW() - INTERVAL '7 days'),
(6, 'Sales Reports', 'Verify sales analytics and forecasting', 'ready', NOW() - INTERVAL '24 days', NOW() - INTERVAL '4 days'),

-- Learning Platform (5 test cases)
(7, 'Course Enrollment', 'Verify students can enroll in courses', 'ready', NOW() - INTERVAL '30 days', NOW() - INTERVAL '9 days'),
(7, 'Video Playback', 'Test course video streaming', 'ready', NOW() - INTERVAL '29 days', NOW() - INTERVAL '7 days'),
(7, 'Quiz Submission', 'Verify quiz taking and auto-grading', 'ready', NOW() - INTERVAL '28 days', NOW() - INTERVAL '6 days'),
(7, 'Progress Tracking', 'Test course progress visualization', 'ready', NOW() - INTERVAL '27 days', NOW() - INTERVAL '5 days'),
(7, 'Certificate Generation', 'Verify certificates issued on completion', 'ready', NOW() - INTERVAL '26 days', NOW() - INTERVAL '8 days'),

-- Booking System (5 test cases)
(8, 'Hotel Search', 'Verify hotel search with filters', 'ready', NOW() - INTERVAL '24 days', NOW() - INTERVAL '7 days'),
(8, 'Room Booking', 'Test room reservation and payment', 'ready', NOW() - INTERVAL '23 days', NOW() - INTERVAL '5 days'),
(8, 'Flight Search', 'Verify flight search and comparison', 'ready', NOW() - INTERVAL '22 days', NOW() - INTERVAL '6 days'),
(8, 'Booking Management', 'Test viewing and cancelling bookings', 'ready', NOW() - INTERVAL '21 days', NOW() - INTERVAL '4 days'),
(8, 'Payment Processing', 'Verify multiple payment methods', 'ready', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),

-- Food Delivery App (5 test cases)
(9, 'Restaurant Browse', 'Verify restaurant listing and filtering', 'ready', NOW() - INTERVAL '26 days', NOW() - INTERVAL '8 days'),
(9, 'Menu Selection', 'Test adding items to cart from menu', 'ready', NOW() - INTERVAL '25 days', NOW() - INTERVAL '6 days'),
(9, 'Delivery Address', 'Verify address selection and validation', 'ready', NOW() - INTERVAL '24 days', NOW() - INTERVAL '5 days'),
(9, 'Order Tracking', 'Test real-time delivery tracking', 'ready', NOW() - INTERVAL '23 days', NOW() - INTERVAL '4 days'),
(9, 'Payment and Tips', 'Verify payment and tip calculation', 'ready', NOW() - INTERVAL '22 days', NOW() - INTERVAL '7 days'),

-- Real Estate Platform (5 test cases)
(10, 'Property Search', 'Verify property search with advanced filters', 'ready', NOW() - INTERVAL '32 days', NOW() - INTERVAL '10 days'),
(10, 'Virtual Tour', 'Test 3D property tour functionality', 'ready', NOW() - INTERVAL '31 days', NOW() - INTERVAL '8 days'),
(10, 'Agent Contact', 'Verify contacting real estate agents', 'ready', NOW() - INTERVAL '30 days', NOW() - INTERVAL '7 days'),
(10, 'Mortgage Calculator', 'Test mortgage calculation tool', 'ready', NOW() - INTERVAL '29 days', NOW() - INTERVAL '9 days'),
(10, 'Favorite Properties', 'Verify saving and comparing properties', 'ready', NOW() - INTERVAL '28 days', NOW() - INTERVAL '6 days');

-- Insert sample test runs with varying results and timestamps
-- Mobile Banking App runs (recent activity)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(1, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes', NOW() - INTERVAL '2 hours'),
(2, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes', NOW() - INTERVAL '2 hours'),
(3, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes', NOW() - INTERVAL '2 hours'),
(4, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 40 minutes', NOW() - INTERVAL '2 hours'),
(5, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 35 minutes', NOW() - INTERVAL '2 hours'),
(6, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '2 hours'),
(7, 'completed', 'fail', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 25 minutes', NOW() - INTERVAL '2 hours'),
(8, 'completed', 'pass', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '2 hours');

-- E-commerce Website runs (some failures)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(9, 'completed', 'pass', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 55 minutes', NOW() - INTERVAL '5 hours'),
(10, 'completed', 'pass', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 50 minutes', NOW() - INTERVAL '5 hours'),
(11, 'completed', 'fail', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 45 minutes', NOW() - INTERVAL '5 hours'),
(12, 'completed', 'pass', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 40 minutes', NOW() - INTERVAL '5 hours'),
(13, 'completed', 'fail', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 35 minutes', NOW() - INTERVAL '5 hours'),
(14, 'completed', 'pass', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 30 minutes', NOW() - INTERVAL '5 hours'),
(15, 'completed', 'pass', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 25 minutes', NOW() - INTERVAL '5 hours');

-- Admin Dashboard runs (mixed results)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(16, 'completed', 'pass', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 55 minutes', NOW() - INTERVAL '1 day'),
(17, 'completed', 'pass', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 50 minutes', NOW() - INTERVAL '1 day'),
(18, 'completed', 'pass', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 45 minutes', NOW() - INTERVAL '1 day'),
(19, 'completed', 'fail', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 40 minutes', NOW() - INTERVAL '1 day'),
(20, 'completed', 'fail', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 35 minutes', NOW() - INTERVAL '1 day'),
(21, 'completed', 'fail', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours 30 minutes', NOW() - INTERVAL '1 day');

-- Social Media Platform runs (mostly passing)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(22, 'completed', 'pass', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 55 minutes', NOW() - INTERVAL '3 hours'),
(23, 'completed', 'pass', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 50 minutes', NOW() - INTERVAL '3 hours'),
(24, 'completed', 'pass', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', NOW() - INTERVAL '3 hours'),
(25, 'completed', 'pass', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 40 minutes', NOW() - INTERVAL '3 hours'),
(26, 'completed', 'pass', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 35 minutes', NOW() - INTERVAL '3 hours'),
(27, 'completed', 'fail', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '3 hours');

-- Healthcare Portal runs (all passing)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(28, 'completed', 'pass', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 55 minutes', NOW() - INTERVAL '6 hours'),
(29, 'completed', 'pass', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 50 minutes', NOW() - INTERVAL '6 hours'),
(30, 'completed', 'pass', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 45 minutes', NOW() - INTERVAL '6 hours'),
(31, 'completed', 'pass', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 40 minutes', NOW() - INTERVAL '6 hours'),
(32, 'completed', 'pass', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 35 minutes', NOW() - INTERVAL '6 hours');

-- CRM Management System runs (good pass rate)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(33, 'completed', 'pass', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 55 minutes', NOW() - INTERVAL '8 hours'),
(34, 'completed', 'pass', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 50 minutes', NOW() - INTERVAL '8 hours'),
(35, 'completed', 'pass', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 45 minutes', NOW() - INTERVAL '8 hours'),
(36, 'completed', 'pass', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 40 minutes', NOW() - INTERVAL '8 hours'),
(37, 'completed', 'fail', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 35 minutes', NOW() - INTERVAL '8 hours');

-- Learning Platform runs (excellent pass rate)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(38, 'completed', 'pass', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 55 minutes', NOW() - INTERVAL '12 hours'),
(39, 'completed', 'pass', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 50 minutes', NOW() - INTERVAL '12 hours'),
(40, 'completed', 'pass', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 45 minutes', NOW() - INTERVAL '12 hours'),
(41, 'completed', 'pass', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 40 minutes', NOW() - INTERVAL '12 hours'),
(42, 'completed', 'pass', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours 35 minutes', NOW() - INTERVAL '12 hours');

-- Booking System runs (moderate pass rate)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(43, 'completed', 'pass', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 55 minutes', NOW() - INTERVAL '1 day 2 hours'),
(44, 'completed', 'pass', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 50 minutes', NOW() - INTERVAL '1 day 2 hours'),
(45, 'completed', 'fail', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 45 minutes', NOW() - INTERVAL '1 day 2 hours'),
(46, 'completed', 'fail', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 40 minutes', NOW() - INTERVAL '1 day 2 hours'),
(47, 'completed', 'pass', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 35 minutes', NOW() - INTERVAL '1 day 2 hours');

-- Food Delivery App runs (good results)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(48, 'completed', 'pass', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 55 minutes', NOW() - INTERVAL '10 hours'),
(49, 'completed', 'pass', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 50 minutes', NOW() - INTERVAL '10 hours'),
(50, 'completed', 'pass', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 45 minutes', NOW() - INTERVAL '10 hours'),
(51, 'completed', 'pass', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 40 minutes', NOW() - INTERVAL '10 hours'),
(52, 'completed', 'fail', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 35 minutes', NOW() - INTERVAL '10 hours');

-- Real Estate Platform runs (all passing)
INSERT INTO test_runs (test_case_id, status, verdict, started_at, finished_at, created_at) VALUES
(53, 'completed', 'pass', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 55 minutes', NOW() - INTERVAL '2 days'),
(54, 'completed', 'pass', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 50 minutes', NOW() - INTERVAL '2 days'),
(55, 'completed', 'pass', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 45 minutes', NOW() - INTERVAL '2 days'),
(56, 'completed', 'pass', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 40 minutes', NOW() - INTERVAL '2 days'),
(57, 'completed', 'pass', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours 35 minutes', NOW() - INTERVAL '2 days');