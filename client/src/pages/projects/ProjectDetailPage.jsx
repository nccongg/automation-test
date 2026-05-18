/**
 * Project Detail Page
 *
 * Main project view showing test cases, runs, and settings.
 * Project name, base URL, scan, and edit actions live in the sidebar context bar.
 */

import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import { useTestSheets } from "@/features/test-collection/hooks/useTestSheets";
import { getCollectionTree } from "@/features/test-collection/api/testCollectionApi";
import { listDatasets } from "@/features/datasets/api/datasetsApi";
import { getTestObjects } from "@/features/object-repository/api/objectRepositoryApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import UpdateProjectDialog from "@/features/projects/components/UpdateProjectDialog";
import {
  BarChart3,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Database,
  Layers,
  Box,
  Pencil,
  Globe,
  FileText,
  FolderOpen,
  Folder,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function projectInitial(title) {
  return (title ?? "?").trim().charAt(0).toUpperCase();
}

function formatBaseUrl(url) {
  try { return new URL(url).host; } catch { return url; }
}

function collectCollectionIds(nodes) {
  const ids = [];

  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectCollectionIds(node.children ?? []));
  }

  return ids;
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

function childItemClass(isActive) {
  return [
    "group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
    isActive
      ? "bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-100"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  ].join(" ");
}

function childIconClass(isActive) {
  return [
    "size-3.5 shrink-0",
    isActive ? "text-indigo-500" : "text-slate-300 group-hover:text-slate-400",
  ].join(" ");
}

