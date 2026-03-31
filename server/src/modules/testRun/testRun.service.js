"use strict";

const testRunRepository = require("./testRun.repository");
const agentService = require("../agent/agent.service");

const SUPPORTED_WORKER_EXECUTION_MODES = new Set([
  "goal_based_agent",
  "replay_script",
]);

function assertUser(userId) {
  if (!userId) {
    throw { status: 401, message: "Unauthorized" };
  }
}

function assertSupportedExecutionMode(mode) {
  if (!SUPPORTED_WORKER_EXECUTION_MODES.has(mode)) {
    throw {
      status: 400,
      message:
        `Unsupported execution mode for current worker: ${mode}. ` +
        `Only goal_based_agent and replay_script are supported.`,
    };
  }
}

function resolveAgentPrompt(ctx, promptText) {
  const override = typeof promptText === "string" ? promptText.trim() : "";
  return override || ctx.prompt_text || ctx.goal;
}

function buildRuntimeConfigSnapshot(ctx) {
  return {
    llmProvider: ctx.llm_provider,
    llmModel: ctx.llm_model,
    maxSteps: ctx.max_steps,
    timeoutSeconds: ctx.timeout_seconds,
    useVision: ctx.use_vision,
    headless: ctx.headless,
    browserType: ctx.browser_type,
    allowedDomains: ctx.allowed_domains || [],
    viewport: ctx.viewport_json || null,
    locale: ctx.locale || null,
    timezone: ctx.timezone || null,
    extraConfig: ctx.extra_config_json || {},
  };
}

function buildBrowserProfileSnapshot(ctx) {
  const profileData = ctx.profile_data || {};

  return {
    id: ctx.browser_profile_id || null,
    provider: ctx.browser_provider || "local",
    profileType: ctx.profile_type || "ephemeral",
    profileRef: ctx.profile_ref || null,
    profileDirectory:
      ctx.profile_type === "system_chrome"
        ? ctx.profile_ref || profileData.profileDirectory || null
        : null,
    profileData,
  };
}

function mapExecutionMode(mode) {
  if (mode === "replay_script") return "replay_script";
  return "goal_based_agent";
}

function buildWorkerPayload(ctx, testRun, attempt, agentPrompt) {
  return {
    testRunId: testRun.id,
    attemptId: attempt.id,
    attemptNo: attempt.attempt_no,
    project: {
      id: ctx.project_id,
      baseUrl: ctx.base_url,
    },
    testCase: {
      id: ctx.test_case_id,
      title: ctx.title,
      goal: ctx.goal || agentPrompt,
      executionMode: mapExecutionMode(ctx.execution_mode),
      promptText: agentPrompt,
      planSnapshot: ctx.plan_snapshot || null,
    },
    runtimeConfig: {
      id: ctx.runtime_id,
      llmProvider: ctx.llm_provider || "google",
      llmModel: ctx.llm_model || "gemini-flash-latest",
      maxSteps: ctx.max_steps || 20,
      timeoutSeconds: ctx.timeout_seconds || 180,
      useVision: ctx.use_vision ?? true,
      headless: ctx.headless ?? true,
      browserType: ctx.browser_type || "chromium",
      allowedDomains: ctx.allowed_domains || [],
      viewport: ctx.viewport_json || { width: 1280, height: 720 },
      locale: ctx.locale || null,
      timezone: ctx.timezone || null,
      extraConfig: ctx.extra_config_json || {},
    },
    browserProfile: buildBrowserProfileSnapshot(ctx),
  };
}

