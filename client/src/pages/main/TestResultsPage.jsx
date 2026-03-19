/**
 * Test Results Page
 * 
 * Displays test execution results and analytics
 * Uses feature components from /features/test-results
 */

import { useTestResults } from '@/features/test-results/hooks/useTestResults';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import ErrorBanner from '@/shared/components/common/ErrorBanner';
import PageHeader from '@/shared/components/common/PageHeader';

/**
 * Summary Stats Card
 */
function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {subtext && <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>}
    </div>
  );
}

export default function TestResultsPage() {
  const { results, loading, error } = useTestResults();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test results..." />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} fullWidth onRetry={() => window.location.reload()} />;
  }

  const summary = results?.summary || {};
  const recentRuns = results?.recentRuns || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test Results"
        description="View test execution history and analytics"
      />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Runs"
          value={summary.totalRuns || 0}
          subtext={`Last run: ${summary.lastRunDate || 'N/A'}`}
        />
        <StatCard
          label="Pass Rate"
          value={summary.passRate || '0%'}
          subtext={`${summary.passed} passed`}
        />
        <StatCard
          label="Failed"
          value={summary.failed || 0}
          subtext={`${summary.skipped} skipped`}
        />
        <StatCard
          label="Avg Duration"
          value={summary.avgDuration || '-'}
          subtext="Per test run"
        />
      </div>

      {/* Recent Runs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Test Runs</h2>
        <div className="rounded-xl border bg-white">
          <div className="grid gap-px divide-y">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{run.projectName}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        run.result === 'Passed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : run.result === 'Failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {run.result}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
