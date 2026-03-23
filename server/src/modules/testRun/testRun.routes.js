const express = require("express");
const testRunController = require("./testRun.controller");

const router = express.Router();

router.get("/", testRunController.getRecentTestRuns);
router.get("/:id", testRunController.getTestRunDetail);
router.post("/", testRunController.createTestRun);

module.exports = router;