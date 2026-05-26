import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { useTestSheetRun } from "@/features/test-collection/hooks/useTestSheetRun";
import { getTestRunDetail, analyzeSheetRun } from "@/features/test-results/api/testResultsApi";
import { parseAgentError } from "@/shared/utils/parseAgentError";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import ScreenshotList from "@/shared/components/common/ScreenshotList";
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
    return { node: "bg-emerald-500 ring-emerald-500/20", tag: "bg-emerald-500/15 text-emerald-500" };
  if (s === "failed" || s === "error")
    return { node: "bg-red-500 ring-red-500/20", tag: "bg-red-500/15 text-red-400" };
  if (s === "running")
    return { node: "bg-blue-500 ring-blue-500/20", tag: "bg-blue-500/15 text-blue-400" };
  return { node: "bg-muted-foreground/40 ring-border", tag: "bg-muted text-muted-foreground" };
}

/* ─── Step Error Message ──────────────────────────────────────────────────── */

const ERROR_CATEGORY_STYLE = {
  "Invalid API Key":       "bg-red-500/10 border-red-500/20 text-red-400",
  "Rate Limit Exceeded":   "bg-orange-500/10 border-orange-500/20 text-orange-400",
  "Authentication Failed": "bg-red-500/10 border-red-500/20 text-red-400",
  "Permission Denied":     "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  "Not Found":             "bg-muted border-border text-muted-foreground",
  "Invalid Request":       "bg-orange-500/10 border-orange-500/20 text-orange-400",
  "Server Error":          "bg-red-500/10 border-red-500/20 text-red-400",
  "Timeout":               "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  "Connection Error":      "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  "Element Not Found":     "bg-orange-500/10 border-orange-500/20 text-orange-400",
  "Navigation Failed":     "bg-orange-500/10 border-orange-500/20 text-orange-400",
};

function StepErrorMessage({ raw }) {
  const parsed = parseAgentError(raw);
  if (parsed) {
    const style = ERROR_CATEGORY_STYLE[parsed.category] ?? "bg-muted border-border text-muted-foreground";
    return (
      <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs ${style}`}>
        <span className="font-semibold">{parsed.category}</span>
        <span className="text-muted-foreground">{parsed.brief}</span>
      </div>
    );
  }
  return (
    <p className="text-xs text-muted-foreground break-all">
      <span className="text-muted-foreground/60">Message: </span>{raw}
    </p>
  );
}

/* ─── Step Item ───────────────────────────────────────────────────────────── */

function StepItem({ step, stepIndex, isLast }) {
  const style = getStepStyle(step.status);
  return (
    <div className="relative flex gap-3">
      {!isLast && <div className="absolute left-[13px] top-7 h-full w-0.5 bg-border" />}
      <div className="relative z-10 mt-0.5 flex-shrink-0">
        <div className={`h-7 w-7 rounded-full ring-4 ${style.node} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>
      <div className="mb-4 flex-1 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{step.title}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
            {step.status}
          </span>
        </div>
        {(step.action || step.message || step.currentUrl) && (
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {step.action && <p><span className="text-muted-foreground/60">Action: </span>{step.action}</p>}
            {step.message && <StepErrorMessage raw={step.message} />}
            {step.currentUrl && (
              <p>
                <span className="text-muted-foreground/60">URL: </span>
                <a href={step.currentUrl} target="_blank" rel="noreferrer"
                  className="text-blue-500 hover:underline break-all">{step.currentUrl}</a>
              </p>
            )}
          </div>
        )}
        {step.thoughtText && (
          <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-muted-foreground/60">Thought: </span>{step.thoughtText}
          </div>
        )}
        {step.extractedContent && (
          <div className="mt-2 rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-amber-500">Extracted: </span>{step.extractedContent}
          </div>
        )}
        <ScreenshotList screenshots={step.screenshots} stepNo={step.stepNo} />
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
                <StepItem key={step.id} step={step} stepIndex={i} isLast={i === stepData.steps.length - 1} />
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

function AiAnalysisSection({ runId, isLive }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const result = await analyzeSheetRun(runId);
      setAnalysis(result);
    } catch (e) {
      setAnalysisError(e?.message || "Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-foreground">AI Analysis</h2>
        </div>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing || isLive}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500/8 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? (
              <>
                <span className="size-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                {isLive ? "Run must complete first" : "Generate Analysis"}
              </>
            )}
          </button>
        )}
        {analysis && (
          <button
            onClick={() => { setAnalysis(null); setAnalysisError(""); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {!analysis && !analyzing && !analysisError && (
          <p className="text-sm text-muted-foreground">
            {isLive
              ? "Analysis will be available once the sheet run completes."
              : "Click \"Generate Analysis\" to get an AI-powered conclusion and actionable suggestions based on all test case results."}
          </p>
        )}

        {analysisError && (
          <p className="text-sm text-red-400">{analysisError}</p>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="rounded-lg bg-brand-500/8 border border-brand-500/15 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-1.5">Conclusion</p>
              <p className="text-sm text-foreground leading-relaxed">{analysis.conclusion}</p>
            </div>

            {analysis.suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="size-3.5 text-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggestions</p>
                </div>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

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
          title={`Run #${run.id} — ${run.sheetName}`}
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
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      {/* AI Analysis */}
      <AiAnalysisSection runId={runId} isLive={isLive} />

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
