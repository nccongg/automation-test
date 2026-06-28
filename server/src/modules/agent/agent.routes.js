'use strict';

const { Router } = require('express');
const agentController = require('./agent.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = Router();

/**
 * Callbacks from Python worker — authenticated via the shared
 * x-agent-callback-secret header (NOT a user JWT), so they are registered
 * before the auth middleware below.
 * POST /api/agent/callbacks/step
 * POST /api/agent/callbacks/final
 */
router.post('/callbacks/step', agentController.handleStepCallback);
router.post('/callbacks/final', agentController.handleFinalCallback);

// Every route below requires an authenticated user (JWT bearer token).
router.use(authMiddleware);

/**
 * Start normal agent run
 * POST /api/agent/run
 *
 * body:
 * {
 *   "testCaseId": 1,
 *   "testCaseVersionId": 2,
 *   "runtimeConfigId": 3,
 *   "browserProfileId": 4
 * }
 */
router.post('/run', agentController.startRun);

/**
 * Replay existing execution script
 * POST /api/agent/replay
 *
 * body:
 * {
 *   "testCaseId": 1,
 *   "testCaseVersionId": 2,
 *   "runtimeConfigId": 3,
 *   "browserProfileId": 4,
 *   "executionScriptId": 10,
 *   "params": {
 *     "username": "abc",
 *     "password": "123456"
 *   }
 * }
 */
router.post('/replay', agentController.replayRun);

/**
 * Parameterize an execution script — replace hardcoded step values with {{var}} templates
 * PATCH /api/agent/execution-scripts/:id/steps
 * body: { steps: [...] }
 */
router.patch('/execution-scripts/:id/steps', agentController.parameterizeScript);
router.delete('/execution-scripts/:id', agentController.deleteScript);

/**
 * Fast-forward a script to targetStepIndex and return a screenshot + DOM elements.
 * Optionally executes the target step (executeTargetStep=true).
 * POST /api/agent/execution-scripts/:id/fast-forward-inspect
 * body: { targetStepIndex, params?, executeTargetStep? }
 */
router.post('/execution-scripts/:id/fast-forward-inspect', agentController.handleFastForwardInspect);

/**
 * Fast-forward + AI-powered selector suggestion for a failing step.
 * POST /api/agent/execution-scripts/:id/suggest-fix
 * body: { targetStepIndex, params? }
 */
router.post('/execution-scripts/:id/suggest-fix', agentController.handleSuggestFix);

module.exports = router;