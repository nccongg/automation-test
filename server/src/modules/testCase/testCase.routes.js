"use strict";

const { Router } = require("express");
const ctrl = require("./testCase.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = Router();

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
 *     summary: Get all test cases
 *     tags: [Test Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
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
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /test-cases/generate:
 *   post:
 *     summary: Generate test cases using AI
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
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Description of the feature to generate test cases for
 *                 example: User login with email and password
 *               projectId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Generated test cases
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
 *                       title:
 *                         type: string
 *                       steps:
 *                         type: array
 *                         items:
 *                           type: string
 *                       expectedResult:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */

/**
 * @swagger
 * /test-cases/run:
 *   post:
 *     summary: Run test cases
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
 *               - testCaseIds
 *             properties:
 *               testCaseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Test run started
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

/**
 * @swagger
 * /test-cases/save:
 *   post:
 *     summary: Save generated test cases
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
 *               - testCases
 *             properties:
 *               projectId:
 *                 type: integer
 *                 description: Project ID to associate test cases with
 *                 example: 1
 *               promptText:
 *                 type: string
 *                 description: Original prompt used to generate test cases
 *                 example: User login with email and password
 *               testCases:
 *                 type: array
 *                 description: Array of test cases to save
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Verify login with valid credentials
 *                     type:
 *                       type: string
 *                       example: custom
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Navigate to login page", "Enter valid email", "Enter valid password", "Click Login"]
 *                     expectedResult:
 *                       type: string
 *                       example: User is redirected to dashboard
 *     responses:
 *       201:
 *         description: Test cases saved successfully
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
 *                   example: 3 test case(s) saved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       versionId:
 *                         type: integer
 *       400:
 *         description: Bad Request (missing projectId or testCases)
 *       401:
 *         description: Unauthorized
 */

router.use(authMiddleware);
router.get("/", ctrl.getTestCases);
router.post("/generate", ctrl.generateTestCases);
router.post("/save", ctrl.saveTestCases);

module.exports = router;
