"use strict";

const { Router } = require("express");
const ctrl = require("./testCase.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = Router();

router.use(authMiddleware);

router.get("/", ctrl.getTestCases);

router.get("/ai-generation/latest", ctrl.getLatestAiGeneration);
router.delete("/ai-generation/unselected", ctrl.clearUnselectedAiGeneration);

router.post("/generate", ctrl.generateTestCases);

router.post("/save", ctrl.saveTestCases);

router.get("/:id", ctrl.getTestCaseById);

router.get("/:id/runs", ctrl.getRunsByTestCaseId);

router.get("/:id/scripts", ctrl.getTestCaseScripts);

router.post("/:id/refine", ctrl.refineTestCase);

router.post("/:id/apply-refinement", ctrl.applyRefinement);

router.post("/:id/commit", ctrl.commitTestCase);

router.put("/:id", ctrl.updateTestCase);

router.delete("/:id", ctrl.deleteTestCase);

module.exports = router;