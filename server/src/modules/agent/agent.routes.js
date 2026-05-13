'use strict';

const { Router } = require('express');
const agentController = require('./agent.controller');

const router = Router();

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
 * Callbacks from Python worker
 * POST /api/agent/callbacks/step
 * POST /api/agent/callbacks/final
 */
router.post('/callbacks/step', agentController.handleStepCallback);
router.post('/callbacks/final', agentController.handleFinalCallback);

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