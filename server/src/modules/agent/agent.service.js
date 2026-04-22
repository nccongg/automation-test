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
    llmProvider: row.llm_provider,
    llmModel: row.llm_model,
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
  const bundle = await agentRepository.findTestCaseBundle(
    testCaseId,
    testCaseVersionId,
  );
  if (!bundle) {
    throw new Error("Test case or test case version not found");
  }

  const script =
    await agentRepository.findExecutionScriptById(executionScriptId);
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

  workerPayload.testCase.executionMode = "replay_script";
  workerPayload.testCase.replay = {
    scriptId: script.id,
    strict: true,
    allowLlmFallback: false,
    params: resolvedInput.params || {},
    scriptJson: script.script_json,
  };
  console.log(`[replayAgentRun] testRun=${testRun.id} replay.params:`, JSON.stringify(resolvedInput.params));

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
  columnBindings = null,
  triggeredBy = null,
}) {
  const bundle = await agentRepository.findTestCaseBundle(testCaseId, testCaseVersionId);
  if (!bundle) throw new Error("Test case or test case version not found");

  const script = await agentRepository.findExecutionScriptById(executionScriptId);
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
        // Build per-row params: spread row columns so {{col}} templates resolve,
        // then add _step_N_key = "{{col}}" so worker overrides the hardcoded step text.
        const row = allRows[rowIndex] || {};
        const rowParams = { ...row };
        if (columnBindings && typeof columnBindings === "object") {
          for (const [paramKey, colName] of Object.entries(columnBindings)) {
            if (typeof colName === "string" && colName) {
              rowParams[paramKey] = `{{${colName}}}`;
            }
          }
        }
        console.log(`[batch:${batch.id}] row ${rowIndex} rowParams:`, JSON.stringify(rowParams));

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
  });

  if (payload.screenshotPath) {
    await agentRepository.insertEvidence({
      testRunId: payload.testRunId,
      attemptId: payload.attemptId,
      runStepLogId: stepLog.id,
      evidenceType: "screenshot",
      filePath: payload.screenshotPath,
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

  // Update batch progress if this run belongs to a batch
  try {
    const run = updatedRun || await agentRepository.findRunById(payload.testRunId);
    if (run && run.batch_id) {
      const batch = await agentRepository.findTestRunBatchById(run.batch_id);
      if (batch) {
        const isPassed = payload.verdict === "pass";
        await agentRepository.updateTestRunBatchProgress({
          batchId: batch.id,
          completedRows: batch.completed_rows + 1,
          passedRows: batch.passed_rows + (isPassed ? 1 : 0),
          failedRows: batch.failed_rows + (isPassed ? 0 : 1),
        });
      }
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

module.exports = {
  startAgentRun,
  replayAgentRun,
  startBatchReplayRun,
  parameterizeExecutionScript,
  handleStepCallback,
  handleFinalCallback,
  startWorkerRun,
};