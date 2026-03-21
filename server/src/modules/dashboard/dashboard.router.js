'use strict';

const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard data (KPIs and recent projects)
 */
router.use(authMiddleware);
router.get('/', ctrl.getDashboard);

module.exports = router;
