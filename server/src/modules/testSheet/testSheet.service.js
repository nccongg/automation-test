"use strict";

const repo = require("./testSheet.repository");
const agentService = require("../agent/agent.service");
const { generateSheetRunAnalysis } = require("../llm/llm.service");

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function buildDatasetSnapshot({ dataset, binding, rowIndex }) {
  const originalData = dataset?.dataJson;

  let selectedData = originalData;

  if (
    rowIndex !== null &&
    rowIndex !== undefined &&
    Array.isArray(originalData)
  ) {
    selectedData = originalData[rowIndex] ?? null;
  }

  return {
    datasetId: dataset.id,
    datasetName: dataset.name,
    dataMode: dataset.dataMode,
    dataJson: selectedData,
    originalDataJson: originalData,
    binding: binding
      ? {
          id: binding.id,
          alias: binding.alias,
          isDefault: binding.isDefault,
        }
      : null,
    selectedRowIndex: rowIndex ?? null,
    snapshotAt: new Date().toISOString(),
  };
}

function normalizeFieldName(value) {
  return String(value || "")
    .trim()
    .replace(/^\{\{/, "")
    .replace(/\}\}$/, "")
    .replace(/^\$\{/, "")
    .replace(/\}$/, "")
    .trim();
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeFieldName(value))
        .filter(Boolean)
    )
  );
}

function getFieldsFromSchema(schemaJson) {
  if (!schemaJson || typeof schemaJson !== "object") return [];

  if (Array.isArray(schemaJson.fields)) {
    return uniqueStrings(
      schemaJson.fields.map((field) =>
        typeof field === "string" ? field : field?.name
      )
    );
  }

  if (
    schemaJson.fields &&
    typeof schemaJson.fields === "object" &&
    !Array.isArray(schemaJson.fields)
  ) {
    return uniqueStrings(Object.keys(schemaJson.fields));
  }

  if (
    schemaJson.properties &&
    typeof schemaJson.properties === "object" &&
    !Array.isArray(schemaJson.properties)
  ) {
    return uniqueStrings(Object.keys(schemaJson.properties));
  }

  return [];
}

function getDatasetRows(dataset) {
  return Array.isArray(dataset?.dataJson) ? dataset.dataJson : [];
}

function getRowsToRun({ runMode, dataset, rowIndex }) {
  if (runMode === "agent") {
    return [null];
  }

  if (!dataset) {
    return [null];
  }

  const rows = getDatasetRows(dataset);

  if (!rows.length) {
    return [null];
  }

  if (
    rowIndex !== null &&
    rowIndex !== undefined &&
    !Number.isNaN(Number(rowIndex))
  ) {
    return [Number(rowIndex)];
  }

  return rows.map((_, index) => index);
}

function getDatasetFields(dataset) {
  const schemaFields = getFieldsFromSchema(dataset?.schemaJson);
  if (schemaFields.length > 0) return schemaFields;

  const rows = getDatasetRows(dataset);
  const firstRow =
    rows[0] && typeof rows[0] === "object" && !Array.isArray(rows[0])
      ? rows[0]
      : {};

  return uniqueStrings(Object.keys(firstRow));
}

function getRequiredFieldsFromParamsSchema(paramsSchema) {
  if (!paramsSchema || typeof paramsSchema !== "object") return [];

  if (Array.isArray(paramsSchema)) {
    return uniqueStrings(
      paramsSchema
        .filter((item) => {
          if (typeof item === "string") return true;
          return item?.required !== false;
        })
        .map((item) => (typeof item === "string" ? item : item?.name))
    );
  }

  return uniqueStrings(
    Object.entries(paramsSchema)
      .filter(([, config]) => {
        if (!config || typeof config !== "object") return true;
        return config.required !== false;
      })
      .map(([name]) => name)
  );
}

function extractTemplateVariables(value) {
  const found = [];
  const text = typeof value === "string" ? value : JSON.stringify(value || {});

  const patterns = [
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
    /\$\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      found.push(match[1]);
    }
  }

  return uniqueStrings(found);
}

