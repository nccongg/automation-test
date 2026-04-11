-- =========================================================
-- MIGRATION 002: Test Sheets / Test Collections
-- =========================================================

-- ─── Test Sheets ─────────────────────────────────────────
-- A named collection of test cases belonging to a project
CREATE TABLE test_sheets (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_test_sheets_project_id   ON test_sheets(project_id);
CREATE INDEX idx_test_sheets_deleted_at   ON test_sheets(deleted_at);

-- ─── Test Sheet Items ─────────────────────────────────────
-- Ordered list of test cases inside a sheet
CREATE TABLE test_sheet_items (
    id              BIGSERIAL PRIMARY KEY,
    test_sheet_id   BIGINT NOT NULL REFERENCES test_sheets(id) ON DELETE CASCADE,
    test_case_id    BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    item_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_sheet_id, test_case_id)
);

CREATE INDEX idx_test_sheet_items_sheet_id ON test_sheet_items(test_sheet_id);

-- ─── Test Sheet Runs ─────────────────────────────────────
-- One batch execution of an entire test sheet
CREATE TABLE test_sheet_runs (
    id              BIGSERIAL PRIMARY KEY,
    test_sheet_id   BIGINT NOT NULL REFERENCES test_sheets(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued','running','completed','failed','cancelled')),
    triggered_by    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    trigger_type    VARCHAR(20) NOT NULL DEFAULT 'manual'
                        CHECK (trigger_type IN ('manual','scheduled')),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    -- Denormalised summary counters (updated as individual runs complete)
    total_cases     INTEGER NOT NULL DEFAULT 0,
    passed          INTEGER NOT NULL DEFAULT 0,
    failed          INTEGER NOT NULL DEFAULT 0,
    errored         INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_sheet_runs_sheet_id    ON test_sheet_runs(test_sheet_id);
CREATE INDEX idx_test_sheet_runs_status      ON test_sheet_runs(status);
CREATE INDEX idx_test_sheet_runs_created_at  ON test_sheet_runs(created_at DESC);

-- ─── Test Sheet Run Items ─────────────────────────────────
-- Links each test case in a sheet run to its individual test_run
CREATE TABLE test_sheet_run_items (
    id                  BIGSERIAL PRIMARY KEY,
    test_sheet_run_id   BIGINT NOT NULL REFERENCES test_sheet_runs(id) ON DELETE CASCADE,
    test_case_id        BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    test_run_id         BIGINT REFERENCES test_runs(id) ON DELETE SET NULL,
    item_order          INTEGER NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','queued','running','completed','failed','cancelled')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_sheet_run_items_run_id     ON test_sheet_run_items(test_sheet_run_id);
CREATE INDEX idx_test_sheet_run_items_test_run   ON test_sheet_run_items(test_run_id);
