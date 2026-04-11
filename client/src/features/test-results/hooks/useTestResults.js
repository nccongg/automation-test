import { useState, useEffect, useCallback, useRef } from 'react';
import { getTestResults, getTestRunDetail } from '../api/testResultsApi';
import { getSheetRuns } from '@/features/test-collection/api/testSheetApi';

export function useTestResults(projectId) {
  const [individualRuns, setIndividualRuns] = useState([]);
  const [sheetRuns, setSheetRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedRunId, setExpandedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const individualRunsRef = useRef([]);
  const runDetailsRef = useRef({});

  useEffect(() => { individualRunsRef.current = individualRuns; }, [individualRuns]);
  useEffect(() => { runDetailsRef.current = runDetails; }, [runDetails]);

  // Poll both lists every 3s
  useEffect(() => {
    let mounted = true;

    const fetchData = async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);

        // Fetch independently so a sheet-runs failure doesn't block individual runs
        const [runsResult, sheetsResult] = await Promise.allSettled([
          getTestResults(projectId),
          projectId ? getSheetRuns(projectId) : Promise.resolve([]),
        ]);

        if (!mounted) return;

        if (runsResult.status === 'fulfilled') {
          const allRuns = runsResult.value?.recentRuns ?? [];
          setIndividualRuns(allRuns.filter((r) => !r.fromSheet));
          setError('');
        } else {
          console.error('[useTestResults] individual runs fetch failed:', runsResult.reason);
          if (!silent) setError(runsResult.reason?.message || 'Failed to load test runs.');
        }

        if (sheetsResult.status === 'fulfilled') {
          const sheetsData = sheetsResult.value;
          setSheetRuns(Array.isArray(sheetsData) ? sheetsData : []);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load test results.');
      } finally {
        if (!mounted) return;
        if (!silent) setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(() => fetchData({ silent: true }), 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [projectId]);

  // Poll expanded individual run detail every 3s
  useEffect(() => {
    if (!expandedRunId) return;

    let mounted = true;

    const fetchDetail = async () => {
      try {
        const detail = await getTestRunDetail(expandedRunId);
        if (!mounted) return;
        setRunDetails((prev) => ({ ...prev, [expandedRunId]: detail }));
      } catch {
        // Silently ignore polling errors
      }
    };

    const intervalId = setInterval(() => {
      const currentRun = individualRunsRef.current.find((r) => r.id === expandedRunId);
      const cachedDetail = runDetailsRef.current[expandedRunId];
      const isInProgress = currentRun?.status === 'queued' || currentRun?.status === 'running';
      const hasSteps = cachedDetail?.steps?.length > 0;

      if (isInProgress || !hasSteps) {
        fetchDetail();
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [expandedRunId]);

  const toggleRunDetail = useCallback(async (runId) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);

    try {
      setDetailLoadingId(runId);
      const detail = await getTestRunDetail(runId);
      setRunDetails((prev) => ({ ...prev, [runId]: detail }));
    } catch (e) {
      setError(e?.message || 'Failed to load test run detail.');
    } finally {
      setDetailLoadingId(null);
    }
  }, [expandedRunId]);

  // summary derived from individual runs only
  const summary = (() => {
    const runs = individualRuns ?? [];
    const total = runs.length;
    const passed = runs.filter((r) => r.result === 'Passed').length;
    const failed = runs.filter((r) => r.result === 'Failed').length;
    const passRate = total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : '0%';
    return { totalRuns: total, passed, failed, passRate };
  })();

  return {
    individualRuns,
    sheetRuns,
    summary,
    loading,
    error,
    expandedRunId,
    runDetails,
    detailLoadingId,
    toggleRunDetail,
  };
}
