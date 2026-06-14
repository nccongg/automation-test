"use strict";

const agentRepository = require("./agent.repository");
const env = require("../../config/env");

const AGENT_WORKER_BASE_URL = env.AGENT_WORKER_BASE_URL;

const SUPPORTED_WORKER_EXECUTION_MODES = new Set([
  "goal_based_agent",
  "replay_script",
]);

const INPUT_ACTIONS = new Set([
  "input",
  "fill",
  "type",
  "input_text",
  "enter_text",
]);

const SENSITIVE_KEY_RE =
  /password|passwd|pwd|secret|token|api[_-]?key|cookie|otp|username|user|email|phone|account|login/i;

function resolveAgentPrompt(bundle) {
  return (
    bundle.display_text?.trim() ||
    bundle.prompt_text?.trim() ||
    bundle.goal?.trim() ||
    null
  );
}

function isTemplatePlaceholder(value) {
  return (
    typeof value === "string" &&
    /^\s*\{\{[^}]+\}\}\s*$/.test(value)
  );
}

const PASSWORD_HINT_RE = /password|passwd|pwd|secret|pin|otp/i;

function isPasswordStep(obj) {
  if (!obj || typeof obj !== "object") return false;
  const hints = [obj.placeholder, obj.axName, obj.nameAttr, obj.id, obj.name];
  return hints.some((h) => typeof h === "string" && PASSWORD_HINT_RE.test(h));
}

function deepSanitize(value, { preserveTemplates = false, sensitiveContext = false } = {}) {
  if (Array.isArray(value)) {
    return value.map((item) =>
      deepSanitize(item, { preserveTemplates, sensitiveContext }),
    );
  }

  if (!value || typeof value !== "object") {
    if (preserveTemplates && isTemplatePlaceholder(value)) {
      return value;
    }
    return value;
  }

  const isSensitive = sensitiveContext || isPasswordStep(value);

  const result = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      if (preserveTemplates && isTemplatePlaceholder(val)) {
        result[key] = val;
      } else {
        result[key] = "[REDACTED]";
      }
      continue;
    }

    // Only redact `text` when this step is a password/sensitive input
    if (key === "text" && typeof val === "string" && isSensitive) {
      if (preserveTemplates && isTemplatePlaceholder(val)) {
        result[key] = val;
      } else {
        result[key] = "[REDACTED]";
      }
      continue;
    }

    result[key] = deepSanitize(val, { preserveTemplates, sensitiveContext: isSensitive });
  }
  return result;
}

function sanitizeStepJsonByAction(action, payload) {
  if (!payload) return payload;
  const actionName = String(action || "")
    .toLowerCase()
    .trim();

  if (INPUT_ACTIONS.has(actionName)) {
    return deepSanitize(payload);
  }

  return deepSanitize(payload);
}

