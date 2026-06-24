/**
 * Projects Page
 *
 * Lists all projects with their status and details
 * Uses feature components from /features/projects
 */

import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useProjects } from "@/features/projects/hooks/useProjects";
import ProjectCard from "@/shared/components/project/ProjectCard";
import { SkeletonCardGrid } from "@/shared/components/common/Skeleton";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import EmptyState from "@/shared/components/common/EmptyState";
import PageHeader from "@/shared/components/common/PageHeader";
import CreateProjectDialog from "@/features/projects/components/CreateProjectDialog";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { projects, loading, error } = useProjects();
  const navigate = useNavigate();

  const handleCreated = (createdProject) => {
    setCreateOpen(false);
    navigate(`/projects/${createdProject.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Projects"
          description="Manage your testing projects and recent runs"
        />
        <section className="space-y-5">
          <h2 className="text-lg font-semibold tracking-tight">Recent Projects</h2>
          <SkeletonCardGrid count={6} />
        </section>
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Manage your testing projects and recent runs"
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No Projects Yet"
          description="Get started by creating your first automation project."
          action={{
            label: "Create Project",
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Projects
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                projectId={project.id}
                title={project.name}
                description={project.description || "No description available"}
                status={project.status}
                statusTone={project.statusTone}
                testCases={project.testCases ?? 0}
                passRate={project.passRate || "0%"}
                lastRun={project.lastRun}
                barTone={project.barTone || "slate"}
                projectBarWidth={project.projectBarWidth ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
