'use strict';

const { Router } = require('express');
const testCaseController = require('./testCase.controller');

const router = Router();

/**
 * Get all test cases of one project
 * GET /api/test-cases/project/:projectId
 */
router.get('/project/:projectId', testCaseController.listProjectTestCases);

/**
 * Get saved scripts of one test case
 * GET /api/test-cases/:testCaseId/scripts
 */
router.get('/:testCaseId/scripts', testCaseController.listExecutionScriptsByTestCase);

module.exports = router;