function sanitizeFreeText(text) {
  if (typeof text !== "string" || !text.trim()) return text;
  return text
    .replace(/(password|pwd)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(
      /(username|user|email|account)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    );
}

function sanitizeRecordedScript(scriptJson) {
  if (!scriptJson || typeof scriptJson !== "object") return scriptJson;

  return {
    ...scriptJson,
    steps: Array.isArray(scriptJson.steps)
      ? scriptJson.steps.map((step) => ({
          ...step,
          actionInput: deepSanitize(step?.actionInput, {
            preserveTemplates: true,
          }),
        }))
      : [],
  };
}

async function postToWorkerRun(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${AGENT_WORKER_BASE_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Worker /run failed: ${response.status} ${text}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function mapRuntimeConfig(row) {
  return {
    id: row.id,
    llmProvider: process.env.EXECUTION_LLM_PROVIDER || row.llm_provider,
    llmModel: process.env.EXECUTION_LLM_MODEL || row.llm_model,
    maxSteps: row.max_steps,
    timeoutSeconds: row.timeout_seconds,
    useVision: row.use_vision,
    headless: row.headless,
    browserType: row.browser_type,
    allowedDomains: row.allowed_domains || [],
    viewport: row.viewport_json || null,
    locale: row.locale || null,
    timezone: row.timezone || null,
    extraConfig: row.extra_config_json || {},
  };
}

function mapBrowserProfile(row) {
  if (!row) return null;

  const profileData = row.profile_data || {};

  return {
    id: row.id,
    provider: row.provider,
    profileType: row.profile_type,
    profileRef: row.profile_ref || null,
    profileDirectory:
      row.profile_type === "system_chrome"
        ? row.profile_ref || profileData.profileDirectory || null
        : null,
    profileData,
  };
}

function assertSupportedExecutionMode(executionMode) {
  const normalized =
    executionMode === "step_based" ? "goal_based_agent" : executionMode;

  if (!SUPPORTED_WORKER_EXECUTION_MODES.has(normalized)) {
    throw new Error(
      `Unsupported executionMode for current Python worker: ${executionMode}. ` +
        `Only goal_based_agent and replay_script are currently supported.`,
    );
  }

  return normalized;
}

function assertRuntimeConfigBelongsToProject(runtimeConfig, projectId) {
  if (!runtimeConfig) {
    throw new Error("Runtime config not found");
  }

  if (runtimeConfig.project_id !== projectId) {
    throw new Error(
      "Runtime config does not belong to the same project as the test case",
    );
  }
}

function assertBrowserProfileBelongsToProject(browserProfile, projectId) {
  if (!browserProfile) return;

  if (browserProfile.project_id !== projectId) {
    throw new Error(
      "Browser profile does not belong to the same project as the test case",
    );
  }
}

function assertExecutionScriptMatchesTestCase(script, bundle) {
  if (!script) {
    throw new Error("Execution script not found");
  }

  if (script.test_case_id !== bundle.test_case_id) {
    throw new Error(
      "Execution script does not belong to the provided test case",
    );
  }

  if (
    script.test_case_version_id &&
    script.test_case_version_id !== bundle.test_case_version_id
  ) {
    throw new Error(
      "Execution script does not belong to the provided test case version",
    );
  }
}

function buildBaseRunPayload({
  testRun,
  attempt,
  bundle,
  runtimeConfig,
  browserProfile,
  inputData = null,
}) {
  const agentPrompt = resolveAgentPrompt(bundle);
  const normalizedExecutionMode = assertSupportedExecutionMode(
    bundle.execution_mode,
  );

  return {
    testRunId: testRun.id,
    attemptId: attempt.id,
    attemptNo: attempt.attempt_no,
    project: {
      id: bundle.project_id,
      baseUrl: bundle.base_url,
    },
    testCase: {
      id: bundle.test_case_id,
      title: bundle.title,
      goal: bundle.goal,
      executionMode: normalizedExecutionMode,
      promptText: agentPrompt,
      planSnapshot: bundle.plan_snapshot,
    },
    runtimeConfig: mapRuntimeConfig(runtimeConfig),
    browserProfile: mapBrowserProfile(browserProfile),
    inputData,
  };
}

async function markRunAndAttemptAsWorkerDispatchFailed({
  testRunId,
  attemptId,
  error,
}) {
  const errorMessage = error?.message || "Failed to dispatch run to worker";

  await agentRepository.updateAttemptFinal({
    attemptId,
    status: "failed",
    verdict: "error",
    finalResult: null,
    structuredOutput: null,
    errorMessage,
  });

  await agentRepository.updateRunFinal({
    testRunId,
    status: "failed",
    verdict: "error",
    executionLog: {
      mode: "dispatch_to_worker",
      dispatchStatus: "failed",
    },
    evidenceSummary: null,
    errorMessage,
  });
}

function normalizeDatasetParams(row) {
  if (!row || typeof row !== "object") return {};
  return { ...row };
}

async function resolveRunDatasetInput({
  testCaseId,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  paramsOverride = {},
}) {
  let binding = null;

  if (datasetId || datasetAlias) {
    binding = await agentRepository.findDatasetBindingForTestCase({
      testCaseId,
      datasetId,
      alias: datasetAlias,
    });
  } else {
    binding = await agentRepository.findDefaultDatasetBindingForTestCase(
      testCaseId,
    );
  }

  if (!binding) {
    return {
      datasetId: null,
      alias: datasetAlias || null,
      rowIndex: rowIndex ?? null,
      rowKey: rowKey ?? null,
      datasetSnapshot: Object.keys(paramsOverride || {}).length
        ? paramsOverride
        : null,
      params: { ...(paramsOverride || {}) },
    };
  }

  const dataset = await agentRepository.findDatasetById(binding.dataset_id);
  if (!dataset) {
    throw new Error("Dataset not found");
  }

  const resolvedRow = await agentRepository.resolveDatasetRow({
    dataset,
    rowIndex,
    rowKey,
  });

  const datasetSnapshot = normalizeDatasetParams(resolvedRow?.data || {});
  const mergedParams = {
    ...datasetSnapshot,
    ...(paramsOverride || {}),
  };

  return {
    datasetId: binding.dataset_id,
    alias: binding.alias || datasetAlias || null,
    rowIndex:
      resolvedRow?.rowIndex !== undefined && resolvedRow?.rowIndex !== null
        ? resolvedRow.rowIndex
        : rowIndex,
    rowKey:
      resolvedRow?.rowKey !== undefined && resolvedRow?.rowKey !== null
        ? resolvedRow.rowKey
        : rowKey,
    datasetSnapshot,
    params: mergedParams,
  };
}

async function persistRunDatasetBinding({
  testRunId,
  attemptId,
  resolvedInput,
}) {
  if (!resolvedInput) return null;

  if (
    !resolvedInput.datasetId &&
    !resolvedInput.alias &&
    !resolvedInput.datasetSnapshot
  ) {
    return null;
  }

  return agentRepository.insertTestRunDatasetBinding({
    testRunId,
    testRunAttemptId: attemptId,
    datasetId: resolvedInput.datasetId || null,
    alias: resolvedInput.alias || null,
    rowIndex:
      resolvedInput.rowIndex !== undefined ? resolvedInput.rowIndex : null,
    rowKey:
      resolvedInput.rowKey !== undefined ? resolvedInput.rowKey : null,
    datasetSnapshot: resolvedInput.datasetSnapshot || {},
  });
}

async function startAgentRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  paramsOverride = {},
  triggeredBy = null,
}) {
  const bundle = await agentRepository.findTestCaseBundle(
    testCaseId,
    testCaseVersionId,
  );
  if (!bundle) {
    throw new Error("Test case or test case version not found");
  }

  assertSupportedExecutionMode(bundle.execution_mode);

  const resolvedRuntimeConfigId = runtimeConfigId || bundle.runtime_config_id;
  if (!resolvedRuntimeConfigId) {
    throw new Error(
      "runtimeConfigId is required because this test case version has no runtime_config_id",
    );
  }

  const runtimeConfig = await agentRepository.findRuntimeConfigById(
    resolvedRuntimeConfigId,
  );
  assertRuntimeConfigBelongsToProject(runtimeConfig, bundle.project_id);

  const browserProfile = browserProfileId
    ? await agentRepository.findBrowserProfileById(browserProfileId)
    : null;

  assertBrowserProfileBelongsToProject(browserProfile, bundle.project_id);

  const testRun = await agentRepository.createTestRun({
    testCaseId: bundle.test_case_id,
    testCaseVersionId: bundle.test_case_version_id,
    triggeredBy,
    status: "running",
  });

  const attempt = await agentRepository.createTestRunAttempt({
    testRunId: testRun.id,
    attemptNo: 1,
    status: "running",
    triggerType: "initial",
    runtimeConfigSnapshot: mapRuntimeConfig(runtimeConfig),
    browserProfileSnapshot: mapBrowserProfile(browserProfile),
    agentPrompt: resolveAgentPrompt(bundle),
  });

  const resolvedInput = await resolveRunDatasetInput({
    testCaseId: bundle.test_case_id,
    datasetId,
    datasetAlias,
    rowIndex,
    rowKey,
    paramsOverride,
  });

  await persistRunDatasetBinding({
    testRunId: testRun.id,
    attemptId: attempt.id,
    resolvedInput,
  });

  const workerPayload = buildBaseRunPayload({
    testRun,
    attempt,
    bundle,
    runtimeConfig,
    browserProfile,
    inputData: {
      datasetId: resolvedInput.datasetId,
      alias: resolvedInput.alias,
      rowIndex: resolvedInput.rowIndex,
      rowKey: resolvedInput.rowKey,
    },
  });

  if (Object.keys(resolvedInput.params || {}).length > 0) {
    workerPayload.testCase.inputParams = resolvedInput.params;
  }

  try {
    await postToWorkerRun(workerPayload);
  } catch (error) {
    await markRunAndAttemptAsWorkerDispatchFailed({
      testRunId: testRun.id,
      attemptId: attempt.id,
      error,
    });
    throw error;
  }

  return {
    accepted: true,
    testRunId: testRun.id,
    attemptId: attempt.id,
    workerPayload,
  };
}

function substituteRedactedValues(steps, params) {
  if (!params || !Array.isArray(steps)) return steps;
  const inputActions = new Set(["fill", "type", "input_text", "enter_text", "input"]);
  return steps.map((step) => {
    if (!inputActions.has(String(step.actionName || "").toLowerCase())) return step;
    const sno = step.stepNo ?? 0;
    const newInput = { ...(step.actionInput || {}) };
    let changed = false;
    for (const [key, val] of Object.entries(newInput)) {
      if (val === "[REDACTED]") {
        const replacement = params[`__r${sno}_${key}`];
        if (replacement !== undefined && replacement !== "") {
          newInput[key] = String(replacement);
          changed = true;
        }
      }
    }
    return changed ? { ...step, actionInput: newInput } : step;
  });
}

async function resolveObjectRefs(projectId, steps) {
  if (!Array.isArray(steps) || !steps.length) return steps;

  // Collect all objectRefs from steps
  const refs = steps
    .filter((s) => s.objectRef?.name)
    .map((s) => ({ pageKey: s.objectRef.pageKey || "", name: s.objectRef.name }));

  if (!refs.length) return steps;

  const objRepo = require("../objectRepository/objectRepository.repository");
  const objMap = await objRepo.findObjectsByRefs(projectId, refs);

  return steps.map((step) => {
    if (!step.objectRef?.name) return step;

    const key = `${step.objectRef.pageKey || ""}||${step.objectRef.name}`;
    const obj = objMap[key];
    if (!obj) return step;

    // Inject latest locators from test_objects, overwriting baked-in values
    return {
      ...step,
      actionInput: {
        ...step.actionInput,
        _selectorCollection: obj.selectorCollection,
        _primarySelector:    obj.selectorMethod,
      },
    };
  });
}

async function replayAgentRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  executionScriptId,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  params = {},
  triggeredBy = null,
}) {
  const script =
    await agentRepository.findExecutionScriptById(executionScriptId);
  if (!script) throw new Error("Execution script not found");

  const resolvedVersionId =
    script.test_case_version_id ?? testCaseVersionId ?? null;

  const bundle = await agentRepository.findTestCaseBundle(
    testCaseId,
    resolvedVersionId,
  );
  if (!bundle) {
    throw new Error("Test case or test case version not found");
  }

  assertExecutionScriptMatchesTestCase(script, bundle);

  const resolvedRuntimeConfigId = runtimeConfigId || bundle.runtime_config_id;
  if (!resolvedRuntimeConfigId) {
    throw new Error("runtimeConfigId is required for replay");
  }

  const runtimeConfig = await agentRepository.findRuntimeConfigById(
    resolvedRuntimeConfigId,
  );
  assertRuntimeConfigBelongsToProject(runtimeConfig, bundle.project_id);

  const browserProfile = browserProfileId
    ? await agentRepository.findBrowserProfileById(browserProfileId)
    : null;

  assertBrowserProfileBelongsToProject(browserProfile, bundle.project_id);

  const testRun = await agentRepository.createTestRun({
    testCaseId: bundle.test_case_id,
    testCaseVersionId: bundle.test_case_version_id,
    triggeredBy,
    status: "running",
  });

  const attempt = await agentRepository.createTestRunAttempt({
    testRunId: testRun.id,
    attemptNo: 1,
    status: "running",
    triggerType: "manual_replay",
    runtimeConfigSnapshot: mapRuntimeConfig(runtimeConfig),
    browserProfileSnapshot: mapBrowserProfile(browserProfile),
    agentPrompt: `Replay execution script #${script.id}`,
  });

  const resolvedInput = await resolveRunDatasetInput({
    testCaseId: bundle.test_case_id,
    datasetId,
    datasetAlias,
    rowIndex,
    rowKey,
    paramsOverride: params,
  });

  await persistRunDatasetBinding({
    testRunId: testRun.id,
    attemptId: attempt.id,
    resolvedInput,
  });

  const workerPayload = buildBaseRunPayload({
    testRun,
    attempt,
    bundle,
    runtimeConfig,
    browserProfile,
    inputData: {
      datasetId: resolvedInput.datasetId,
      alias: resolvedInput.alias,
      rowIndex: resolvedInput.rowIndex,
      rowKey: resolvedInput.rowKey,
    },
  });

  const patchedSteps = substituteRedactedValues(
    script.script_json?.steps ?? [],
    resolvedInput.params,
  );
  const workerParams = Object.fromEntries(
    Object.entries(resolvedInput.params || {}).filter(([k]) => !k.startsWith("__r")),
  );

  // Resolve objectRefs → inject fresh locators from test_objects before sending to worker
  const resolvedSteps = await resolveObjectRefs(bundle.project_id, patchedSteps);

  workerPayload.testCase.executionMode = "replay_script";
  workerPayload.testCase.replay = {
    scriptId: script.id,
    strict: true,
    allowLlmFallback: false,
    params: workerParams,
    scriptJson: { ...script.script_json, steps: resolvedSteps },
  };
  try {
    await postToWorkerRun(workerPayload);
  } catch (error) {
    await markRunAndAttemptAsWorkerDispatchFailed({
      testRunId: testRun.id,
      attemptId: attempt.id,
      error,
    });
    throw error;
  }

  return {
    accepted: true,
    testRunId: testRun.id,
    attemptId: attempt.id,
    workerPayload,
  };
}

