"use strict";

const testCaseRepository = require("./testCase.repository");

function assertUser(userId) {
  if (!userId) {
    throw { status: 401, message: "Unauthorized" };
  }
}

async function getTestCases(userId, projectId) {
  assertUser(userId);
  return testCaseRepository.getTestCases(userId, projectId);
}

async function generateTestCases(userId, prompt) {
  assertUser(userId);

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw { status: 400, message: "Prompt is required to generate test cases" };
  }

  // Call the repository function to generate test cases using AI
  const testCases = await testCaseRepository.generateTestCases(
    userId,
    prompt.trim(),
  );

  return testCases;
}

async function saveTestCases(userId, projectId, promptText, testCases) {
  assertUser(userId);

  if (!projectId) {
    throw { status: 400, message: "projectId is required" };
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw { status: 400, message: "testCases must be a non-empty array" };
  }

  return testCaseRepository.saveTestCases({
    projectId,
    userId,
    promptText,
    aiModel: process.env.LLM_PROVIDER || "ollama",
    testCases,
  });
}

module.exports = {
  getTestCases,
  generateTestCases,
  saveTestCases,
};
