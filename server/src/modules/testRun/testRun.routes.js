"use strict";

const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const testRunController = require("./testRun.controller");

const router = express.Router();

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
 *     responses:
 *       200:
 *         description: List of recent test runs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [pending, running, passed, failed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/", testRunController.getRecentTestRuns);

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
 *         description: Test run detail with results
 *       404:
 *         description: Test run not found
 */
router.get("/:id", testRunController.getTestRunDetail);

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
 *             required: [testCaseIds]
 *             properties:
 *               testCaseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               projectId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Test run created and started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 runId:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.post("/", testRunController.createTestRun);

module.exports = router;
