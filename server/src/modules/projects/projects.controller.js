'use strict';

const projectsService = require('./projects.service');

async function createProject(req, res, next) {
  try {
    const userId = req.user?.userId;
    const data = await projectsService.createProject(userId, req.body);

    res.status(201).json({
      status: 'ok',
      data,
      message: 'Project created successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function getProjects(req, res, next) {
  try {
    const userId = req.user?.userId;
    const data = await projectsService.getProjects(userId);

    res.json({
      status: 'ok',
      data,
      message: 'Projects fetched successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function getRecentProjects(req, res, next) {
  try {
    const userId = req.user?.userId;
    const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 5;
    const data = await projectsService.getRecentProjects(userId, limit);

    res.json({
      status: 'ok',
      data,
      message: 'Recent projects fetched successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { projectId } = req.params;
    const data = await projectsService.getProjectById(userId, projectId);

    res.json({
      status: 'ok',
      data,
      message: 'Project fetched successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProject,
  getProjects,
  getRecentProjects,
  getProjectById,
};

