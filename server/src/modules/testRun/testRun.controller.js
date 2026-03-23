const testRunService = require("./testRun.service");

async function createTestRun(req, res, next) {
  try {
    const { testCaseId, promptText } = req.body;

    if (!testCaseId) {
      return res.status(400).json({ message: "testCaseId is required" });
    }

    const normalizedPromptText =
      typeof promptText === "string" ? promptText.trim() : null;

    const result = await testRunService.startTestRun({
      testCaseId,
      promptText: normalizedPromptText || null,
      triggeredBy: 1,
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
    const data = await testRunService.listRecentTestRuns();

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
    const { id } = req.params;

    const data = await testRunService.getTestRunDetail(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTestRun,
  getRecentTestRuns,
  getTestRunDetail,
};