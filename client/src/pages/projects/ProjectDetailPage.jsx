/**
 * Project Detail Page
 *
 * Main project view showing test cases, test collections, test suites, runs, data, objects, and settings.
 * Project name, base URL, scan, and edit actions live in the sidebar context bar.
 */

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useProject } from "@/features/projects/hooks/useProject";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import { useTestSheets } from "@/features/test-collection/hooks/useTestSheets";
import {
  getCollectionTree,
  addCollectionItems,
  removeCollectionItem,
} from "@/features/test-collection/api/testCollectionApi";
import { toast } from "sonner";
import AddToCollectionDialog from "@/features/test-collection/components/AddToCollectionDialog";
import { listDatasets } from "@/features/datasets/api/datasetsApi";
import { getTestObjects } from "@/features/object-repository/api/objectRepositoryApi";
import { SkeletonDetail } from "@/shared/components/common/Skeleton";
import ErrorState from "@/shared/components/common/ErrorState";
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
  Settings,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function projectInitial(title) {
  return (title ?? "?").trim().charAt(0).toUpperCase();
}

function formatBaseUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function collectCollectionIds(nodes) {
  const ids = [];

  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectCollectionIds(node.children ?? []));
  }

  return ids;
}

// ── Compact project context bar ────────────────────────────────────────────────