function CollectionNode({
  node,
  projectId,
  navigate,
  expandedCollections,
  toggleCollection,
  activeTestCaseId,
  depth = 0,
}) {
  const isOpen = expandedCollections.has(node.id);
  const itemCount = (node.items ?? []).length;
  const childCount = (node.children ?? []).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleCollection(node.id)}
        className="group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isOpen ? (
          <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
        )}
        {isOpen ? (
          <FolderOpen className="size-3.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {node.name}
        </span>
        <span className="shrink-0 text-[11px] text-slate-400">
          {node.itemCount ?? itemCount}
        </span>
      </button>

      {isOpen && (
        <div>
          {(node.children ?? []).map((child) => (
            <CollectionNode
              key={child.id}
              node={child}
              projectId={projectId}
              navigate={navigate}
              expandedCollections={expandedCollections}
              toggleCollection={toggleCollection}
              activeTestCaseId={activeTestCaseId}
              depth={depth + 1}
            />
          ))}

          {(node.items ?? []).map((item) => {
            const testCaseId = item.testCaseId ?? item.id;
            const isActive = String(activeTestCaseId) === String(testCaseId);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/projects/${projectId}/test-cases/${testCaseId}`)}
                className={childItemClass(isActive)}
                style={{ paddingLeft: `${(depth + 1) * 14 + 24}px` }}
              >
                <FileText className={childIconClass(isActive)} />
                <span className="min-w-0 flex-1 truncate">
                  {item.title}
                </span>
              </button>
            );
          })}

          {childCount === 0 && itemCount === 0 && (
            <div
              className="px-2 py-1.5 text-xs text-slate-400"
              style={{ paddingLeft: `${(depth + 1) * 14 + 24}px` }}
            >
              Empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTestCaseId = location.pathname.match(/\/test-cases\/([^/]+)/)?.[1] ?? null;
  const activeSuiteId = location.pathname.match(/\/suites\/([^/]+)/)?.[1] ?? null;
  const activeDatasetId = new URLSearchParams(location.search).get("datasetId");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isTestCasesOpen, setIsTestCasesOpen] = useState(true);
  const [isTestSuitesOpen, setIsTestSuitesOpen] = useState(true);
  const [isDataOpen, setIsDataOpen] = useState(true);
  const [isObjectsOpen, setIsObjectsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [collectionTree, setCollectionTree] = useState([]);
  const [categorizedIds, setCategorizedIds] = useState(new Set());
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState(new Set());

  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  const [sidebarObjects, setSidebarObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);

  const { data, loading, error } = useProject(
    reloadKey > 0 ? `${projectId}-${reloadKey}` : projectId,
  );

  const { testCases, loading: loadingTestCases, refetch: refetchTestCases } = useTestCases(projectId);
  const { sheets, loading: loadingSuites, refetch: refetchSuites } = useTestSheets(projectId);

  const sidebarSuites = useMemo(() => sheets ?? [], [sheets]);

  const uncategorizedTestCases = useMemo(
    () => (testCases ?? []).filter((tc) => !categorizedIds.has(Number(tc.id))),
    [testCases, categorizedIds]
  );

  const handleProjectUpdated = () => setReloadKey((prev) => prev + 1);

  const refetchCollections = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingCollections(true);
      const result = await getCollectionTree(projectId);
      const nodes = result?.tree ?? [];

      setCollectionTree(nodes);
      setCategorizedIds(new Set(result?.categorizedTestCaseIds ?? []));

      setExpandedCollections((prev) => {
        const next = new Set(prev);
        collectCollectionIds(nodes).forEach((id) => next.add(id));
        return next;
      });
    } catch {
      setCollectionTree([]);
      setCategorizedIds(new Set());
    } finally {
      setLoadingCollections(false);
    }
  }, [projectId]);

  const refetchTestCaseSidebar = useCallback(async () => {
    await Promise.all([
      refetchTestCases?.(),
      refetchCollections(),
    ]);
  }, [refetchTestCases, refetchCollections]);

  const refetchDatasets = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoadingDatasets(true);
      const data = await listDatasets(projectId);
      setDatasets(data ?? []);
    } catch {
      setDatasets([]);
    } finally {
      setLoadingDatasets(false);
    }
  }, [projectId]);

  const refetchObjects = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingObjects(true);
      const data = await getTestObjects(projectId);
      setSidebarObjects(data ?? []);
    } catch {
      setSidebarObjects([]);
    } finally {
      setLoadingObjects(false);
    }
  }, [projectId]);

  useEffect(() => {
    refetchCollections();
  }, [refetchCollections]);

  useEffect(() => {
    refetchDatasets();
  }, [refetchDatasets]);

  useEffect(() => {
    refetchObjects();
  }, [refetchObjects]);

  function toggleCollection(collectionId) {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      next.has(collectionId) ? next.delete(collectionId) : next.add(collectionId);
      return next;
    });
  }

  function handleResizeStart(e) {
    e.preventDefault();

    if (isSidebarCollapsed) return;

    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function handleMouseMove(moveEvent) {
      const nextWidth = startWidth + moveEvent.clientX - startX;
      const clampedWidth = Math.min(Math.max(nextWidth, 260), 460);
      setSidebarWidth(clampedWidth);
    }

    function handleMouseUp() {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

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
        className={`sticky top-0 self-start relative shrink-0 rounded-xl border bg-white p-2 ease-in-out overflow-y-auto max-h-screen ${
          isResizing ? "" : "transition-all duration-300"
        }`}
        style={{
          width: isSidebarCollapsed ? 64 : sidebarWidth,
        }}
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
          <div className="relative">
            <NavLink to="test-cases" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}
              onClick={() => setIsTestCasesOpen((prev) => !prev)}
            >
              <PlayCircle className="size-5 shrink-0" />
              {!isSidebarCollapsed && "Test Cases"}
            </NavLink>

            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsTestCasesOpen((prev) => !prev);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/90 hover:bg-white/20"
                title={isTestCasesOpen ? "Collapse test cases" : "Expand test cases"}
              >
                {isTestCasesOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isTestCasesOpen && (
            <div className="ml-5 mt-1 mb-2 space-y-0.5 border-l border-slate-200 pl-2">
              {loadingTestCases || loadingCollections ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : collectionTree.length === 0 && uncategorizedTestCases.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  No test cases
                </div>
              ) : (
                <>
                  {collectionTree.map((node) => (
                    <CollectionNode
                      key={node.id}
                      node={node}
                      projectId={projectId}
                      navigate={navigate}
                      expandedCollections={expandedCollections}
                      toggleCollection={toggleCollection}
                      activeTestCaseId={activeTestCaseId}
                    />
                  ))}

                  {uncategorizedTestCases.map((tc) => {
                    const isActive = String(activeTestCaseId) === String(tc.id);

                    return (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => navigate(`/projects/${projectId}/test-cases/${tc.id}`)}
                        className={childItemClass(isActive)}
                      >
                        <FileText className={childIconClass(isActive)} />
                        <span className="min-w-0 flex-1 truncate">
                          {tc.title}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          <div className="relative">
            <NavLink to="suites" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}
              onClick={() => setIsTestSuitesOpen((prev) => !prev)}
            >
              <FlaskConical className="size-5 shrink-0" />
              {!isSidebarCollapsed && "Test Suites"}
            </NavLink>

            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsTestSuitesOpen((prev) => !prev);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/90 hover:bg-white/20"
                title={isTestSuitesOpen ? "Collapse test suites" : "Expand test suites"}
              >
                {isTestSuitesOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isTestSuitesOpen && (
            <div className="ml-5 mt-1 mb-2 space-y-0.5 border-l border-slate-200 pl-2">
              {loadingSuites ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : sidebarSuites.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  No test suites
                </div>
              ) : (
                sidebarSuites.map((sheet) => {
                  const isActive = String(activeSuiteId) === String(sheet.id);

                  return (
                    <button
                      key={sheet.id}
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/suites/${sheet.id}`)}
                      className={childItemClass(isActive)}
                    >
                      <FolderOpen className={childIconClass(isActive)} />
                      <span className="min-w-0 flex-1 truncate">
                        {sheet.name}
                      </span>
                      <span className={isActive ? "shrink-0 text-[11px] text-indigo-500" : "shrink-0 text-[11px] text-slate-400"}>
                        {sheet.itemCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <div className="relative">
            <NavLink to="data" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}
              onClick={() => setIsDataOpen((prev) => !prev)}
            >
              <Database className="size-5 shrink-0" />
              {!isSidebarCollapsed && "Data"}
            </NavLink>

            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDataOpen((prev) => !prev);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/90 hover:bg-white/20"
                title={isDataOpen ? "Collapse data" : "Expand data"}
              >
                {isDataOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isDataOpen && (
            <div className="ml-5 mt-1 mb-2 space-y-0.5 border-l border-slate-200 pl-2">
              {loadingDatasets ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : datasets.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  No datasets
                </div>
              ) : (
                datasets.map((ds) => {
                  const isActive = String(activeDatasetId) === String(ds.id);

                  return (
                    <button
                      key={ds.id}
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/data?datasetId=${ds.id}`)}
                      className={childItemClass(isActive)}
                    >
                      <Database className={childIconClass(isActive)} />
                      <span className="min-w-0 flex-1 truncate">
                        {ds.name}
                      </span>
                      <span className={isActive ? "shrink-0 text-[11px] text-indigo-500" : "shrink-0 text-[11px] text-slate-400"}>
                        {ds.rowCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

             <div className="relative">
            <NavLink
              to="objects"
              className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}
              onClick={() => setIsObjectsOpen((prev) => !prev)}
            >
              <Layers className="size-5 shrink-0" />
              {!isSidebarCollapsed && "Objects"}
            </NavLink>

            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsObjectsOpen((prev) => !prev);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/90 hover:bg-white/20"
                title={isObjectsOpen ? "Collapse objects" : "Expand objects"}
              >
                {isObjectsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isObjectsOpen && (
            <div className="ml-5 mt-1 mb-2 space-y-0.5 border-l border-slate-200 pl-2">
              {loadingObjects ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">Loading…</div>
              ) : sidebarObjects.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">No objects</div>
              ) : (
                sidebarObjects.map((obj) => {
                  const activeObjectId = new URLSearchParams(location.search).get("objectId");
                  const isActive = location.pathname.endsWith("/objects") && String(activeObjectId) === String(obj.id);
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/objects?objectId=${obj.id}`)}
                      className={childItemClass(isActive)}
                    >
                      <Box className={childIconClass(isActive)} />
                      <span className="min-w-0 flex-1 truncate font-mono">{obj.name}</span>
                      {obj.pageKey && (
                        <span className="shrink-0 text-[10px] text-slate-400 truncate max-w-[60px]">{obj.pageKey}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
          
          <NavLink to="test-runs" className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}>
            <BarChart3 className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Test Runs"}
          </NavLink>

       

        </nav>

        {!isSidebarCollapsed && (
          <div
            onMouseDown={handleResizeStart}
            className={`absolute right-0 top-0 h-full w-2 cursor-col-resize rounded-r-xl transition-colors ${
              isResizing ? "bg-indigo-200" : "hover:bg-indigo-100"
            }`}
            title="Drag to resize sidebar"
          />
        )}
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet
          context={{
            project: data,
            projectId,
            onProjectUpdated: handleProjectUpdated,
            onTestCasesUpdated: refetchTestCaseSidebar,
            onCollectionsUpdated: refetchCollections,
            onSuitesUpdated: refetchSuites,
            onDatasetsUpdated: refetchDatasets,
            onObjectsUpdated: refetchObjects,
          }}
        />
      </main>
    </div>
  );
}