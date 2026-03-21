'use strict';

const dashboardRepository = require('./dashboard.repository');

/**
 * Format project data for response
 * @param {Object} project - Raw project data from database
 * @returns {Object} Formatted project object
 */
function formatProjectResponse(project) {
  // Determine status display text and tone
  const statusMap = {
    passing: { display: 'Passing', tone: 'passing' },
    partial: { display: 'Partial', tone: 'pending' },
    failing: { display: 'Failing', tone: 'failing' },
    pending: { display: 'Pending', tone: 'pending' },
  };

  const statusInfo = statusMap[project.status] || statusMap.pending;

  // Format last run time to human-readable format
  let lastRunFormatted = 'Never';
  if (project.last_run_at) {
    const now = new Date();
    const lastRun = new Date(project.last_run_at);
    const diffMs = now - lastRun;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      lastRunFormatted = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      lastRunFormatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      lastRunFormatted = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }

  return {
    id: project.id,
    title: project.name,
    description: project.description || 'No description available',
    status: statusInfo.display,
    statusTone: statusInfo.tone,
    testCases: parseInt(project.total_test_cases, 10) || 0,
    passRate: `${project.pass_rate || 0}%`,
    lastRun: lastRunFormatted,
    barTone: project.status === 'passing' ? 'green' : project.status === 'failing' ? 'red' : 'slate',
    projectBarWidth: Math.round(parseFloat(project.pass_rate || 0)),
  };
}

/**
 * Get dashboard data including KPIs and recent projects
 * @param {number} userId - User ID from authenticated session
 * @returns {Promise<Object>} Dashboard data
 */
async function getDashboardData(userId) {
  try {
    // Fetch KPIs and recent projects in parallel
    const [kpisData, recentProjects] = await Promise.all([
      dashboardRepository.getDashboardKPIs(userId),
      dashboardRepository.getRecentProjects(userId, 5), // Limit to 5 projects
    ]);

    // Format KPIs
    const kpis = [
      {
        id: 'kpi-total-tests',
        label: 'Total Test',
        value: kpisData.total_tests?.toString() || '0',
        iconBg: 'bg-sky-100',
        iconText: 'text-sky-700',
        iconEmoji: '⚡',
        trendDirection: 'up',
        trendPercent: '8.5%',
        trendText: 'Up from past week',
        barColor: 'sky',
        trendBarWidth: 72,
      },
      {
        id: 'kpi-pass-rate',
        label: 'Pass Rate',
        value: `${kpisData.pass_rate_percentage || 0}%`,
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-700',
        iconEmoji: '✓',
        trendDirection: 'up',
        trendPercent: '1.3%',
        trendText: 'Up from past week',
        barColor: 'emerald',
        trendBarWidth: 64,
      },
      {
        id: 'kpi-failed-tests',
        label: 'Failed Tests',
        value: kpisData.failed_tests?.toString() || '0',
        iconBg: 'bg-red-100',
        iconText: 'text-red-700',
        iconEmoji: '×',
        trendDirection: 'down',
        trendPercent: '4.3%',
        trendText: 'Down from past week',
        barColor: 'red',
        trendBarWidth: 58,
      },
      {
        id: 'kpi-avg-duration',
        label: 'Avg Duration',
        value: formatDuration(kpisData.avg_duration_minutes),
        iconBg: 'bg-slate-100',
        iconText: 'text-slate-700',
        iconEmoji: '⏱',
        trendDirection: 'up',
        trendPercent: '1.8%',
        trendText: 'Up from past week',
        barColor: 'slate',
        trendBarWidth: 60,
      },
    ];

    // Format recent projects
    const formattedProjects = recentProjects.map(formatProjectResponse);

    return {
      kpis,
      recentProjects: formattedProjects,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw { 
      status: 500, 
      message: 'Failed to fetch dashboard data',
      details: error.message 
    };
  }
}

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
function formatDuration(minutes) {
  if (!minutes || minutes < 1) {
    return '0m';
  }
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  return `${Math.round(minutes)}m`;
}

module.exports = {
  getDashboardData,
};
