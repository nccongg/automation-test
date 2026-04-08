"use strict";

const llmService = require("../llm/llm.service");
const scanRepository = require("../scan/scan.repository");
const testCaseRepository = require("./testCase.repository");

function assertUser(userId) {
  if (!userId) {
    throw { status: 401, message: "Unauthorized" };
  }
}

function toPositiveInt(value, fieldName) {
  const num = Number(value);
  if (!num || Number.isNaN(num) || num <= 0) {
    throw { status: 400, message: `${fieldName} must be a valid positive number` };
  }
  return num;
}

function normalizeStepText(step) {
  if (typeof step === "string") return step.trim();

  if (step && typeof step === "object") {
    return String(step.text || step.description || "").trim();
  }

  return "";
}

function normalizeExecutionMode(value) {
  const allowed = new Set([
    "step_based",
    "goal_based_agent",
    "hybrid_agent",
    "replay_script",
  ]);

  return allowed.has(value) ? value : "step_based";
}

function buildDisplayText({ title, goal, steps, expectedResult }) {
  const lines = [
    `Test Case: ${title}`,
    `Goal: ${goal}`,
    "",
    "Steps:",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ];

  if (expectedResult) {
    lines.push("", `Expected Result: ${expectedResult}`);
  }

  return lines.join("\n");
}

function normalizeGeneratedCandidates(rawCases) {
  if (!Array.isArray(rawCases) || rawCases.length === 0) {
    throw { status: 422, message: "LLM did not return any test case candidates" };
  }

  return rawCases.map((tc, index) => {
    const title = String(tc?.title || "").trim();
    const goal =
      String(tc?.goal || "").trim() ||
      String(tc?.expectedResult || "").trim() ||
      title;

    const expectedResult = String(tc?.expectedResult || "").trim();

    const steps = Array.isArray(tc?.steps)
      ? tc.steps.map(normalizeStepText).filter(Boolean)
      : [];

    if (!title) {
      throw {
        status: 422,
        message: `Generated candidate at index ${index} is missing title`,
      };
    }

    if (!goal) {
      throw {
        status: 422,
        message: `Generated candidate at index ${index} is missing goal`,
      };
    }

    if (steps.length === 0) {
      throw {
        status: 422,
        message: `Generated candidate at index ${index} must contain at least one valid step`,
      };
    }

    const executionMode = normalizeExecutionMode(tc?.executionMode);

    const normalizedSteps = steps.map((text, stepIndex) => ({
      order: stepIndex + 1,
      text,
      action: "custom",
    }));

    return {
      title,
      goal,
      promptText: String(tc?.promptText || "").trim(),
      displayText: buildDisplayText({
        title,
        goal,
        steps,
        expectedResult,
      }),
      executionMode,
      planSnapshot: {
        title,
        goal,
        expectedResult,
        steps: normalizedSteps,
      },
      variablesSchema:
        tc?.variablesSchema && typeof tc.variablesSchema === "object"
          ? tc.variablesSchema
          : {},
    };
  });
}

async function getTestCases(userId, projectId) {
  assertUser(userId);

  if (projectId !== null && projectId !== undefined) {
    projectId = toPositiveInt(projectId, "projectId");
  }

  return testCaseRepository.getTestCases(userId, projectId);
}

async function generateTestCases(userId, { prompt, projectId }) {
  assertUser(userId);

  const trimmedPrompt = String(prompt || "").trim();
  if (!trimmedPrompt) {
    throw { status: 400, message: "prompt is required" };
  }

  const projectIdNum = toPositiveInt(projectId, "projectId");

  const ownedProject = await testCaseRepository.findOwnedProjectById(
    userId,
    projectIdNum
  );

  if (!ownedProject) {
    throw { status: 404, message: "Project not found or access denied" };
  }

  const scanContext =
    await scanRepository.getLatestCompletedScanByProject(projectIdNum);

  const llmResult = await llmService.generateTestCases(
    userId,
    trimmedPrompt,
    scanContext
  );

  const rawCases = Array.isArray(llmResult)
    ? llmResult
    : Array.isArray(llmResult?.testCases)
    ? llmResult.testCases
    : [];

  const normalizedCandidates = normalizeGeneratedCandidates(rawCases);

  return testCaseRepository.createGenerationBatchWithCandidates({
    projectId: projectIdNum,
    userId,
    prompt: trimmedPrompt,
    llmProvider:
      llmResult?.llmProvider || process.env.LLM_PROVIDER || null,
    llmModel:
      llmResult?.llmModel || process.env.LLM_MODEL || process.env.LLM_PROVIDER || null,
    candidates: normalizedCandidates,
  });
}

async function saveTestCases(
  userId,
  { projectId, batchId, candidateIds, runtimeConfigId }
) {
  assertUser(userId);

  const projectIdNum = toPositiveInt(projectId, "projectId");
  const batchIdNum = toPositiveInt(batchId, "batchId");

  const normalizedCandidateIds = Array.from(
    new Set(
      (candidateIds || []).map((id) => toPositiveInt(id, "candidateIds"))
    )
  );

  if (normalizedCandidateIds.length === 0) {
    throw { status: 400, message: "candidateIds must be a non-empty array" };
  }

  const ownedProject = await testCaseRepository.findOwnedProjectById(
    userId,
    projectIdNum
  );

  if (!ownedProject) {
    throw { status: 404, message: "Project not found or access denied" };
  }

  const runtimeConfigIdNum =
    runtimeConfigId === null || runtimeConfigId === undefined
      ? null
      : toPositiveInt(runtimeConfigId, "runtimeConfigId");

  return testCaseRepository.saveCandidatesAsTestCases({
    userId,
    projectId: projectIdNum,
    batchId: batchIdNum,
    candidateIds: normalizedCandidateIds,
    runtimeConfigId: runtimeConfigIdNum,
  });
}

const ALLOWED_STATUSES = new Set(["draft", "ready", "archived"]);

async function updateTestCase(userId, testCaseId, { title, goal, status }) {
  assertUser(userId);

  const id = toPositiveInt(testCaseId, "testCaseId");

  const trimmedTitle = title !== undefined ? String(title).trim() : undefined;
  const trimmedGoal = goal !== undefined ? String(goal).trim() : undefined;

  if (trimmedTitle !== undefined && !trimmedTitle) {
    throw { status: 400, message: "title cannot be empty" };
  }

  if (trimmedGoal !== undefined && !trimmedGoal) {
    throw { status: 400, message: "goal cannot be empty" };
  }

  if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
    throw { status: 400, message: "status must be draft, ready, or archived" };
  }

  const updated = await testCaseRepository.updateTestCase(userId, id, {
    title: trimmedTitle,
    goal: trimmedGoal,
    status,
  });

  if (!updated) {
    throw { status: 404, message: "Test case not found or access denied" };
  }

  return updated;
}

module.exports = {
  getTestCases,
  generateTestCases,
  saveTestCases,
  updateTestCase,
};