function getRequiredFieldsFromVariablesSchema(variablesSchema) {
  if (!variablesSchema || typeof variablesSchema !== "object") return [];

  if (Array.isArray(variablesSchema)) {
    return uniqueStrings(
      variablesSchema
        .filter((item) => {
          if (typeof item === "string") return true;
          return item?.required !== false;
        })
        .map((item) => (typeof item === "string" ? item : item?.name))
    );
  }

  return uniqueStrings(
    Object.entries(variablesSchema)
      .filter(([, config]) => {
        if (!config || typeof config !== "object") return true;
        return config.required !== false;
      })
      .map(([name]) => name)
  );
}

function getRequiredFieldsFromScripts(scripts) {
  const required = [];

  for (const script of scripts || []) {
    required.push(...getRequiredFieldsFromParamsSchema(script.paramsSchema));
    required.push(...extractTemplateVariables(script.scriptJson));
  }

  return uniqueStrings(required);
}

function getRequiredFieldsFromText(item) {
  const text = `${item?.title || ""} ${item?.goal || ""}`.toLowerCase();

  if (text.includes("login") || text.includes("sign in")) {
    return ["username", "password"];
  }

  if (
    text.includes("register") ||
    text.includes("sign up") ||
    text.includes("signup")
  ) {
    return ["username", "email", "password"];
  }

  if (text.includes("search")) {
    return ["keyword"];
  }

  if (text.includes("checkout") || text.includes("payment")) {
    return ["amount"];
  }

  return [];
}

function getRequiredFieldsForTestCase(item, scripts) {
  const scriptFields = getRequiredFieldsFromScripts(scripts);
  if (scriptFields.length > 0) {
    return {
      fields: scriptFields,
      source: "script",
    };
  }

  const versionFields = getRequiredFieldsFromVariablesSchema(
    item.variablesSchema
  );

  if (versionFields.length > 0) {
    return {
      fields: versionFields,
      source: "variables_schema",
    };
  }

  const textFields = getRequiredFieldsFromText(item);

  if (textFields.length > 0) {
    return {
      fields: textFields,
      source: "heuristic",
    };
  }

  return {
    fields: [],
    source: "unknown",
  };
}

function verifyDatasetCompatibility(requiredFields, datasetFields) {
  const normalizedRequired = uniqueStrings(requiredFields);
  const normalizedDatasetFields = uniqueStrings(datasetFields);

  if (normalizedRequired.length === 0) {
    return {
      status: "needs_review",
      label: "Needs review",
      missingFields: [],
      message: "No required variables were found for this test case.",
    };
  }

  const datasetFieldSet = new Set(
    normalizedDatasetFields.map((field) => field.toLowerCase())
  );

  const missingFields = normalizedRequired.filter(
    (field) => !datasetFieldSet.has(field.toLowerCase())
  );

  if (missingFields.length > 0) {
    return {
      status: "incompatible",
      label: "Not compatible",
      missingFields,
      message: `Missing required field(s): ${missingFields.join(", ")}`,
    };
  }

  return {
    status: "compatible",
    label: "Compatible",
    missingFields: [],
    message: "Dataset contains all required fields.",
  };
}

