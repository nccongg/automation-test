/**
 * Projects Page
 * 
 * Lists all projects with their status and details
 * Uses feature components from /features/projects
 */

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import ProjectRowCard from '@/features/projects/components/ProjectRowCard';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import ErrorBanner from '@/shared/components/common/ErrorBanner';
import EmptyState from '@/shared/components/common/EmptyState';
import PageHeader from '@/shared/components/common/PageHeader';
import CreateProjectDialog from '@/features/projects/components/CreateProjectDialog';

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
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} fullWidth onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Manage your testing projects and recent runs"
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

      {projects.length === 0 ? (
        <EmptyState
          title="No Projects Yet"
          description="Get started by creating your first automation project."
          action={{
            label: 'Create Project',
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectRowCard
              key={project.id}
              id={project.id}
              name={project.name}
              owner={project.owner}
              status={project.status}
              statusTone={project.statusTone}
              updatedAt={project.lastRun}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
