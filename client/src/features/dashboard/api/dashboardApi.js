/**
 * Dashboard API Module
 * 
 * Dashboard data fetching from real backend API
 */

import { apiClient } from '@/api/client';

/**
 * Fetch dashboard statistics and recent projects
 * @returns {Promise<Object>} Dashboard data
 */
export async function getDashboardData() {
  const response = await apiClient.get('/dashboard');
  // Backend contract: { status: 'ok', data: <payload>, message }
  return response.data?.data || response.data;
}
