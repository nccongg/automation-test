"use strict";

const { Router } = require("express");
const ctrl = require("./testCase.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Test Cases
 *   description: Test case generation and management
 */

/**
 * @swagger
 * /test-cases:
 *   get:
 *     summary: Get all test cases of the current user
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter test cases by project ID
 *         example: 1
 *     responses:
 *       200:
 *         description: List of test cases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 11
 *                       projectId:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Verify login with valid credentials
 *                       goal:
 *                         type: string
 *                         example: Verify user can log in successfully
 *                       status:
 *                         type: string
 *                         example: draft
 *                       aiModel:
 *                         type: string
 *                         example: gemini-2.5-flash
 *                       suite:
 *                         type: string
 *                         example: Demo Project
 *                       currentVersionId:
 *                         type: integer
 *                         example: 21
 *                       executionMode:
 *                         type: string
 *                         example: step_based
 *                       displayText:
 *                         type: string
 *                         example: "Test Case: Verify login with valid credentials"
 *                       stepCount:
 *                         type: integer
 *                         example: 4
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/", ctrl.getTestCases);

/**
 * @swagger
 * /test-cases/generate:
 *   post:
 *     summary: Generate test case candidates using AI and store them as a generation batch
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - prompt
 *             properties:
 *               projectId:
 *                 type: integer
 *                 description: Project ID where the generated candidates belong
 *                 example: 1
 *               prompt:
 *                 type: string
 *                 description: Description of the feature or scenario to generate test cases for
 *                 example: User login with email and password
 *     responses:
 *       201:
 *         description: Test case candidates generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Test case candidates generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     batch:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         projectId:
 *                           type: integer
 *                           example: 1
 *                         sourcePrompt:
 *                           type: string
 *                           example: User login with email and password
 *                         status:
 *                           type: string
 *                           example: generated
 *                         llmProvider:
 *                           type: string
 *                           example: google
 *                         llmModel:
 *                           type: string
 *                           example: gemini-2.5-flash
 *                         candidateCount:
 *                           type: integer
 *                           example: 3
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 101
 *                           title:
 *                             type: string
 *                             example: Verify login with valid credentials
 *                           goal:
 *                             type: string
 *                             example: Verify user can log in successfully
 *                           displayText:
 *                             type: string
 *                             example: |
 *                               Test Case: Verify login with valid credentials
 *                               Goal: Verify user can log in successfully
 *                           promptText:
 *                             type: string
 *                             example: User login with email and password
 *                           executionMode:
 *                             type: string
 *                             example: step_based
 *                           planSnapshot:
 *                             type: object
 *                           variablesSchema:
 *                             type: object
 *                           candidateOrder:
 *                             type: integer
 *                             example: 1
 *                           isSelected:
 *                             type: boolean
 *                             example: false
 *                           selectedTestCaseId:
 *                             nullable: true
 *                             type: integer
 *                             example: null
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found or access denied
 *       422:
 *         description: Invalid AI output
 */
router.post("/generate", ctrl.generateTestCases);

/**
 * @swagger
 * /test-cases/save:
 *   post:
 *     summary: Save selected generated candidates as official test cases
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - batchId
 *               - candidateIds
 *             properties:
 *               projectId:
 *                 type: integer
 *                 description: Project ID that owns the batch and resulting test cases
 *                 example: 1
 *               batchId:
 *                 type: integer
 *                 description: Generation batch ID returned by /test-cases/generate
 *                 example: 10
 *               candidateIds:
 *                 type: array
 *                 description: Selected generated candidate IDs to convert into official test cases
 *                 items:
 *                   type: integer
 *                 example: [101, 102]
 *               runtimeConfigId:
 *                 type: integer
 *                 nullable: true
 *                 description: Optional reusable runtime config ID of the same project. If omitted, the backend reuses or creates a default one.
 *                 example: 1
 *     responses:
 *       201:
 *         description: Selected candidates saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: 2 test case(s) saved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2001
 *                       title:
 *                         type: string
 *                         example: Verify login with valid credentials
 *                       goal:
 *                         type: string
 *                         example: Verify user can log in successfully
 *                       versionId:
 *                         type: integer
 *                         example: 3001
 *                       runtimeConfigId:
 *                         type: integer
 *                         example: 1
 *                       candidateId:
 *                         type: integer
 *                         example: 101
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project, runtime config, or candidate not found
 */
router.post("/save", ctrl.saveTestCases);

/**
 * @swagger
 * /test-cases/{id}:
 *   put:
 *     summary: Update a test case
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test case ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               goal:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, ready, archived]
 *     responses:
 *       200:
 *         description: Test case updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Test case not found or access denied
 */
router.put("/:id", ctrl.updateTestCase);

module.exports = router;