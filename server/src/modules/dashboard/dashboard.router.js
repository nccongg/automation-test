'use strict';

const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard summary data
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard data (KPIs and recent projects)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                     totalTestCases:
 *                       type: integer
 *                     totalTestRuns:
 *                       type: integer
 *                     recentProjects:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', ctrl.getDashboard);

module.exports = router;
