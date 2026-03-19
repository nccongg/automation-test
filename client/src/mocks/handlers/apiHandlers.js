/**
 * Mock API Handlers
 * 
 * Simulates API calls with realistic delays and responses
 * Replace these with real API calls when backend is ready
 */

import { DASHBOARD_DATA } from '../data/dashboard';
import { PROJECTS_DATA } from '../data/projects';
import { TEST_CASES_DATA } from '../data/testCases';
import { TEST_RESULTS_DATA } from '../data/testResults';

// Simulate network delay (300-800ms)
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 350));

/**
 * Dashboard API Mock
 * @returns {Promise<Object>} Dashboard data
 */
export async function getDashboardData() {
  await simulateDelay();
  return {
    success: true,
    data: DASHBOARD_DATA,
  };
}

/**
 * Projects API Mock
 * @returns {Promise<Object>} Projects list
 */
export async function getProjectsList() {
  await simulateDelay();
  return {
    success: true,
    data: PROJECTS_DATA,
  };
}

/**
 * Get single project by ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Project details
 */
export async function getProjectById(projectId) {
  await simulateDelay();
  const project = PROJECTS_DATA.find(p => p.id === projectId);
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  return {
    success: true,
    data: project,
  };
}

/**
 * Create new project (mock)
 * @param {Object} projectData - Project data to create
 * @returns {Promise<Object>} Created project
 */
export async function createProject(projectData) {
  await simulateDelay();
  const newProject = {
    id: `proj-${Date.now()}`,
    ...projectData,
    lastRun: 'Never',
  };
  
  return {
    success: true,
    data: newProject,
    message: 'Project created successfully',
  };
}

/**
 * Test Cases API Mock
 * @returns {Promise<Object>} Test cases list
 */
export async function getTestCases() {
  await simulateDelay();
  return {
    success: true,
    data: TEST_CASES_DATA,
  };
}

/**
 * Get test case by ID
 * @param {string} testCaseId - Test case ID
 * @returns {Promise<Object>} Test case details
 */
export async function getTestCaseById(testCaseId) {
  await simulateDelay();
  const testCase = TEST_CASES_DATA.find(tc => tc.id === testCaseId);
  
  if (!testCase) {
    throw new Error('Test case not found');
  }
  
  return {
    success: true,
    data: testCase,
  };
}

/**
 * Test Results API Mock
 * @returns {Promise<Object>} Test results data
 */
export async function getTestResults() {
  await simulateDelay();
  return {
    success: true,
    data: TEST_RESULTS_DATA,
  };
}

/**
 * Settings API Mock
 * @returns {Promise<Object>} User settings
 */
export async function getUserSettings() {
  await simulateDelay();
  return {
    success: true,
    data: {
      email: 'example@gmail.com',
      timezone: 'UTC',
      notifications: {
        weeklySummary: true,
        testFailures: true,
        projectUpdates: false,
      },
      preferences: {
        theme: 'light',
        defaultProjectVisibility: 'private',
        itemsPerPage: 10,
      },
    },
  };
}

/**
 * Update user settings (mock)
 * @param {Object} settings - New settings
 * @returns {Promise<Object>} Updated settings
 */
export async function updateUserSettings(settings) {
  await simulateDelay();
  return {
    success: true,
    data: settings,
    message: 'Settings updated successfully',
  };
}
