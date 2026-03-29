'use strict';

const db = require('../../config/database');

async function getTestCaseExecutionContext(testCaseId, userId) {
  const query = `
    SELECT
      tc.id AS test_case_id,
      tc.title,
      tc.goal,
      tc.project_id,
      tc.current_version_id,
      p.base_url,
      tcv.prompt_text,
      tcv.plan_snapshot,
      tcv.execution_mode,
      tcv.runtime_config_id,
      arc.id AS runtime_id,
      arc.llm_provider,
      arc.llm_model,
      arc.max_steps,
      arc.timeout_seconds,
      arc.use_vision,
      arc.headless,
      arc.browser_type,
      arc.allowed_domains,
      arc.viewport_json,
      bp.id AS browser_profile_id,
      bp.provider AS browser_provider,
      bp.profile_type,
      bp.profile_ref
    FROM test_cases tc
    JOIN projects p
      ON p.id = tc.project_id
    LEFT JOIN test_case_versions tcv
      ON tcv.id = tc.current_version_id
    LEFT JOIN agent_runtime_configs arc
      ON arc.id = tcv.runtime_config_id
    LEFT JOIN LATERAL (
      SELECT *
      FROM browser_profiles bp
      WHERE bp.project_id = p.id
        AND bp.is_default = TRUE
        AND bp.deleted_at IS NULL
      ORDER BY bp.id DESC
      LIMIT 1
    ) bp ON TRUE
    WHERE tc.id = $1
      AND tc.deleted_at IS NULL
      AND p.user_id = $2
    LIMIT 1
  `;

  const result = await db.query(query, [testCaseId, userId]);
  return result.rows[0] || null;
}

async function createTestRun({ testCaseId, versionId, triggeredBy }) {
  const query = `
    INSERT INTO test_runs (
      test_case_id,
      test_case_version_id,
      status,
      triggered_by,
      created_at
    )
    VALUES ($1, $2, 'queued', $3, NOW())
    RETURNING *
  `;

  const result = await db.query(query, [testCaseId, versionId, triggeredBy]);
  return result.rows[0];
}

async function createRunAttempt({
  testRunId,
  agentPrompt,
  runtimeConfigSnapshot,
  browserProfileSnapshot,
  triggerType = 'initial',
}) {
  const nextAttemptQuery = `
    SELECT COALESCE(MAX(attempt_no), 0) + 1 AS next_attempt_no
    FROM test_run_attempts
    WHERE test_run_id = $1
  `;

  const nextAttemptResult = await db.query(nextAttemptQuery, [testRunId]);
  const attemptNo = nextAttemptResult.rows[0].next_attempt_no;

  const query = `
    INSERT INTO test_run_attempts (
      test_run_id,
      attempt_no,
      status,
      trigger_type,
      runtime_config_snapshot,
      browser_profile_snapshot,
      agent_prompt,
      created_at
    )
    VALUES ($1, $2, 'queued', $3, $4, $5, $6, NOW())
    RETURNING *
  `;

  const result = await db.query(query, [
    testRunId,
    attemptNo,
    triggerType,
    runtimeConfigSnapshot || {},
    browserProfileSnapshot || {},
    agentPrompt || null,
  ]);

  return result.rows[0];
}

async function markRunStarted(testRunId) {
  const query = `
    UPDATE test_runs
    SET
      status = 'running',
      started_at = COALESCE(started_at, NOW())
    WHERE id = $1
    RETURNING *
  `;

  const result = await db.query(query, [testRunId]);
  return result.rows[0];
}

async function markAttemptStarted(attemptId) {
  const query = `
    UPDATE test_run_attempts
    SET
      status = 'running',
      started_at = COALESCE(started_at, NOW())
    WHERE id = $1
    RETURNING *
  `;

  const result = await db.query(query, [attemptId]);
  return result.rows[0];
}

async function insertRunStepLog(payload) {
  const query = `
    INSERT INTO run_step_logs (
      test_run_id,
      test_run_attempt_id,
      step_no,
      step_title,
      action,
      status,
      message,
      current_url,
      thought_text,
      extracted_content,
      action_input_json,
      action_output_json,
      model_output_json,
      duration_ms,
      started_at,
      finished_at,
      created_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14,
      NOW(), NOW(), NOW()
    )
    RETURNING *
  `;

  const result = await db.query(query, [
    payload.testRunId,
    payload.attemptId,
    payload.stepNo,
    payload.stepTitle || null,
    payload.action || null,
    payload.status,
    payload.message || null,
    payload.currentUrl || null,
    payload.thoughtText || null,
    payload.extractedContent || null,
    payload.actionInputJson || null,
    payload.actionOutputJson || null,
    payload.modelOutputJson || null,
    payload.durationMs || null,
  ]);

  return result.rows[0];
}

async function insertEvidence({
  testRunId,
  attemptId,
  runStepLogId,
  screenshotPath,
  currentUrl,
}) {
  const query = `
    INSERT INTO evidences (
      test_run_id,
      test_run_attempt_id,
      run_step_log_id,
      evidence_type,
      file_path,
      storage_provider,
      page_url,
      captured_at,
      created_at
    )
    VALUES ($1, $2, $3, 'screenshot', $4, 'local', $5, NOW(), NOW())
    RETURNING *
  `;

  const result = await db.query(query, [
    testRunId,
    attemptId,
    runStepLogId,
    screenshotPath,
    currentUrl || null,
  ]);

  return result.rows[0];
}

