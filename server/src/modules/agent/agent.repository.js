'use strict';

const database = require('../../config/database');

function getQueryExecutor() {
  if (database && typeof database.query === 'function') return database;
  if (database && database.pool && typeof database.pool.query === 'function') return database.pool;
  if (database && database.default && typeof database.default.query === 'function') return database.default;
  throw new Error('Cannot resolve database query executor from src/config/database.js');
}

async function query(text, params = []) {
  const executor = getQueryExecutor();
  return executor.query(text, params);
}

async function findTestCaseBundle(testCaseId, testCaseVersionId = null) {
  const sql = `
    SELECT
      tc.id AS test_case_id,
      tc.project_id,
      tc.title,
      tc.goal,
      tc.current_version_id,
      tcv.id AS test_case_version_id,
      tcv.prompt_text,
      tcv.plan_snapshot,
      tcv.execution_mode,
      tcv.runtime_config_id,
      p.base_url
    FROM public.test_cases tc
    JOIN public.projects p
      ON p.id = tc.project_id
    JOIN public.test_case_versions tcv
      ON tcv.test_case_id = tc.id
     AND tcv.id = COALESCE($2::bigint, tc.current_version_id)
    WHERE tc.id = $1
      AND tc.deleted_at IS NULL
    LIMIT 1
  `;

  const result = await query(sql, [testCaseId, testCaseVersionId]);
  return result.rows[0] || null;
}

async function findRuntimeConfigById(runtimeConfigId) {
  const sql = `
    SELECT
      id,
      project_id,
      llm_provider,
      llm_model,
      max_steps,
      timeout_seconds,
      use_vision,
      headless,
      browser_type,
      allowed_domains,
      viewport_json,
      locale,
      timezone,
      extra_config_json
    FROM public.agent_runtime_configs
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await query(sql, [runtimeConfigId]);
  return result.rows[0] || null;
}

async function findBrowserProfileById(browserProfileId) {
  const sql = `
    SELECT
      id,
      project_id,
      provider,
      profile_type,
      profile_ref,
      profile_data
    FROM public.browser_profiles
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await query(sql, [browserProfileId]);
  return result.rows[0] || null;
}

async function findExecutionScriptById(executionScriptId) {
  const sql = `
    SELECT
      id,
      test_case_id,
      test_case_version_id,
      script_type,
      script_json,
      params_schema,
      metadata_json
    FROM public.execution_scripts
    WHERE id = $1
      AND status = 'active'
    LIMIT 1
  `;
  const result = await query(sql, [executionScriptId]);
  return result.rows[0] || null;
}

async function createTestRun({
  testCaseId,
  testCaseVersionId,
  triggeredBy = null,
  status = 'running',
}) {
  const sql = `
    INSERT INTO public.test_runs (
      test_case_id,
      test_case_version_id,
      status,
      verdict,
      triggered_by,
      started_at
    )
    VALUES ($1, $2, $3, NULL, $4, NOW())
    RETURNING *
  `;
  const result = await query(sql, [testCaseId, testCaseVersionId, status, triggeredBy]);
  return result.rows[0];
}

async function createTestRunAttempt({
  testRunId,
  attemptNo = 1,
  status = 'running',
  triggerType = 'initial',
  runtimeConfigSnapshot = {},
  browserProfileSnapshot = null,
  agentPrompt = null,
}) {
  const sql = `
    INSERT INTO public.test_run_attempts (
      test_run_id,
      attempt_no,
      status,
      verdict,
      trigger_type,
      runtime_config_snapshot,
      browser_profile_snapshot,
      agent_prompt,
      started_at
    )
    VALUES ($1, $2, $3, NULL, $4, $5::jsonb, $6::jsonb, $7, NOW())
    RETURNING *
  `;
  const result = await query(sql, [
    testRunId,
    attemptNo,
    status,
    triggerType,
    JSON.stringify(runtimeConfigSnapshot || {}),
    browserProfileSnapshot ? JSON.stringify(browserProfileSnapshot) : null,
    agentPrompt,
  ]);
  return result.rows[0];
}

