/**
 * Dashboard Data Hook
 * 
 * Fetches and manages dashboard data
 * Handles loading, error, and success states
 */

import { useState, useEffect } from 'react';
import { getDashboardData } from '../api/dashboardApi';

/**
 * Dashboard data fetching hook
 * @returns {Object} Dashboard state and methods
 */
export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await getDashboardData();
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load dashboard data.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
