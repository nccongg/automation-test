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

async function listProjectTestCases(projectId) {
  const sql = `
    SELECT
      tc.id AS "testCaseId",
      tc.project_id AS "projectId",
      tc.title,
      tc.goal,
      tc.status,
      tc.current_version_id AS "currentVersionId",
      tcv.id AS "versionId",
      tcv.version_no AS "versionNo",
      tcv.prompt_text AS "promptText",
      tcv.plan_snapshot AS "planSnapshot",
      tcv.execution_mode AS "executionMode",
      tcv.runtime_config_id AS "runtimeConfigId",
      tc.created_at AS "createdAt",
      tc.updated_at AS "updatedAt"
    FROM public.test_cases tc
    LEFT JOIN public.test_case_versions tcv
      ON tcv.id = tc.current_version_id
    WHERE tc.project_id = $1
      AND tc.deleted_at IS NULL
    ORDER BY tc.id DESC
  `;

  const result = await query(sql, [projectId]);
  return result.rows;
}

async function listExecutionScriptsByTestCase(testCaseId) {
  const sql = `
    SELECT
      id,
      test_case_id AS "testCaseId",
      test_case_version_id AS "testCaseVersionId",
      source_test_run_id AS "sourceTestRunId",
      source_attempt_id AS "sourceAttemptId",
      script_type AS "scriptType",
      status,
      created_at AS "createdAt"
    FROM public.execution_scripts
    WHERE test_case_id = $1
      AND status = 'active'
    ORDER BY id DESC
  `;

  const result = await query(sql, [testCaseId]);
  return result.rows;
}

module.exports = {
  query,
  listProjectTestCases,
  listExecutionScriptsByTestCase,
};