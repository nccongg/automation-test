/**
 * Dashboard API Module
 * 
 * Dashboard data fetching
 * Currently uses mock data - replace with real API when ready
 */

import { getDashboardData as getDashboardDataMock } from '@/mocks/handlers/apiHandlers';

/**
 * Fetch dashboard statistics and recent projects
 * @returns {Promise<Object>} Dashboard data
 * 
 * TODO: Replace with real API call:
 * import { apiClient } from '@/api/client';
 * return apiClient.get('/dashboard');
 */
export async function getDashboardData() {
  // Mock implementation - replace with real API call
  const response = await getDashboardDataMock();
  return response.data;
}
