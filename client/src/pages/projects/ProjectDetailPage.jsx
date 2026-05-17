/**
 * Project Detail Page
 *
 * Main project view showing test cases, runs, and settings.
 * Project name, base URL, scan, and edit actions live in the sidebar context bar.
 */

import { NavLink, Outlet, useParams } from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import UpdateProjectDialog from "@/features/projects/components/UpdateProjectDialog";
import {
  BarChart3,
  PlayCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Database,
  Pencil,
  Globe,
  Layers,
} from "lucide-react";
import { useState } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function projectInitial(title) {
  return (title ?? "?").trim().charAt(0).toUpperCase();
}

function formatBaseUrl(url) {
  try { return new URL(url).host; } catch { return url; }
}

// ── Compact project context bar (top of sidebar) ───────────────────────────────

function ProjectContextBar({ project, collapsed, onProjectUpdated }) {
  const [showEdit, setShowEdit] = useState(false);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-1 pb-3 mb-2 border-b">
        <div
          title={`${project.title}\n${project.baseUrl}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white select-none"
        >
          {projectInitial(project.title)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pb-3 mb-2 border-b space-y-1.5">
      {/* Name row */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white select-none">
          {projectInitial(project.title)}
        </div>
        <p className="flex-1 truncate text-sm font-semibold text-slate-800 leading-tight">
          {project.title}
        </p>
        <button
          onClick={() => setShowEdit(true)}
          title="Edit project"
          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      {/* Meta */}
      {(project.baseUrl || project.description) && (
        <div className="ml-10 space-y-1">
          {project.baseUrl && (
            <a
              href={project.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={project.baseUrl}
              className="flex items-center gap-1.5 group w-fit"
            >
              <Globe className="size-3 shrink-0 text-indigo-400" />
              <span className="text-[11px] text-slate-400 group-hover:text-indigo-500 group-hover:underline transition-colors truncate max-w-[140px]">
                {formatBaseUrl(project.baseUrl)}
              </span>
            </a>
          )}
          {project.description && (
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
      )}

      <UpdateProjectDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        project={project}
        onUpdated={() => { onProjectUpdated?.(); setShowEdit(false); }}
      />
    </div>
  );
}

// ── Shared nav-link class helper ───────────────────────────────────────────────

function navClass(isActive, collapsed) {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-4 text-sm font-medium transition-colors",
    isActive
      ? "bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]"
      : "text-muted-foreground hover:bg-muted",
    collapsed ? "justify-center px-2" : "",
  ].join(" ");
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { data, loading, error } = useProject(
    reloadKey > 0 ? `${projectId}-${reloadKey}` : projectId,
  );

  const handleProjectUpdated = () => setReloadKey((prev) => prev + 1);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading project..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open onClose={() => window.location.reload()} onRetry={() => window.location.reload()} />;
  }

  if (!data) {
    return <ErrorPopup open onClose={() => window.history.back()} />;
  }

  return (
    <div className="flex gap-6">
      <aside
        className={`sticky top-0 self-start shrink-0 rounded-xl border bg-white p-2 transition-all duration-300 ease-in-out overflow-y-auto ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Collapse toggle */}
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
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Project context bar */}
        <ProjectContextBar
          project={data}
          collapsed={isSidebarCollapsed}
          onProjectUpdated={handleProjectUpdated}
        />

        {/* Nav links */}
        <nav className="space-y-1">
          <NavLink to="test-cases" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <PlayCircle className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Test Cases"}
          </NavLink>

          <NavLink to="suites" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <FlaskConical className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Test Suites"}
          </NavLink>

          <NavLink to="data" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <Database className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Data"}
          </NavLink>

          <NavLink to="objects" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <Layers className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Objects"}
          </NavLink>

          <NavLink to="test-runs" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <BarChart3 className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Test Runs"}
          </NavLink>

          <NavLink to="settings" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <Settings className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Settings"}
          </NavLink>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet
          context={{
            project: data,
            projectId,
            onProjectUpdated: handleProjectUpdated,
          }}
        />
      </main>
    </div>
  );
}
