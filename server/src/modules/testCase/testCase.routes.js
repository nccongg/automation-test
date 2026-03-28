"use strict";

const { Router } = require("express");
const ctrl = require("./testCase.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = Router();

/**
 * @route   POST /api/test-cases/generate
 * @desc    Generate test cases from a prompt using AI
 * @access  Private
 */
router.use(authMiddleware);
router.get("/", ctrl.getTestCases);
router.post("/generate", ctrl.generateTestCases);
router.post("/save", ctrl.saveTestCases);

module.exports = router;
