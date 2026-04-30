import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Database,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { getBatchDetail, batchReplayTestRun } from "@/features/test-results/api/testResultsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return "-";
  const ms = new Date(finishedAt) - new Date(startedAt);
  if (ms < 0) return "-";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

/* ─── Failure taxonomy ────────────────────────────────────────────────── */

const FAILURE_REASON_META = {
  assertion_mismatch:  { label: "Assertion",       color: "bg-red-100 text-red-700" },
  element_not_found:   { label: "Not found",        color: "bg-orange-100 text-orange-700" },
  element_not_visible: { label: "Not visible",      color: "bg-orange-100 text-orange-700" },
  timeout:             { label: "Timeout",           color: "bg-yellow-100 text-yellow-700" },
  navigation_failed:   { label: "Nav failed",        color: "bg-red-100 text-red-700" },
  value_not_set:       { label: "Value not set",     color: "bg-amber-100 text-amber-700" },
  selector_invalid:    { label: "Bad selector",      color: "bg-purple-100 text-purple-700" },
  unexpected_error:    { label: "Error",             color: "bg-slate-100 text-slate-600" },
};

function FailureReasonBadge({ reason }) {
  if (!reason) return null;
  const meta = FAILURE_REASON_META[reason] ?? { label: reason, color: "bg-slate-100 text-slate-500" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function VerdictBadge({ verdict, status }) {
  if (verdict === "pass")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> PASS
      </span>
    );
  if (verdict === "pass_with_warning")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <ShieldAlert className="h-3 w-3" /> PASS*
      </span>
    );
  if (verdict === "fail")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <XCircle className="h-3 w-3" /> FAIL
      </span>
    );
  if (verdict === "error")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
        <AlertTriangle className="h-3 w-3" /> ERROR
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
      <Clock className="h-3 w-3" />
      {status === "running" ? "Running" : "Queued"}
    </span>
  );
}

function SummaryCard({ label, value, color }) {
  const colorMap = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-500 tabular-nums">
        {completed}/{total}
      </span>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */

export default function DatasetRunDetailPage() {
  const { projectId, batchId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rerunBusy, setRerunBusy] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const result = await getBatchDetail(batchId);
      if (!result) {
        setError("Batch not found.");
        return;
      }
      setData(result);
    } catch {
      setError("Failed to load batch detail.");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  // Initial load
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Polling while batch is running
  useEffect(() => {
    if (!data) return;
    if (data.batch.status === "completed") return;

    const timer = setInterval(fetchDetail, 3000);
    return () => clearInterval(timer);
  }, [data, fetchDetail]);

  async function handleRerunFailed() {
    if (!data) return;
    const failedIndexes = data.runs
      .filter((r) => r.verdict === "fail")
      .map((r) => r.row_index)
      .filter((i) => i != null);

    if (!failedIndexes.length) return;

    setRerunBusy(true);
    try {
      const result = await batchReplayTestRun({
        testCaseId: data.batch.test_case_id,
        executionScriptId: data.batch.execution_script_id,
        datasetId: data.batch.dataset_id,
        rowIndexes: failedIndexes,
      });
      navigate(`/projects/${projectId}/dataset-runs/${result.batchId}`);
    } catch {
      // ignore — user can retry
    } finally {
      setRerunBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <p>{error || "Not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const { batch, runs } = data;
  const isRunning = batch.status !== "completed";
  const failedCount = runs.filter((r) => r.verdict === "fail").length;

  // Infer dataset column names from the first row that has a snapshot
  const columnKeys = (() => {
    const snap = runs.find((r) => r.dataset_snapshot)?.dataset_snapshot;
    return snap ? Object.keys(snap) : [];
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <button
          onClick={() => navigate(`/projects/${projectId}/test-cases/${batch.test_case_id}`)}
          className="hover:text-indigo-600 transition-colors font-medium truncate max-w-[180px]"
        >
          {batch.test_case_title ?? `Test Case #${batch.test_case_id}`}
        </button>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <button
          onClick={() => navigate(`/projects/${projectId}/test-cases/${batch.test_case_id}`)}
          className="hover:text-slate-600 transition-colors"
        >
          Dataset Runs
        </button>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-600 font-medium">Batch #{batch.id}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-500" />
              <h1 className="text-lg font-semibold text-slate-800">
                Dataset Replay #{batch.id}
              </h1>
              {isRunning && (
                <span className="animate-pulse rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
                  Running
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {batch.dataset_name && <span>{batch.dataset_name}</span>}
              <span className="ml-2 text-slate-400">{formatDateTime(batch.created_at)}</span>
            </p>
          </div>
        </div>

        {!isRunning && failedCount > 0 && (
          <button
            disabled={rerunBusy}
            onClick={handleRerunFailed}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Rerun {failedCount} failed
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={batch.total_rows} color="slate" />
        <SummaryCard label="Passed" value={batch.passed_rows} color="emerald" />
        <SummaryCard label="Failed" value={batch.failed_rows} color="red" />
        <SummaryCard
          label="Running"
          value={batch.total_rows - batch.completed_rows}
          color="blue"
        />
      </div>

      {/* Progress bar (visible while running) */}
      {isRunning && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-600">Progress</p>
          <ProgressBar completed={batch.completed_rows} total={batch.total_rows} />
        </div>
      )}

      {/* Result table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 text-left">Row</th>
                {columnKeys.map((col) => (
                  <th key={col} className="px-4 py-3 text-left">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-left">Verdict</th>
                <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Failed Step / Reason</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {runs.map((run, idx) => (
                <tr
                  key={run.run_id}
                  className={`transition-colors hover:bg-slate-50 ${
                    run.verdict === "fail" ? "bg-red-50/30" : run.verdict === "pass_with_warning" ? "bg-amber-50/20" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {run.row_index != null ? run.row_index + 1 : idx + 1}
                  </td>

                  {columnKeys.map((col) => (
                    <td key={col} className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                      {run.dataset_snapshot?.[col] != null
                        ? String(run.dataset_snapshot[col])
                        : <span className="text-slate-300">—</span>}
                    </td>
                  ))}

                  <td className="px-4 py-3">
                    <VerdictBadge verdict={run.verdict} status={run.status} />
                  </td>

                  <td className="px-4 py-3 tabular-nums text-slate-500">
                    {formatDuration(run.started_at, run.finished_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {run.failed_step
                        ? <span className="truncate text-xs text-red-600 max-w-[180px]">{run.failed_step}</span>
                        : <span className="text-slate-300">—</span>}
                      <FailureReasonBadge reason={run.failure_reason} />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {run.run_id && (
                      <button
                        onClick={() =>
                          navigate(`/projects/${projectId}/test-runs/${run.run_id}`)
                        }
                        className="rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                      >
                        Detail
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {runs.length === 0 && (
                <tr>
                  <td
                    colSpan={columnKeys.length + 5}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No runs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
