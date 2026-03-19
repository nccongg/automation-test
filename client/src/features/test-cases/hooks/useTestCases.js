/**
 * Test Cases Hook
 */

import { useState, useEffect } from 'react';
import { getTestCases } from '../api/testCasesApi';

export function useTestCases() {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getTestCases();
        if (!mounted) return;
        setTestCases(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load test cases.');
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

  return { testCases, loading, error };
}