async function updateRunAttemptFinal({
  attemptId,
  status,
  verdict,
  finalResult,
  structuredOutput,
  errorMessage,
}) {
  const query = `
    UPDATE test_run_attempts
    SET
      status = $2::varchar(30),
      verdict = $3::varchar(20),
      final_result = $4::text,
      structured_output = $5::jsonb,
      error_message = $6::text,
      started_at = COALESCE(started_at, NOW()),
      finished_at = CASE
        WHEN $2::text IN ('completed', 'failed', 'cancelled') THEN NOW()
        ELSE finished_at
      END
    WHERE id = $1
    RETURNING *
  `;

  const result = await db.query(query, [
    attemptId,
    status,
    verdict || null,
    finalResult || null,
    structuredOutput || null,
    errorMessage || null,
  ]);

  return result.rows[0];
}

async function updateTestRunFinal({
  testRunId,
  status,
  verdict,
  executionLog,
  evidenceSummary,
  errorMessage,
}) {
  const query = `
    UPDATE test_runs
    SET
      status = $2::varchar(30),
      verdict = $3::varchar(20),
      execution_log = $4::jsonb,
      evidence_summary = $5::jsonb,
      error_message = $6::text,
      started_at = COALESCE(started_at, NOW()),
      finished_at = CASE
        WHEN $2::text IN ('completed', 'failed', 'cancelled') THEN NOW()
        ELSE finished_at
      END
    WHERE id = $1
    RETURNING *
  `;

  const result = await db.query(query, [
    testRunId,
    status,
    verdict || null,
    executionLog || null,
    evidenceSummary || null,
    errorMessage || null,
  ]);

  return result.rows[0];
}

async function getRecentTestRuns({ userId, projectId = null, limit = 20 }) {
  const query = `
    SELECT
      tr.id,
      tr.status,
      tr.verdict,
      tr.error_message,
      tr.created_at,
      tr.started_at,
      tr.finished_at,
      tc.title AS test_case_title
    FROM test_runs tr
    JOIN test_cases tc
      ON tc.id = tr.test_case_id
    JOIN projects p
      ON p.id = tc.project_id
    WHERE p.user_id = $1
      AND ($2::bigint IS NULL OR tc.project_id = $2)
    ORDER BY tr.id DESC
    LIMIT $3
  `;

  const result = await db.query(query, [userId, projectId, limit]);
  return result.rows;
}

async function getReplaySourceRun(testRunId, userId) {
  const query = `
    SELECT
      tr.id AS source_run_id,
      tr.test_case_id,
      tr.test_case_version_id,
      latest_attempt.agent_prompt
    FROM test_runs tr
    JOIN test_cases tc
      ON tc.id = tr.test_case_id
    JOIN projects p
      ON p.id = tc.project_id
    LEFT JOIN LATERAL (
      SELECT tra.agent_prompt
      FROM test_run_attempts tra
      WHERE tra.test_run_id = tr.id
      ORDER BY tra.attempt_no DESC, tra.id DESC
      LIMIT 1
    ) latest_attempt ON TRUE
    WHERE tr.id = $1
      AND p.user_id = $2
    LIMIT 1
  `;

  const result = await db.query(query, [testRunId, userId]);
  return result.rows[0] || null;
}

async function getTestRunDetail(testRunId, userId) {
  const runQuery = `
    SELECT
      tr.*,
      tc.title AS test_case_title,
      tc.goal AS test_case_goal
    FROM test_runs tr
    JOIN test_cases tc
      ON tc.id = tr.test_case_id
    JOIN projects p
      ON p.id = tc.project_id
    WHERE tr.id = $1
      AND p.user_id = $2
    LIMIT 1
  `;

  const runResult = await db.query(runQuery, [testRunId, userId]);
  const run = runResult.rows[0] || null;

  if (!run) {
    return {
      run: null,
      attempts: [],
      steps: [],
      evidences: [],
    };
  }

  const attemptsQuery = `
    SELECT *
    FROM test_run_attempts
    WHERE test_run_id = $1
    ORDER BY id DESC
  `;

  const stepsQuery = `
    SELECT *
    FROM run_step_logs
    WHERE test_run_id = $1
    ORDER BY step_no ASC, id ASC
  `;

  const evidencesQuery = `
    SELECT *
    FROM evidences
    WHERE test_run_id = $1
    ORDER BY id DESC
  `;

  const [attemptsResult, stepsResult, evidencesResult] = await Promise.all([
    db.query(attemptsQuery, [testRunId]),
    db.query(stepsQuery, [testRunId]),
    db.query(evidencesQuery, [testRunId]),
  ]);

  return {
    run,
    attempts: attemptsResult.rows,
    steps: stepsResult.rows,
    evidences: evidencesResult.rows,
  };
}

module.exports = {
  getTestCaseExecutionContext,
  createTestRun,
  createRunAttempt,
  markRunStarted,
  markAttemptStarted,
  insertRunStepLog,
  insertEvidence,
  updateRunAttemptFinal,
  updateTestRunFinal,
  getRecentTestRuns,
  getReplaySourceRun,
  getTestRunDetail,
};