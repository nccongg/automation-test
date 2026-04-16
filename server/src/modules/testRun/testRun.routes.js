"use strict";

const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const testRunController = require("./testRun.controller");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Test Runs
 *   description: Test run execution and history
 */

/**
 * @swagger
 * /test-runs:
 *   get:
 *     summary: Get recent test runs
 *     tags: [Test Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: Optional project filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max number of runs to return
 *     responses:
 *       200:
 *         description: List of recent test runs
 *       401:
 *         description: Unauthorized
 */
router.get("/", testRunController.getRecentTestRuns);

/**
 * @swagger
 * /test-runs:
 *   post:
 *     summary: Create and start a new test run
 *     tags: [Test Runs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testCaseId
 *             properties:
 *               testCaseId:
 *                 type: integer
 *                 description: ID of the test case to run
 *                 example: 1
 *     responses:
 *       202:
 *         description: Test run accepted and dispatched
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post("/", testRunController.createTestRun);

/**
 * @swagger
 * /test-runs/replay:
 *   post:
 *     summary: Replay using execution script + dataset/params payload
 *     tags: [Test Runs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testCaseId
 *               - executionScriptId
 *             properties:
 *               sourceRunId:
 *                 type: integer
 *                 nullable: true
 *               testCaseId:
 *                 type: integer
 *               testCaseVersionId:
 *                 type: integer
 *                 nullable: true
 *               runtimeConfigId:
 *                 type: integer
 *                 nullable: true
 *               browserProfileId:
 *                 type: integer
 *                 nullable: true
 *               executionScriptId:
 *                 type: integer
 *               datasetId:
 *                 type: integer
 *                 nullable: true
 *               datasetAlias:
 *                 type: string
 *                 nullable: true
 *               rowIndex:
 *                 type: integer
 *                 nullable: true
 *               rowKey:
 *                 type: string
 *                 nullable: true
 *               params:
 *                 type: object
 *                 nullable: true
 *     responses:
 *       202:
 *         description: Replay accepted and dispatched
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Source run or script not found
 */
router.post("/replay", testRunController.replayTestRun);

/**
 * @swagger
 * /test-runs/{id}/replay:
 *   post:
 *     summary: Replay a previous test run (legacy path)
 *     tags: [Test Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       202:
 *         description: Replay accepted and dispatched
 *       404:
 *         description: Source run not found
 */
router.post("/:id/replay", testRunController.replayTestRun);

/**
 * @swagger
 * /test-runs/{id}:
 *   get:
 *     summary: Get test run detail by ID
 *     tags: [Test Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Test run detail with attempts, steps and evidences
 *       404:
 *         description: Test run not found
 */
router.get("/:id", testRunController.getTestRunDetail);

/**
 * @swagger
 * /test-runs/{id}/analyze:
 *   post:
 *     summary: Generate LLM conclusion and suggestions for a test run
 *     tags: [Test Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: AI-generated conclusion and suggestions
 *       404:
 *         description: Test run not found
 */
router.post("/:id/analyze", testRunController.analyzeTestRun);

module.exports = router;