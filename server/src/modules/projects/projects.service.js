'use strict';

const projectsRepository = require('./projects.repository');

function assertUser(userId) {
  if (!userId) {
    throw { status: 401, message: 'Unauthorized' };
  }
}

const statusMap = {
  passing: { display: 'Passing', tone: 'passing' },
  partial: { display: 'Partial', tone: 'pending' },
  failing: { display: 'Failing', tone: 'failing' },
  pending: { display: 'Pending', tone: 'pending' },
};

function formatRelativeTimeFromDb(dateValue) {
  if (!dateValue) return 'Never';

  const now = new Date();
  const then = new Date(dateValue);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function formatStatus(status) {
  return statusMap[status] || statusMap.pending;
}

function verdictToLastRunStatus(verdict) {
  if (!verdict) return 'Never';
  if (verdict === 'pass') return 'Pass';
  if (verdict === 'fail') return 'Fail';
  if (verdict === 'error') return 'Error';
  if (verdict === 'partial') return 'Partial';
  return 'Never';
}

async function createProject(userId, body) {
  assertUser(userId);

  const name = (body?.name || '').trim();
  const description = (body?.description || '').trim();
  const baseUrl = (body?.base_url || body?.baseUrl || '').trim();

  if (!name) throw { status: 400, message: 'Project name is required' };
  if (!description) throw { status: 400, message: 'Project description is required' };
  if (!baseUrl) throw { status: 400, message: 'Base URL is required' };

  const created = await projectsRepository.createProject(userId, {
    name,
    description,
    baseUrl,
  });

  // Return the full project object with proper field mapping
  return {
    id: created.id,
    name: created.name,
    description: created.description,
    baseUrl: created.base_url,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  };
}

async function getProjects(userId, page = 1, limit = 6) {
  assertUser(userId);

  const result = await projectsRepository.getProjects(userId, page, limit);

  return {
    data: result.rows.map((p) => {
      const statusInfo = formatStatus(p.status);
      const passRateNum = p.total_runs > 0 
        ? Math.round((p.passed_runs / p.total_runs) * 100) 
        : 0;

      return {
        id: p.id,
        name: p.name,
        owner: p.owner_name,
        status: statusInfo.display,
        statusTone: statusInfo.tone,
        testCases: parseInt(p.total_test_cases, 10) || 0,
        passRate: `${passRateNum}%`,
        lastRun: formatRelativeTimeFromDb(p.last_run_at),
        barTone: p.status === 'passing' ? 'green' : p.status === 'failing' ? 'red' : 'slate',
        projectBarWidth: passRateNum,
      };
    }),
    pagination: result.pagination,
  };
}

async function getRecentProjects(userId, limit = 5) {
  assertUser(userId);

  const rows = await projectsRepository.getRecentProjects(userId, limit);

  return rows.map((p) => {
    const statusInfo = formatStatus(p.status);

    const passRateNum = parseFloat(p.pass_rate || 0);
    const projectBarWidth = Math.round(passRateNum);

    const barTone =
      p.status === 'passing' ? 'green' : p.status === 'failing' ? 'red' : 'slate';

    return {
      id: p.id,
      title: p.name,
      description: p.description || 'No description available',
      status: statusInfo.display,
      statusTone: statusInfo.tone,
      testCases: parseInt(p.total_test_cases, 10) || 0,
      passRate: `${passRateNum || 0}%`,
      lastRun: formatRelativeTimeFromDb(p.last_run_at),
      barTone,
      projectBarWidth,
    };
  });
}

async function getProjectById(userId, projectId) {
  assertUser(userId);

  const project = await projectsRepository.getProjectById(userId, projectId);
  if (!project) throw { status: 404, message: 'Project not found' };

  const statusInfo = formatStatus(project.status);
  const lastRunStatus = verdictToLastRunStatus(project.latest_verdict);

  return {
    id: project.id,
    title: project.name,
    description: project.description || '',
    baseUrl: project.base_url,
    status: statusInfo.display,
    statusTone: statusInfo.tone,

    totalTests: parseInt(project.total_test_cases, 10) || 0,
    lastRunStatus,
    totalRuns: parseInt(project.total_runs, 10) || 0,

    recentActivity: (project.recent_activity || []).map((a) => ({
      id: a.run_id,
      runId: a.run_id,
      testTitle: a.test_title,
      verdict: a.verdict,
      createdAt: a.created_at,
    })),
  };
}

async function updateProject(userId, projectId, body) {
  assertUser(userId);

  const name = body?.name ? String(body.name).trim() : undefined;
  const description = body?.description ? String(body.description).trim() : undefined;
  const baseUrl = body?.base_url || body?.baseUrl ? String(body?.base_url || body?.baseUrl).trim() : undefined;

  if (name !== undefined && name.length === 0) {
    throw { status: 400, message: 'Project name cannot be empty' };
  }

  const updated = await projectsRepository.updateProject(userId, projectId, {
    name,
    description,
    baseUrl,
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    baseUrl: updated.base_url,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

async function deleteProject(userId, projectId) {
  assertUser(userId);

  return await projectsRepository.deleteProject(userId, projectId);
}

module.exports = {
  createProject,
  getProjects,
  getRecentProjects,
  getProjectById,
  updateProject,
  deleteProject,
};

