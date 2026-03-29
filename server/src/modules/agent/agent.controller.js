'use strict';

const agentService = require('./agent.service');

function getUserId(req) {
  return req.user?.id || req.auth?.userId || null;
}

function verifyCallbackSecret(req) {
  const expected = process.env.AGENT_CALLBACK_SECRET || '';
  if (!expected) return true;

  const actual = req.headers['x-agent-callback-secret'];
  return actual === expected;
}

async function startRun(req, res) {
  try {
    const {
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
    } = req.body;

    if (!testCaseId) {
      return res.status(400).json({
        status: 'error',
        message: 'testCaseId is required',
      });
    }

    const result = await agentService.startAgentRun({
      testCaseId,
      testCaseVersionId: testCaseVersionId || null,
      runtimeConfigId: runtimeConfigId || null,
      browserProfileId: browserProfileId || null,
      triggeredBy: getUserId(req),
    });

    return res.status(202).json({
      status: 'ok',
      message: 'Agent run accepted',
      data: result,
    });
  } catch (error) {
    console.error('[AgentController.startRun]', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to start agent run',
    });
  }
}

async function replayRun(req, res) {
  try {
    const {
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      executionScriptId,
      params,
    } = req.body;

    if (!testCaseId) {
      return res.status(400).json({
        status: 'error',
        message: 'testCaseId is required',
      });
    }

    if (!executionScriptId) {
      return res.status(400).json({
        status: 'error',
        message: 'executionScriptId is required',
      });
    }

    const result = await agentService.replayAgentRun({
      testCaseId,
      testCaseVersionId: testCaseVersionId || null,
      runtimeConfigId: runtimeConfigId || null,
      browserProfileId: browserProfileId || null,
      executionScriptId,
      params: params || {},
      triggeredBy: getUserId(req),
    });

    return res.status(202).json({
      status: 'ok',
      message: 'Replay run accepted',
      data: result,
    });
  } catch (error) {
    console.error('[AgentController.replayRun]', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to replay agent run',
    });
  }
}

async function handleStepCallback(req, res) {
  try {
    if (!verifyCallbackSecret(req)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid callback secret',
      });
    }

    await agentService.handleStepCallback(req.body);

    return res.json({
      status: 'ok',
      message: 'Step callback processed',
    });
  } catch (error) {
    console.error('[AgentController.handleStepCallback]', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to handle step callback',
    });
  }
}

async function handleFinalCallback(req, res) {
  try {
    if (!verifyCallbackSecret(req)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid callback secret',
      });
    }

    await agentService.handleFinalCallback(req.body);

    return res.json({
      status: 'ok',
      message: 'Final callback processed',
    });
  } catch (error) {
    console.error('[AgentController.handleFinalCallback]', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to handle final callback',
    });
  }
}

module.exports = {
  startRun,
  replayRun,
  handleStepCallback,
  handleFinalCallback,
};