async function startBatchReplayRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  executionScriptId,
  datasetId,
  rowIndexes = null,
  variableMapping = null,
  triggeredBy = null,
}) {
  const script = await agentRepository.findExecutionScriptById(executionScriptId);
  if (!script) throw new Error("Execution script not found");

  // Use the script's own version first — client-provided version may point to a newer
  // version that doesn't match the script, causing a false mismatch error.
  const resolvedVersionId =
    script.test_case_version_id ?? testCaseVersionId ?? null;

  const bundle = await agentRepository.findTestCaseBundle(testCaseId, resolvedVersionId);
  if (!bundle) throw new Error("Test case or test case version not found");

  assertExecutionScriptMatchesTestCase(script, bundle);

  const dataset = await agentRepository.findDatasetById(datasetId);
  if (!dataset) throw new Error("Dataset not found");

  const allRows = Array.isArray(dataset.data_json) ? dataset.data_json : [];
  const targetIndexes = rowIndexes
    ? rowIndexes.filter((i) => i >= 0 && i < allRows.length)
    : allRows.map((_, i) => i);

  if (targetIndexes.length === 0) throw new Error("No rows to run in dataset");

  const batch = await agentRepository.createTestRunBatch({
    projectId: bundle.project_id,
    testCaseId: bundle.test_case_id,
    datasetId,
    executionScriptId,
    totalRows: targetIndexes.length,
    triggeredBy,
  });

  // Fire-and-forget: run each row sequentially without blocking the HTTP response
  (async () => {
    for (const rowIndex of targetIndexes) {
      try {
        const row = allRows[rowIndex] || {};
        // Spread entire row first (exact name match), then apply explicit mappings
        const rowParams = { ...row };
        if (variableMapping && typeof variableMapping === "object") {
          for (const [scriptVar, colName] of Object.entries(variableMapping)) {
            if (typeof colName === "string" && Object.prototype.hasOwnProperty.call(row, colName)) {
              rowParams[scriptVar] = row[colName];
              // Remove the source column if it was remapped to a different variable name
              if (colName !== scriptVar) delete rowParams[colName];
            }
          }
        }
        const result = await replayAgentRun({
          testCaseId,
          testCaseVersionId,
          runtimeConfigId,
          browserProfileId,
          executionScriptId,
          datasetId,
          rowIndex,
          params: rowParams,
          triggeredBy,
        });
        await agentRepository.setTestRunBatchId({ testRunId: result.testRunId, batchId: batch.id });
      } catch (err) {
        console.error(`[batch:${batch.id}] row ${rowIndex} dispatch failed:`, err.message);
      }
    }
  })();

  return { batchId: batch.id, totalRows: targetIndexes.length };
}

