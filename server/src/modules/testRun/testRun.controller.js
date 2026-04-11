"use strict";

const testRunService = require("./testRun.service");

function toPositiveNumber(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

async function createTestRun(req, res, next) {
  try {
    const userId = req.user?.userId;
    const testCaseId = toPositiveNumber(req.body?.testCaseId);

    if (!testCaseId) {
      return res.status(400).json({
        success: false,
        message: "testCaseId must be a positive integer",
      });
    }

    const result = await testRunService.startTestRun({
      testCaseId,
      triggeredBy: userId,
    });

    return res.status(202).json({
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
    const rawLimit = req.query?.limit ? parseInt(req.query.limit, 10) : 20;
    const rawProjectId = req.query?.projectId
      ? parseInt(req.query.projectId, 10)
      : null;

    const limit =
      Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : 20;
    const projectId =
      Number.isInteger(rawProjectId) && rawProjectId > 0 ? rawProjectId : null;

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
    const id = toPositiveNumber(req.params?.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer",
      });
    }

    const data = await testRunService.getTestRunDetail(id, userId);

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
    const id = toPositiveNumber(req.params?.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer",
      });
    }

    const result = await testRunService.replayTestRun({
      sourceRunId: id,
      triggeredBy: userId,
    });

    return res.status(202).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function analyzeTestRun(req, res, next) {
  try {
    const userId = req.user?.userId;
    const id = toPositiveNumber(req.params?.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }

    const analysis = await testRunService.analyzeTestRun(id, userId);

    if (!analysis) {
      return res.status(404).json({ success: false, message: "Test run not found" });
    }

    return res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTestRun,
  getRecentTestRuns,
  getTestRunDetail,
  replayTestRun,
  analyzeTestRun,
};