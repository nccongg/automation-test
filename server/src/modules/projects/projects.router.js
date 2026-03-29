'use strict';

const { Router } = require('express');
const authMiddleware = require('../../middleware/auth.middleware');
const ctrl = require('./projects.controller');

const router = Router();

router.use(authMiddleware);

router.post('/', ctrl.createProject);
router.get('/', ctrl.getProjects);
router.get('/recent', ctrl.getRecentProjects);
router.get('/:projectId', ctrl.getProjectById);
router.put('/:projectId', ctrl.updateProject);
router.delete('/:projectId', ctrl.deleteProject);

module.exports = router;