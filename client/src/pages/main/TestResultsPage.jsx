import { useTestResults } from "@/features/test-results/hooks/useTestResults";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorBanner from "@/shared/components/common/ErrorBanner";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function getResultStyle(result) {
  if (result === "Passed")
    return {
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      stripe: "border-l-emerald-400",
      rowBg: "bg-emerald-50/30",
    };
  if (result === "Failed")
    return {
      badge: "bg-red-100 text-red-700 border border-red-200",
      stripe: "border-l-red-400",
      rowBg: "bg-red-50/30",
    };
  return {
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    stripe: "border-l-blue-400",
    rowBg: "bg-white",
  };
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

/* ─── Stat Card ───────────────────────────────────────────────────────── */

function StatCard({ label, value, subtext, color, icon, progress }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-800 leading-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
            {value}
          </p>
        </div>
      </div>
      {subtext && <p className="mt-3 text-xs text-slate-400">{subtext}</p>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Step Item ───────────────────────────────────────────────────────── */

function StepItem({ step, stepIndex, isLast }) {
  const style = getStepStyle(step.status);

  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-100" />
      )}

      {/* Node */}
      <div className="relative z-10 mt-0.5 flex-shrink-0">
        <div className={`h-7 w-7 rounded-full ring-4 ${style.node} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">{step.title}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
            {step.status}
          </span>
        </div>

        {(step.action || step.message || step.currentUrl) && (
          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
            {step.action && (
              <p><span className="text-slate-400">Action: </span>{step.action}</p>
            )}
            {step.message && (
              <p><span className="text-slate-400">Message: </span>{step.message}</p>
            )}
            {step.currentUrl && (
              <p>
                <span className="text-slate-400">URL: </span>
                <a
                  href={step.currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:text-blue-600 hover:underline break-all"
                >
                  {step.currentUrl}
                </a>
              </p>
            )}
          </div>
        )}

        {step.thoughtText && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-slate-400">Thought: </span>
            {step.thoughtText}
          </div>
        )}

        {step.extractedContent && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-amber-500">Extracted: </span>
            {step.extractedContent}
          </div>
        )}

        {step.screenshots?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.screenshots.map((shot) =>
              shot.imageUrl ? (
                <a
                  key={shot.id}
                  href={shot.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="group relative block overflow-hidden rounded-lg border border-slate-200 shadow-sm"
                >
                  <img
                    src={shot.imageUrl}
                    alt={`Step ${step.stepNo} screenshot`}
                    className="h-28 w-44 object-cover transition-opacity group-hover:opacity-80"
                  />
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
  const style = getResultStyle(run.result);
  const isLoading = detailLoadingId === run.id;
  const isLive = run.status === "running" || run.status === "queued";
  const total = run.totalTests ?? 0;
  const passed = run.passed ?? 0;
  const failed = run.failed ?? 0;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden shadow-sm border-l-4 ${style.stripe} ${style.rowBg}`}>
      {/* Header */}
      <button
        onClick={() => onToggle(run.id)}
        className="w-full px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
              )}
              <h3 className="font-semibold text-slate-800">{run.projectName}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                {run.result}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-slate-500">{total} tests</span>
              <span className="text-emerald-600 font-medium">✓ {passed} passed</span>
              {failed > 0 && (
                <span className="text-red-600 font-medium">✗ {failed} failed</span>
              )}
              {run.duration && (
                <span className="text-slate-400">· {run.duration}</span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 w-32 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 tabular-nums">{pct}% pass</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <div className="text-right text-xs text-slate-400 leading-5">
              <p>{run.executedAt}</p>
              <p>by <span className="font-medium text-slate-600">{run.executedBy}</span></p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              {isExpanded ? "Hide" : "Show steps"}
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded steps */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <LoadingSpinner size="sm" />
              Loading steps…
            </div>
          ) : detail?.steps?.length ? (
            <div>
              <p className="mb-4 text-xs font-medium text-slate-400">
                {detail.steps.length} steps recorded
              </p>
              {detail.steps.map((step, i) => (
                <StepItem
                  key={step.id}
                  step={step}
                  stepIndex={i}
                  isLast={i === detail.steps.length - 1}
                />
              ))}
              {isLive && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-600">
                  <LoadingSpinner size="sm" />
                  Still running — refreshing every 3s
                </div>
              )}
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-2 text-sm text-blue-500 py-2">
              <LoadingSpinner size="sm" />
              Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-slate-400">No steps recorded for this run.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function TestResultsPage() {
  const {
    results,
    loading,
    error,
    expandedRunId,
    runDetails,
    detailLoadingId,
    toggleRunDetail,
  } = useTestResults();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading results…" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBanner message={error} fullWidth onRetry={() => window.location.reload()} />
    );
  }

  const summary = results?.summary || {};
  const recentRuns = results?.recentRuns || [];
  const passRateNum = parseFloat((summary.passRate || "0").replace("%", "")) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Results</h1>
          <p className="mt-1 text-sm text-slate-400">Track your test runs and results</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Runs"
          value={summary.totalRuns ?? 0}
          subtext={`Last: ${summary.lastRunDate || "—"}`}
          color="bg-slate-100"
          icon="🚀"
        />
        <StatCard
          label="Pass Rate"
          value={summary.passRate || "0%"}
          subtext={`${summary.passed ?? 0} tests passed`}
          color="bg-emerald-100"
          icon="✅"
          progress={passRateNum}
        />
        <StatCard
          label="Failed"
          value={summary.failed ?? 0}
          subtext={`${summary.skipped ?? 0} skipped`}
          color="bg-red-100"
          icon="❌"
        />
        <StatCard
          label="Avg Duration"
          value={summary.avgDuration || "—"}
          subtext="per test run"
          color="bg-amber-100"
          icon="⏱️"
        />
      </div>

      {/* Runs list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Recent Runs</h2>
          <span className="text-xs text-slate-400">{recentRuns.length} total</span>
        </div>

        {recentRuns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
            <span className="text-4xl">🔬</span>
            <p className="font-medium text-slate-500">No test runs yet</p>
            <p className="text-sm text-slate-400">Run a test to see results here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                isExpanded={expandedRunId === run.id}
                onToggle={toggleRunDetail}
                detail={runDetails[run.id]}
                detailLoadingId={detailLoadingId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
