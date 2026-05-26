import { useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { LayoutList, Sheet, CheckCircle2, XCircle, Clock, ShieldAlert, AlertTriangle, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { useTestResults } from "@/features/test-results/hooks/useTestResults";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import ScreenshotList from "@/shared/components/common/ScreenshotList";
import { parseAgentError } from "@/shared/utils/parseAgentError";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const ms = new Date(finishedAt) - new Date(startedAt);
  if (ms < 0) return null;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function getRunStyle(verdict) {
  if (verdict === "pass") return { stripe: "border-l-emerald-400", bg: "bg-emerald-500/8" };
  if (verdict === "pass_with_warning") return { stripe: "border-l-amber-400", bg: "bg-amber-500/8" };
  if (verdict === "fail") return { stripe: "border-l-red-400", bg: "bg-red-500/8" };
  if (verdict === "error") return { stripe: "border-l-orange-400", bg: "bg-orange-500/8" };
  return { stripe: "border-l-blue-400", bg: "bg-card" };
}

function getSheetRunStyle(status, passed, failed) {
  if (status === "running" || status === "queued") return { stripe: "border-l-blue-400", bg: "bg-card" };
  if (failed > 0 && passed === 0) return { stripe: "border-l-red-400", bg: "bg-red-500/8" };
  if (failed > 0) return { stripe: "border-l-amber-400", bg: "bg-amber-500/8" };
  return { stripe: "border-l-emerald-400", bg: "bg-emerald-500/8" };
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

/* ─── Step Item ───────────────────────────────────────────────────────── */

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

/* ─── Run Card ────────────────────────────────────────────────────────── */

function RunCard({ run, projectId }) {
  const navigate = useNavigate();
  const style = getRunStyle(run.verdict);
  const isLive = run.status === "running" || run.status === "queued";

  return (
    <div className={`rounded-2xl border border-border overflow-hidden shadow-sm border-l-4 ${style.stripe} ${style.bg}`}>
      <button onClick={() => navigate(`/projects/${projectId}/test-runs/${run.id}`)}
        className="w-full px-5 py-4 text-left hover:bg-black/[0.02] transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1 shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <LayoutList className="size-3" /> Test Case
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>
                )}
                {run.testCaseId && projectId ? (
                  <span
                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/test-cases/${run.testCaseId}`); }}
                    className="font-semibold text-foreground truncate hover:text-brand-400 hover:underline transition-colors cursor-pointer"
                  >
                    {run.projectName}
                  </span>
                ) : (
                  <p className="font-semibold text-foreground truncate">{run.projectName}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{run.executedAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {run.verdict === "pass" && (
              <span className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <CheckCircle2 className="size-4" /> Passed
              </span>
            )}
            {run.verdict === "pass_with_warning" && (
              <span className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                <ShieldAlert className="size-4" /> Pass (no assertion)
              </span>
            )}
            {run.verdict === "fail" && (
              <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
                <XCircle className="size-4" /> Failed
              </span>
            )}
            {run.verdict === "error" && (
              <span className="flex items-center gap-1 text-orange-400 text-sm font-medium">
                <AlertTriangle className="size-4" /> Error
              </span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-blue-400 text-sm font-medium">
                <Clock className="size-4 animate-pulse" /> Running
              </span>
            )}
            <span className="text-xs text-muted-foreground">View details →</span>
          </div>
        </div>
      </button>

    </div>
  );
}

/* ─── Sheet Run Card ──────────────────────────────────────────────────── */

function SheetRunCard({ run, onClick }) {
  const style = getSheetRunStyle(run.status, run.passed ?? 0, run.failed ?? 0);
  const isLive = run.status === "queued" || run.status === "running";
  const total = run.totalCases ?? 0;
  const passed = run.passed ?? 0;
  const failed = run.failed ?? 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const duration = formatDuration(run.startedAt, run.completedAt);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border border-border overflow-hidden shadow-sm border-l-4 ${style.stripe} ${style.bg} hover:shadow-md transition-shadow`}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1 shrink-0 rounded-md bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-400">
              <Sheet className="size-3" /> Test Sheet
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>
                )}
                <p className="font-semibold text-foreground truncate">{run.sheetName}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total} test case{total !== 1 ? "s" : ""}
                {duration ? ` · ${duration}` : ""}
                {" · "}{formatDateTime(run.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 className="size-4" /> {passed}
              </span>
              {failed > 0 && (
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <XCircle className="size-4" /> {failed}
                </span>
              )}
              {isLive && (
                <span className="flex items-center gap-1 text-blue-400 font-medium">
                  <Clock className="size-4 animate-pulse" /> Running
                </span>
              )}
            </div>
            {total > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${passRate}%` }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-10">{passRate}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">View report →</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Pagination ──────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {from}–{to} of {total} runs
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "cases", label: "Test Cases", icon: LayoutList },
  { id: "sheets", label: "Test Sheets", icon: Sheet },
  { id: "datasets", label: "Dataset Runs", icon: Database },
];

export default function TestResultsPage() {
  const { project, projectId } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cases");

  const {
    individualRuns = [],
    sheetRuns = [],
    datasetBatches = [],
    summary = { totalRuns: 0, passed: 0, failed: 0, passRate: "0%" },
    pagination = { total: 0, page: 1, pageSize: 15, totalPages: 1 },
    setPage,
    loading,
    error,
  } = useTestResults(projectId ?? project?.id);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setPage]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading results…" />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={() => window.location.reload()} onRetry={() => window.location.reload()} />;
  }

  const pid = projectId ?? project?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Test Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">All test case and test sheet runs</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === "cases" ? pagination.total : id === "sheets" ? sheetRuns.length : datasetBatches.length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                isActive ? "bg-muted text-muted-foreground" : "bg-muted/60 text-muted-foreground"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab: Test Cases */}
      {activeTab === "cases" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-medium">Total Runs</p>
              <p className="text-2xl font-bold text-foreground mt-1">{summary.totalRuns}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.passed} passed · {summary.failed} failed</p>
            </div>
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-medium">Passed</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{summary.passed}</p>
              <p className="text-xs text-muted-foreground mt-1">out of {summary.totalRuns} runs</p>
            </div>
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-medium">Pass Rate</p>
              <p className="text-2xl font-bold text-foreground mt-1">{summary.passRate}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                  style={{ width: summary.passRate }} />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {individualRuns.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16">
                <span className="text-4xl">🔬</span>
                <p className="font-medium text-muted-foreground">No test case runs yet</p>
                <p className="text-sm text-muted-foreground/60">Run a test case to see results here</p>
              </div>
            ) : (
              individualRuns.map((run) => (
                <RunCard
                  key={`run-${run.id}`}
                  run={run}
                  projectId={pid}
                />
              ))
            )}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Tab: Test Sheets */}
      {activeTab === "sheets" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-medium">Sheet Runs</p>
              <p className="text-2xl font-bold text-foreground mt-1">{sheetRuns.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {sheetRuns.reduce((s, r) => s + (r.totalCases ?? 0), 0)} total cases executed
              </p>
            </div>
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-medium">Passed</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">
                {sheetRuns.reduce((s, r) => s + (r.passed ?? 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">cases across all sheet runs</p>
            </div>
            <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              {(() => {
                const total = sheetRuns.reduce((s, r) => s + (r.totalCases ?? 0), 0);
                const passed = sheetRuns.reduce((s, r) => s + (r.passed ?? 0), 0);
                const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
                return (
                  <>
                    <p className="text-xs text-muted-foreground font-medium">Pass Rate</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{rate}%</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${rate}%` }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {sheetRuns.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16">
                <span className="text-4xl">📋</span>
                <p className="font-medium text-muted-foreground">No test sheet runs yet</p>
                <p className="text-sm text-muted-foreground/60">Run a test sheet to see results here</p>
              </div>
            ) : (
              [...sheetRuns]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((run) => (
                  <SheetRunCard
                    key={`sheet-${run.id}`}
                    run={run}
                    onClick={() =>
                      navigate(`/projects/${pid}/test-runs/sheet/${run.id}`)
                    }
                  />
                ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Dataset Runs */}
      {activeTab === "datasets" && (
        <div className="space-y-3">
          {datasetBatches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16">
              <Database className="size-8 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">No dataset runs yet</p>
              <p className="text-sm text-muted-foreground/60">Run a dataset batch from a test case to see results here</p>
            </div>
          ) : (
            datasetBatches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                onClick={() => navigate(`/projects/${pid}/test-runs/batches/${batch.id}`)}
                className="w-full text-left rounded-2xl border border-border bg-card px-5 py-4 shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                      <Database className="size-4 text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {batch.test_case_title ?? `Test Case #${batch.test_case_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {batch.dataset_name ?? `Dataset #${batch.dataset_id}`}
                        {" · "}Batch #{batch.id}
                        {batch.created_at ? ` · ${new Date(batch.created_at).toLocaleString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">
                        <CheckCircle2 className="size-4" />
                        {batch.passed_rows ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-400 font-medium">
                        <XCircle className="size-4" />
                        {batch.failed_rows ?? 0}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        / {batch.total_rows ?? 0} rows
                      </span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      batch.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-blue-500/10 text-blue-400"
                    }`}>
                      {batch.status}
                    </span>
                    <span className="text-xs text-muted-foreground">View →</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