async function handleStepCallback(payload) {
  const sanitizedAction = payload.action || payload.stepTitle;

  const stepLog = await agentRepository.insertOrUpdateRunStepLog({
    testRunId: payload.testRunId,
    attemptId: payload.attemptId,
    stepNo: payload.stepNo,
    stepTitle: payload.stepTitle,
    action: payload.action,
    status: payload.status,
    message: sanitizeFreeText(payload.message),
    currentUrl: payload.currentUrl || null,
    thoughtText: null,
    extractedContent: sanitizeFreeText(payload.extractedContent || null),
    actionInputJson: sanitizeStepJsonByAction(
      sanitizedAction,
      payload.actionInputJson || null,
    ),
    actionOutputJson: sanitizeStepJsonByAction(
      sanitizedAction,
      payload.actionOutputJson || null,
    ),
    modelOutputJson: sanitizeStepJsonByAction(
      sanitizedAction,
      payload.modelOutputJson || null,
    ),
    durationMs: payload.durationMs || null,
    failureReason: payload.failureReason || null,
    anchorResults: payload.anchorResults || null,
  });

  if (payload.screenshotPath || payload.screenshotData) {
    const fileData = payload.screenshotData
      ? Buffer.from(payload.screenshotData, "base64")
      : null;

    await agentRepository.insertEvidence({
      testRunId: payload.testRunId,
      attemptId: payload.attemptId,
      runStepLogId: stepLog.id,
      evidenceType: "screenshot",
      filePath: payload.screenshotPath,
      fileData,
      mimeType: fileData ? payload.screenshotMimeType || "image/png" : null,
      fileSizeBytes: fileData ? fileData.length : null,
      pageUrl: payload.currentUrl || null,
      artifactGroup: "step",
      capturedAt: new Date(),
    });
  }

  return stepLog;
}