function ProjectContextBar({ project, collapsed, onProjectUpdated }) {
  const [showEdit, setShowEdit] = useState(false);

  if (collapsed) {
    return (
      <div className="mb-2 flex flex-col items-center gap-2 border-b px-1 pb-3">
        <div
          title={`${project.title}\n${project.baseUrl}`}
          className="flex size-9 shrink-0 select-none items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white"
        >
          {projectInitial(project.title)}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 space-y-1.5 border-b px-2 pb-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          {projectInitial(project.title)}
        </div>

        <p className="flex-1 truncate text-sm font-semibold leading-tight text-foreground">
          {project.title}
        </p>

        <button
          onClick={() => setShowEdit(true)}
          title="Edit project"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      {(project.baseUrl || project.description) && (
        <div className="ml-10 space-y-1">
          {project.baseUrl && (
            <a
              href={project.baseUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={project.baseUrl}
              className="group flex w-fit items-center gap-1.5"
            >
              <Globe className="size-3 shrink-0 text-brand-400" />
              <span className="max-w-[140px] truncate text-[11px] text-muted-foreground transition-colors group-hover:text-brand-400 group-hover:underline">
                {formatBaseUrl(project.baseUrl)}
              </span>
            </a>
          )}

          {project.description && (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
      )}

      <UpdateProjectDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        project={project}
        onUpdated={() => {
          onProjectUpdated?.();
          setShowEdit(false);
        }}
      />
    </div>
  );
}

// ── Shared nav-link class helper ───────────────────────────────────────────────

function navClass(isActive, collapsed) {
  return [
    "flex items-center gap-3 px-3 py-4 text-sm font-medium transition-colors rounded-lg",
    isActive
      ? "bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]"
      : "text-muted-foreground hover:bg-muted",
    collapsed ? "justify-center px-2" : "",
  ].join(" ");
}

function childItemClass(isActive) {
  return [
    "group flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors",
    isActive
      ? "bg-brand-500/15 text-brand-400 font-medium ring-1 ring-brand-500/20"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
  ].join(" ");
}

function childIconClass(isActive) {
  return [
    "size-3.5 shrink-0",
    isActive
      ? "text-brand-400"
      : "text-muted-foreground/30 group-hover:text-muted-foreground",
  ].join(" ");
}

const MOBILE_NAV_ITEMS = [
  { to: "test-cases", label: "Cases", Icon: PlayCircle },
  { to: "suites", label: "Suites", Icon: FlaskConical },
  { to: "data", label: "Data", Icon: Database },
  { to: "objects", label: "Objects", Icon: Layers },
  { to: "test-runs", label: "Runs", Icon: BarChart3 },
  { to: "settings", label: "Settings", Icon: Settings },
];

function CollectionNode({
  node,
  projectId,
  navigate,
  expandedCollections,
  toggleCollection,
  activeTestCaseId,
  onAddTestCases,
  dnd,
  depth = 0,
}) {
  const isOpen = expandedCollections.has(node.id);
  const itemCount = (node.items ?? []).length;
  const childCount = (node.children ?? []).length;

  const isDropTarget = dnd.dropTargetId === node.id;
  const canDrop =
    dnd.dragPayload && dnd.dragPayload.fromCollectionId !== node.id;

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (!canDrop) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect =
            dnd.dragPayload.fromCollectionId ? "move" : "copy";
          dnd.setDropTargetId(node.id);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            dnd.setDropTargetId((prev) => (prev === node.id ? null : prev));
          }
        }}
        onDrop={(e) => {
          if (!canDrop) return;
          e.preventDefault();
          e.stopPropagation();
          dnd.onDropOnCollection(node);
        }}
        className={`group flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
          isDropTarget && canDrop
            ? "rounded-md bg-brand-500/15 text-foreground ring-1 ring-brand-400"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => toggleCollection(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          title={node.name}
        >
          {isOpen ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}

          {isOpen ? (
            <FolderOpen className="size-3.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground" />
          ) : (
            <Folder className="size-3.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground" />
          )}

          <span className="min-w-0 flex-1 truncate">{node.name}</span>
        </button>

        <span className="shrink-0 text-[11px] text-muted-foreground">
          {node.itemCount ?? itemCount}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddTestCases?.(node);
          }}
          className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          title="Add test cases to collection"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

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
              onAddTestCases={onAddTestCases}
              dnd={dnd}
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
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(testCaseId));
                  dnd.setDragPayload({
                    testCaseId: Number(testCaseId),
                    fromCollectionId: node.id,
                    itemId: item.id,
                    title: item.title,
                  });
                }}
                onDragEnd={dnd.clearDrag}
                onClick={() =>
                  navigate(`/projects/${projectId}/test-cases/${testCaseId}`)
                }
                className={`${childItemClass(isActive)} cursor-grab active:cursor-grabbing`}
                style={{ paddingLeft: `${(depth + 1) * 14 + 24}px` }}
              >
                <FileText className={childIconClass(isActive)} />

                <span className="min-w-0 flex-1 truncate">
                  {item.title ?? item.name ?? `Test case #${testCaseId}`}
                </span>
              </button>
            );
          })}

          {childCount === 0 && itemCount === 0 && (
            <div
              className="px-2 py-1.5 text-xs text-muted-foreground"
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

  const activeTestCaseId =
    location.pathname.match(/\/test-cases\/([^/]+)/)?.[1] ?? null;
  const activeSuiteId =
    location.pathname.match(/\/suites\/([^/]+)/)?.[1] ?? null;
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
  const [addToCollectionTarget, setAddToCollectionTarget] = useState(null);

  // Sidebar drag & drop: payload of the test case being dragged
  // ({ testCaseId, fromCollectionId, itemId, title }) and the hovered folder.
  const [dragPayload, setDragPayload] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  const [sidebarObjects, setSidebarObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [expandedObjectPages, setExpandedObjectPages] = useState(new Set());

  const { data, loading, error } = useProject(
    reloadKey > 0 ? `${projectId}-${reloadKey}` : projectId,
  );

  const {
    testCases,
    loading: loadingTestCases,
    refetch: refetchTestCases,
  } = useTestCases(projectId);

  const {
    sheets,
    loading: loadingSuites,
    refetch: refetchSuites,
  } = useTestSheets(projectId);

  const sidebarSuites = useMemo(() => sheets ?? [], [sheets]);

  const uncategorizedTestCases = useMemo(
    () => (testCases ?? []).filter((tc) => !categorizedIds.has(Number(tc.id))),
    [testCases, categorizedIds],
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
    await Promise.all([refetchTestCases?.(), refetchCollections()]);
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
      const list = data ?? [];
      setSidebarObjects(list);
      // Auto-expand all page groups
      const pages = new Set(list.map((o) => o.pageKey || "(No Page)"));
      setExpandedObjectPages(pages);
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

  const clearDrag = useCallback(() => {
    setDragPayload(null);
    setDropTargetId(null);
  }, []);

  async function handleDropOnCollection(node) {
    const payload = dragPayload;
    clearDrag();

    if (!payload || payload.fromCollectionId === node.id) return;

    try {
      await addCollectionItems(node.id, [payload.testCaseId]);

      if (payload.fromCollectionId && payload.itemId) {
        await removeCollectionItem(payload.fromCollectionId, payload.itemId);
      }

      toast.success(`"${payload.title}" moved to "${node.name}".`);
      refetchTestCaseSidebar();
    } catch (e) {
      toast.error(e?.message || "Failed to move test case.");
    }
  }

  async function handleDropRemoveFromCollection() {
    const payload = dragPayload;
    clearDrag();

    if (!payload?.fromCollectionId || !payload?.itemId) return;

    try {
      await removeCollectionItem(payload.fromCollectionId, payload.itemId);

      toast.success(`"${payload.title}" removed from collection.`);
      refetchTestCaseSidebar();
    } catch (e) {
      toast.error(e?.message || "Failed to remove test case from collection.");
    }
  }

  const sidebarDnd = {
    dragPayload,
    setDragPayload,
    dropTargetId,
    setDropTargetId,
    clearDrag,
    onDropOnCollection: handleDropOnCollection,
  };

  function toggleCollection(collectionId) {
    setExpandedCollections((prev) => {
      const next = new Set(prev);

      next.has(collectionId)
        ? next.delete(collectionId)
        : next.add(collectionId);

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
      <SkeletonDetail />
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  if (!data) {
    return <ErrorState error={{ status: 404 }} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="overflow-hidden rounded-xl border bg-card lg:hidden">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            {projectInitial(data.title ?? data.name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {data.title ?? data.name}
            </p>
            {data.baseUrl && (
              <p className="truncate text-[11px] text-muted-foreground">
                {formatBaseUrl(data.baseUrl)}
              </p>
            )}
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {MOBILE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")
              }
            >
              <item.Icon className="size-3.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <aside
        className={`sticky top-0 hidden shrink-0 overflow-y-auto overscroll-contain rounded-xl border bg-card p-2 ease-in-out lg:block ${
          isResizing ? "" : "transition-all duration-300"
        }`}
        style={{
          width: isSidebarCollapsed ? 64 : sidebarWidth,
          maxHeight: "calc(100dvh - 32px)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <span className="px-3 text-xs font-semibold text-muted-foreground">
              Navigation
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>

        <ProjectContextBar
          project={data}
          collapsed={isSidebarCollapsed}
          onProjectUpdated={handleProjectUpdated}
        />

        <nav className="space-y-1">
          {/* Test Cases + Test Collections */}
          <div className="relative">
            <NavLink
              to="test-cases"
              className={({ isActive }) =>
                navClass(isActive, isSidebarCollapsed)
              }
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
                title={
                  isTestCasesOpen ? "Collapse test cases" : "Expand test cases"
                }
              >
                {isTestCasesOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isTestCasesOpen && (
            <div className="mb-2 ml-5 mt-1 space-y-0.5 border-l border-border pl-2">
              {loadingTestCases || loadingCollections ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : collectionTree.length === 0 &&
                uncategorizedTestCases.length === 0 ? (
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
                      onAddTestCases={setAddToCollectionTarget}
                      dnd={sidebarDnd}
                    />
                  ))}

                  {uncategorizedTestCases.map((tc) => {
                    const isActive = String(activeTestCaseId) === String(tc.id);

                    return (
                      <button
                        key={tc.id}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "copy";
                          e.dataTransfer.setData("text/plain", String(tc.id));
                          setDragPayload({
                            testCaseId: Number(tc.id),
                            fromCollectionId: null,
                            itemId: null,
                            title: tc.title,
                          });
                        }}
                        onDragEnd={clearDrag}
                        onClick={() =>
                          navigate(`/projects/${projectId}/test-cases/${tc.id}`)
                        }
                        className={`${childItemClass(isActive)} cursor-grab active:cursor-grabbing`}
                      >
                        <FileText className={childIconClass(isActive)} />

                        <span className="min-w-0 flex-1 truncate">
                          {tc.title}
                        </span>
                      </button>
                    );
                  })}

                  {dragPayload?.fromCollectionId && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDropTargetId("uncategorized");
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setDropTargetId((prev) =>
                            prev === "uncategorized" ? null : prev,
                          );
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropRemoveFromCollection();
                      }}
                      className={`mt-1 rounded-md border border-dashed px-2 py-2 text-center text-xs transition-colors ${
                        dropTargetId === "uncategorized"
                          ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/20"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      Drop here to remove from collection
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Test Suites */}
          <div className="relative">
            <NavLink
              to="suites"
              className={({ isActive }) =>
                navClass(isActive, isSidebarCollapsed)
              }
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
                title={
                  isTestSuitesOpen
                    ? "Collapse test suites"
                    : "Expand test suites"
                }
              >
                {isTestSuitesOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isTestSuitesOpen && (
            <div className="mb-2 ml-5 mt-1 space-y-0.5 border-l border-border pl-2">
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
                      onClick={() =>
                        navigate(`/projects/${projectId}/suites/${sheet.id}`)
                      }
                      className={childItemClass(isActive)}
                    >
                      <FolderOpen className={childIconClass(isActive)} />

                      <span className="min-w-0 flex-1 truncate">
                        {sheet.name}
                      </span>

                      <span
                        className={
                          isActive
                            ? "shrink-0 text-[11px] text-brand-400"
                            : "shrink-0 text-[11px] text-muted-foreground"
                        }
                      >
                        {sheet.itemCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Data */}
          <div className="relative">
            <NavLink
              to="data"
              className={({ isActive }) =>
                navClass(isActive, isSidebarCollapsed)
              }
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
                {isDataOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isDataOpen && (
            <div className="mb-2 ml-5 mt-1 space-y-0.5 border-l border-border pl-2">
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
                      onClick={() =>
                        navigate(
                          `/projects/${projectId}/data?datasetId=${ds.id}`,
                        )
                      }
                      className={childItemClass(isActive)}
                    >
                      <Database className={childIconClass(isActive)} />

                      <span className="min-w-0 flex-1 truncate">{ds.name}</span>

                      <span
                        className={
                          isActive
                            ? "shrink-0 text-[11px] text-brand-400"
                            : "shrink-0 text-[11px] text-muted-foreground"
                        }
                      >
                        {ds.rowCount ?? 0}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Objects */}
          <div className="relative">
            <NavLink
              to="objects"
              className={({ isActive }) =>
                navClass(isActive, isSidebarCollapsed)
              }
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
                {isObjectsOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            )}
          </div>

          {!isSidebarCollapsed && isObjectsOpen && (
            <div className="mb-2 ml-5 mt-1 space-y-0.5 border-l border-border pl-2">
              {loadingObjects ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  Loading…
                </div>
              ) : sidebarObjects.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  No objects
                </div>
              ) : (
                (() => {
                  const activeObjectId = new URLSearchParams(
                    location.search,
                  ).get("objectId");
                  const grouped = sidebarObjects.reduce((acc, obj) => {
                    const key = obj.pageKey || "(No Page)";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(obj);
                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([pageKey, objs]) => {
                    const isPageOpen = expandedObjectPages.has(pageKey);
                    return (
                      <div key={pageKey}>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedObjectPages((prev) => {
                              const next = new Set(prev);
                              next.has(pageKey)
                                ? next.delete(pageKey)
                                : next.add(pageKey);
                              return next;
                            });
                          }}
                          className="group flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        >
                          {isPageOpen ? (
                            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <FolderOpen className="size-3.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground" />
                          <span className="flex-1 truncate font-medium">
                            {pageKey === "(No Page)"
                              ? "Uncategorized"
                              : pageKey}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {objs.length}
                          </span>
                        </button>

                        {isPageOpen &&
                          objs.map((obj) => {
                            const isActive =
                              location.pathname.endsWith("/objects") &&
                              String(activeObjectId) === String(obj.id);
                            return (
                              <button
                                key={obj.id}
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/projects/${projectId}/objects?objectId=${obj.id}`,
                                  )
                                }
                                className={childItemClass(isActive)}
                                style={{ paddingLeft: "24px" }}
                              >
                                <Box className={childIconClass(isActive)} />
                                <span className="min-w-0 flex-1 truncate">
                                  {obj.name}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}

          {/* Test Runs */}
          <NavLink
            to="test-runs"
            className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}
          >
            <BarChart3 className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Test Runs"}
          </NavLink>

          <NavLink
            to="settings"
            className={({ isActive }) => navClass(isActive, isSidebarCollapsed)}
          >
            <Settings className="size-5 shrink-0" />
            {!isSidebarCollapsed && "Settings"}
          </NavLink>
        </nav>

        {!isSidebarCollapsed && (
          <div
            onMouseDown={handleResizeStart}
            className={`absolute right-0 top-0 h-full w-2 cursor-col-resize rounded-r-xl transition-colors ${
              isResizing ? "bg-brand-500/30" : "hover:bg-brand-500/15"
            }`}
            title="Drag to resize sidebar"
          />
        )}
      </aside>

      <main className="min-w-0 flex-1 lg:max-h-[calc(100dvh-32px)] lg:overflow-y-auto lg:overscroll-contain">
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

        <AddToCollectionDialog
          open={!!addToCollectionTarget}
          onClose={() => setAddToCollectionTarget(null)}
          collection={addToCollectionTarget}
          testCases={testCases ?? []}
          onSaved={refetchTestCaseSidebar}
        />
      </main>
    </div>
  );
}
