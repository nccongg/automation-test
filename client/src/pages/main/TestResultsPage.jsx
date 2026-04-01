import { useTestResults } from "@/features/test-results/hooks/useTestResults";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorBanner from "@/shared/components/common/ErrorBanner";
import PageHeader from "@/shared/components/common/PageHeader";

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {subtext && (
        <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>
      )}
    </div>
  );
}

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
        <LoadingSpinner size="lg" label="Loading test results..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBanner
        message={error}
        fullWidth
        onRetry={() => window.location.reload()}
      />
    );
  }

  const summary = results?.summary || {};
  const recentRuns = results?.recentRuns || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test Results"
        description="View test execution history and analytics"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Runs"
          value={summary.totalRuns || 0}
          subtext={`Last run: ${summary.lastRunDate || "N/A"}`}
        />
        <StatCard
          label="Pass Rate"
          value={summary.passRate || "0%"}
          subtext={`${summary.passed || 0} passed`}
        />
        <StatCard
          label="Failed"
          value={summary.failed || 0}
          subtext={`${summary.skipped || 0} skipped`}
        />
        <StatCard
          label="Avg Duration"
          value={summary.avgDuration || "-"}
          subtext="Per test run"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Test Runs</h2>

        <div className="rounded-xl border bg-white">
          <div className="grid gap-px">
            {recentRuns.map((run) => {
              const detail = runDetails[run.id];

              return (
                <div key={run.id} className="divide-y">
                  <div className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{run.projectName}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            run.result === "Passed"
                              ? "bg-emerald-100 text-emerald-700"
                              : run.result === "Failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {run.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {run.status}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{run.totalTests} tests</span>
                        <span>{run.passed} passed</span>
                        <span>{run.failed} failed</span>
                        <span>Duration: {run.duration}</span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      <div>{run.executedAt}</div>
                      <div>by {run.executedBy}</div>

                      <button
                        onClick={() => toggleRunDetail(run.id)}
                        className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {expandedRunId === run.id
                          ? "Hide details"
                          : "View details"}
                      </button>
                    </div>
                  </div>

                  {expandedRunId === run.id && (
                    <div className="bg-slate-50 p-4">
                      {detailLoadingId === run.id ? (
                        <div className="text-sm text-muted-foreground">
                          Loading step details...
                        </div>
                      ) : detail?.steps?.length ? (
                        <div className="space-y-4">
                          {detail.steps.map((step) => (
                            <div
                              key={step.id}
                              className="rounded-xl border bg-white p-4 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold">
                                  Step {step.stepNo}: {step.title}
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                  {step.status}
                                </span>
                              </div>

                              <div className="mt-3 space-y-2 text-sm">
                                {step.action && (
                                  <div>
                                    <span className="font-medium">Action:</span>{" "}
                                    {step.action}
                                  </div>
                                )}

                                {step.message && (
                                  <div>
                                    <span className="font-medium">
                                      Message:
                                    </span>{" "}
                                    {step.message}
                                  </div>
                                )}

                                {step.currentUrl && (
                                  <div className="break-all">
                                    <span className="font-medium">
                                      Current URL:
                                    </span>{" "}
                                    <a
                                      href={step.currentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 underline"
                                    >
                                      {step.currentUrl}
                                    </a>
                                  </div>
                                )}

                                {step.thoughtText && (
                                  <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="mb-1 font-medium">
                                      Thought
                                    </div>
                                    <div className="whitespace-pre-wrap text-sm">
                                      {step.thoughtText}
                                    </div>
                                  </div>
                                )}

                                {step.extractedContent && (
                                  <div className="rounded-lg bg-slate-50 p-3">
                                    <div className="mb-1 font-medium">
                                      Extracted content
                                    </div>
                                    <div className="whitespace-pre-wrap text-sm">
                                      {step.extractedContent}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {step.screenshots?.length > 0 && (
                                <div className="mt-4">
                                  <div className="mb-2 text-sm font-medium">
                                    Screenshots
                                  </div>
                                  <div className="space-y-2">
                                    {step.screenshots.map((shot) => (
                                      <div
                                        key={shot.id}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                      >
                                        <div className="break-all text-xs text-slate-600">
                                          {shot.filePath}
                                        </div>

                                        <a
                                          href={shot.imageUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="mt-2 inline-block text-sm text-blue-600 underline"
                                        >
                                          Open screenshot
                                        </a>

                                        {shot.pageUrl && (
                                          <div className="mt-2 break-all text-xs text-slate-500">
                                            Page: {shot.pageUrl}
                                          </div>
                                        )}

                                        <div className="mt-1 text-xs text-slate-400">
                                          Captured: {shot.capturedAt}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                            <div className="font-medium">
                              No step logs found for this run.
                            </div>

                            {detail?.run && (
                              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                <div>
                                  <span className="font-medium">Status:</span>{" "}
                                  {detail.run.status ||
                                    detail.run.state ||
                                    "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">Verdict:</span>{" "}
                                  {detail.run.verdict || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">Error:</span>{" "}
                                  {detail.run.error_message ||
                                    detail.run.errorMessage ||
                                    "None"}
                                </div>
                              </div>
                            )}
                          </div>

                          {detail?.attempts?.length > 0 && (
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <div className="font-medium mb-2">Attempts</div>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                {detail.attempts.map((att, idx) => (
                                  <div
                                    key={att.id || idx}
                                    className="rounded-md border border-slate-100 p-2"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        Attempt:
                                      </span>{" "}
                                      {att.attempt_no ?? att.id ?? idx + 1}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Status:
                                      </span>{" "}
                                      {att.status || att.state || "N/A"}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Error:
                                      </span>{" "}
                                      {att.error_message ||
                                        att.error ||
                                        att.errorMessage ||
                                        "None"}
                                    </div>
                                    {att.started_at && (
                                      <div>
                                        <span className="font-medium">
                                          Started:
                                        </span>{" "}
                                        {att.started_at}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