async function handleFinalCallback(payload) {
  const updatedAttempt = await agentRepository.updateAttemptFinal({
    attemptId: payload.attemptId,
    status: payload.status,
    verdict: payload.verdict,
    finalResult: sanitizeFreeText(payload.finalResult || null),
    structuredOutput: deepSanitize(payload.structuredOutput || null),
    errorMessage: sanitizeFreeText(payload.errorMessage || null),
  });

  const updatedRun = await agentRepository.updateRunFinal({
    testRunId: payload.testRunId,
    status: payload.status,
    verdict: payload.verdict,
    executionLog: deepSanitize(payload.executionLog || null),
    evidenceSummary: deepSanitize(payload.evidenceSummary || null),
    errorMessage: sanitizeFreeText(payload.errorMessage || null),
  });

  try {
    const testSheetService = require("../testSheet/testSheet.service");
    await testSheetService.onTestRunCompleted(
      payload.testRunId,
      payload.verdict,
      payload.status,
    );
  } catch (sheetErr) {
    console.error("[agent] Failed to update sheet run summary:", sheetErr.message);
  }

  if (payload.recordedScript && payload.recordedScript.scriptJson) {
    const run = await agentRepository.findRunById(payload.testRunId);

    if (run) {
      await agentRepository.insertExecutionScript({
        testCaseId: run.test_case_id,
        testCaseVersionId: run.test_case_version_id,
        sourceTestRunId: payload.testRunId,
        sourceAttemptId: payload.attemptId,
        scriptType: payload.recordedScript.scriptType,
        scriptJson: sanitizeRecordedScript(payload.recordedScript.scriptJson),
        paramsSchema: payload.recordedScript.paramsSchema || {},
        metadataJson: {
          createdFrom: "agent_final_callback",
          sanitized: true,
        },
      });
    }
  }

  // Upsert auto-detected test objects from agent run
  if (Array.isArray(payload.testObjects) && payload.testObjects.length > 0) {
    try {
      const run = await agentRepository.findRunById(payload.testRunId);
      const projectId = run?.projectId ?? run?.project_id;
      if (projectId) {
        const objRepo = require("../objectRepository/objectRepository.repository");
        await objRepo.upsertObjects(projectId, payload.testObjects);
        console.log(`[agent] Upserted ${payload.testObjects.length} test objects for project ${projectId}`);
      } else {
        console.warn("[agent] Cannot upsert test objects — projectId not found for run", payload.testRunId);
      }
    } catch (objErr) {
      console.error("[agent] Failed to upsert test objects (non-fatal):", objErr.message);
    }
  }

  // Update batch progress if this run belongs to a batch
  try {
    const run = updatedRun || await agentRepository.findRunById(payload.testRunId);
    if (run && run.batch_id) {
      await agentRepository.incrementTestRunBatchProgress({
        batchId: run.batch_id,
        isPassed: payload.verdict === "pass" || payload.verdict === "pass_with_warning",
      });
    }
  } catch (batchErr) {
    console.error("[agent] Failed to update batch progress:", batchErr.message);
  }

  return {
    attempt: updatedAttempt,
    run: updatedRun,
  };
}

