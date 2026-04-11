"use strict";

const repo = require("./testSheet.repository");
const agentService = require("../agent/agent.service");
const { generateSheetRunAnalysis } = require("../llm/llm.service");

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ─── Sheets CRUD ──────────────────────────────────────────────────────────────

async function createSheet({ projectId, name, description, userId }) {
  if (!name || !name.trim()) {
    throw { status: 400, message: "Sheet name is required" };
  }
  return repo.createSheet({
    projectId,
    name: name.trim(),
    description: description || null,
    createdBy: userId,
  });
}

async function listSheets(projectId) {
  return repo.findSheetsByProject(projectId);
}

async function getSheet(sheetId, userId) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  const items = await repo.findItemsBySheet(sheetId);
  return { ...sheet, items };
}

async function updateSheet(sheetId, userId, { name, description }) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  return repo.updateSheet(sheetId, { name, description });
}

async function deleteSheet(sheetId, userId) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  await repo.softDeleteSheet(sheetId);
}

// ─── Items Management ─────────────────────────────────────────────────────────

async function addItems(sheetId, userId, testCaseIds) {
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    throw { status: 400, message: "testCaseIds must be a non-empty array" };
  }

  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  const validIds = testCaseIds.map(toInt).filter(Boolean);
  return repo.addItemsToSheet(sheetId, validIds);
}

async function removeItem(sheetId, itemId, userId) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  const removed = await repo.removeItemFromSheet(sheetId, itemId);
  if (!removed) throw { status: 404, message: "Item not found in sheet" };
}

async function reorderItems(sheetId, userId, orders) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  await repo.reorderItems(sheetId, orders);
}

// ─── Sheet Run ────────────────────────────────────────────────────────────────

async function runSheet(sheetId, userId, { testCaseIds } = {}) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  let items = await repo.findItemsBySheet(sheetId);
  if (items.length === 0) {
    throw { status: 400, message: "Test sheet has no test cases" };
  }

  // Filter to specific test cases if provided
  if (Array.isArray(testCaseIds) && testCaseIds.length > 0) {
    const idSet = new Set(testCaseIds.map(Number));
    items = items.filter((item) => idSet.has(item.testCaseId));
    if (items.length === 0) {
      throw { status: 400, message: "None of the specified test cases are in this sheet" };
    }
  }

  const sheetRun = await repo.createSheetRun({
    testSuiteId: sheetId,
    triggeredBy: userId,
    totalCases: items.length,
  });

  const runItems = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    let testRunId = null;
    let dispatchFailed = false;

    try {
      const runResult = await agentService.startAgentRun({
        testCaseId: item.testCaseId,
        triggeredBy: userId,
      });
      testRunId = runResult.testRunId;
    } catch (err) {
      dispatchFailed = true;
      console.error(`[testSheet] Failed to dispatch testCase ${item.testCaseId}:`, err.message);
    }

    const runItem = await repo.createSheetRunItem({
      testSuiteRunId: sheetRun.id,
      testCaseId: item.testCaseId,
      testRunId,
      itemOrder: i + 1,
      // Mark immediately as failed so pending_count stays accurate
      initialStatus: dispatchFailed ? 'failed' : 'queued',
    });

    runItems.push(runItem);
  }

  // Recalc once after all dispatches — covers the edge case where every
  // item failed to dispatch (no agent callbacks will ever fire for them).
  await repo.recalcSheetRunSummary(sheetRun.id);

  return { sheetRun, runItems };
}

// ─── Sheet Run Queries ────────────────────────────────────────────────────────

async function listSheetRuns(projectId, limit = 20) {
  return repo.findSheetRunsByProject(projectId, limit);
}

async function getSheetRunDetail(runId) {
  const run = await repo.findSheetRunById(runId);
  if (!run) throw { status: 404, message: "Test sheet run not found" };

  const items = await repo.findSheetRunItems(runId);
  return { run, items };
}

// ─── Called from agent finalCallback ─────────────────────────────────────────

async function onTestRunCompleted(testRunId, verdict, status) {
  const item = await repo.findSheetRunItemByTestRunId(testRunId);
  if (!item) return; // this run is not part of any sheet run

  // Map test_run.status → sheet run item status
  // 'completed' covers pass/fail/error/partial verdicts — the SQL recalc uses verdict for bucketing
  // 'failed'/'cancelled' covers worker-level failures
  const itemStatus = status === "completed" ? "completed" : "failed";
  await repo.updateSheetRunItemStatus(item.id, itemStatus);
  await repo.recalcSheetRunSummary(item.testSuiteRunId);
}

async function analyzeSheetRun(runId) {
  const { query } = require("../../config/database");
  const detail = await getSheetRunDetail(runId);
  const run = detail.run;
  const items = detail.items ?? [];

  // Fetch steps for each item that has a test run
  const itemsWithSteps = await Promise.all(
    items.map(async (item) => {
      if (!item.testRunId) return item;
      try {
        const result = await query(
          `SELECT step_no, step_title, action, status, message, thought_text, extracted_content
           FROM public.run_step_logs
           WHERE test_run_id = $1
           ORDER BY step_no ASC
           LIMIT 15`,
          [item.testRunId]
        );
        return { ...item, steps: result.rows };
      } catch {
        return item;
      }
    })
  );

  return generateSheetRunAnalysis({
    sheetName: run.sheetName || "Test Sheet",
    totalCases: run.totalCases || 0,
    passed: run.passed || 0,
    failed: run.failed || 0,
    errored: run.errored || 0,
    items: itemsWithSteps,
  });
}

module.exports = {
  createSheet,
  listSheets,
  getSheet,
  updateSheet,
  deleteSheet,
  addItems,
  removeItem,
  reorderItems,
  runSheet,
  listSheetRuns,
  getSheetRunDetail,
  onTestRunCompleted,
  analyzeSheetRun,
};
