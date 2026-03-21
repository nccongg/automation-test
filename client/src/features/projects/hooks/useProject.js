/**
 * Project Data Hook
 * 
 * Fetches and manages project detail data
 * Handles loading, error, and success states
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../api/projectApi';

/**
 * Hook to fetch project details by ID from URL params
 * @returns {Object} Project state { data, loading, error }
 */
export function useProject() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await getProjectById(projectId);
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load project details.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchProject();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  return { data, loading, error };
}
