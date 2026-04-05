import { useState, useEffect, useCallback, useRef } from 'react';
import { getTestResults, getTestRunDetail } from '../api/testResultsApi';

export function useTestResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedRunId, setExpandedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  // Refs so the polling intervals can read the latest values
  // without being in the dependency array (which would reset the interval)
  const resultsRef = useRef(null);
  const runDetailsRef = useRef({});

  useEffect(() => { resultsRef.current = results; }, [results]);
  useEffect(() => { runDetailsRef.current = runDetails; }, [runDetails]);

  // Poll the runs list every 3s
  useEffect(() => {
    let mounted = true;

    const fetchData = async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const res = await getTestResults();
        if (!mounted) return;
        setResults(res);
        setError('');
      } catch (e) {
        if (!mounted) return;
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

  // Poll the expanded run's detail every 3s.
  // Keeps polling while: run is in progress OR detail has no steps yet.
  // Stops once the run is completed/failed AND we have steps loaded.
  useEffect(() => {
    if (!expandedRunId) return;

    let mounted = true;

    const fetchDetail = async () => {
      try {
        const detail = await getTestRunDetail(expandedRunId);
        if (!mounted) return;
        setRunDetails((prev) => ({
          ...prev,
          [expandedRunId]: detail,
        }));
      } catch {
        // Silently ignore polling errors
      }
    };

    const intervalId = setInterval(() => {
      const currentRun = resultsRef.current?.recentRuns?.find(
        (r) => r.id === expandedRunId,
      );
      const cachedDetail = runDetailsRef.current[expandedRunId];
      const isInProgress =
        currentRun?.status === 'queued' || currentRun?.status === 'running';
      const hasSteps = cachedDetail?.steps?.length > 0;

      // Keep polling if the run is still going, OR if it's done but we haven't loaded steps yet
      if (isInProgress || !hasSteps) {
        fetchDetail();
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [expandedRunId]); // Only depends on expandedRunId — NOT on results

  const toggleRunDetail = useCallback(async (runId) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);

    // Always fetch fresh detail when expanding
    try {
      setDetailLoadingId(runId);
      const detail = await getTestRunDetail(runId);
      setRunDetails((prev) => ({
        ...prev,
        [runId]: detail,
      }));
    } catch (e) {
      setError(e?.message || 'Failed to load test run detail.');
    } finally {
      setDetailLoadingId(null);
    }
  }, [expandedRunId]);

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
