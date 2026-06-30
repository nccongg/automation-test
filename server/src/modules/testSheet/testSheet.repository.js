"use strict";

const { pool } = require("../../config/database");

// ─── Sheets ──────────────────────────────────────────────────────────────────

async function createSheet({ projectId, name, description, createdBy }) {
  const result = await pool.query(
    `INSERT INTO test_suites (project_id, name, description, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, project_id AS "projectId", name, description, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [projectId, name, description || null, createdBy]
  );

  return result.rows[0];
}

async function findSheetsByProject(projectId) {
  const result = await pool.query(
    `SELECT
       ts.id,
       ts.project_id AS "projectId",
       ts.name,
       ts.description,
       ts.created_at AS "createdAt",
       ts.updated_at AS "updatedAt",
       COUNT(tsi.id)::int AS "itemCount"
     FROM test_suites ts
     LEFT JOIN test_suite_items tsi ON tsi.test_suite_id = ts.id
     WHERE ts.project_id = $1 AND ts.deleted_at IS NULL
     GROUP BY ts.id
     ORDER BY ts.updated_at DESC`,
    [projectId]
  );

  return result.rows;
}

async function findSheetById(sheetId) {
  const result = await pool.query(
    `SELECT
       ts.id,
       ts.project_id AS "projectId",
       ts.name,
       ts.description,
       ts.created_at AS "createdAt",
       ts.updated_at AS "updatedAt"
     FROM test_suites ts
     WHERE ts.id = $1 AND ts.deleted_at IS NULL
     LIMIT 1`,
    [sheetId]
  );

  return result.rows[0] || null;
}

async function findSheetWithOwner(sheetId, userId) {
  const result = await pool.query(
    `SELECT
       ts.id,
       ts.project_id AS "projectId",
       ts.name,
       ts.description
     FROM test_suites ts
     JOIN projects p ON p.id = ts.project_id
     WHERE ts.id = $1
       AND ts.deleted_at IS NULL
       AND p.user_id = $2
     LIMIT 1`,
    [sheetId, userId]
  );

  return result.rows[0] || null;
}

async function updateSheet(sheetId, { name, description }) {
  const result = await pool.query(
    `UPDATE test_suites
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, project_id AS "projectId", name, description, updated_at AS "updatedAt"`,
    [sheetId, name || null, description !== undefined ? description : null]
  );

  return result.rows[0] || null;
}

async function softDeleteSheet(sheetId) {
  await pool.query(
    `UPDATE test_suites SET deleted_at = NOW() WHERE id = $1`,
    [sheetId]
  );
}

// ─── Sheet Items ──────────────────────────────────────────────────────────────

async function findItemsBySheet(sheetId) {
  const result = await pool.query(
    `SELECT
       tsi.id,
       tsi.test_suite_id AS "testSuiteId",
       tsi.test_case_id AS "testCaseId",
       tsi.item_order AS "itemOrder",
       tc.title,
       tc.goal,
       tc.status,
       tc.current_version_id AS "currentVersionId",
       tcv.variables_schema AS "variablesSchema",
       tcv.plan_snapshot AS "planSnapshot"
     FROM test_suite_items tsi
     JOIN test_cases tc ON tc.id = tsi.test_case_id
     LEFT JOIN test_case_versions tcv ON tcv.id = tc.current_version_id
     WHERE tsi.test_suite_id = $1
       AND tc.deleted_at IS NULL
     ORDER BY tsi.item_order ASC, tsi.id ASC`,
    [sheetId]
  );

  return result.rows;
}

async function findDatasetsByTestCase(testCaseId) {
  const result = await pool.query(
    `SELECT
       tcdb.id AS "bindingId",
       tcdb.test_case_id AS "testCaseId",
       tcdb.dataset_id AS "datasetId",
       tcdb.alias,
       tcdb.is_default AS "isDefault",
       td.id,
       td.project_id AS "projectId",
       td.name,
       td.description,
       td.data_mode AS "dataMode",
       td.schema_json AS "schemaJson",
       td.data_json AS "dataJson",
       td.created_at AS "createdAt",
       td.updated_at AS "updatedAt"
     FROM test_case_dataset_bindings tcdb
     JOIN test_datasets td ON td.id = tcdb.dataset_id
     WHERE tcdb.test_case_id = $1
       AND td.deleted_at IS NULL
     ORDER BY tcdb.is_default DESC, td.name ASC`,
    [testCaseId]
  );

  return result.rows;
}

async function findDatasetsByProject(projectId) {
  const result = await pool.query(
    `SELECT
       td.id,
       td.id AS "datasetId",
       td.project_id AS "projectId",
       td.name,
       td.description,
       td.data_mode AS "dataMode",
       td.schema_json AS "schemaJson",
       td.data_json AS "dataJson",
       td.created_at AS "createdAt",
       td.updated_at AS "updatedAt",
       NULL::bigint AS "bindingId",
       NULL::bigint AS "testCaseId",
       NULL::text AS alias,
       FALSE AS "isDefault"
     FROM test_datasets td
     WHERE td.project_id = $1
       AND td.deleted_at IS NULL
     ORDER BY td.created_at DESC, td.name ASC`,
    [projectId]
  );

  return result.rows;
}

async function findDatasetBinding(testCaseId, datasetId) {
  const result = await pool.query(
    `SELECT
       id,
       test_case_id AS "testCaseId",
       dataset_id AS "datasetId",
       alias,
       is_default AS "isDefault"
     FROM test_case_dataset_bindings
     WHERE test_case_id = $1
       AND dataset_id = $2
     LIMIT 1`,
    [testCaseId, datasetId]
  );

  return result.rows[0] || null;
}

async function findDatasetById(datasetId) {
  const result = await pool.query(
    `SELECT
       id,
       project_id AS "projectId",
       name,
       description,
       data_mode AS "dataMode",
       schema_json AS "schemaJson",
       data_json AS "dataJson",
       created_at AS "createdAt",
       updated_at AS "updatedAt"
     FROM test_datasets
     WHERE id = $1
       AND deleted_at IS NULL
     LIMIT 1`,
    [datasetId]
  );

  return result.rows[0] || null;
}

async function findScriptsByTestCase(testCaseId) {
  const result = await pool.query(
    `SELECT
       id,
       test_case_id AS "testCaseId",
       test_case_version_id AS "testCaseVersionId",
       script_type AS "scriptType",
       status,
       script_json AS "scriptJson",
       params_schema AS "paramsSchema",
       metadata_json AS "metadataJson",
       created_at AS "createdAt"
     FROM execution_scripts
     WHERE test_case_id = $1
       AND status IN ('active', 'ready')
       AND script_type IN ('strict_replay_json', 'replay')
     ORDER BY created_at DESC, id DESC`,
    [testCaseId]
  );

  return result.rows;
}

async function createTestRunDatasetBinding({
  testRunId,
  datasetId,
  alias,
  rowIndex,
  rowKey,
  datasetSnapshot,
}) {
  const result = await pool.query(
    `INSERT INTO test_run_dataset_bindings
       (test_run_id, dataset_id, alias, row_index, row_key, dataset_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING
       id,
       test_run_id AS "testRunId",
       dataset_id AS "datasetId",
       alias,
       row_index AS "rowIndex",
       row_key AS "rowKey",
       dataset_snapshot AS "datasetSnapshot",
       created_at AS "createdAt"`,
    [
      testRunId,
      datasetId,
      alias || null,
      rowIndex ?? null,
      rowKey || null,
      JSON.stringify(datasetSnapshot || {}),
    ]
  );

  return result.rows[0];
}

async function addItemsToSheet(sheetId, testCaseIds) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const maxOrderResult = await client.query(
      `SELECT COALESCE(MAX(item_order), 0) AS max_order
       FROM test_suite_items
       WHERE test_suite_id = $1`,
      [sheetId]
    );

    let nextOrder = maxOrderResult.rows[0].max_order + 1;
    const inserted = [];

    for (const tcId of testCaseIds) {
      const r = await client.query(
        `INSERT INTO test_suite_items (test_suite_id, test_case_id, item_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (test_suite_id, test_case_id) DO NOTHING
         RETURNING id, test_case_id AS "testCaseId", item_order AS "itemOrder"`,
        [sheetId, tcId, nextOrder]
      );

      if (r.rows[0]) {
        inserted.push(r.rows[0]);
        nextOrder += 1;
      }
    }

    await client.query(
      `UPDATE test_suites SET updated_at = NOW() WHERE id = $1`,
      [sheetId]
    );

    await client.query("COMMIT");
    return inserted;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function removeItemFromSheet(sheetId, itemId) {
  const result = await pool.query(
    `DELETE FROM test_suite_items
     WHERE id = $1 AND test_suite_id = $2
     RETURNING id`,
    [itemId, sheetId]
  );

  return result.rowCount > 0;
}

async function reorderItems(sheetId, orders) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const { id, order } of orders) {
      await client.query(
        `UPDATE test_suite_items
         SET item_order = $1
         WHERE id = $2 AND test_suite_id = $3`,
        [order, id, sheetId]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ─── Sheet Runs ───────────────────────────────────────────────────────────────

async function createSheetRun({ testSuiteId, triggeredBy, totalCases }) {
  const result = await pool.query(
    `INSERT INTO test_suite_runs
       (test_suite_id, triggered_by, total_cases, status, started_at)
     VALUES ($1, $2, $3, 'running', NOW())
     RETURNING
       id,
       test_suite_id AS "testSuiteId",
       status,
       total_cases AS "totalCases",
       passed,
       failed,
       errored,
       started_at AS "startedAt",
       created_at AS "createdAt"`,
    [testSuiteId, triggeredBy, totalCases]
  );

  return result.rows[0];
}

async function createSheetRunItem({
  testSuiteRunId,
  testCaseId,
  testRunId,
  itemOrder,
  initialStatus = "queued",
  runMode = "agent",
  datasetId = null,
  executionScriptId = null,
  datasetRowIndex = null,
}) {
  const result = await pool.query(
    `INSERT INTO test_suite_run_items
       (
         test_suite_run_id,
         test_case_id,
         test_run_id,
         item_order,
         status,
         run_mode,
         dataset_id,
         execution_script_id,
         dataset_row_index
       )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING
       id,
       test_case_id AS "testCaseId",
       test_run_id AS "testRunId",
       item_order AS "itemOrder",
       status,
       run_mode AS "runMode",
       dataset_id AS "datasetId",
       execution_script_id AS "executionScriptId",
       dataset_row_index AS "datasetRowIndex"`,
    [
      testSuiteRunId,
      testCaseId,
      testRunId || null,
      itemOrder,
      initialStatus,
      runMode,
      datasetId,
      executionScriptId,
      datasetRowIndex,
    ]
  );

  return result.rows[0];
}

async function findSheetRunsByProject(projectId, limit = 20) {
  const result = await pool.query(
    `SELECT
       tsr.id,
       tsr.test_suite_id AS "testSuiteId",
       ts.name AS "sheetName",
       tsr.status,
       tsr.total_cases AS "totalCases",
       tsr.passed,
       tsr.failed,
       tsr.errored,
       tsr.started_at AS "startedAt",
       tsr.completed_at AS "completedAt",
       tsr.created_at AS "createdAt"
     FROM test_suite_runs tsr
     JOIN test_suites ts ON ts.id = tsr.test_suite_id
     WHERE ts.project_id = $1
     ORDER BY tsr.created_at DESC
     LIMIT $2`,
    [projectId, limit]
  );

  return result.rows;
}

async function findSheetRunById(runId) {
  const result = await pool.query(
    `SELECT
       tsr.id,
       tsr.test_suite_id AS "testSuiteId",
       ts.name AS "sheetName",
       tsr.status,
       tsr.total_cases AS "totalCases",
       tsr.passed,
       tsr.failed,
       tsr.errored,
       tsr.started_at AS "startedAt",
       tsr.completed_at AS "completedAt",
       tsr.created_at AS "createdAt",
       tsr.ai_analysis AS "aiAnalysis"
     FROM test_suite_runs tsr
     JOIN test_suites ts ON ts.id = tsr.test_suite_id
     WHERE tsr.id = $1
     LIMIT 1`,
    [runId]
  );

  return result.rows[0] || null;
}

async function findSheetRunItems(testSheetRunId) {
  const result = await pool.query(
    `SELECT
       tsri.id,
       tsri.test_case_id AS "testCaseId",
       tsri.test_run_id AS "testRunId",
       tsri.item_order AS "itemOrder",
       tsri.status,

       tsri.run_mode AS "runMode",
       tsri.dataset_id AS "datasetId",
       tsri.execution_script_id AS "executionScriptId",
       tsri.dataset_row_index AS "datasetRowIndex",

       td.name AS "datasetName",

       COALESCE(
         es.metadata_json ->> 'label',
         es.metadata_json ->> 'name',
         CASE
           WHEN es.id IS NOT NULL THEN CONCAT('Script #', es.id)
           ELSE NULL
         END
       ) AS "scriptLabel",

       tc.title,
       tc.goal,
       tr.verdict,
       tr.started_at AS "startedAt",
       tr.finished_at AS "finishedAt",

       trdb.dataset_snapshot AS "datasetSnapshot",
       trdb.row_index AS "rowIndex"

     FROM test_suite_run_items tsri
     JOIN test_cases tc
       ON tc.id = tsri.test_case_id
     LEFT JOIN test_runs tr
       ON tr.id = tsri.test_run_id
     LEFT JOIN test_datasets td
       ON td.id = tsri.dataset_id
     LEFT JOIN execution_scripts es
       ON es.id = tsri.execution_script_id
     LEFT JOIN test_run_dataset_bindings trdb
       ON trdb.test_run_id = tsri.test_run_id
     WHERE tsri.test_suite_run_id = $1
     ORDER BY tsri.item_order ASC, tsri.id ASC`,
    [testSheetRunId]
  );

  return result.rows;
}

async function findSheetRunItemByTestRunId(testRunId) {
  const result = await pool.query(
    `SELECT id, test_suite_run_id AS "testSuiteRunId"
     FROM test_suite_run_items
     WHERE test_run_id = $1
     LIMIT 1`,
    [testRunId]
  );

  return result.rows[0] || null;
}

async function updateSheetRunItemStatus(itemId, status) {
  await pool.query(
    `UPDATE test_suite_run_items SET status = $1 WHERE id = $2`,
    [status, itemId]
  );
}

async function recalcSheetRunSummary(testSheetRunId) {
  const result = await pool.query(
    `UPDATE test_suite_runs tsr
     SET
       passed              = sub.passed,
       failed              = sub.failed,
       errored             = sub.errored,
       total_input_tokens  = sub.total_input_tokens,
       total_output_tokens = sub.total_output_tokens,
       status  = CASE
                   WHEN sub.pending_count = 0 THEN 'completed'
                   ELSE 'running'
                 END,
       completed_at = CASE
                        WHEN sub.pending_count = 0 THEN NOW()
                        ELSE tsr.completed_at
                      END
     FROM (
       SELECT
         SUM(CASE WHEN tsri.status = 'completed' AND tr.verdict IN ('pass','pass_with_warning') THEN 1 ELSE 0 END) AS passed,
         SUM(CASE WHEN tsri.status = 'completed' AND tr.verdict IN ('fail','partial') THEN 1 ELSE 0 END) AS failed,
         SUM(CASE
               WHEN tsri.status = 'completed' AND tr.verdict = 'error' THEN 1
               WHEN tsri.status IN ('failed','cancelled') THEN 1
               ELSE 0
             END) AS errored,
         SUM(CASE WHEN tsri.status IN ('pending','queued','running') THEN 1 ELSE 0 END) AS pending_count,
         SUM(tr.agent_input_tokens)  AS total_input_tokens,
         SUM(tr.agent_output_tokens) AS total_output_tokens
       FROM test_suite_run_items tsri
       LEFT JOIN test_runs tr ON tr.id = tsri.test_run_id
       WHERE tsri.test_suite_run_id = $1
     ) sub
     WHERE tsr.id = $1
     RETURNING tsr.id, tsr.status, tsr.passed, tsr.failed, tsr.errored`,
    [testSheetRunId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createSheet,
  findSheetsByProject,
  findSheetById,
  findSheetWithOwner,
  updateSheet,
  softDeleteSheet,

  findItemsBySheet,
  findDatasetsByTestCase,
  findDatasetsByProject,
  findDatasetById,
  findDatasetBinding,
  findScriptsByTestCase,
  createTestRunDatasetBinding,

  addItemsToSheet,
  removeItemFromSheet,
  reorderItems,

  createSheetRun,
  createSheetRunItem,
  findSheetRunsByProject,
  findSheetRunById,
  findSheetRunItems,
  findSheetRunItemByTestRunId,
  updateSheetRunItemStatus,
  recalcSheetRunSummary,
};