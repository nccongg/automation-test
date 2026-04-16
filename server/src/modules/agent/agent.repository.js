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
      tcv.display_text,
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

/* =========================
   DATASET / BINDING HELPERS
========================= */

async function findDefaultDatasetBindingForTestCase(testCaseId) {
  const sql = `
    SELECT
      tcdb.id,
      tcdb.test_case_id,
      tcdb.dataset_id,
      tcdb.alias,
      tcdb.is_default,
      tcdb.created_at,
      tcdb.updated_at
    FROM public.test_case_dataset_bindings tcdb
    WHERE tcdb.test_case_id = $1
      AND tcdb.is_default = true
    ORDER BY tcdb.id ASC
    LIMIT 1
  `;
  const result = await query(sql, [testCaseId]);
  return result.rows[0] || null;
}

async function findDatasetBindingForTestCase({
  testCaseId,
  datasetId = null,
  alias = null,
}) {
  if (!testCaseId) return null;

  if (datasetId) {
    const sql = `
      SELECT
        tcdb.id,
        tcdb.test_case_id,
        tcdb.dataset_id,
        tcdb.alias,
        tcdb.is_default,
        tcdb.created_at,
        tcdb.updated_at
      FROM public.test_case_dataset_bindings tcdb
      WHERE tcdb.test_case_id = $1
        AND tcdb.dataset_id = $2
      LIMIT 1
    `;
    const result = await query(sql, [testCaseId, datasetId]);
    return result.rows[0] || null;
  }

  if (alias) {
    const sql = `
      SELECT
        tcdb.id,
        tcdb.test_case_id,
        tcdb.dataset_id,
        tcdb.alias,
        tcdb.is_default,
        tcdb.created_at,
        tcdb.updated_at
      FROM public.test_case_dataset_bindings tcdb
      WHERE tcdb.test_case_id = $1
        AND tcdb.alias = $2
      LIMIT 1
    `;
    const result = await query(sql, [testCaseId, alias]);
    return result.rows[0] || null;
  }

  return findDefaultDatasetBindingForTestCase(testCaseId);
}

async function findDatasetById(datasetId) {
  const sql = `
    SELECT
      id,
      project_id,
      name,
      description,
      data_mode,
      schema_json,
      data_json,
      generator_config,
      created_by,
      created_at,
      updated_at,
      deleted_at
    FROM public.test_datasets
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await query(sql, [datasetId]);
  return result.rows[0] || null;
}

function normalizeDatasetRows(dataJson) {
  if (!dataJson) return [];

  if (Array.isArray(dataJson)) {
    return dataJson;
  }

  if (typeof dataJson === 'object') {
    if (Array.isArray(dataJson.rows)) {
      return dataJson.rows;
    }

    if (Array.isArray(dataJson.items)) {
      return dataJson.items;
    }

    if (Array.isArray(dataJson.data)) {
      return dataJson.data;
    }

    return [dataJson];
  }

  return [];
}

function inferRowKey(row) {
  if (!row || typeof row !== 'object') return null;
  return (
    row.rowKey ??
    row.key ??
    row.id ??
    row.code ??
    row.username ??
    row.email ??
    null
  );
}

async function resolveDatasetRow({
  dataset,
  rowIndex = null,
  rowKey = null,
}) {
  if (!dataset) {
    throw new Error('Dataset is required to resolve row');
  }

  if (dataset.data_mode !== 'static_json') {
    throw new Error(`Dataset mode ${dataset.data_mode} is not supported yet`);
  }

  const rows = normalizeDatasetRows(dataset.data_json);

  if (!rows.length) {
    throw new Error('Dataset contains no rows');
  }

  if (rowIndex !== null && rowIndex !== undefined) {
    const idx = Number(rowIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= rows.length) {
      throw new Error('rowIndex is out of range');
    }

    const row = rows[idx];
    return {
      rowIndex: idx,
      rowKey: inferRowKey(row),
      data: row,
    };
  }

  if (rowKey !== null && rowKey !== undefined && String(rowKey).trim() !== '') {
    const normalizedRowKey = String(rowKey).trim();

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const candidates = [
        row?.rowKey,
        row?.key,
        row?.id,
        row?.code,
        row?.username,
        row?.email,
      ]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v));

      if (candidates.includes(normalizedRowKey)) {
        return {
          rowIndex: i,
          rowKey: normalizedRowKey,
          data: row,
        };
      }
    }

    throw new Error(`Cannot find dataset row with key: ${normalizedRowKey}`);
  }

  const firstRow = rows[0];
  return {
    rowIndex: 0,
    rowKey: inferRowKey(firstRow),
    data: firstRow,
  };
}

async function insertTestRunDatasetBinding({
  testRunId,
  testRunAttemptId,
  datasetId = null,
  alias = null,
  rowIndex = null,
  rowKey = null,
  datasetSnapshot = {},
}) {
  const sql = `
    INSERT INTO public.test_run_dataset_bindings (
      test_run_id,
      test_run_attempt_id,
      dataset_id,
      alias,
      row_index,
      row_key,
      dataset_snapshot,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
    RETURNING *
  `;

  const result = await query(sql, [
    testRunId,
    testRunAttemptId,
    datasetId,
    alias,
    rowIndex,
    rowKey,
    JSON.stringify(datasetSnapshot || {}),
  ]);

  return result.rows[0] || null;
}

async function listTestRunDatasetBindings(testRunId) {
  const sql = `
    SELECT
      trdb.*
    FROM public.test_run_dataset_bindings trdb
    WHERE trdb.test_run_id = $1
    ORDER BY trdb.id ASC
  `;
  const result = await query(sql, [testRunId]);
  return result.rows || [];
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

  findDefaultDatasetBindingForTestCase,
  findDatasetBindingForTestCase,
  findDatasetById,
  resolveDatasetRow,
  insertTestRunDatasetBinding,
  listTestRunDatasetBindings,
};