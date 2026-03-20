'use strict';

const dashboardService = require('./dashboard.service');

/**
 * Get dashboard data for authenticated user
 */
async function getDashboard(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw { status: 401, message: 'Unauthorized' };
    }

    const data = await dashboardService.getDashboardData(userId);

    res.json({
      status: 'ok',
      data,
      message: 'Dashboard data fetched successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
};
