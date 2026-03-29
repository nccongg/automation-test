'use strict';

const testCaseService = require('./testCase.service');

async function listProjectTestCases(req, res) {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'projectId must be a positive integer',
      });
    }

    const items = await testCaseService.listProjectTestCases(projectId);

    return res.json({
      status: 'ok',
      data: items,
    });
  } catch (error) {
    console.error('[TestCaseController.listProjectTestCases]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load test cases',
    });
  }
}

async function listExecutionScriptsByTestCase(req, res) {
  try {
    const testCaseId = Number(req.params.testCaseId);

    if (!Number.isInteger(testCaseId) || testCaseId <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'testCaseId must be a positive integer',
      });
    }

    const items = await testCaseService.listExecutionScriptsByTestCase(testCaseId);

    return res.json({
      status: 'ok',
      data: items,
    });
  } catch (error) {
    console.error('[TestCaseController.listExecutionScriptsByTestCase]', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load execution scripts',
    });
  }
}

module.exports = {
  listProjectTestCases,
  listExecutionScriptsByTestCase,
};