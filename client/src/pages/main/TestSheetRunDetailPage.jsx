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
import { getTestRunDetail } from "@/features/test-results/api/testResultsApi";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
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

function getStepStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "passed" || s === "success" || s === "completed")
    return { node: "bg-emerald-500 ring-emerald-200", tag: "bg-emerald-100 text-emerald-700" };
  if (s === "failed" || s === "error")
    return { node: "bg-red-500 ring-red-200", tag: "bg-red-100 text-red-700" };
  if (s === "running")
    return { node: "bg-blue-500 ring-blue-200", tag: "bg-blue-100 text-blue-700" };
  return { node: "bg-slate-300 ring-slate-100", tag: "bg-slate-100 text-slate-500" };
}

/* ─── Step Item ───────────────────────────────────────────────────────────── */

function StepItem({ step, stepIndex, isLast }) {
  const style = getStepStyle(step.status);
  return (
    <div className="relative flex gap-3">
      {!isLast && <div className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-100" />}
      <div className="relative z-10 mt-0.5 flex-shrink-0">
        <div className={`h-7 w-7 rounded-full ring-4 ${style.node} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>
      <div className="mb-4 flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">{step.title}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
            {step.status}
          </span>
        </div>
        {(step.action || step.message || step.currentUrl) && (
          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
            {step.action && <p><span className="text-slate-400">Action: </span>{step.action}</p>}
            {step.message && <p><span className="text-slate-400">Message: </span>{step.message}</p>}
            {step.currentUrl && (
              <p>
                <span className="text-slate-400">URL: </span>
                <a href={step.currentUrl} target="_blank" rel="noreferrer"
                  className="text-blue-500 hover:underline break-all">{step.currentUrl}</a>
              </p>
            )}
          </div>
        )}
        {step.thoughtText && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-slate-400">Thought: </span>{step.thoughtText}
          </div>
        )}
        {step.extractedContent && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-amber-500">Extracted: </span>{step.extractedContent}
          </div>
        )}
        {step.screenshots?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.screenshots.map((shot) =>
              shot.imageUrl ? (
                <a key={shot.id} href={shot.imageUrl} target="_blank" rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <img src={shot.imageUrl} alt={`Step ${step.stepNo}`}
                    className="h-28 w-44 object-cover transition-opacity group-hover:opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 text-xs font-medium px-2 py-1 rounded-md transition-opacity">
                      View
                    </span>
                  </div>
                </a>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
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
  completed: "bg-emerald-100 text-emerald-700",
  failed:    "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  running:   "bg-yellow-100 text-yellow-600",
  queued:    "bg-indigo-50 text-indigo-600",
  pending:   "bg-slate-100 text-slate-500",
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
        className="w-full flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-6 text-center text-xs font-mono text-muted-foreground">
            {idx + 1}
          </span>
          {VERDICT_ICON[item.verdict] ?? (
            <div className="size-4 shrink-0 rounded-full border-2 border-slate-300" />
          )}
          <div className="min-w-0">
            <p className="font-medium truncate text-slate-800">{item.title}</p>
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
          <Badge className={`capitalize text-xs ${ITEM_STATUS_BADGE[item.status] ?? "bg-slate-100 text-slate-600"}`}>
            {item.verdict ?? item.status}
          </Badge>
          {hasRun && (
            <div className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
              {isExpanded ? "Hide" : "Steps"}
              <ChevronDown className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          )}
        </div>
      </button>

      {/* Expanded steps */}
      {isExpanded && hasRun && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
          {stepData?.loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <LoadingSpinner size="sm" /> Loading steps…
            </div>
          ) : stepData?.error ? (
            <p className="text-sm text-red-500 py-2">{stepData.error}</p>
          ) : stepData?.steps?.length ? (
            <div>
              <p className="mb-4 text-xs font-medium text-slate-400">{stepData.steps.length} steps recorded</p>
              {stepData.steps.map((step, i) => (
                <StepItem key={step.id} step={step} stepIndex={i} isLast={i === stepData.steps.length - 1} />
              ))}
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-2 text-sm text-blue-500 py-2">
              <LoadingSpinner size="sm" /> Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-slate-400">No steps recorded for this test case.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TestSheetRunDetailPage() {
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
          title={`Run #${run.id} — ${run.sheetName}`}
          description={
            isLive
              ? "Running… results update automatically"
              : `Completed ${run.completedAt ? new Date(run.completedAt).toLocaleString() : ""}`
          }
          action={
            isLive ? (
              <div className="flex items-center gap-2 rounded-lg border bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700">
                <Clock className="size-4 animate-pulse" />
                Live
              </div>
            ) : null
          }
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={run.totalCases} color="bg-white" />
        <StatCard label="Passed" value={run.passed} color="bg-emerald-50 border-emerald-200" />
        <StatCard label="Failed" value={run.failed} color="bg-red-50 border-red-200" />
        <StatCard label="Pass Rate" value={`${passRate}%`} color="bg-indigo-50 border-indigo-200" />
      </div>

      {/* Progress Bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{run.passed + run.failed + (run.errored ?? 0)} / {run.totalCases} completed</span>
          <span>{formatDuration(run.startedAt, run.completedAt || new Date().toISOString())}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      {/* Test Case Items */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Test Case Results ({items.length})
        </h2>
        <div className="rounded-xl border bg-white divide-y overflow-hidden">
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
