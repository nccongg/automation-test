'use strict';

const testCaseRepository = require('./testCase.repository');

async function listProjectTestCases(projectId) {
  return testCaseRepository.listProjectTestCases(projectId);
}

async function listExecutionScriptsByTestCase(testCaseId) {
  return testCaseRepository.listExecutionScriptsByTestCase(testCaseId);
}

module.exports = {
  listProjectTestCases,
  listExecutionScriptsByTestCase,
};