/**
 * Projects Data Hook
 * 
 * Fetches and manages projects list
 */

import { useState, useEffect } from 'react';
import { getProjectsList } from '../api/projectsApi';

/**
 * Projects list fetching hook
 * @returns {Object} Projects state and methods
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await getProjectsList();
        if (!mounted) return;
        setProjects(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load projects.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  return { projects, loading, error };
}
