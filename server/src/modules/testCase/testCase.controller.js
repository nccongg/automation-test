"use strict";

const testCaseService = require("./testCase.service");

async function getTestCases(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;

    const data = await testCaseService.getTestCases(userId, projectId);

    res.json({
      status: "ok",
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function generateTestCases(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { prompt, projectId } = req.body;

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        status: "error",
        message: "prompt is required",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "projectId is required",
      });
    }

    const data = await testCaseService.generateTestCases(userId, {
      prompt,
      projectId,
    });

    res.status(201).json({
      status: "ok",
      data,
      message: "Test case candidates generated successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function saveTestCases(req, res, next) {
  try {
    const userId = req.user?.userId;
    const {
      projectId,
      batchId,
      candidateIds,
      candidates,
      runtimeConfigId,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        status: "error",
        message: "projectId is required",
      });
    }

    if (!batchId) {
      return res.status(400).json({
        status: "error",
        message: "batchId is required",
      });
    }

    const hasCandidateIds =
      Array.isArray(candidateIds) && candidateIds.length > 0;
    const hasCandidates =
      Array.isArray(candidates) && candidates.length > 0;

    if (!hasCandidateIds && !hasCandidates) {
      return res.status(400).json({
        status: "error",
        message: "candidateIds or candidates must be a non-empty array",
      });
    }

    const saved = await testCaseService.saveTestCases(userId, {
      projectId,
      batchId,
      candidateIds,
      candidates,
      runtimeConfigId,
    });

    res.status(201).json({
      status: "ok",
      data: saved,
      message: `${saved.length} test case(s) saved successfully`,
    });
  } catch (err) {
    next(err);
  }
}

async function updateTestCase(req, res, next) {
  try {
    const userId = req.user?.userId;
    const testCaseId = Number(req.params.id);
    const { title, goal, status } = req.body;

    const updated = await testCaseService.updateTestCase(userId, testCaseId, {
      title,
      goal,
      status,
    });

    res.json({ status: "ok", data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTestCases,
  generateTestCases,
  saveTestCases,
  updateTestCase,
};