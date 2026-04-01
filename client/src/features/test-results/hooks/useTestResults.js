import { useState, useEffect } from 'react';
import { getTestResults, getTestRunDetail } from '../api/testResultsApi';

export function useTestResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedRunId, setExpandedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const res = await getTestResults();
        if (!mounted) return;

        // Debug: log polling results to trace FE<->BE connection
        const activeRuns = res?.recentRuns?.filter(r => r.status === 'running' || r.status === 'queued') || [];
        if (activeRuns.length > 0) {
          console.log('[useTestResults] Poll result: %d active runs:', activeRuns.length,
            activeRuns.map(r => ({ id: r.id, status: r.status, result: r.result })));
        }

        setResults(res);
        setError('');
      } catch (e) {
        if (!mounted) return;
        console.error('[useTestResults] Poll error:', e?.message);
        setError(e?.message || 'Failed to load test results.');
      } finally {
        if (!mounted) return;
        if (!silent) setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      fetchData({ silent: true });
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const toggleRunDetail = async (runId) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);

    if (runDetails[runId]) return;

    try {
      setDetailLoadingId(runId);
      const detail = await getTestRunDetail(runId);
      console.log('[useTestResults] Detail loaded for runId=%s | status=%s attempts=%d steps=%d',
        runId, detail?.run?.status, detail?.attempts?.length, detail?.steps?.length);

      setRunDetails((prev) => ({
        ...prev,
        [runId]: detail,
      }));
    } catch (e) {
      console.error('[useTestResults] Detail error for runId=%s:', runId, e?.message);
      setError(e?.message || 'Failed to load test run detail.');
    } finally {
      setDetailLoadingId(null);
    }
  };

  return {
    results,
    loading,
    error,
    expandedRunId,
    runDetails,
    detailLoadingId,
    toggleRunDetail,
  };
}