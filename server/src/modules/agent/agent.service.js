const agentRepository = require("./agent.repository");
const env = require("../../config/env");

const AGENT_WORKER_BASE_URL = env.AGENT_WORKER_BASE_URL;

async function postToWorkerRun(payload) {
  const response = await fetch(`${AGENT_WORKER_BASE_URL}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Worker /run failed: ${response.status} ${text}`);
  }

  return response.json();
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

  return {
    id: row.id,
    provider: row.provider,
    profileType: row.profile_type,
    profileRef: row.profile_ref,
    profileData: row.profile_data || {},
  };
}

function buildBaseRunPayload({ testRun, attempt, bundle, runtimeConfig, browserProfile }) {
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
      executionMode: bundle.execution_mode,
      promptText: bundle.prompt_text,
      planSnapshot: bundle.plan_snapshot,
    },
    runtimeConfig: mapRuntimeConfig(runtimeConfig),
    browserProfile: mapBrowserProfile(browserProfile),
  };
}

async function startAgentRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  triggeredBy = null,
}) {
  const bundle = await agentRepository.findTestCaseBundle(testCaseId, testCaseVersionId);
  if (!bundle) {
    throw new Error("Test case or test case version not found");
  }

  const resolvedRuntimeConfigId = runtimeConfigId || bundle.runtime_config_id;
  if (!resolvedRuntimeConfigId) {
    throw new Error("runtimeConfigId is required because this test case version has no runtime_config_id");
  }

  const runtimeConfig = await agentRepository.findRuntimeConfigById(resolvedRuntimeConfigId);
  if (!runtimeConfig) {
    throw new Error("Runtime config not found");
  }

  const browserProfile = browserProfileId
    ? await agentRepository.findBrowserProfileById(browserProfileId)
    : null;

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
    agentPrompt: bundle.prompt_text || bundle.goal,
  });

  const workerPayload = buildBaseRunPayload({
    testRun,
    attempt,
    bundle,
    runtimeConfig,
    browserProfile,
  });

  await postToWorkerRun(workerPayload);

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
  params = {},
  triggeredBy = null,
}) {
  const bundle = await agentRepository.findTestCaseBundle(testCaseId, testCaseVersionId);
  if (!bundle) {
    throw new Error("Test case or test case version not found");
  }

  const script = await agentRepository.findExecutionScriptById(executionScriptId);
  if (!script) {
    throw new Error("Execution script not found");
  }

  const resolvedRuntimeConfigId = runtimeConfigId || bundle.runtime_config_id;
  if (!resolvedRuntimeConfigId) {
    throw new Error("runtimeConfigId is required for replay");
  }

  const runtimeConfig = await agentRepository.findRuntimeConfigById(resolvedRuntimeConfigId);
  if (!runtimeConfig) {
    throw new Error("Runtime config not found");
  }

  const browserProfile = browserProfileId
    ? await agentRepository.findBrowserProfileById(browserProfileId)
    : null;

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

  const workerPayload = buildBaseRunPayload({
    testRun,
    attempt,
    bundle,
    runtimeConfig,
    browserProfile,
  });

  workerPayload.testCase.executionMode = "replay_script";
  workerPayload.testCase.replay = {
    scriptId: script.id,
    strict: true,
    allowLlmFallback: false,
    params,
    scriptJson: script.script_json,
  };

  await postToWorkerRun(workerPayload);

  return {
    accepted: true,
    testRunId: testRun.id,
    attemptId: attempt.id,
    workerPayload,
  };
}

async function handleStepCallback(payload) {
  const stepLog = await agentRepository.insertRunStepLog({
    testRunId: payload.testRunId,
    attemptId: payload.attemptId,
    stepNo: payload.stepNo,
    stepTitle: payload.stepTitle,
    action: payload.action,
    status: payload.status,
    message: payload.message,
    currentUrl: payload.currentUrl || null,
    thoughtText: payload.thoughtText || null,
    extractedContent: payload.extractedContent || null,
    actionInputJson: payload.actionInputJson || null,
    actionOutputJson: payload.actionOutputJson || null,
    modelOutputJson: payload.modelOutputJson || null,
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
    finalResult: payload.finalResult || null,
    structuredOutput: payload.structuredOutput || null,
    errorMessage: payload.errorMessage || null,
  });

  const updatedRun = await agentRepository.updateRunFinal({
    testRunId: payload.testRunId,
    status: payload.status,
    verdict: payload.verdict,
    executionLog: payload.executionLog || null,
    evidenceSummary: payload.evidenceSummary || null,
    errorMessage: payload.errorMessage || null,
  });

  if (payload.recordedScript && payload.recordedScript.scriptJson) {
    const run = await agentRepository.findRunById(payload.testRunId);

    if (run) {
      await agentRepository.insertExecutionScript({
        testCaseId: run.test_case_id,
        testCaseVersionId: run.test_case_version_id,
        sourceTestRunId: payload.testRunId,
        sourceAttemptId: payload.attemptId,
        scriptType: payload.recordedScript.scriptType,
        scriptJson: payload.recordedScript.scriptJson,
        paramsSchema: payload.recordedScript.paramsSchema || {},
        metadataJson: {
          createdFrom: "agent_final_callback",
        },
      });
    }
  }

  return {
    attempt: updatedAttempt,
    run: updatedRun,
  };
}

async function startWorkerRun(payload) {
  return postToWorkerRun(payload);
}

module.exports = {
  startAgentRun,
  replayAgentRun,
  handleStepCallback,
  handleFinalCallback,
  startWorkerRun,
};