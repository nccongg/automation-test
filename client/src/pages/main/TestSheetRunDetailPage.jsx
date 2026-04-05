import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useTestSheetRun } from "@/features/test-collection/hooks/useTestSheetRun";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorBanner from "@/shared/components/common/ErrorBanner";
import { Badge } from "@/components/ui/badge";

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  if (ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

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
  completed:  "bg-emerald-100 text-emerald-700",
  failed:     "bg-red-100 text-red-700",
  cancelled:  "bg-slate-100 text-slate-600",
  running:    "bg-yellow-100 text-yellow-600",
  queued:     "bg-indigo-50 text-indigo-600",
  pending:    "bg-slate-100 text-slate-500",
};

export default function TestSheetRunDetailPage() {
  const { projectId, sheetId, runId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useTestSheetRun(runId);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading run results..." />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} fullWidth />;
  }

  const run = data?.run;
  const items = data?.items ?? [];

  if (!run) return null;

  const passRate =
    run.totalCases > 0
      ? Math.round((run.passed / run.totalCases) * 100)
      : 0;

  const isLive = ["queued", "running"].includes(run.status);

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(`/projects/${projectId}/collections/${sheetId}`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Sheet
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
          <span>{run.passed + run.failed + run.errored} / {run.totalCases} completed</span>
          <span>
            {formatDuration(run.startedAt, run.completedAt || new Date().toISOString())}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      {/* Items Table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Test Case Results
        </h2>
        <div className="rounded-xl border bg-white divide-y">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 w-6 text-center text-xs font-mono text-muted-foreground">
                  {idx + 1}
                </span>
                {VERDICT_ICON[item.verdict] ?? (
                  <div className="size-4 shrink-0 rounded-full border-2 border-slate-300" />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.goal}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDuration(item.startedAt, item.finishedAt)}
                </span>
                <Badge
                  className={`capitalize text-xs ${ITEM_STATUS_BADGE[item.status] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {item.verdict ?? item.status}
                </Badge>
                {item.testRunId && (
                  <button
                    onClick={() =>
                      navigate(`/projects/${projectId}/test-runs/${item.testRunId}`)
                    }
                    className="rounded p-1 text-muted-foreground hover:text-indigo-600 transition-colors"
                    title="View run detail"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