async function startWorkerRun(payload) {
  return postToWorkerRun(payload);
}

async function postToWorkerInspect(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${AGENT_WORKER_BASE_URL}/fast-forward-inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Worker /fast-forward-inspect failed: ${response.status} ${text}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fastForwardInspect({ scriptId, targetStepIndex, params = {}, executeTargetStep = false }) {
  const script = await agentRepository.findExecutionScriptById(scriptId);
  if (!script) throw { status: 404, message: "Script not found" };

  const steps = script.script_json?.steps ?? [];
  if (targetStepIndex < 0 || targetStepIndex > steps.length) {
    throw { status: 400, message: `targetStepIndex ${targetStepIndex} out of range [0, ${steps.length}]` };
  }

  return postToWorkerInspect({ steps, targetStepIndex, params, executeTargetStep });
}

async function suggestStepFix({ scriptId, targetStepIndex, params = {} }) {
  const script = await agentRepository.findExecutionScriptById(scriptId);
  if (!script) throw { status: 404, message: "Script not found" };

  const steps = script.script_json?.steps ?? [];
  const failingStep = steps[targetStepIndex];
  if (!failingStep) throw { status: 400, message: `No step at index ${targetStepIndex}` };

  const inspectResult = await postToWorkerInspect({ steps, targetStepIndex, params, executeTargetStep: false });

  const elementsText = (inspectResult.interactiveElements || [])
    .slice(0, 30)
    .map((el, i) => {
      const attrs = [
        el.id ? `id="${el.id}"` : null,
        el.name ? `name="${el.name}"` : null,
        el.placeholder ? `placeholder="${el.placeholder}"` : null,
        el.ariaLabel ? `aria-label="${el.ariaLabel}"` : null,
        el.title ? `title="${el.title}"` : null,
        el.type ? `type="${el.type}"` : null,
      ].filter(Boolean).join(" ");
      return `${i + 1}. <${el.tag}${attrs ? " " + attrs : ""}> "${el.text || ""}"`;
    })
    .join("\n");

  const llmService = require("../llm/llm.service");
  const messages = [
    {
      role: "system",
      content: `You are a Playwright test repair assistant. Given a failing automation step and the interactive elements visible on the page, suggest a corrected actionInput.

Return ONLY a JSON object — no explanation, no markdown:
{
  "actionInput": { corrected locator/value fields },
  "reasoning": "one sentence explaining why",
  "confidence": 0.0-1.0
}

Locator preference order (use the most stable available):
1. placeholder — for input fields
2. axName / ariaLabel — for buttons, links
3. nameAttr / name — for form controls
4. title — for elements with explicit titles
5. selector (CSS) — last resort`,
    },
    {
      role: "user",
      content: `Current URL: ${inspectResult.currentUrl || "unknown"}

Failing step:
  actionName: ${failingStep.actionName}
  actionInput: ${JSON.stringify(failingStep.actionInput, null, 2)}

Interactive elements on the page right now:
${elementsText || "(none found — page may not have loaded)"}

Suggest a corrected actionInput for the failing step.`,
    },
  ];

  let suggestion = { actionInput: null, reasoning: "LLM unavailable", confidence: 0 };
  try {
    const rawText = await llmService.generateFromLLM(messages, {
      provider: process.env.GEMINI_API_KEY ? "gemini" : undefined,
      model: process.env.GEMINI_API_KEY ? "gemini-2.0-flash" : undefined,
      maxOutputTokens: 512,
      temperature: 0.1,
    });
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      suggestion = {
        actionInput: parsed.actionInput || null,
        reasoning: parsed.reasoning || "",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      };
    }
  } catch (err) {
    console.error("[suggestStepFix] LLM call failed:", err.message);
    suggestion.reasoning = `AI unavailable: ${err.message}`;
  }

  return {
    screenshotBase64: inspectResult.screenshotBase64,
    currentUrl: inspectResult.currentUrl,
    interactiveElements: inspectResult.interactiveElements || [],
    failingStep: deepSanitize(failingStep),
    suggestion,
    inspectOk: inspectResult.ok,
    inspectError: inspectResult.errorMessage || null,
  };
}

