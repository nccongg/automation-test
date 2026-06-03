import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, History } from "lucide-react";
import { STATUS_CLS } from "./utils";

export default function RecentRunsList({ runs, projectId }) {
  const navigate = useNavigate();

  if (runs.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          Recent Runs
        </h2>
        <button
          onClick={() => navigate(`/projects/${projectId}/test-runs`)}
          className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
        >
          <History className="size-3" />
          View all
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {runs.map((run, i) => (
          <button
            key={run.id}
            onClick={() => navigate(`/projects/${projectId}/test-runs/sheet/${run.id}`)}
            className={`group flex w-full items-center gap-4 px-8 transition-colors hover:bg-muted/60 ${
              i % 2 === 0 ? "bg-card" : "bg-muted/50"
            } ${i < runs.length - 1 ? "border-b border-border" : ""}`}
            style={{ minHeight: 46 }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {run.status === "completed" ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : run.status === "running" ? (
                <Clock className="size-4 shrink-0 animate-pulse text-blue-500" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0">
                <p className="text-[14px] text-foreground">Run #{run.id}</p>
                <p className="text-[13px] text-muted-foreground">
                  {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 text-[13px]">
              <span className="text-success">{run.passed} pass</span>
              <span className="text-destructive">{run.failed} fail</span>
              <span
                className={`rounded-[6px] border px-2 py-0.5 text-[11px] font-medium capitalize ${
                  STATUS_CLS[run.status] ?? "border-border bg-muted text-muted-foreground"
                }`}
              >
                {run.status}
              </span>
            </div>

            <span className="shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              View →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