function mergeDatasets({ projectDatasets, linkedDatasets }) {
  const map = new Map();

  for (const dataset of projectDatasets || []) {
    const id = Number(dataset.datasetId || dataset.id);
    if (!id) continue;

    map.set(id, {
      ...dataset,
      id,
      datasetId: id,
      bindingId: null,
      alias: null,
      isDefault: false,
      isLinked: false,
    });
  }

  for (const dataset of linkedDatasets || []) {
    const id = Number(dataset.datasetId || dataset.id);
    if (!id) continue;

    map.set(id, {
      ...map.get(id),
      ...dataset,
      id,
      datasetId: id,
      isLinked: true,
      isDefault: Boolean(dataset.isDefault),
    });
  }

  return Array.from(map.values());
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

async function getRunOptions(sheetId, userId) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  const items = await repo.findItemsBySheet(sheetId);
  const projectDatasets = await repo.findDatasetsByProject(sheet.projectId);

  const result = [];

  for (const item of items) {
    const [linkedDatasets, scripts] = await Promise.all([
      repo.findDatasetsByTestCase(item.testCaseId),
      repo.findScriptsByTestCase(item.testCaseId),
    ]);

    const required = getRequiredFieldsForTestCase(item, scripts);
    const mergedDatasets = mergeDatasets({
      projectDatasets,
      linkedDatasets,
    });

    result.push({
      testCaseId: item.testCaseId,
      title: item.title,
      goal: item.goal,
      status: item.status,
      itemOrder: item.itemOrder,
      requiredFields: required.fields,
      requiredFieldsSource: required.source,
      availableDatasets: mergedDatasets.map((dataset) => {
        const rows = getDatasetRows(dataset);
        const fields = getDatasetFields(dataset);
        const compatibility = verifyDatasetCompatibility(
          required.fields,
          fields
        );

        const isDefault = Boolean(dataset.isDefault);
        const isLinked = Boolean(dataset.isLinked);

        let verifyStatus = compatibility.status;
        let verifyLabel = compatibility.label;

        if (isDefault && compatibility.status !== "incompatible") {
          verifyStatus = "default";
          verifyLabel = "Default data";
        } else if (isLinked && compatibility.status !== "incompatible") {
          verifyStatus = "linked";
          verifyLabel = "Linked data";
        }

        return {
          id: dataset.datasetId || dataset.id,
          name: dataset.name,
          description: dataset.description,
          alias: dataset.alias,
          isDefault,
          isLinked,
          dataMode: dataset.dataMode,
          rowCount: rows.length,
          fields,
          previewRows: rows.slice(0, 3),
          compatibility: {
            ...compatibility,
            status: verifyStatus,
            label: verifyLabel,
          },
        };
      }),
    });
  }

  return {
    sheetId,
    sheetName: sheet.name,
    items: result,
  };
}

async function assertSelectedDatasetCompatible({ sheet, item, datasetId }) {
  const dataset = await repo.findDatasetById(datasetId);

  if (!dataset) {
    throw { status: 404, message: `Dataset ${datasetId} not found` };
  }

  if (String(dataset.projectId) !== String(sheet.projectId)) {
    throw {
      status: 400,
      message: `Dataset ${datasetId} does not belong to this project`,
    };
  }

  const scripts = await repo.findScriptsByTestCase(item.testCaseId);
  const required = getRequiredFieldsForTestCase(item, scripts);
  const datasetFields = getDatasetFields(dataset);
  const compatibility = verifyDatasetCompatibility(
    required.fields,
    datasetFields
  );

  if (compatibility.status === "incompatible") {
    throw {
      status: 400,
      message: `Dataset "${dataset.name}" is not compatible with test case "${item.title}". ${compatibility.message}`,
      details: {
        testCaseId: item.testCaseId,
        datasetId,
        requiredFields: required.fields,
        datasetFields,
        missingFields: compatibility.missingFields,
      },
    };
  }

  return dataset;
}

