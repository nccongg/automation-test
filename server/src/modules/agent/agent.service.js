'use strict';

const agentRepository = require('./agent.repository');
const env = require('../../config/env');

const AGENT_WORKER_BASE_URL = env.AGENT_WORKER_BASE_URL;

const SUPPORTED_WORKER_EXECUTION_MODES = new Set([
  'goal_based_agent',
  'replay_script',
]);

async function postToWorkerRun(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${AGENT_WORKER_BASE_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      row.profile_type === 'system_chrome'
        ? (row.profile_ref || profileData.profileDirectory || null)
        : null,
    profileData,
  };
}

function assertSupportedExecutionMode(executionMode) {
  if (!SUPPORTED_WORKER_EXECUTION_MODES.has(executionMode)) {
    throw new Error(
      `Unsupported executionMode for current Python worker: ${executionMode}. ` +
      `Only goal_based_agent and replay_script are currently supported.`
    );
  }
}

function assertRuntimeConfigBelongsToProject(runtimeConfig, projectId) {
  if (!runtimeConfig) {
    throw new Error('Runtime config not found');
  }

  if (runtimeConfig.project_id !== projectId) {
    throw new Error('Runtime config does not belong to the same project as the test case');
  }
}

function assertBrowserProfileBelongsToProject(browserProfile, projectId) {
  if (!browserProfile) return;

  if (browserProfile.project_id !== projectId) {
    throw new Error('Browser profile does not belong to the same project as the test case');
  }
}

function assertExecutionScriptMatchesTestCase(script, bundle) {
  if (!script) {
    throw new Error('Execution script not found');
  }

  if (script.test_case_id !== bundle.test_case_id) {
    throw new Error('Execution script does not belong to the provided test case');
  }

  if (
    script.test_case_version_id &&
    script.test_case_version_id !== bundle.test_case_version_id
  ) {
    throw new Error('Execution script does not belong to the provided test case version');
  }
}

function buildBaseRunPayload({
  testRun,
  attempt,
  bundle,
  runtimeConfig,
  browserProfile,
}) {
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

async function markRunAndAttemptAsWorkerDispatchFailed({
  testRunId,
  attemptId,
  error,
}) {
  const errorMessage = error?.message || 'Failed to dispatch run to worker';

  await agentRepository.updateAttemptFinal({
    attemptId,
    status: 'failed',
    verdict: 'error',
    finalResult: null,
    structuredOutput: null,
    errorMessage,
  });

  await agentRepository.updateRunFinal({
    testRunId,
    status: 'failed',
    verdict: 'error',
    executionLog: {
      mode: 'dispatch_to_worker',
      dispatchStatus: 'failed',
    },
    evidenceSummary: null,
    errorMessage,
  });
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
    throw new Error('Test case or test case version not found');
  }

  assertSupportedExecutionMode(bundle.execution_mode);

  const resolvedRuntimeConfigId = runtimeConfigId || bundle.runtime_config_id;
  if (!resolvedRuntimeConfigId) {
    throw new Error(
      'runtimeConfigId is required because this test case version has no runtime_config_id'
    );
  }

  const runtimeConfig = await agentRepository.findRuntimeConfigById(resolvedRuntimeConfigId);
  assertRuntimeConfigBelongsToProject(runtimeConfig, bundle.project_id);

  const browserProfile = browserProfileId
    ? await agentRepository.findBrowserProfileById(browserProfileId)
    : null;

  assertBrowserProfileBelongsToProject(browserProfile, bundle.project_id);

  const testRun = await agentRepository.createTestRun({
    testCaseId: bundle.test_case_id,
    testCaseVersionId: bundle.test_case_version_id,
    triggeredBy,
    status: 'running',
  });

  const attempt = await agentRepository.createTestRunAttempt({
    testRunId: testRun.id,
    attemptNo: 1,
    status: 'running',
    triggerType: 'initial',
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
  params = {},
  triggeredBy = null,
}) {
  const bundle = await agentRepository.findTestCaseBundle(testCaseId, testCaseVersionId);
  if (!bundle) {
    throw new Error('Test case or test case version not found');
  }

  const script = await agentRepository.findExecutionScriptById(executionScriptId);
  assertExecutionScriptMatchesTestCase(script, bundle);

  const resolvedRuntimeConfigId = runtimeConfigId || bundle.runtime_config_id;
  if (!resolvedRuntimeConfigId) {
    throw new Error('runtimeConfigId is required for replay');
  }

  const runtimeConfig = await agentRepository.findRuntimeConfigById(resolvedRuntimeConfigId);
  assertRuntimeConfigBelongsToProject(runtimeConfig, bundle.project_id);

  const browserProfile = browserProfileId
    ? await agentRepository.findBrowserProfileById(browserProfileId)
    : null;

  assertBrowserProfileBelongsToProject(browserProfile, bundle.project_id);

  const testRun = await agentRepository.createTestRun({
    testCaseId: bundle.test_case_id,
    testCaseVersionId: bundle.test_case_version_id,
    triggeredBy,
    status: 'running',
  });

  const attempt = await agentRepository.createTestRunAttempt({
    testRunId: testRun.id,
    attemptNo: 1,
    status: 'running',
    triggerType: 'manual_replay',
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

  workerPayload.testCase.executionMode = 'replay_script';
  workerPayload.testCase.replay = {
    scriptId: script.id,
    strict: true,
    allowLlmFallback: false,
    params,
    scriptJson: script.script_json,
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

async function handleStepCallback(payload) {
  const stepLog = await agentRepository.insertOrUpdateRunStepLog({
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
      evidenceType: 'screenshot',
      filePath: payload.screenshotPath,
      pageUrl: payload.currentUrl || null,
      artifactGroup: 'step',
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
          createdFrom: 'agent_final_callback',
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