async function insertOrUpdateRunStepLog({
  testRunId,
  attemptId,
  stepNo,
  stepTitle,
  action,
  status,
  message,
  currentUrl = null,
  thoughtText = null,
  extractedContent = null,
  actionInputJson = null,
  actionOutputJson = null,
  modelOutputJson = null,
  durationMs = null,
}) {
  const sql = `
    INSERT INTO public.run_step_logs (
      test_run_id,
      test_run_attempt_id,
      step_no,
      step_title,
      action,
      status,
      message,
      started_at,
      finished_at,
      current_url,
      thought_text,
      extracted_content,
      action_input_json,
      action_output_json,
      model_output_json,
      duration_ms
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      NOW(), NOW(),
      $8, $9, $10,
      $11::jsonb, $12::jsonb, $13::jsonb, $14
    )
    ON CONFLICT (test_run_attempt_id, step_no)
    DO UPDATE SET
      step_title = EXCLUDED.step_title,
      action = EXCLUDED.action,
      status = EXCLUDED.status,
      message = EXCLUDED.message,
      finished_at = NOW(),
      current_url = EXCLUDED.current_url,
      thought_text = EXCLUDED.thought_text,
      extracted_content = EXCLUDED.extracted_content,
      action_input_json = EXCLUDED.action_input_json,
      action_output_json = EXCLUDED.action_output_json,
      model_output_json = EXCLUDED.model_output_json,
      duration_ms = EXCLUDED.duration_ms
    RETURNING *
  `;

  const result = await query(sql, [
    testRunId,
    attemptId,
    stepNo,
    stepTitle,
    action,
    status,
    message,
    currentUrl,
    thoughtText,
    extractedContent,
    actionInputJson ? JSON.stringify(actionInputJson) : null,
    actionOutputJson ? JSON.stringify(actionOutputJson) : null,
    modelOutputJson ? JSON.stringify(modelOutputJson) : null,
    durationMs,
  ]);

  return result.rows[0];
}

async function insertEvidence({
  testRunId,
  attemptId,
  runStepLogId = null,
  evidenceType = 'screenshot',
  filePath = null,
  pageUrl = null,
  capturedAt = null,
  artifactGroup = null,
}) {
  const sql = `
    INSERT INTO public.evidences (
      test_run_id,
      test_run_attempt_id,
      run_step_log_id,
      evidence_type,
      file_path,
      storage_provider,
      page_url,
      artifact_group,
      captured_at
    )
    VALUES ($1, $2, $3, $4, $5, 'local', $6, $7, COALESCE($8, NOW()))
    RETURNING *
  `;
  const result = await query(sql, [
    testRunId,
    attemptId,
    runStepLogId,
    evidenceType,
    filePath,
    pageUrl,
    artifactGroup,
    capturedAt,
  ]);
  return result.rows[0];
}

async function updateAttemptFinal({
  attemptId,
  status,
  verdict,
  finalResult,
  structuredOutput,
  errorMessage,
}) {
  const sql = `
    UPDATE public.test_run_attempts
    SET
      status = $2,
      verdict = $3,
      final_result = $4,
      structured_output = $5::jsonb,
      error_message = $6,
      finished_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const result = await query(sql, [
    attemptId,
    status,
    verdict,
    finalResult,
    structuredOutput ? JSON.stringify(structuredOutput) : null,
    errorMessage,
  ]);
  return result.rows[0] || null;
}

async function updateRunFinal({
  testRunId,
  status,
  verdict,
  executionLog,
  evidenceSummary,
  errorMessage,
}) {
  const sql = `
    UPDATE public.test_runs
    SET
      status = $2,
      verdict = $3,
      execution_log = $4::jsonb,
      evidence_summary = $5::jsonb,
      error_message = $6,
      finished_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const result = await query(sql, [
    testRunId,
    status,
    verdict,
    executionLog ? JSON.stringify(executionLog) : null,
    evidenceSummary ? JSON.stringify(evidenceSummary) : null,
    errorMessage,
  ]);
  return result.rows[0] || null;
}

async function findRunById(testRunId) {
  const sql = `
    SELECT *
    FROM public.test_runs
    WHERE id = $1
    LIMIT 1
  `;
  const result = await query(sql, [testRunId]);
  return result.rows[0] || null;
}

async function insertExecutionScript({
  testCaseId,
  testCaseVersionId,
  sourceTestRunId,
  sourceAttemptId,
  scriptType,
  scriptJson,
  paramsSchema = {},
  metadataJson = {},
}) {
  const sql = `
    INSERT INTO public.execution_scripts (
      test_case_id,
      test_case_version_id,
      source_test_run_id,
      source_attempt_id,
      script_type,
      status,
      script_json,
      params_schema,
      metadata_json
    )
    VALUES ($1, $2, $3, $4, $5, 'active', $6::jsonb, $7::jsonb, $8::jsonb)
    RETURNING *
  `;
  const result = await query(sql, [
    testCaseId,
    testCaseVersionId,
    sourceTestRunId,
    sourceAttemptId,
    scriptType,
    JSON.stringify(scriptJson),
    JSON.stringify(paramsSchema || {}),
    JSON.stringify(metadataJson || {}),
  ]);
  return result.rows[0];
}

module.exports = {
  query,
  findTestCaseBundle,
  findRuntimeConfigById,
  findBrowserProfileById,
  findExecutionScriptById,
  createTestRun,
  createTestRunAttempt,
  insertOrUpdateRunStepLog,
  insertEvidence,
  updateAttemptFinal,
  updateRunFinal,
  findRunById,
  insertExecutionScript,
};