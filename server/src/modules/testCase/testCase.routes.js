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
 *       401:
 *         description: Unauthorized
 */
router.get("/", ctrl.getTestCases);

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
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post("/generate", ctrl.generateTestCases);

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
 *                       example:
 *                         - Navigate to login page
 *                         - Enter valid email
 *                         - Enter valid password
 *                         - Click Login
 *                     expectedResult:
 *                       type: string
 *                       example: User is redirected to dashboard
 *     responses:
 *       201:
 *         description: Test cases saved successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post("/save", ctrl.saveTestCases);

module.exports = router;