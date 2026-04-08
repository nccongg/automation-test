"use strict";

const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const ctrl = require("./testSheet.controller");

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Test Sheet Runs
 *   description: Batch execution history and results for test sheets
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TestSheetRun:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         testSheetId:
 *           type: integer
 *         sheetName:
 *           type: string
 *         status:
 *           type: string
 *           enum: [queued, running, completed, failed, cancelled]
 *         totalCases:
 *           type: integer
 *         passed:
 *           type: integer
 *         failed:
 *           type: integer
 *         errored:
 *           type: integer
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *     TestSheetRunItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         testCaseId:
 *           type: integer
 *         testRunId:
 *           type: integer
 *           nullable: true
 *         itemOrder:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [pending, queued, running, completed, failed, cancelled]
 *         title:
 *           type: string
 *         goal:
 *           type: string
 *         verdict:
 *           type: string
 *           enum: [pass, fail, error, partial]
 *           nullable: true
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         finishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /test-sheet-runs:
 *   get:
 *     summary: List all sheet runs for a project
 *     tags: [Test Sheet Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID to filter sheet runs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max number of runs to return (capped at 100)
 *     responses:
 *       200:
 *         description: List of test sheet runs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestSheetRun'
 *       400:
 *         description: projectId is required
 *       401:
 *         description: Unauthorized
 */
router.get("/", ctrl.listSheetRuns);

/**
 * @swagger
 * /test-sheet-runs/{runId}:
 *   get:
 *     summary: Get sheet run detail with per-case results
 *     tags: [Test Sheet Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test sheet run ID
 *     responses:
 *       200:
 *         description: Sheet run with summary stats and per-case results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     run:
 *                       $ref: '#/components/schemas/TestSheetRun'
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TestSheetRunItem'
 *       404:
 *         description: Test sheet run not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:runId", ctrl.getSheetRunDetail);

/**
 * @swagger
 * /test-sheet-runs/{runId}/analyze:
 *   post:
 *     summary: Generate LLM conclusion and suggestions for a test sheet run
 *     tags: [Test Sheet Runs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: runId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: AI-generated conclusion and suggestions
 *       404:
 *         description: Test sheet run not found
 */
router.post("/:runId/analyze", ctrl.analyzeSheetRun);

module.exports = router;
