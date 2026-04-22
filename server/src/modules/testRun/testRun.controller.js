"use strict";

const testRunService = require("./testRun.service");

function toPositiveNumber(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function toNullablePositiveNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function toNullableNonNegativeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : null;
}

function hasMeaningfulValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function toNullableTrimmedString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function toPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

async function createTestRun(req, res, next) {
  try {
    const userId = req.user?.userId;

    const testCaseId = toPositiveNumber(req.body?.testCaseId);
    const testCaseVersionId = toNullablePositiveNumber(req.body?.testCaseVersionId);
    const runtimeConfigId = toNullablePositiveNumber(req.body?.runtimeConfigId);
    const browserProfileId = toNullablePositiveNumber(req.body?.browserProfileId);
    const datasetId = toNullablePositiveNumber(req.body?.datasetId);
    const datasetAlias = toNullableTrimmedString(req.body?.datasetAlias);
    const rowIndex = toNullableNonNegativeNumber(req.body?.rowIndex);
    const rowKey = toNullableTrimmedString(req.body?.rowKey);
    const paramsOverride = toPlainObject(req.body?.paramsOverride);

    if (!testCaseId) {
      return res.status(400).json({
        success: false,
        message: "testCaseId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.testCaseVersionId) && testCaseVersionId === null) {
      return res.status(400).json({
        success: false,
        message: "testCaseVersionId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.runtimeConfigId) && runtimeConfigId === null) {
      return res.status(400).json({
        success: false,
        message: "runtimeConfigId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.browserProfileId) && browserProfileId === null) {
      return res.status(400).json({
        success: false,
        message: "browserProfileId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.datasetId) && datasetId === null) {
      return res.status(400).json({
        success: false,
        message: "datasetId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.rowIndex) && rowIndex === null) {
      return res.status(400).json({
        success: false,
        message: "rowIndex must be a non-negative integer",
      });
    }

    const result = await testRunService.startTestRun({
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      datasetId,
      datasetAlias,
      rowIndex,
      rowKey,
      paramsOverride,
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

    // Support both:
    // - POST /test-runs/replay
    // - POST /test-runs/:id/replay
    const sourceRunId =
      toNullablePositiveNumber(req.params?.id) ??
      toNullablePositiveNumber(req.body?.sourceRunId);

    const testCaseId = toPositiveNumber(req.body?.testCaseId);
    const testCaseVersionId = toNullablePositiveNumber(req.body?.testCaseVersionId);
    const runtimeConfigId = toNullablePositiveNumber(req.body?.runtimeConfigId);
    const browserProfileId = toNullablePositiveNumber(req.body?.browserProfileId);
    const executionScriptId = toPositiveNumber(req.body?.executionScriptId);
    const datasetId = toNullablePositiveNumber(req.body?.datasetId);
    const datasetAlias = toNullableTrimmedString(req.body?.datasetAlias);
    const rowIndex = toNullableNonNegativeNumber(req.body?.rowIndex);
    const rowKey = toNullableTrimmedString(req.body?.rowKey);
    const params = toPlainObject(req.body?.params);

    if (!testCaseId) {
      return res.status(400).json({
        success: false,
        message: "testCaseId must be a positive integer",
      });
    }

    if (!executionScriptId) {
      return res.status(400).json({
        success: false,
        message: "executionScriptId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.testCaseVersionId) && testCaseVersionId === null) {
      return res.status(400).json({
        success: false,
        message: "testCaseVersionId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.runtimeConfigId) && runtimeConfigId === null) {
      return res.status(400).json({
        success: false,
        message: "runtimeConfigId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.browserProfileId) && browserProfileId === null) {
      return res.status(400).json({
        success: false,
        message: "browserProfileId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.datasetId) && datasetId === null) {
      return res.status(400).json({
        success: false,
        message: "datasetId must be a positive integer",
      });
    }

    if (hasMeaningfulValue(req.body?.rowIndex) && rowIndex === null) {
      return res.status(400).json({
        success: false,
        message: "rowIndex must be a non-negative integer",
      });
    }

    const result = await testRunService.replayTestRun({
      sourceRunId,
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      executionScriptId,
      datasetId,
      datasetAlias,
      rowIndex,
      rowKey,
      params,
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

async function batchReplayTestRun(req, res, next) {
  try {
    const userId = req.user?.userId;

    const testCaseId = toPositiveNumber(req.body?.testCaseId);
    const testCaseVersionId = toNullablePositiveNumber(req.body?.testCaseVersionId);
    const runtimeConfigId = toNullablePositiveNumber(req.body?.runtimeConfigId);
    const browserProfileId = toNullablePositiveNumber(req.body?.browserProfileId);
    const executionScriptId = toPositiveNumber(req.body?.executionScriptId);
    const datasetId = toPositiveNumber(req.body?.datasetId);
    const rowIndexes = Array.isArray(req.body?.rowIndexes) ? req.body.rowIndexes : null;
    const columnBindings =
      req.body?.columnBindings && typeof req.body.columnBindings === "object" && !Array.isArray(req.body.columnBindings)
        ? req.body.columnBindings
        : null;

    if (!testCaseId) {
      return res.status(400).json({ success: false, message: "testCaseId must be a positive integer" });
    }
    if (!executionScriptId) {
      return res.status(400).json({ success: false, message: "executionScriptId must be a positive integer" });
    }
    if (!datasetId) {
      return res.status(400).json({ success: false, message: "datasetId must be a positive integer" });
    }

    if (hasMeaningfulValue(req.body?.testCaseVersionId) && testCaseVersionId === null) {
      return res.status(400).json({ success: false, message: "testCaseVersionId must be a positive integer" });
    }
    if (hasMeaningfulValue(req.body?.runtimeConfigId) && runtimeConfigId === null) {
      return res.status(400).json({ success: false, message: "runtimeConfigId must be a positive integer" });
    }
    if (hasMeaningfulValue(req.body?.browserProfileId) && browserProfileId === null) {
      return res.status(400).json({ success: false, message: "browserProfileId must be a positive integer" });
    }

    const result = await testRunService.batchReplayTestRun({
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      executionScriptId,
      datasetId,
      rowIndexes,
      columnBindings,
      triggeredBy: userId,
    });

    return res.status(202).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function analyzeTestRun(req, res, next) {
  try {
    const userId = req.user?.userId;
    const id = toPositiveNumber(req.params?.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id must be a positive integer",
      });
    }

    const analysis = await testRunService.analyzeTestRun(id, userId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Test run not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
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
  batchReplayTestRun,
  analyzeTestRun,
};