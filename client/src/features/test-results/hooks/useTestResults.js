import { useState, useEffect, useCallback, useRef } from 'react';
import { getTestResults, getTestRunDetail, listBatchesForProject } from '../api/testResultsApi';
import { getSheetRuns } from '@/features/test-collection/api/testSheetApi';

const PAGE_SIZE = 15;

export function useTestResults(projectId) {
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 });

  const [individualRuns, setIndividualRuns] = useState([]);
  const [sheetRuns, setSheetRuns] = useState([]);
  const [datasetBatches, setDatasetBatches] = useState([]);
  const [summary, setSummary] = useState({ totalRuns: 0, passed: 0, failed: 0, passRate: '0%' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedRunId, setExpandedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const individualRunsRef = useRef([]);
  const runDetailsRef = useRef({});

  useEffect(() => { individualRunsRef.current = individualRuns; }, [individualRuns]);
  useEffect(() => { runDetailsRef.current = runDetails; }, [runDetails]);

  // Reset to page 1 when projectId changes
  useEffect(() => { setPage(1); }, [projectId]);

  // Poll list every 3s
  useEffect(() => {
    let mounted = true;

    const fetchData = async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);

        const [runsResult, sheetsResult, batchesResult] = await Promise.allSettled([
          getTestResults(projectId, { page, pageSize: PAGE_SIZE }),
          projectId ? getSheetRuns(projectId) : Promise.resolve([]),
          projectId ? listBatchesForProject(projectId) : Promise.resolve([]),
        ]);

        if (!mounted) return;

        if (runsResult.status === 'fulfilled') {
          const { recentRuns = [], pagination: pg, summary: sm } = runsResult.value ?? {};
          setIndividualRuns(recentRuns);
          if (pg) setPagination(pg);
          if (sm) setSummary(sm);
          setError('');
        } else {
          console.error('[useTestResults] individual runs fetch failed:', runsResult.reason);
          if (!silent) setError(runsResult.reason?.message || 'Failed to load test runs.');
        }

        if (sheetsResult.status === 'fulfilled') {
          setSheetRuns(Array.isArray(sheetsResult.value) ? sheetsResult.value : []);
        }

        if (batchesResult.status === 'fulfilled') {
          setDatasetBatches(Array.isArray(batchesResult.value) ? batchesResult.value : []);
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
  }, [projectId, page]);

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

  return {
    individualRuns,
    sheetRuns,
    datasetBatches,
    summary,
    pagination,
    page,
    setPage,
    loading,
    error,
    expandedRunId,
    runDetails,
    detailLoadingId,
    toggleRunDetail,
  };
}
