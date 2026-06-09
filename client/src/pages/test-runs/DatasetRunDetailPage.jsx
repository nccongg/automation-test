import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import {
  getBatchDetail,
  batchReplayTestRun,
} from "@/features/test-results/api/testResultsApi";

import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import PageHeader from "@/shared/components/common/PageHeader";
import { Button } from "@/components/ui/button";

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
  assertion_mismatch: {
    label: "Assertion",
    color: "bg-red-500/15 text-red-400",
  },
  element_not_found: {
    label: "Not found",
    color: "bg-orange-500/15 text-orange-400",
  },
  element_not_visible: {
    label: "Not visible",
    color: "bg-orange-500/15 text-orange-400",
  },
  timeout: {
    label: "Timeout",
    color: "bg-yellow-500/15 text-yellow-500",
  },
  navigation_failed: {
    label: "Nav failed",
    color: "bg-red-500/15 text-red-400",
  },
  value_not_set: {
    label: "Value not set",
    color: "bg-amber-500/15 text-amber-500",
  },
  selector_invalid: {
    label: "Bad selector",
    color: "bg-purple-500/15 text-purple-400",
  },
  unexpected_error: {
    label: "Error",
    color: "bg-muted text-muted-foreground",
  },
};

function FailureReasonBadge({ reason }) {
  if (!reason) return null;

  const meta = FAILURE_REASON_META[reason] ?? {
    label: reason,
    color: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function VerdictBadge({ verdict, status }) {
  if (verdict === "pass") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
        <CheckCircle2 className="size-3" />
        PASS
      </span>
    );
  }

  if (verdict === "pass_with_warning") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-500">
        <ShieldAlert className="size-3" />
        PASS*
      </span>
    );
  }

  if (verdict === "fail") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
        <XCircle className="size-3" />
        FAIL
      </span>
    );
  }

  if (verdict === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-400">
        <AlertTriangle className="size-3" />
        ERROR
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-400">
      <Clock className="size-3" />
      {status === "running" ? "Running" : "Queued"}
    </span>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="text-xs font-medium text-muted-foreground tabular-nums">
        {completed}/{total}
      </span>
    </div>
  );
}

/* ─── AI Analysis: only show after clicking Analyze ───────────────────── */