async function runSheet(
  sheetId,
  userId,
  { testCaseIds, items: runConfigItems } = {}
) {
  const sheet = await repo.findSheetWithOwner(sheetId, userId);
  if (!sheet) throw { status: 404, message: "Test sheet not found" };

  let items = await repo.findItemsBySheet(sheetId);

  if (items.length === 0) {
    throw { status: 400, message: "Test sheet has no test cases" };
  }

  if (Array.isArray(testCaseIds) && testCaseIds.length > 0) {
    const idSet = new Set(testCaseIds.map(Number));
    items = items.filter((item) => idSet.has(item.testCaseId));

    if (items.length === 0) {
      throw {
        status: 400,
        message: "None of the specified test cases are in this sheet",
      };
    }
  }

  const configByTestCaseId = new Map();

  if (Array.isArray(runConfigItems)) {
    for (const config of runConfigItems) {
      const testCaseId = toInt(config?.testCaseId);
      if (!testCaseId) continue;

      const runMode = config?.runMode === "replay" ? "replay" : "agent";

      configByTestCaseId.set(testCaseId, {
        runMode,
        datasetId: runMode === "agent" ? null : toInt(config?.datasetId),
        executionScriptId:
          runMode === "agent" ? null : toInt(config?.executionScriptId),
        rowIndex:
          config?.rowIndex === null || config?.rowIndex === undefined
            ? null
            : Number(config.rowIndex),
      });
    }
  }

  const expandedRuns = [];

  for (const item of items) {
    const config = configByTestCaseId.get(Number(item.testCaseId)) || {};
    const runMode = config.runMode || "agent";

    const selectedDatasetId = config.datasetId || null;
    const selectedExecutionScriptId = config.executionScriptId || null;
    const selectedRowIndex = config.rowIndex ?? null;

    let selectedDataset = null;

    if (runMode === "replay") {
      if (!selectedExecutionScriptId) {
        throw {
          status: 400,
          message: `Replay script is required for test case "${item.title}".`,
        };
      }

      if (selectedDatasetId) {
        selectedDataset = await assertSelectedDatasetCompatible({
          sheet,
          item,
          datasetId: selectedDatasetId,
        });
      }
    }

    const rowIndexes = getRowsToRun({
      runMode,
      dataset: selectedDataset,
      rowIndex: selectedRowIndex,
    });

    for (const rowIndex of rowIndexes) {
      expandedRuns.push({
        item,
        runMode,
        datasetId: selectedDatasetId,
        executionScriptId: selectedExecutionScriptId,
        rowIndex,
      });
    }
  }

  const sheetRun = await repo.createSheetRun({
    testSuiteId: sheetId,
    triggeredBy: userId,
    totalCases: expandedRuns.length,
  });

  const runItems = [];

  for (let i = 0; i < expandedRuns.length; i += 1) {
    const planned = expandedRuns[i];
    const item = planned.item;

    let testRunId = null;
    let dispatchFailed = false;

    try {
      let runResult;

      if (planned.runMode === "replay") {
        runResult = await agentService.replayAgentRun({
          testCaseId: item.testCaseId,
          executionScriptId: planned.executionScriptId,
          datasetId: planned.datasetId,
          rowIndex: planned.rowIndex,
          triggeredBy: userId,
        });
      } else {
        runResult = await agentService.startAgentRun({
          testCaseId: item.testCaseId,
          triggeredBy: userId,
        });
      }

      testRunId = runResult?.testRunId || null;
    } catch (dispatchErr) {
      dispatchFailed = true;
      console.error(
        `[testSheet] Failed to dispatch test case ${item.testCaseId}:`,
        dispatchErr.message
      );
    }

    const runItem = await repo.createSheetRunItem({
      testSuiteRunId: sheetRun.id,
      testCaseId: item.testCaseId,
      testRunId,
      itemOrder: i + 1,
      initialStatus: dispatchFailed ? "failed" : "queued",
      runMode: planned.runMode,
      datasetId: planned.datasetId,
      executionScriptId: planned.executionScriptId,
      datasetRowIndex: planned.rowIndex,
    });

    runItems.push(runItem);
  }

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
  if (!item) return;

  const itemStatus = status === "completed" ? "completed" : "failed";

  await repo.updateSheetRunItemStatus(item.id, itemStatus);
  await repo.recalcSheetRunSummary(item.testSuiteRunId);
}

async function analyzeSheetRun(runId) {
  const { query } = require("../../config/database");
  const detail = await getSheetRunDetail(runId);
  const run = detail.run;
  const items = detail.items ?? [];

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

  const analysis = await generateSheetRunAnalysis({
    sheetName: run.sheetName || "Test Sheet",
    totalCases: run.totalCases || 0,
    passed: run.passed || 0,
    failed: run.failed || 0,
    errored: run.errored || 0,
    items: itemsWithSteps,
  });

  // Persist so the analysis survives reloads / tab switches.
  await query(
    `UPDATE public.test_suite_runs
        SET ai_analysis = $1::jsonb, ai_analysis_at = now()
      WHERE id = $2`,
    [JSON.stringify(analysis), runId],
  );

  return analysis;
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

  getRunOptions,
  runSheet,
  listSheetRuns,
  getSheetRunDetail,
  onTestRunCompleted,
  analyzeSheetRun,
};