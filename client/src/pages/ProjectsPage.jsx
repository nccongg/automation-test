import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getProjectsList } from "@/features/projects/api/projectsApi";
import CreateProjectDialog from "@/features/projects/components/CreateProjectDialog";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorBanner from "@/shared/components/common/ErrorBanner";
import EmptyState from "@/shared/components/common/EmptyState";

function ProjectRowCard({
  name,
  owner,
  status,
  updatedAt,
  projectId,
}) {
  const navigate = useNavigate();

  const statusTone =
    status === "Passing"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : status === "Partial"
        ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
        : "bg-slate-500/10 text-slate-700 border-slate-500/20";

  const handleClick = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div 
      className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
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
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjectsList();
        if (!mounted) return;
        setProjects(data);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load projects.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const handleProjectCreated = (createdProject) => {
    // Refresh projects list
    window.location.reload();
    // Navigate to the newly created project
    if (createdProject?.id) {
      navigate(`/projects/${createdProject.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading projects..." />
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
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow-[var(--brand-primary-shadow)] hover:bg-[var(--brand-primary-hover)]"
        >
          <Plus className="size-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first test automation project to get started"
          actionButton={
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-medium text-white shadow-[var(--brand-primary-shadow)] hover:bg-[var(--brand-primary-hover)]"
            >
              <Plus className="size-4" />
              Create Project
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectRowCard
              key={project.id}
              projectId={project.id}
              name={project.name}
              owner={project.owner}
              status={project.status}
              updatedAt={project.lastRun}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}

