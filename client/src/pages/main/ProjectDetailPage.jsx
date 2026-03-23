/**
 * Project Detail Page
 * 
 * Main project view showing overview, test cases, runs, and settings
 */

import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useProject } from '@/features/projects/hooks/useProject';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import ErrorBanner from '@/shared/components/common/ErrorBanner';
import { BarChart3, FileText, PlayCircle, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  
  // Force reload project data when reloadKey changes
  const { data, loading, error } = useProject(reloadKey > 0 ? `${projectId}-${reloadKey}` : projectId);

  const handleProjectUpdated = () => {
    setReloadKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading project..." />
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

  if (!data) {
    return (
      <ErrorBanner 
        message="Project not found" 
        fullWidth 
        onRetry={() => window.history.back()} 
      />
    );
  }

  return (
    <div className="flex gap-6">
      <aside 
        className={`shrink-0 rounded-xl border bg-white p-2 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          {!isSidebarCollapsed && (
            <span className="text-xs font-semibold text-muted-foreground px-3">
              Navigation
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>
        
        <nav className="space-y-1">
          <NavLink
            to="overview"
            end
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]' : 'text-muted-foreground hover:bg-muted',
                isSidebarCollapsed ? 'justify-center px-2' : '',
              ].join(' ')
            }
          >
            <FileText className="size-4 shrink-0" />
            {!isSidebarCollapsed && 'Overview'}
          </NavLink>

          <NavLink
            to="test-cases"
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]' : 'text-muted-foreground hover:bg-muted',
                isSidebarCollapsed ? 'justify-center px-2' : '',
              ].join(' ')
            }
          >
            <PlayCircle className="size-4 shrink-0" />
            {!isSidebarCollapsed && 'Test Cases'}
          </NavLink>

          <NavLink
            to="test-runs"
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]' : 'text-muted-foreground hover:bg-muted',
                isSidebarCollapsed ? 'justify-center px-2' : '',
              ].join(' ')
            }
          >
            <BarChart3 className="size-4 shrink-0" />
            {!isSidebarCollapsed && 'Test Runs'}
          </NavLink>

          <NavLink
            to="settings"
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]' : 'text-muted-foreground hover:bg-muted',
                isSidebarCollapsed ? 'justify-center px-2' : '',
              ].join(' ')
            }
          >
            <Settings className="size-4 shrink-0" />
            {!isSidebarCollapsed && 'Settings'}
          </NavLink>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet context={{ project: data, projectId, onProjectUpdated: handleProjectUpdated }} />
      </main>
    </div>
  );
}
