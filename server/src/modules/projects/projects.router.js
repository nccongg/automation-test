'use strict';

const { Router } = require('express');
const authMiddleware = require('../../middleware/auth.middleware');
const ctrl = require('./projects.controller');

const router = Router();

// Protect all project routes
router.use(authMiddleware);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 */
router.post('/', ctrl.createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the authenticated user
 */
router.get('/', ctrl.getProjects);

/**
 * @route   GET /api/projects/recent
 * @desc    Get recent projects (for dashboard cards)
 */
router.get('/recent', ctrl.getRecentProjects);

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get a single project by ID
 */
router.get('/:projectId', ctrl.getProjectById);

module.exports = router;

