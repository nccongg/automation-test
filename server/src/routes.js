'use strict';

const { Router } = require('express');
const { testConnection } = require('./config/database');

const router = Router();

// ─── Health Check ────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const dbTime = await testConnection();
    res.json({
      status: 'ok',
      db: 'connected',
      dbTime,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      message: err.message,
    });
  }
});

// ─── Module Routes ────────────────────────────────────────────────────────────
// Uncomment as you implement each module:
// router.use('/test-cases', require('./modules/testCase/testCase.router'));
// router.use('/test-runs',  require('./modules/testRun/testRun.router'));
// router.use('/results',    require('./modules/result/result.router'));

module.exports = router;
