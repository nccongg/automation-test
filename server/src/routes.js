"use strict";

const { Router } = require("express");
const { testConnection } = require("./config/database");

const router = Router();

// ─── Health Check ────────────────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  try {
    const dbTime = await testConnection();
    res.json({
      status: "ok",
      db: "connected",
      dbTime,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      db: "disconnected",
      message: err.message,
    });
  }
});

// ─── Module Routes ────────────────────────────────────────────────────────────
router.use("/auth", require("./modules/auth/auth.router"));
router.use("/test-runs", require("./modules/testRun/testRun.routes"));
router.use("/test-cases", require("./modules/testCase/testCase.routes"));

//router.use('/results', require('./modules/result/result.routes'));
router.use("/agent", require("./modules/agent/agent.routes"));
router.use("/dashboard", require("./modules/dashboard/dashboard.router"));
router.use("/projects", require("./modules/projects/projects.router"));
router.use("/scans", require("./modules/scan/scan.routes"));
router.use("/test-sheets", require("./modules/testSheet/testSheet.routes"));
router.use("/test-sheet-runs", require("./modules/testSheet/testSheetRun.routes"));

module.exports = router;
