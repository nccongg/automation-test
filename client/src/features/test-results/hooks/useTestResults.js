/**
 * Test Results Hook
 */

import { useState, useEffect } from 'react';
import { getTestResults } from '../api/testResultsApi';

export function useTestResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getTestResults();
        if (!mounted) return;
        setResults(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load test results.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetch();

    return () => {
      mounted = false;
    };
  }, []);

  return { results, loading, error };
}
