"use strict";

const { Router } = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const ctrl = require("./scan.controller");

const router = Router();

// Logging middleware for all scan routes
router.use((req, res, next) => {
  console.log(`[scan:routes] ${req.method} ${req.path}`);
  next();
});

// ── Authenticated routes ──────────────────────────────────────────────────────

/**
 * POST /api/scans/projects/:projectId/trigger
 * Kick off a new crawl for the given project.
 */
router.post("/projects/:projectId/trigger", authMiddleware, ctrl.triggerScan);

/**
 * GET /api/scans/projects/:projectId/latest
 * Get the most recent scan (any status) for the project.
 */
router.get("/projects/:projectId/latest", authMiddleware, ctrl.getLatestScan);

/**
 * GET /api/scans/:scanId
 * Get a specific scan by ID (ownership verified via project).
 */
router.get("/:scanId", authMiddleware, ctrl.getScanById);

/**
 * POST /api/scans/:scanId/cancel
 * Cancel an in-progress scan.
 */
router.post("/:scanId/cancel", authMiddleware, ctrl.cancelScan);

// ── Internal callbacks (no JWT — validated by x-callback-secret header) ──────

/**
 * POST /api/scans/:scanId/progress
 * Called by the crawler after each page is crawled (live progress).
 */
router.post("/:scanId/progress", ctrl.pageProgress);

/**
 * POST /api/scans/:scanId/callback
 * Called by the agent-worker when a crawl finishes (success or failure).
 */
router.post("/:scanId/callback", ctrl.crawlCallback);

module.exports = router;
