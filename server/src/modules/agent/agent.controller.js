'use strict';

const env = require('../../config/env');
const testRunRepository = require('../testRun/testRun.repository');

function verifyCallbackSecret(req) {
  const incomingSecret = req.headers['x-agent-callback-secret'];
  return incomingSecret && incomingSecret === env.AGENT_CALLBACK_SECRET;
}

async function handleStepCallback(req, res, next) {
  try {
    if (!verifyCallbackSecret(req)) {
      return res.status(401).json({ message: 'Unauthorized callback' });
    }

    const stepLog = await testRunRepository.insertRunStepLog(req.body);

    if (req.body.screenshotPath) {
      await testRunRepository.insertEvidence({
        testRunId: req.body.testRunId,
        attemptId: req.body.attemptId,
        runStepLogId: stepLog.id,
        screenshotPath: req.body.screenshotPath,
        currentUrl: req.body.currentUrl,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function handleFinalCallback(req, res, next) {
  try {
    if (!verifyCallbackSecret(req)) {
      return res.status(401).json({ message: 'Unauthorized callback' });
    }

    await testRunRepository.updateRunAttemptFinal({
      attemptId: req.body.attemptId,
      status: req.body.status,
      verdict: req.body.verdict,
      finalResult: req.body.finalResult,
      structuredOutput: req.body.structuredOutput,
      errorMessage: req.body.errorMessage,
    });

    await testRunRepository.updateTestRunFinal({
      testRunId: req.body.testRunId,
      status: req.body.status,
      verdict: req.body.verdict,
      executionLog: req.body.executionLog,
      evidenceSummary: req.body.evidenceSummary,
      errorMessage: req.body.errorMessage,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleStepCallback,
  handleFinalCallback,
};