const VALID_VAR_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

async function parameterizeExecutionScript({ scriptId, steps, userId }) {
  if (!scriptId) throw { status: 400, message: "scriptId is required" };
  if (!Array.isArray(steps)) throw { status: 400, message: "steps must be an array" };

  const script = await agentRepository.findExecutionScriptById(scriptId);
  if (!script) throw { status: 404, message: "Execution script not found" };

  // Validate that any {{var}} used in steps follow safe naming convention
  const vars = agentRepository.extractTemplateVariables(steps);
  const invalid = vars.filter((v) => !VALID_VAR_RE.test(v));
  if (invalid.length) {
    throw { status: 400, message: `Invalid variable names: ${invalid.join(", ")}. Use letters, digits and underscore only.` };
  }

  const updated = await agentRepository.updateExecutionScriptSteps({ id: scriptId, steps });
  if (!updated) throw { status: 404, message: "Execution script not found" };

  return {
    id: updated.id,
    steps: updated.script_json?.steps ?? steps,
    templateVariables: updated.metadata_json?.templateVariables ?? vars,
  };
}

async function deleteExecutionScript({ scriptId }) {
  const script = await agentRepository.findExecutionScriptById(scriptId);
  if (!script) throw { status: 404, message: "Execution script not found" };
  const deleted = await agentRepository.deactivateExecutionScript(scriptId);
  if (!deleted) throw { status: 404, message: "Execution script not found" };
  return { id: deleted.id };
}

module.exports = {
  startAgentRun,
  replayAgentRun,
  startBatchReplayRun,
  parameterizeExecutionScript,
  deleteExecutionScript,
  fastForwardInspect,
  suggestStepFix,
  handleStepCallback,
  handleFinalCallback,
  startWorkerRun,
};