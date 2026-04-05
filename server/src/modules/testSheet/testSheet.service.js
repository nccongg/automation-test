"use strict";

const repo = require("./testSheet.repository");
const agentService = require("../agent/agent.service");

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

async function runSheet(sheetId, userId) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  const items = await repo.findItemsBySheet(sheetId);
  if (items.length === 0) {
    throw { status: 400, message: "Test sheet has no test cases" };
  }

  const sheetRun = await repo.createSheetRun({
    testSheetId: sheetId,
    triggeredBy: userId,
    totalCases: items.length,
  });

  const runItems = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    let testRunId = null;

    try {
      const runResult = await agentService.startAgentRun({
        testCaseId: item.testCaseId,
        triggeredBy: userId,
      });
      testRunId = runResult.testRunId;
    } catch (err) {
      // Record the failure in the run item but continue with remaining test cases
      console.error(`[testSheet] Failed to start run for testCase ${item.testCaseId}:`, err.message);
    }

    const runItem = await repo.createSheetRunItem({
      testSheetRunId: sheetRun.id,
      testCaseId: item.testCaseId,
      testRunId,
      itemOrder: i + 1,
    });

    runItems.push(runItem);
  }

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

  const itemStatus = status === "completed" ? "completed" : "failed";
  await repo.updateSheetRunItemStatus(item.id, itemStatus);
  await repo.recalcSheetRunSummary(item.testSheetRunId);
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
};
