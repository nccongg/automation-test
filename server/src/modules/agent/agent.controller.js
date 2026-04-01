"use strict";

const agentService = require("./agent.service");

function getUserId(req) {
  return req.user?.userId || req.user?.id || req.auth?.userId || null;
}

function verifyCallbackSecret(req) {
  const expected = process.env.AGENT_CALLBACK_SECRET || "";
  if (!expected) {
    console.log("[AgentController] No AGENT_CALLBACK_SECRET configured, allowing callback");
    return true;
  }

  const actual = req.headers["x-agent-callback-secret"];
  if (actual === expected) {
    console.log("[AgentController] Callback secret verified OK");
    return true;
  }

  console.warn(
    `[AgentController] Callback secret mismatch. headerPresent=${Boolean(actual)}, expectedLen=${expected.length}, actualLen=${actual ? actual.length : 0}`,
  );

  return false;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;

  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function sendError(res, error, fallbackMessage) {
  const statusCode =
    error?.status && Number.isInteger(error.status) ? error.status : 500;

  return res.status(statusCode).json({
    status: "error",
    message: error?.message || fallbackMessage,
  });
}

async function startRun(req, res) {
  try {
    const testCaseId = toNullableNumber(req.body?.testCaseId);
    const testCaseVersionId = toNullableNumber(req.body?.testCaseVersionId);
    const runtimeConfigId = toNullableNumber(req.body?.runtimeConfigId);
    const browserProfileId = toNullableNumber(req.body?.browserProfileId);

    if (!testCaseId) {
      return res.status(400).json({
        status: "error",
        message: "testCaseId is required",
      });
    }

    const result = await agentService.startAgentRun({
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      triggeredBy: getUserId(req),
    });

    return res.status(202).json({
      status: "ok",
      message: "Agent run accepted",
      data: result,
    });
  } catch (error) {
    console.error("[AgentController.startRun]", error);
    return sendError(res, error, "Failed to start agent run");
  }
}

async function replayRun(req, res) {
  try {
    const testCaseId = toNullableNumber(req.body?.testCaseId);
    const testCaseVersionId = toNullableNumber(req.body?.testCaseVersionId);
    const runtimeConfigId = toNullableNumber(req.body?.runtimeConfigId);
    const browserProfileId = toNullableNumber(req.body?.browserProfileId);
    const executionScriptId = toNullableNumber(req.body?.executionScriptId);
    const params =
      req.body?.params && typeof req.body.params === "object"
        ? req.body.params
        : {};

    if (!testCaseId) {
      return res.status(400).json({
        status: "error",
        message: "testCaseId is required",
      });
    }

    if (!executionScriptId) {
      return res.status(400).json({
        status: "error",
        message: "executionScriptId is required",
      });
    }

    const result = await agentService.replayAgentRun({
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      executionScriptId,
      params,
      triggeredBy: getUserId(req),
    });

    return res.status(202).json({
      status: "ok",
      message: "Replay run accepted",
      data: result,
    });
  } catch (error) {
    console.error("[AgentController.replayRun]", error);
    return sendError(res, error, "Failed to replay agent run");
  }
}

async function handleStepCallback(req, res) {
  try {
    console.log("[AgentController.handleStepCallback] Received step callback | runId=%s attemptId=%s",
      req.body?.runId, req.body?.attemptId);

    if (!verifyCallbackSecret(req)) {
      console.warn("[AgentController.handleStepCallback] 403 - secret mismatch");
      return res.status(403).json({
        status: "error",
        message: "Invalid callback secret",
      });
    }

    await agentService.handleStepCallback(req.body);
    console.log("[AgentController.handleStepCallback] Processed OK");

    return res.json({
      status: "ok",
      message: "Step callback processed",
    });
  } catch (error) {
    console.error("[AgentController.handleStepCallback]", error);
    return sendError(res, error, "Failed to handle step callback");
  }
}

async function handleFinalCallback(req, res) {
  try {
    console.log("[AgentController.handleFinalCallback] Received final callback | runId=%s attemptId=%s status=%s verdict=%s",
      req.body?.runId, req.body?.attemptId, req.body?.status, req.body?.verdict);

    if (!verifyCallbackSecret(req)) {
      console.warn("[AgentController.handleFinalCallback] 403 - secret mismatch");
      return res.status(403).json({
        status: "error",
        message: "Invalid callback secret",
      });
    }

    await agentService.handleFinalCallback(req.body);
    console.log("[AgentController.handleFinalCallback] Processed OK | DB updated for runId=%s", req.body?.runId);

    return res.json({
      status: "ok",
      message: "Final callback processed",
    });
  } catch (error) {
    console.error("[AgentController.handleFinalCallback]", error);
    return sendError(res, error, "Failed to handle final callback");
  }
}

module.exports = {
  startRun,
  replayRun,
  handleStepCallback,
  handleFinalCallback,
};
