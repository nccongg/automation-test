/**
 * Dashboard Page
 *
 * Main dashboard view showing KPIs and recent projects
 * Uses feature components from /features/dashboard
 */

import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import KpiCard from "@/features/dashboard/components/KpiCard";
import ProjectCard from "@/shared/components/project/ProjectCard";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import PageHeader from "@/shared/components/common/PageHeader";
import EmptyState from "@/shared/components/common/EmptyState";
import CreateProjectDialog from "@/features/projects/components/CreateProjectDialog";

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { data, loading, error } = useDashboard();

  const handleCreated = (createdProject) => {
    setCreateOpen(false);
    navigate(`/projects/${createdProject.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPopup
        open={true}
        onClose={() => window.location.reload()}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const kpis = data?.kpis || [];
  const recentProjects = data?.recentProjects || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your testing projects and recent activity"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow-[var(--brand-primary-shadow)] hover:bg-[var(--brand-primary-hover)]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New Project
          </button>
        }
      />

      {recentProjects.length === 0 ? (
        <EmptyState
          title="No Projects Yet"
          description="Create your first automation project to start generating and running tests."
          action={{
            label: "Create Project",
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id || kpi.label} {...kpi} />
            ))}
          </div>

          <section className="space-y-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent Projects
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((p) => (
                <ProjectCard
                  key={p.id || p.title}
                  projectId={p.id}
                  title={p.title || p.name}
                  description={p.description || "No description available"}
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
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
