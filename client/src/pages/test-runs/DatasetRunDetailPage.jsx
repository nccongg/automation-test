import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

import {
  getBatchDetail,
  batchReplayTestRun,
} from "@/features/test-results/api/testResultsApi";

import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { SkeletonDetail } from "@/shared/components/common/Skeleton";
import PageHeader from "@/shared/components/common/PageHeader";
import AiAnalysisSection from "@/shared/components/common/AiAnalysisSection";

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

function buildDatasetRunAnalysis(batch, runs) {
  const totalRows = Number(batch?.total_rows ?? runs.length ?? 0);
  const passedRows = Number(batch?.passed_rows ?? 0);
  const failedRows = Number(batch?.failed_rows ?? 0);
  const completedRows = Number(batch?.completed_rows ?? 0);

  const failedRuns = runs.filter((run) => run.verdict === "fail");
  const errorRuns = runs.filter((run) => run.verdict === "error");
  const warningRuns = runs.filter((run) => run.verdict === "pass_with_warning");

  const passRate =
    totalRows > 0 ? Math.round((passedRows / totalRows) * 100) : 0;

  const failureReasons = Object.entries(
    failedRuns.reduce((acc, run) => {
      const key = run.failure_reason || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const failedRowsText = failedRuns
    .map((run) =>
      run.row_index !== null && run.row_index !== undefined
        ? `Row ${run.row_index + 1}`
        : null,
    )
    .filter(Boolean)
    .join(", ");

  const conclusion =
    failedRows > 0 || errorRuns.length > 0
      ? `This dataset run needs review. ${failedRows} row(s) failed and ${errorRuns.length} row(s) had errors.`
      : "This dataset run passed successfully. No failed rows were found.";

  const summary = `This run executed ${totalRows} dataset row(s). ${completedRows} row(s) completed, ${passedRows} passed, ${failedRows} failed, and the pass rate is ${passRate}%.`;

  const keyFindings = [
    failedRows > 0 && failedRowsText
      ? `Failed row(s): ${failedRowsText}.`
      : null,
    warningRuns.length > 0
      ? `${warningRuns.length} row(s) passed with warning and may need manual review.`
      : null,
    failureReasons.length > 0
      ? `Main failure reason(s): ${failureReasons
          .map(([reason, count]) => `${reason} (${count})`)
          .join(", ")}.`
      : null,
  ].filter(Boolean);

  const recommendations = [
    failedRows > 0
      ? "Open the failed row details and check the failed step, failure reason, and screenshot evidence."
      : null,
    failureReasons.length > 0
      ? "Review whether the failure is caused by incorrect test data, unstable selectors, or an actual application defect."
      : null,
    warningRuns.length > 0
      ? "Review warning rows manually because they may have passed without a strong assertion."
      : null,
    failedRows === 0 && warningRuns.length === 0
      ? "No immediate action is required for this dataset run."
      : null,
  ].filter(Boolean);

  return {
    conclusion,
    summary,
    keyFindings,
    recommendations,
    failureReasons,
    warningCount: warningRuns.length,
  };
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
      .filter((run) => run.verdict === "fail")
      .map((run) => run.row_index)
      .filter((index) => index != null);

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
      <SkeletonDetail />
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
  const failedCount = runs.filter((run) => run.verdict === "fail").length;

  const columnKeys = (() => {
    const snap = runs.find((run) => run.dataset_snapshot)?.dataset_snapshot;
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

      <AiAnalysisSection
        onAnalyze={() =>
          Promise.resolve(buildDatasetRunAnalysis(batch, runs ?? []))
        }
        isLive={isRunning}
        initialAnalysis={batch.aiAnalysis ?? batch.ai_analysis ?? null}
        description={
          isRunning
            ? "Analysis will be available once the dataset run completes."
            : 'Click "Generate Analysis" to get an AI-powered conclusion and actionable suggestions based on all dataset row results.'
        }
      />

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
                          navigate(
                            `/projects/${projectId}/test-runs/${run.run_id}`,
                          )
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