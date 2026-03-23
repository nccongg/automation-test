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

/**
 * Get paginated projects list
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<{data: Object[], pagination: {page: number, limit: number, total: number, totalPages: number}}>}
 */
export async function getPaginatedProjects(page = 1, limit = 6) {
  const response = await apiClient.get(`/projects?page=${page}&limit=${limit}`);
  return {
    data: response.data?.data || [],
    pagination: response.data?.pagination,
  };
}

/**
 * Update project
 * @param {string} projectId - Project ID
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(projectId, projectData) {
  const payload = {
    name: projectData?.name,
    description: projectData?.description,
    base_url: projectData?.base_url || projectData?.baseUrl,
  };

  const response = await apiClient.put(`/projects/${projectId}`, payload);
  return response.data?.data || response.data;
}

/**
 * Delete project
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(projectId) {
  await apiClient.del(`/projects/${projectId}`);
}
