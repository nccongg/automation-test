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
