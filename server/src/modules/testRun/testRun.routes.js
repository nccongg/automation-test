'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth.middleware');
const testRunController = require('./testRun.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', testRunController.getRecentTestRuns);
router.get('/:id', testRunController.getTestRunDetail);
router.post('/', testRunController.createTestRun);
router.post('/:id/replay', testRunController.replayTestRun);

module.exports = router;