import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useTestSheetRun } from "@/features/test-collection/hooks/useTestSheetRun";
import { getTestRunDetail, analyzeSheetRun } from "@/features/test-results/api/testResultsApi";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import StepResult from "@/shared/components/common/StepResult";
import AiAnalysisSection from "@/shared/components/common/AiAnalysisSection";
import { Badge } from "@/components/ui/badge";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  if (ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

function StatCard({ label, value, color }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-4 ${color}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm font-medium opacity-70">{label}</span>
    </div>
  );
}

const VERDICT_ICON = {
  pass:  <CheckCircle2 className="size-4 text-emerald-500" />,
  fail:  <XCircle className="size-4 text-red-500" />,
  error: <AlertTriangle className="size-4 text-orange-500" />,
};

const ITEM_STATUS_BADGE = {
  completed: "bg-emerald-500/15 text-emerald-500",
  failed:    "bg-red-500/15 text-red-400",
  cancelled: "bg-muted text-muted-foreground",
  running:   "bg-yellow-500/15 text-yellow-500",
  queued:    "bg-brand-500/10 text-brand-400",
  pending:   "bg-muted text-muted-foreground",
};

/* ─── Test Case Item Row ──────────────────────────────────────────────────── */

function TestCaseItem({ item, idx, isExpanded, onToggle, stepData }) {
  const isLive = item.status === "running" || item.status === "queued";
  const hasRun = !!item.testRunId;

  return (
    <div className="border-b last:border-b-0">
      {/* Row header */}
      <button
        onClick={() => onToggle(item)}
        className="w-full flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-6 text-center text-xs font-mono text-muted-foreground">
            {idx + 1}
          </span>
          {VERDICT_ICON[item.verdict] ?? (
            <div className="size-4 shrink-0 rounded-full border-2 border-border" />
          )}
          <div className="min-w-0">
            <p className="font-medium truncate text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground truncate">{item.goal}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isLive && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(item.startedAt, item.finishedAt)}
          </span>
          <Badge className={`capitalize text-xs ${ITEM_STATUS_BADGE[item.status] ?? "bg-muted text-muted-foreground"}`}>
            {item.verdict ?? item.status}
          </Badge>
          {hasRun && (
            <div className="flex items-center gap-1 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {isExpanded ? "Hide" : "Steps"}
              <ChevronDown className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          )}
        </div>
      </button>

      {/* Expanded steps */}
      {isExpanded && hasRun && (
        <div className="border-t border-border bg-muted/20 px-6 py-5">
          {stepData?.loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <LoadingSpinner size="sm" /> Loading steps…
            </div>
          ) : stepData?.error ? (
            <p className="text-sm text-red-400 py-2">{stepData.error}</p>
          ) : stepData?.steps?.length ? (
            <div>
              <p className="mb-4 text-xs font-medium text-muted-foreground">{stepData.steps.length} steps recorded</p>
              {stepData.steps.map((step, i) => (
                <StepResult key={step.id} step={step} stepIndex={i} isLast={i === stepData.steps.length - 1} />
              ))}
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-2 text-sm text-blue-400 py-2">
              <LoadingSpinner size="sm" /> Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">No steps recorded for this test case.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── AI Analysis ─────────────────────────────────────────────────────────── */


/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TestSuiteRunDetailPage() {
  const { projectId, runId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useTestSheetRun(runId);

  const [expandedItemId, setExpandedItemId] = useState(null);
  const [itemDetails, setItemDetails] = useState({}); // { [testRunId]: { steps, loading, error } }
  const prevItemStatusRef = useRef({});

  const handleToggleItem = async (item) => {
    if (!item.testRunId) return;

    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      return;
    }

    setExpandedItemId(item.id);

    // Only show loading spinner if not already cached
    if (!itemDetails[item.testRunId]) {
      setItemDetails((prev) => ({ ...prev, [item.testRunId]: { loading: true } }));
    }

    try {
      const detail = await getTestRunDetail(item.testRunId);
      setItemDetails((prev) => ({
        ...prev,
        [item.testRunId]: { steps: detail.steps ?? [], loading: false },
      }));
    } catch (e) {
      setItemDetails((prev) => ({
        ...prev,
        [item.testRunId]: { error: e?.message || "Failed to load steps", loading: false },
      }));
    }
  };

  // Auto-refresh steps for the expanded item whenever the sheet run polls (every 3s).
  // Keeps refreshing while the item is live, and does one final fetch when it completes.
  useEffect(() => {
    if (!expandedItemId || !data?.items) return;

    const item = data.items.find((i) => i.id === expandedItemId);
    if (!item?.testRunId) return;

    const isLive = ["running", "queued", "pending"].includes(item.status);
    const prev = prevItemStatusRef.current[item.id];
    const justCompleted = prev && ["running", "queued", "pending"].includes(prev) && !isLive;

    prevItemStatusRef.current[item.id] = item.status;

    if (!isLive && !justCompleted) return;

    getTestRunDetail(item.testRunId)
      .then((detail) => {
        setItemDetails((prev) => ({
          ...prev,
          [item.testRunId]: { steps: detail.steps ?? [], loading: false },
        }));
      })
      .catch(() => {});
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading run results..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={() => window.history.back()} />;
  }

  const run = data?.run;
  const items = data?.items ?? [];

  if (!run) return null;

  const passRate = run.totalCases > 0 ? Math.round((run.passed / run.totalCases) * 100) : 0;
  const isLive = ["queued", "running"].includes(run.status);

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(`/projects/${projectId}/test-runs`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Test Runs
        </button>

        <PageHeader
          title={
            <span className="break-words">
              Run #{run.id}
              {run.sheetName && (
                <>
                  <span className="mx-2 font-normal text-muted-foreground/50">/</span>
                  {run.testSuiteId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/suites/${run.testSuiteId}`)}
                      className="text-brand-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
                      title="Open test suite"
                    >
                      {run.sheetName}
                    </button>
                  ) : (
                    run.sheetName
                  )}
                </>
              )}
            </span>
          }
          description={
            isLive
              ? "Running… results update automatically"
              : `Completed ${run.completedAt ? new Date(run.completedAt).toLocaleString() : ""}`
          }
          action={
            isLive ? (
              <div className="flex items-center gap-2 rounded-lg border bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-500">
                <Clock className="size-4 animate-pulse" />
                Live
              </div>
            ) : null
          }
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={run.totalCases} color="bg-card border-border" />
        <StatCard label="Passed" value={run.passed} color="bg-emerald-500/10 border-emerald-500/20" />
        <StatCard label="Failed" value={(run.failed ?? 0) + (run.errored ?? 0)} color="bg-red-500/10 border-red-500/20" />
        <StatCard label="Pass Rate" value={`${passRate}%`} color="bg-brand-500/10 border-brand-500/20" />
      </div>

      {/* Progress Bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{run.passed + run.failed + (run.errored ?? 0)} / {run.totalCases} completed</span>
          <span>{formatDuration(run.startedAt, run.completedAt || new Date().toISOString())}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      {/* AI Analysis */}
      <AiAnalysisSection
        onAnalyze={() => analyzeSheetRun(runId)}
        isLive={isLive}
        initialAnalysis={run.aiAnalysis}
        description={isLive
          ? "Analysis will be available once the sheet run completes."
          : "Click \"Generate Analysis\" to get an AI-powered conclusion and actionable suggestions based on all test case results."}
      />

      {/* Test Case Items */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Test Case Results ({items.length})
        </h2>
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No test cases found.</div>
          ) : (
            items.map((item, idx) => (
              <TestCaseItem
                key={item.id}
                item={item}
                idx={idx}
                isExpanded={expandedItemId === item.id}
                onToggle={handleToggleItem}
                stepData={item.testRunId ? itemDetails[item.testRunId] : null}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
