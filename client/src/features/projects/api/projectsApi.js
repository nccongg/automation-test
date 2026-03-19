/**
 * Projects API Module
 * 
 * Project management API calls
 * Currently uses mock data - replace with real API when ready
 */

import { 
  getProjectsList as getProjectsListMock,
  getProjectById as getProjectByIdMock,
  createProject as createProjectMock,
} from '@/mocks/handlers/apiHandlers';

/**
 * Get all projects
 * @returns {Promise<Object[]>} List of projects
 * 
 * TODO: Replace with real API call
 */
export async function getProjectsList() {
  const response = await getProjectsListMock();
  return response.data;
}

/**
 * Get single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project details
 * 
 * TODO: Replace with real API call
 */
export async function getProjectById(projectId) {
  const response = await getProjectByIdMock(projectId);
  return response.data;
}

/**
 * Create new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 * 
 * TODO: Replace with real API call
 */
export async function createProject(projectData) {
  const response = await createProjectMock(projectData);
  return response.data;
}
