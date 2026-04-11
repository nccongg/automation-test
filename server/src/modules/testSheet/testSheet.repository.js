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
    `SELECT ts.id, ts.project_id AS "projectId", ts.name, ts.description
     FROM test_suites ts
     JOIN projects p ON p.id = ts.project_id
     WHERE ts.id = $1 AND ts.deleted_at IS NULL AND p.user_id = $2
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
       tc.status
     FROM test_suite_items tsi
     JOIN test_cases tc ON tc.id = tsi.test_case_id
     WHERE tsi.test_suite_id = $1 AND tc.deleted_at IS NULL
     ORDER BY tsi.item_order ASC, tsi.id ASC`,
    [sheetId]
  );
  return result.rows;
}

async function addItemsToSheet(sheetId, testCaseIds) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const maxOrderResult = await client.query(
      `SELECT COALESCE(MAX(item_order), 0) AS max_order FROM test_suite_items WHERE test_suite_id = $1`,
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
    `DELETE FROM test_suite_items WHERE id = $1 AND test_suite_id = $2 RETURNING id`,
    [itemId, sheetId]
  );
  return result.rowCount > 0;
}

async function reorderItems(sheetId, orders) {
  // orders: [{id, order}, ...]
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const { id, order } of orders) {
      await client.query(
        `UPDATE test_suite_items SET item_order = $1 WHERE id = $2 AND test_suite_id = $3`,
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
    `INSERT INTO test_suite_runs (test_suite_id, triggered_by, total_cases, status, started_at)
     VALUES ($1, $2, $3, 'running', NOW())
     RETURNING id, test_suite_id AS "testSuiteId", status, total_cases AS "totalCases",
               passed, failed, errored, started_at AS "startedAt", created_at AS "createdAt"`,
    [testSuiteId, triggeredBy, totalCases]
  );
  return result.rows[0];
}

async function createSheetRunItem({ testSuiteRunId, testCaseId, testRunId, itemOrder, initialStatus = 'queued' }) {
  const result = await pool.query(
    `INSERT INTO test_suite_run_items (test_suite_run_id, test_case_id, test_run_id, item_order, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, test_case_id AS "testCaseId", test_run_id AS "testRunId", item_order AS "itemOrder", status`,
    [testSuiteRunId, testCaseId, testRunId || null, itemOrder, initialStatus]
  );
  return result.rows[0];
}

async function findSheetRunsByProject(projectId, limit = 20) {
  const result = await pool.query(
    `SELECT
       tsr.id,
       tsr.test_suite_id AS "testSuiteId",
       ts.name AS "suiteName",
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
       ts.name AS "suiteName",
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
       tc.title,
       tc.goal,
       tr.verdict,
       tr.started_at AS "startedAt",
       tr.finished_at AS "finishedAt"
     FROM test_suite_run_items tsri
     JOIN test_cases tc ON tc.id = tsri.test_case_id
     LEFT JOIN test_runs tr ON tr.id = tsri.test_run_id
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
       passed  = sub.passed,
       failed  = sub.failed,
       errored = sub.errored,
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
         -- passed: run finished cleanly with pass verdict
         SUM(CASE WHEN tsri.status = 'completed' AND tr.verdict = 'pass' THEN 1 ELSE 0 END) AS passed,
         -- failed: run finished with fail or partial verdict
         SUM(CASE WHEN tsri.status = 'completed' AND tr.verdict IN ('fail','partial') THEN 1 ELSE 0 END) AS failed,
         -- errored: run finished with error verdict OR item never dispatched (test_run_id IS NULL)
         SUM(CASE
               WHEN tsri.status = 'completed' AND tr.verdict = 'error' THEN 1
               WHEN tsri.status IN ('failed','cancelled') THEN 1
               ELSE 0
             END) AS errored,
         -- pending: still in-flight
         SUM(CASE WHEN tsri.status IN ('pending','queued','running') THEN 1 ELSE 0 END) AS pending_count
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
