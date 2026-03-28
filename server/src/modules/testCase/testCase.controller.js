"use strict";

const testCaseService = require("./testCase.service");

async function getTestCases(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    console.log("[getTestCases] userId:", userId, "projectId:", projectId);
    const data = await testCaseService.getTestCases(userId, projectId);
    console.log("[getTestCases] rows returned:", data.length, data);
    res.json({ status: "ok", data });
  } catch (err) {
    next(err);
  }
}

async function generateTestCases(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: "error",
        message: "Prompt is required to generate test cases",
      });
    }

    const data = await testCaseService.generateTestCases(userId, prompt);

    console.log("[generateTestCases] response:", JSON.stringify(data, null, 2));

    res.json({
      status: "ok",
      data,
      message: "Test cases generated successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function saveTestCases(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { projectId, promptText, testCases } = req.body;

    if (!projectId) {
      return res
        .status(400)
        .json({ status: "error", message: "projectId is required" });
    }

    const saved = await testCaseService.saveTestCases(
      userId,
      projectId,
      promptText,
      testCases,
    );

    res.status(201).json({
      status: "ok",
      data: saved,
      message: `${saved.length} test case(s) saved successfully`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTestCases,
  generateTestCases,
  saveTestCases,
};
