import { Plus } from "lucide-react";

function ProjectRowCard({
  name,
  owner,
  status,
  updatedAt,
}) {
  const statusTone =
    status === "Active"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : status === "Paused"
        ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
        : "bg-slate-500/10 text-slate-700 border-slate-500/20";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          Owner: {owner}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusTone}`}
        >
          {status}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          Updated {updatedAt}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your testing projects and recent runs
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow-[var(--brand-primary-shadow)] hover:bg-[var(--brand-primary-hover)]"
        >
          <Plus className="size-4" />
          New Project
        </button>
      </div>

      <div className="space-y-4">
        <ProjectRowCard
          name="Mobile Banking App"
          owner="QA Team"
          status="Active"
          updatedAt="2 hours ago"
        />
        <ProjectRowCard
          name="E-commerce Website"
          owner="Platform QA"
          status="Paused"
          updatedAt="1 day ago"
        />
        <ProjectRowCard
          name="Admin dashboard"
          owner="Backend QA"
          status="Active"
          updatedAt="3 days ago"
        />
        <ProjectRowCard
          name="Social Media Platform"
          owner="Growth QA"
          status="Archived"
          updatedAt="1 week ago"
        />
      </div>
    </div>
  );
}

