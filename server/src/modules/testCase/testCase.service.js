"use strict";

const testCaseRepository = require("./testCase.repository");

function assertUser(userId) {
  if (!userId) {
    throw { status: 401, message: "Unauthorized" };
  }
}

function normalizeAndValidateGeneratedTestCases(testCases) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw { status: 400, message: "testCases must be a non-empty array" };
  }

  return testCases.map((tc, index) => {
    const title = String(tc?.title || "").trim();
    const type = String(tc?.type || "custom").trim() || "custom";
    const expectedResult = String(tc?.expectedResult || "").trim();

    if (!title) {
      throw {
        status: 400,
        message: `testCases[${index}].title is required`,
      };
    }

    if (!Array.isArray(tc?.steps) || tc.steps.length === 0) {
      throw {
        status: 400,
        message: `testCases[${index}].steps must be a non-empty array`,
      };
    }

    const steps = tc.steps
      .map((step) => String(step || "").trim())
      .filter(Boolean);

    if (steps.length === 0) {
      throw {
        status: 400,
        message: `testCases[${index}].steps must contain at least one valid step`,
      };
    }

    return {
      title,
      type,
      steps,
      expectedResult,
    };
  });
}

async function getTestCases(userId, projectId) {
  assertUser(userId);
  return testCaseRepository.getTestCases(userId, projectId);
}

async function generateTestCases(userId, prompt, projectId = null) {
  assertUser(userId);

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw { status: 400, message: "Prompt is required to generate test cases" };
  }

  const testCases = await testCaseRepository.generateTestCases(
    userId,
    prompt.trim(),
    projectId,
  );

  return testCases;
}

async function saveTestCases(userId, projectId, promptText, testCases) {
  assertUser(userId);

  const projectIdNum = Number(projectId);
  if (!projectIdNum || Number.isNaN(projectIdNum)) {
    throw { status: 400, message: "projectId is required" };
  }

  const ownedProject = await testCaseRepository.findOwnedProjectById(
    userId,
    projectIdNum,
  );

  if (!ownedProject) {
    throw { status: 404, message: "Project not found or access denied" };
  }

  const normalizedTestCases = normalizeAndValidateGeneratedTestCases(testCases);

  return testCaseRepository.saveTestCases({
    projectId: projectIdNum,
    userId,
    promptText: typeof promptText === "string" ? promptText.trim() : "",
    aiModel: process.env.LLM_PROVIDER || "ollama",
    testCases: normalizedTestCases,
  });
}

module.exports = {
  getTestCases,
  generateTestCases,
  saveTestCases,
};