async function markDispatchFailed({ testRunId, attemptId, error }) {
  const errorMessage = error?.message || "Failed to dispatch run to worker";

  await testRunRepository.updateRunAttemptFinal({
    attemptId,
    status: "failed",
    verdict: "error",
    finalResult: null,
    structuredOutput: null,
    errorMessage,
  });

  await testRunRepository.updateTestRunFinal({
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

async function startTestRun({ testCaseId, promptText, triggeredBy }) {
  assertUser(triggeredBy);

  const ctx = await testRunRepository.getTestCaseExecutionContext(
    testCaseId,
    triggeredBy,
    null
  );

  if (!ctx) {
    throw { status: 404, message: "Test case not found or access denied" };
  }

  if (!ctx.resolved_test_case_version_id) {
    throw { status: 400, message: "Test case has no current version" };
  }

  if (!ctx.runtime_id && !ctx.runtime_config_id) {
    throw {
      status: 400,
      message: "Test case version has no runtime config",
    };
  }

  assertSupportedExecutionMode(mapExecutionMode(ctx.execution_mode));

  const agentPrompt = resolveAgentPrompt(ctx, promptText);

  const testRun = await testRunRepository.createTestRun({
    testCaseId,
    versionId: ctx.resolved_test_case_version_id,
    triggeredBy,
  });

  const attempt = await testRunRepository.createRunAttempt({
    testRunId: testRun.id,
    agentPrompt,
    runtimeConfigSnapshot: buildRuntimeConfigSnapshot(ctx),
    browserProfileSnapshot: buildBrowserProfileSnapshot(ctx),
    triggerType: "initial",
  });

  const workerPayload = buildWorkerPayload(ctx, testRun, attempt, agentPrompt);

  try {
    await agentService.startWorkerRun(workerPayload);
  } catch (error) {
    await markDispatchFailed({
      testRunId: testRun.id,
      attemptId: attempt.id,
      error,
    });
    throw error;
  }

  return {
    testRun,
    attempt,
    workerPayload,
  };
}

async function listRecentTestRuns({ userId, projectId = null, limit = 20 }) {
  assertUser(userId);

  return testRunRepository.getRecentTestRuns({
    userId,
    projectId,
    limit,
  });
}

async function getTestRunDetail(testRunId, userId) {
  assertUser(userId);

  const detail = await testRunRepository.getTestRunDetail(testRunId, userId);

  if (!detail.run) {
    throw { status: 404, message: "Test run not found or access denied" };
  }

  return detail;
}

async function replayTestRun({ sourceRunId, triggeredBy }) {
  assertUser(triggeredBy);

  const sourceRun = await testRunRepository.getReplaySourceRun(
    sourceRunId,
    triggeredBy
  );

  if (!sourceRun) {
    throw { status: 404, message: "Source run not found or access denied" };
  }

  const ctx = await testRunRepository.getTestCaseExecutionContext(
    sourceRun.test_case_id,
    triggeredBy,
    sourceRun.test_case_version_id || null
  );

  if (!ctx) {
    throw { status: 404, message: "Test case/version not found or access denied" };
  }

  if (!ctx.resolved_test_case_version_id) {
    throw { status: 400, message: "Replay source has no resolvable version" };
  }

  if (!ctx.runtime_id && !ctx.runtime_config_id) {
    throw {
      status: 400,
      message: "Replay version has no runtime config",
    };
  }

  assertSupportedExecutionMode(mapExecutionMode(ctx.execution_mode));

  const agentPrompt = resolveAgentPrompt(ctx, sourceRun.agent_prompt);

  const testRun = await testRunRepository.createTestRun({
    testCaseId: sourceRun.test_case_id,
    versionId: ctx.resolved_test_case_version_id,
    triggeredBy,
  });

  const attempt = await testRunRepository.createRunAttempt({
    testRunId: testRun.id,
    agentPrompt,
    runtimeConfigSnapshot: buildRuntimeConfigSnapshot(ctx),
    browserProfileSnapshot: buildBrowserProfileSnapshot(ctx),
    triggerType: "manual_replay",
  });

  const workerPayload = buildWorkerPayload(ctx, testRun, attempt, agentPrompt);

  try {
    await agentService.startWorkerRun(workerPayload);
  } catch (error) {
    await markDispatchFailed({
      testRunId: testRun.id,
      attemptId: attempt.id,
      error,
    });
    throw error;
  }

  return {
    testRun,
    attempt,
    workerPayload,
  };
}

module.exports = {
  startTestRun,
  listRecentTestRuns,
  getTestRunDetail,
  replayTestRun,
};