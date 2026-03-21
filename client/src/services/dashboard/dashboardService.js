/**
 * Dashboard Service
 * 
 * Fetches dashboard data from backend API
 */

import { getDashboardData as fetchDashboardData } from '@/features/dashboard/api/dashboardApi';
import { getRecentProjects } from '@/features/projects/api/projectsApi';

/**
 * Fetch dashboard data from API
 * @returns {Promise<Object>} Dashboard data with kpis and recentProjects
 */
export async function getDashboardData() {
  const [dashboardPayload, recentProjects] = await Promise.all([
    fetchDashboardData(),
    getRecentProjects(5),
  ]);

  return {
    kpis: dashboardPayload?.kpis || [],
    recentProjects: recentProjects || [],
  };
}

