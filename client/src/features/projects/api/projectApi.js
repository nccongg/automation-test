/**
 * Project Service Layer
 * 
 * Handles all project-related data operations
 * Clean separation between API calls and UI components
 */

import { apiClient } from '@/api/client';

/**
 * Fetch project details by ID
 * @param {string|number} projectId - Project identifier
 * @returns {Promise<Object>} Project details
 */
export async function getProjectById(projectId) {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data?.data || response.data;
}

/**
 * Fetch project statistics
 * @param {string|number} projectId - Project identifier
 * @returns {Promise<Object>} Project stats
 */
export async function getProjectStats(projectId) {
  // Stats are included in the project detail payload for now.
  const project = await getProjectById(projectId);
  return {
    totalTests: project.totalTests,
    lastRunStatus: project.lastRunStatus,
    totalRuns: project.totalRuns,
  };
}

/**
 * Update project
 * @param {string|number} projectId - Project identifier
 * @param {Object} updateData - Update payload
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject() {
  throw { status: 501, message: 'Update project not implemented yet' };
}
