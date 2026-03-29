'use strict';

const testRunRepository = require('./testRun.repository');
const agentService = require('../agent/agent.service');

function resolveAgentPrompt(ctx, promptText) {
  const override =
    typeof promptText === 'string' ? promptText.trim() : '';

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
    allowedDomains: ctx.allowed_domains,
    viewport: ctx.viewport_json,
  };
}

function buildBrowserProfileSnapshot(ctx) {
  return {
    id: ctx.browser_profile_id,
    provider: ctx.browser_provider,
    profileType: ctx.profile_type,
    profileRef: ctx.profile_ref,
  };
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
      llmProvider: ctx.llm_provider || 'google',
      llmModel: ctx.llm_model || 'gemini-flash-latest',
      maxSteps: ctx.max_steps || 20,
      timeoutSeconds: ctx.timeout_seconds || 180,
      useVision: ctx.use_vision ?? true,
      headless: ctx.headless ?? true,
      browserType: ctx.browser_type || 'chromium',
      allowedDomains: ctx.allowed_domains || [],
      viewport: ctx.viewport_json || { width: 1280, height: 720 },
    },
    browserProfile: {
      id: ctx.browser_profile_id || null,
      provider: ctx.browser_provider || 'local',
      profileType: ctx.profile_type || 'ephemeral',
      profileRef: ctx.profile_ref || null,
    },
  };
}

function assertUser(userId) {
  if (!userId) {
    throw { status: 401, message: 'Unauthorized' };
  }
}

async function startTestRun({ testCaseId, promptText, triggeredBy }) {
  assertUser(triggeredBy);

  const ctx = await testRunRepository.getTestCaseExecutionContext(
    testCaseId,
    triggeredBy
  );

  if (!ctx) {
    throw { status: 404, message: 'Test case not found or access denied' };
  }

  if (!ctx.current_version_id) {
    throw { status: 400, message: 'Test case has no current version' };
  }

  if (!ctx.runtime_id && !ctx.runtime_config_id) {
  throw {
    status: 400,
    message: 'Test case version has no runtime config',
  };
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
    runtimeConfigSnapshot: buildRuntimeConfigSnapshot(ctx),
    browserProfileSnapshot: buildBrowserProfileSnapshot(ctx),
    triggerType: 'initial',
  });

  const workerPayload = buildWorkerPayload(ctx, testRun, attempt, agentPrompt);

  await agentService.startWorkerRun(workerPayload);

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
    throw { status: 404, message: 'Test run not found or access denied' };
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
    throw { status: 404, message: 'Source run not found or access denied' };
  }

  const ctx = await testRunRepository.getTestCaseExecutionContext(
    sourceRun.test_case_id,
    triggeredBy
  );

  if (!ctx) {
    throw { status: 404, message: 'Test case not found or access denied' };
  }

  const versionId = sourceRun.test_case_version_id || ctx.current_version_id;
  const agentPrompt = resolveAgentPrompt(ctx, sourceRun.agent_prompt);

  const testRun = await testRunRepository.createTestRun({
    testCaseId: sourceRun.test_case_id,
    versionId,
    triggeredBy,
  });

  const attempt = await testRunRepository.createRunAttempt({
    testRunId: testRun.id,
    agentPrompt,
    runtimeConfigSnapshot: buildRuntimeConfigSnapshot(ctx),
    browserProfileSnapshot: buildBrowserProfileSnapshot(ctx),
    triggerType: 'manual_replay',
  });

  const workerPayload = buildWorkerPayload(ctx, testRun, attempt, agentPrompt);

  await agentService.startWorkerRun(workerPayload);

  return {
    testRun,
    attempt,
    workerPayload,
  };
}

function mapExecutionMode(mode) {
  if (mode === 'replay_script') return 'replay_script';
  return 'goal_based_agent';
}

module.exports = {
  startTestRun,
  listRecentTestRuns,
  getTestRunDetail,
  replayTestRun,
};