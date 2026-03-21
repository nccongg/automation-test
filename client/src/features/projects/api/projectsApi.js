/**
 * Projects API Module
 * 
 * Project management API calls
 */

import { apiClient } from '@/api/client';

/**
 * Get all projects
 * @returns {Promise<Object[]>} List of projects
 */
export async function getProjectsList() {
  const response = await apiClient.get('/projects');
  return response.data?.data || response.data;
}

/**
 * Get single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project details
 */
export async function getProjectById(projectId) {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data?.data || response.data;
}

/**
 * Create new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
export async function createProject(projectData) {
  const payload = {
    name: projectData?.name,
    description: projectData?.description,
    base_url: projectData?.base_url || projectData?.baseUrl,
  };

  const response = await apiClient.post('/projects', payload);
  return response.data?.data || response.data;
}

/**
 * Get recent projects for dashboard cards.
 * @param {number} limit
 */
export async function getRecentProjects(limit = 5) {
  const response = await apiClient.get(`/projects/recent?limit=${limit}`);
  return response.data?.data || response.data;
}
