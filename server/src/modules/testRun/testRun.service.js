const testRunRepository = require("./testRun.repository");
const agentService = require("../agent/agent.service");

function resolveAgentPrompt(ctx, promptText) {
  const override =
    typeof promptText === "string" ? promptText.trim() : "";

  return override || ctx.prompt_text || ctx.goal;
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
      executionMode: ctx.execution_mode || "goal_based_agent",
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
    },
    browserProfile: {
      id: ctx.browser_profile_id || null,
      provider: ctx.browser_provider || "local",
      profileType: ctx.profile_type || "ephemeral",
      profileRef: ctx.profile_ref || null,
    },
  };
}

async function startTestRun({ testCaseId, promptText, triggeredBy }) {
  const ctx = await testRunRepository.getTestCaseExecutionContext(testCaseId);

  if (!ctx) {
    throw new Error("Test case not found");
  }

  if (!ctx.current_version_id) {
    throw new Error("Test case has no current version");
  }

  const agentPrompt = resolveAgentPrompt(ctx, promptText);

  const testRun = await testRunRepository.createTestRun({
    testCaseId,
    versionId: ctx.current_version_id,
    triggeredBy,
  });

  const attempt = await testRunRepository.createRunAttempt({
    testRunId: testRun.id,
    agentPrompt,
    runtimeConfigSnapshot: {
      llmProvider: ctx.llm_provider,
      llmModel: ctx.llm_model,
      maxSteps: ctx.max_steps,
      timeoutSeconds: ctx.timeout_seconds,
      useVision: ctx.use_vision,
      headless: ctx.headless,
      browserType: ctx.browser_type,
      allowedDomains: ctx.allowed_domains,
      viewport: ctx.viewport_json,
    },
    browserProfileSnapshot: {
      id: ctx.browser_profile_id,
      provider: ctx.browser_provider,
      profileType: ctx.profile_type,
      profileRef: ctx.profile_ref,
    },
  });

  const workerPayload = buildWorkerPayload(ctx, testRun, attempt, agentPrompt);

  await agentService.startWorkerRun(workerPayload);

  return {
    testRun,
    attempt,
    workerPayload,
  };
}

async function listRecentTestRuns() {
  return await testRunRepository.getRecentTestRuns(20);
}

async function getTestRunDetail(testRunId) {
  const detail = await testRunRepository.getTestRunDetail(testRunId);

  if (!detail.run) {
    throw new Error("Test run not found");
  }

  return detail;
}

module.exports = {
  startTestRun,
  listRecentTestRuns,
  getTestRunDetail,
};