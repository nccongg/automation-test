'use strict';

const testRunService = require('./testRun.service');

async function createTestRun(req, res, next) {
  try {
    const { testCaseId, promptText } = req.body;
    const userId = req.user?.userId;

    if (!testCaseId) {
      return res.status(400).json({ message: 'testCaseId is required' });
    }

    const normalizedPromptText =
      typeof promptText === 'string' ? promptText.trim() : null;

    const result = await testRunService.startTestRun({
      testCaseId: Number(testCaseId),
      promptText: normalizedPromptText || null,
      triggeredBy: userId,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentTestRuns(req, res, next) {
  try {
    const userId = req.user?.userId;
    const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 20;
    const parsedProjectId = req.query?.projectId
      ? parseInt(req.query.projectId, 10)
      : null;

    const projectId = Number.isNaN(parsedProjectId) ? null : parsedProjectId;

    const data = await testRunService.listRecentTestRuns({
      userId,
      projectId,
      limit,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getTestRunDetail(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const data = await testRunService.getTestRunDetail(Number(id), userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function replayTestRun(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await testRunService.replayTestRun({
      sourceRunId: Number(id),
      triggeredBy: userId,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTestRun,
  getRecentTestRuns,
  getTestRunDetail,
  replayTestRun,
};