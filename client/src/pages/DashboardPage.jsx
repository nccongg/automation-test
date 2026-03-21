import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { getDashboardData } from "@/services/dashboard/dashboardService";
import CreateProjectDialog from "@/features/projects/components/CreateProjectDialog";
import { ROUTES } from "@/config/routes";

function TrendLine({
  direction,
  percent,
  text,
  color,
  barWidth,
}) {
  const icon =
    direction === "up" ? (
      <TrendingUp className="size-4" />
    ) : (
      <TrendingDown className="size-4" />
    );

  const tone =
    color === "emerald"
      ? { icon: "text-emerald-600", bar: "bg-emerald-500" }
      : color === "red"
        ? { icon: "text-red-600", bar: "bg-red-500" }
        : color === "sky"
          ? { icon: "text-sky-600", bar: "bg-sky-500" }
          : { icon: "text-slate-600", bar: "bg-slate-400" };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={tone.icon}>{icon}</span>
        <span className="font-medium text-foreground">{percent}</span>
        <span>{text}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full ${tone.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  iconBg,
  iconText,
  icon,
  trendDirection,
  trendPercent,
  trendText,
  barColor,
  trendBarWidth,
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {value}
          </div>
        </div>
        <div
          className={`grid size-11 place-items-center rounded-full ${iconBg} text-sm ${iconText}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <TrendLine
          direction={trendDirection}
          percent={trendPercent}
          text={trendText}
          color={barColor}
          barWidth={trendBarWidth}
        />
      </div>
    </div>
  );
}

function ProjectCard({
  title,
  description,
  status,
  statusTone,
  testCases,
  passRate,
  lastRun,
  barTone,
  projectBarWidth,
  projectId,
}) {
  const navigate = useNavigate();

  const statusClass =
    statusTone === "passing"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : statusTone === "failing"
        ? "bg-red-500/10 text-red-700 border-red-500/20"
        : "bg-slate-500/10 text-slate-700 border-slate-500/20";

  const barClass =
    barTone === "green"
      ? "bg-emerald-500"
      : barTone === "red"
        ? "bg-red-500"
        : "bg-slate-400";

  const handleClick = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div 
      className="flex flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {description}
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
        >
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="space-y-1">
          <div className="text-muted-foreground">Test Cases</div>
          <div className="font-semibold">{testCases}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Pass Rate</div>
          <div className="font-semibold">{passRate}</div>
        </div>
        <div className="col-span-2 space-y-1">
          <div className="text-muted-foreground">Last run</div>
          <div className="font-semibold">{lastRun}</div>
        </div>
      </div>

      <div className="mt-auto h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full ${barClass}`}
          style={{ width: `${projectBarWidth}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await getDashboardData();
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load dashboard data.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleProjectCreated = (createdProject) => {
    // Refresh dashboard data
    window.location.reload();
    // Navigate to the newly created project
    if (createdProject?.id) {
      navigate(`/projects/${createdProject.id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="h-44 animate-pulse rounded-2xl border bg-white/70"
            />
          ))}
        </div>
        <div className="h-5 w-56 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="h-64 animate-pulse rounded-2xl border bg-white/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const kpis = data?.kpis || [];
  const recentProjects = data?.recentProjects || [];
  const hasProjects = recentProjects.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your testing projects and recent activity
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow-[var(--brand-primary-shadow)] hover:bg-[var(--brand-primary-hover)]"
        >
          <Plus className="size-4" />
          New Project
        </button>
      </div>

      {!hasProjects ? (
        <div className="rounded-2xl border bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex size-16 shrink-0 place-items-center justify-center rounded-full bg-muted">
            <FolderOpenIcon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating your first test automation project
          </p>
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-medium text-white shadow-[var(--brand-primary-shadow)] hover:bg-[var(--brand-primary-hover)]"
          >
            <Plus className="size-4" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                iconBg={kpi.iconBg}
                iconText={kpi.iconText}
                icon={<span className="font-bold">{kpi.iconEmoji}</span>}
                trendDirection={kpi.trendDirection}
                trendPercent={kpi.trendPercent}
                trendText={kpi.trendText}
                barColor={kpi.barColor}
                trendBarWidth={kpi.trendBarWidth}
              />
            ))}
          </div>

          <section className="space-y-5">
            <h2 className="text-lg font-semibold tracking-tight">Recent Projects</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recentProjects.map((p) => (
                <ProjectCard
                  key={p.title}
                  projectId={p.id}
                  title={p.title}
                  description={p.description}
                  status={p.status}
                  statusTone={p.statusTone}
                  testCases={p.testCases}
                  passRate={p.passRate}
                  lastRun={p.lastRun}
                  barTone={p.barTone}
                  projectBarWidth={p.projectBarWidth}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}

function FolderOpenIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}
