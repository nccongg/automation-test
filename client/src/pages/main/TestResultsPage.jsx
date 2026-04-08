import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { LayoutList, Sheet, ChevronDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTestResults } from "@/features/test-results/hooks/useTestResults";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
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

function getRunStyle(result) {
  if (result === "Passed") return { stripe: "border-l-emerald-400", bg: "bg-emerald-50/30" };
  if (result === "Failed") return { stripe: "border-l-red-400", bg: "bg-red-50/30" };
  return { stripe: "border-l-blue-400", bg: "bg-white" };
}

function getSheetRunStyle(status, passed, failed) {
  if (status === "running" || status === "queued") return { stripe: "border-l-blue-400", bg: "bg-white" };
  if (failed > 0 && passed === 0) return { stripe: "border-l-red-400", bg: "bg-red-50/30" };
  if (failed > 0) return { stripe: "border-l-amber-400", bg: "bg-amber-50/20" };
  return { stripe: "border-l-emerald-400", bg: "bg-emerald-50/30" };
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

/* ─── Step Item ───────────────────────────────────────────────────────── */

const ERROR_CATEGORY_STYLE = {
  "Invalid API Key":       "bg-red-50 border-red-200 text-red-700",
  "Rate Limit Exceeded":   "bg-orange-50 border-orange-200 text-orange-700",
  "Authentication Failed": "bg-red-50 border-red-200 text-red-700",
  "Permission Denied":     "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Not Found":             "bg-slate-50 border-slate-200 text-slate-600",
  "Invalid Request":       "bg-orange-50 border-orange-200 text-orange-700",
  "Server Error":          "bg-red-50 border-red-200 text-red-700",
  "Timeout":               "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Connection Error":      "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Element Not Found":     "bg-orange-50 border-orange-200 text-orange-700",
  "Navigation Failed":     "bg-orange-50 border-orange-200 text-orange-700",
};

function StepErrorMessage({ raw }) {
  const parsed = parseAgentError(raw);
  if (parsed) {
    const style = ERROR_CATEGORY_STYLE[parsed.category] ?? "bg-slate-50 border-slate-200 text-slate-600";
    return (
      <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs ${style}`}>
        <span className="font-semibold">{parsed.category}</span>
        <span className="text-slate-600">{parsed.brief}</span>
      </div>
    );
  }
  return (
    <p className="text-xs text-slate-500 break-all">
      <span className="text-slate-400">Message: </span>{raw}
    </p>
  );
}

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
            {step.message && <StepErrorMessage raw={step.message} />}
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

/* ─── Run Card ────────────────────────────────────────────────────────── */

function RunCard({ run, isExpanded, onToggle, detail, detailLoadingId }) {
  const style = getRunStyle(run.result);
  const isLoading = detailLoadingId === run.id;
  const isLive = run.status === "running" || run.status === "queued";

  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden shadow-sm border-l-4 ${style.stripe} ${style.bg}`}>
      <button onClick={() => onToggle(run.id)}
        className="w-full px-5 py-4 text-left hover:bg-black/[0.02] transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
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
                <p className="font-semibold text-slate-800 truncate">{run.projectName}</p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{run.executedAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {run.result === "Passed" && (
              <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="size-4" /> Passed
              </span>
            )}
            {run.result === "Failed" && (
              <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <XCircle className="size-4" /> Failed
              </span>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                <Clock className="size-4 animate-pulse" /> Running
              </span>
            )}
            <div className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
              {isExpanded ? "Hide" : "Show steps"}
              <ChevronDown className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <LoadingSpinner size="sm" /> Loading steps…
            </div>
          ) : detail?.steps?.length ? (
            <div>
              <p className="mb-4 text-xs font-medium text-slate-400">{detail.steps.length} steps recorded</p>
              {detail.steps.map((step, i) => (
                <StepItem key={step.id} step={step} stepIndex={i} isLast={i === detail.steps.length - 1} />
              ))}
              {isLive && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-600">
                  <LoadingSpinner size="sm" /> Still running — refreshing every 3s
                </div>
              )}
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-2 text-sm text-blue-500 py-2">
              <LoadingSpinner size="sm" /> Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-slate-400">No steps recorded for this run.</p>
          )}
        </div>
      )}
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
      className={`w-full text-left rounded-2xl border border-slate-200 overflow-hidden shadow-sm border-l-4 ${style.stripe} ${style.bg} hover:shadow-md transition-shadow`}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1 shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
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
                <p className="font-semibold text-slate-800 truncate">{run.sheetName}</p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {total} test case{total !== 1 ? "s" : ""}
                {duration ? ` · ${duration}` : ""}
                {" · "}{formatDateTime(run.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="size-4" /> {passed}
              </span>
              {failed > 0 && (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <XCircle className="size-4" /> {failed}
                </span>
              )}
              {isLive && (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <Clock className="size-4 animate-pulse" /> Running
                </span>
              )}
            </div>
            {total > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${passRate}%` }} />
                </div>
                <span className="text-xs text-slate-400 tabular-nums w-10">{passRate}%</span>
              </div>
            )}
            <span className="text-xs text-slate-400">View report →</span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "cases", label: "Test Cases", icon: LayoutList },
  { id: "sheets", label: "Test Sheets", icon: Sheet },
];

export default function TestResultsPage() {
  const { project, projectId } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cases");

  const {
    individualRuns = [],
    sheetRuns = [],
    summary = { totalRuns: 0, passed: 0, failed: 0, passRate: "0%" },
    loading,
    error,
    expandedRunId,
    runDetails,
    detailLoadingId,
    toggleRunDetail,
  } = useTestResults(projectId ?? project?.id);

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
          <h1 className="text-2xl font-bold text-slate-800">Test Results</h1>
          <p className="mt-1 text-sm text-slate-400">All test case and test sheet runs</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === "cases" ? individualRuns.length : sheetRuns.length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                isActive ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
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
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Total Runs</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary.totalRuns}</p>
              <p className="text-xs text-slate-400 mt-1">{summary.passed} passed · {summary.failed} failed</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Passed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.passed}</p>
              <p className="text-xs text-slate-400 mt-1">out of {summary.totalRuns} runs</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Pass Rate</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{summary.passRate}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                  style={{ width: summary.passRate }} />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {individualRuns.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
                <span className="text-4xl">🔬</span>
                <p className="font-medium text-slate-500">No test case runs yet</p>
                <p className="text-sm text-slate-400">Run a test case to see results here</p>
              </div>
            ) : (
              individualRuns.map((run) => (
                <RunCard
                  key={`run-${run.id}`}
                  run={run}
                  isExpanded={expandedRunId === run.id}
                  onToggle={toggleRunDetail}
                  detail={runDetails[run.id]}
                  detailLoadingId={detailLoadingId}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Test Sheets */}
      {activeTab === "sheets" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Sheet Runs</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{sheetRuns.length}</p>
              <p className="text-xs text-slate-400 mt-1">
                {sheetRuns.reduce((s, r) => s + (r.totalCases ?? 0), 0)} total cases executed
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Passed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {sheetRuns.reduce((s, r) => s + (r.passed ?? 0), 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">cases across all sheet runs</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              {(() => {
                const total = sheetRuns.reduce((s, r) => s + (r.totalCases ?? 0), 0);
                const passed = sheetRuns.reduce((s, r) => s + (r.passed ?? 0), 0);
                const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
                return (
                  <>
                    <p className="text-xs text-slate-400 font-medium">Pass Rate</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{rate}%</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
                <span className="text-4xl">📋</span>
                <p className="font-medium text-slate-500">No test sheet runs yet</p>
                <p className="text-sm text-slate-400">Run a test sheet to see results here</p>
              </div>
            ) : (
              [...sheetRuns]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((run) => (
                  <SheetRunCard
                    key={`sheet-${run.id}`}
                    run={run}
                    onClick={() =>
                      navigate(`/projects/${pid}/collections/${run.testSheetId}/runs/${run.id}`)
                    }
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