function DatasetAiAnalysisSection({ batch, runs, isLive }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);

    try {
      const failedRuns = runs.filter((r) => r.verdict === "fail");
      const warningRuns = runs.filter((r) => r.verdict === "pass_with_warning");

      const failureReasons = Object.entries(
        failedRuns.reduce((acc, run) => {
          const key = run.failure_reason || "unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]);

      const result = {
        conclusion:
          failedRuns.length > 0
            ? `This dataset run has ${failedRuns.length} failed row(s). Review the failed step, failure reason, and related test run detail.`
            : "No failed rows were found in this dataset run.",
        summary: `This run executed ${batch.total_rows} dataset rows. ${batch.passed_rows} passed and ${batch.failed_rows} failed.`,
        failureReasons,
        warningCount: warningRuns.length,
      };

      setAnalysis(result);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-foreground">AI Analysis</h2>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLive || analyzing}
          onClick={handleAnalyze}
          className="gap-1.5"
        >
          {analyzing ? (
            <>
              <LoadingSpinner size="sm" />
              Analyzing...
            </>
          ) : analysis ? (
            "Regenerate"
          ) : (
            "Analyze"
          )}
        </Button>
      </div>

      {isLive ? (
        <p className="text-sm text-muted-foreground">
          AI analysis will be available after this dataset run is completed.
        </p>
      ) : !analysis ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          Click <span className="font-medium text-foreground">Analyze</span> to
          generate an AI summary for this dataset run.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
              Conclusion
            </p>
            <p className="mt-1 text-sm text-foreground">
              {analysis.conclusion}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">{analysis.summary}</p>

          {analysis.failureReasons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {analysis.failureReasons.map(([reason, count]) => (
                <span
                  key={reason}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {reason}: {count}
                </span>
              ))}
            </div>
          )}

          {analysis.warningCount > 0 && (
            <p className="text-sm text-amber-500">
              {analysis.warningCount} row(s) passed with warning and may need
              manual review.
            </p>
          )}
        </div>
      )}
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
      setError("");
    } catch {
      setError("Failed to load batch detail.");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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
    } finally {
      setRerunBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground">
        <AlertTriangle className="size-8 text-muted-foreground/30" />
        <p className="text-sm font-medium">{error || "Batch not found."}</p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          Go back
        </Button>
      </div>
    );
  }

  const { batch, runs } = data;

  const isRunning = batch.status !== "completed";
  const failedCount = runs.filter((r) => r.verdict === "fail").length;

  const columnKeys = (() => {
    const snap = runs.find((r) => r.dataset_snapshot)?.dataset_snapshot;
    return snap ? Object.keys(snap) : [];
  })();

  const pageTitle = `Run TestSuite ${
    batch.test_suite_name ?? batch.test_case_title ?? `#${batch.id}`
  }`;

  const pageDescription = batch.dataset_name
    ? `${batch.dataset_name} • ${formatDateTime(batch.created_at)}`
    : formatDateTime(batch.created_at);

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={
          !isRunning && failedCount > 0 ? (
            <Button
              type="button"
              variant="ds-outlined-destructive"
              size="sm"
              disabled={rerunBusy}
              onClick={handleRerunFailed}
              className="gap-1.5"
            >
              {rerunBusy ? (
                <>
                  <LoadingSpinner size="sm" />
                  Rerunning...
                </>
              ) : (
                <>
                  <RotateCcw className="size-3.5" />
                  Rerun {failedCount} failed
                </>
              )}
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={batch.total_rows} />
        <SummaryCard label="Passed" value={batch.passed_rows} />
        <SummaryCard label="Failed" value={batch.failed_rows} />
        <SummaryCard
          label={isRunning ? "Running" : "Completed"}
          value={
            isRunning
              ? batch.total_rows - batch.completed_rows
              : batch.completed_rows
          }
        />
      </div>

      {isRunning && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Progress
          </p>
          <ProgressBar
            completed={batch.completed_rows}
            total={batch.total_rows}
          />
        </div>
      )}

      <DatasetAiAnalysisSection batch={batch} runs={runs} isLive={isRunning} />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Dataset Run Results
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Result details for each dataset row
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left">Row</th>

                {columnKeys.map((col) => (
                  <th key={col} className="px-4 py-3 text-left">
                    {col}
                  </th>
                ))}

                <th className="px-4 py-3 text-left">Verdict</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Failed Step / Reason</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {runs.map((run, idx) => (
                <tr
                  key={run.run_id ?? `${run.row_index}-${idx}`}
                  className={`border-b border-border/60 transition-colors last:border-b-0 ${
                    run.verdict === "fail"
                      ? "bg-red-500/8 hover:bg-red-500/12"
                      : run.verdict === "pass_with_warning"
                        ? "bg-amber-500/8 hover:bg-amber-500/12"
                        : idx % 2 === 1
                          ? "bg-muted/20 hover:bg-muted/30"
                          : "hover:bg-muted/20"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {run.row_index != null ? run.row_index + 1 : idx + 1}
                  </td>

                  {columnKeys.map((col) => (
                    <td
                      key={col}
                      className="max-w-[200px] truncate px-4 py-3 text-foreground"
                      title={
                        run.dataset_snapshot?.[col] != null
                          ? String(run.dataset_snapshot[col])
                          : ""
                      }
                    >
                      {run.dataset_snapshot?.[col] != null ? (
                        String(run.dataset_snapshot[col])
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  ))}

                  <td className="px-4 py-3">
                    <VerdictBadge verdict={run.verdict} status={run.status} />
                  </td>

                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {formatDuration(run.started_at, run.finished_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {run.failed_step ? (
                        <span
                          className="max-w-[180px] truncate text-xs text-red-400"
                          title={run.failed_step}
                        >
                          {run.failed_step}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}

                      <FailureReasonBadge reason={run.failure_reason} />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {run.run_id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/projects/${projectId}/test-runs/${run.run_id}`)
                        }
                      >
                        Detail
                      </Button>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {runs.length === 0 && (
                <tr>
                  <td
                    colSpan={columnKeys.length + 5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
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