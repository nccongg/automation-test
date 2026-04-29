import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  ListTodo,
  Plus,
  Folder,
  FolderOpen,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Loader2,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import { createTestRun } from "@/features/test-results/api/testResultsApi";
import {
  getCollectionTree,
  createCollection,
  deleteCollection,
  addCollectionItems,
  removeCollectionItem,
} from "@/features/test-collection/api/testCollectionApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import PageHeader from "@/shared/components/common/PageHeader";
import AddToSuiteDialog from "@/shared/components/common/AddToSuiteDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { COLOR_OPTIONS, getColor } from "@/shared/constants/colors";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  ready:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  draft:    "bg-slate-100 text-slate-600 border-slate-200",
  archived: "bg-amber-100 text-amber-700 border-amber-200",
};

// ─── Create Folder Dialog ─────────────────────────────────────────────────────

function CreateFolderDialog({ open, onClose, onCreated, projectId, parentId, parentName }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("indigo");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function reset() { setName(""); setDescription(""); setColor("indigo"); setErr(""); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true); setErr("");
      await createCollection({ projectId: Number(projectId), name, description, color, parentId: parentId || null });
      onCreated(); reset(); onClose();
    } catch (e) {
      setErr(e?.message || "Failed to create folder.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parentId ? `New Sub-folder in "${parentName}"` : "New Folder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input id="folder-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beer Order, Login, Checkout" autoFocus required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="folder-desc">Description (optional)</Label>
            <Input id="folder-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What test cases belong here?" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c.key} type="button" onClick={() => setColor(c.key)}
                  className={`h-6 w-6 rounded-full ${c.dot} ring-2 ring-offset-2 transition-all ${color === c.key ? c.ring : "ring-transparent"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Cases Dialog ─────────────────────────────────────────────────────────

function AddCasesDialog({ open, onClose, onAdded, collectionId, existingIds, allTestCases }) {
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setSelected(new Set()); setQuery(""); } }, [open]);

  function toggle(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleAdd() {
    const ids = [...selected];
    if (!ids.length) return;
    try {
      setSaving(true);
      await addCollectionItems(collectionId, ids);
      onAdded(); onClose();
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  const available = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return allTestCases
      .filter((tc) => !existingIds.has(tc.id))
      .filter((tc) => !kw || (tc.title ?? "").toLowerCase().includes(kw) || (tc.goal ?? "").toLowerCase().includes(kw));
  }, [allTestCases, existingIds, query]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Test Cases</DialogTitle></DialogHeader>
        <input className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Search by title or goal..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="mt-2 max-h-72 overflow-y-auto divide-y rounded-lg border">
          {available.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {allTestCases.length === 0 ? "No test cases in this project" : "All test cases are already in this folder"}
            </p>
          ) : available.map((tc) => (
            <label key={tc.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50">
              <input type="checkbox" checked={selected.has(tc.id)} onChange={() => toggle(tc.id)} className="mt-0.5 accent-indigo-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{tc.title}</p>
                <p className="text-xs text-muted-foreground truncate">{tc.goal}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={selected.size === 0 || saving} onClick={handleAdd}>
            {saving ? "Adding..." : `Add ${selected.size > 0 ? selected.size : ""} Case${selected.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Folder Menu (⋯) ─────────────────────────────────────────────────────────

function FolderMenu({ onAddSubfolder, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="rounded-md p-1 text-muted-foreground hover:bg-white/80 hover:text-slate-700 transition-colors" title="More options">
        <MoreHorizontal className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border bg-white shadow-lg py-1">
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onAddSubfolder(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
            <FolderPlus className="size-3.5 text-indigo-500" />New sub-folder
          </button>
          <div className="my-1 border-t" />
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="size-3.5" />Delete folder
          </button>
        </div>
      )}
    </div>
  );
}

// ─── File Node (Test Case) ────────────────────────────────────────────────────

function FileNode({
  item, depth, projectId, collectionId,
  onRemove, removingId, onSuiteClick, onRun, runningId,
  // drag
  onDragStart, onDragEnd, isDragging,
}) {
  const navigate = useNavigate();
  const id = item.testCaseId ?? item.id;

  function handleDragStart(e) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({
      testCaseId: id,
      itemId: item.id,
      sourceCollectionId: collectionId ?? null,
    }));
    onDragStart?.();
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-2 py-2 pr-4 hover:bg-slate-50 cursor-grab active:cursor-grabbing rounded-lg transition-colors select-none ${
        isDragging ? "opacity-30" : ""
      }`}
      style={{ paddingLeft: `${depth * 20 + 8}px` }}
      onClick={() => navigate(`/projects/${projectId}/test-cases/${id}`)}
    >
      <div className="flex shrink-0 items-center gap-0.5">
        <div className="w-4 flex-shrink-0" />
        <FileText className="size-3.5 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" />
      </div>

      <div className="min-w-0 flex-1 flex items-center gap-2">
        <span className="text-sm truncate text-slate-700 group-hover:text-slate-900">{item.title}</span>
        <Badge className={`shrink-0 text-[10px] border py-0 px-1.5 ${STATUS_BADGE[item.status] ?? STATUS_BADGE.draft}`}>
          {item.status || "draft"}
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onSuiteClick({ id, title: item.title })} title="Add to test suite"
          className="rounded-md p-1 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
          <ListTodo className="size-3.5" />
        </button>
        {collectionId && (
          <button onClick={() => onRemove(item)} disabled={removingId === item.id} title="Remove from folder"
            className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50">
            {removingId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
          </button>
        )}
        <button onClick={() => onRun(item)} disabled={runningId === id || item.status === "archived"}
          className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {runningId === id ? <Loader2 className="size-3 animate-spin" /> : "Run"}
        </button>
      </div>
    </div>
  );
}

// ─── Folder Node ──────────────────────────────────────────────────────────────

function FolderNode({
  node, depth, projectId,
  expanded, onToggle,
  onAddCases, onAddSubfolder, onDelete,
  onRemoveItem, removingId,
  onSuiteClick, onRun, runningId,
  // drag
  draggingItem, dragOverId, setDragOverId,
  onDropOnFolder, onDragStart, onDragEnd,
}) {
  const isExpanded = expanded.has(node.id);
  const isDragOver = dragOverId === node.id;
  const c = getColor(node.color);
  const totalCount = node.items.length + node.children.reduce((s, ch) => s + (ch.itemCount ?? 0), 0);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    // Don't allow dropping on the folder the item is already in
    if (draggingItem?.sourceCollectionId === node.id) return;
    e.dataTransfer.dropEffect = "move";
    setDragOverId(node.id);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverId(null);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    onDropOnFolder(e, node.id);
  }

  return (
    <div>
      {/* Folder row — also the drop target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group flex items-center gap-1.5 py-2 pr-4 rounded-lg cursor-pointer transition-all ${
          isDragOver
            ? `${c.bg} ring-2 ${c.ring} ring-inset`
            : isExpanded
            ? "bg-slate-50/60 hover:bg-slate-50"
            : "hover:bg-slate-50"
        }`}
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
        onClick={() => onToggle(node.id)}
      >
        <div className="size-5 shrink-0 flex items-center justify-center text-slate-400">
          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </div>
        {isExpanded
          ? <FolderOpen className={`size-4 shrink-0 ${c.text}`} />
          : <Folder className={`size-4 shrink-0 ${isDragOver ? c.text : "text-slate-400"}`} />
        }
        <span className={`flex-1 text-sm font-medium truncate min-w-0 ${isDragOver ? c.text : "text-slate-700"}`}>
          {node.name}
        </span>
        {isDragOver ? (
          <span className={`shrink-0 text-xs font-medium ${c.text}`}>Drop here</span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums opacity-60 group-hover:opacity-100">
            {totalCount}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAddCases(node)} title="Add test cases"
            className="rounded-md p-1 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <Plus className="size-3.5" />
          </button>
          <FolderMenu onAddSubfolder={() => onAddSubfolder(node)} onDelete={() => onDelete(node.id)} />
        </div>
      </div>

      {/* Children */}
      {isExpanded && (
        <div>
          {node.children.map((child) => (
            <FolderNode key={child.id} node={child} depth={depth + 1} projectId={projectId}
              expanded={expanded} onToggle={onToggle}
              onAddCases={onAddCases} onAddSubfolder={onAddSubfolder} onDelete={onDelete}
              onRemoveItem={onRemoveItem} removingId={removingId}
              onSuiteClick={onSuiteClick} onRun={onRun} runningId={runningId}
              draggingItem={draggingItem} dragOverId={dragOverId} setDragOverId={setDragOverId}
              onDropOnFolder={onDropOnFolder} onDragStart={onDragStart} onDragEnd={onDragEnd}
            />
          ))}
          {node.items.map((item) => (
            <FileNode key={item.id} item={item} depth={depth + 1} projectId={projectId}
              collectionId={node.id}
              onRemove={(it) => onRemoveItem(node.id, it)} removingId={removingId}
              onSuiteClick={onSuiteClick} onRun={onRun} runningId={runningId}
              onDragStart={onDragStart} onDragEnd={onDragEnd}
              isDragging={draggingItem?.testCaseId === (item.testCaseId ?? item.id) && draggingItem?.sourceCollectionId === node.id}
            />
          ))}
          {node.children.length === 0 && node.items.length === 0 && (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground/60 italic"
              style={{ paddingLeft: `${(depth + 1) * 20 + 24}px` }}>
              Empty folder — click + to add test cases
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Search Results ───────────────────────────────────────────────────────────

function SearchResults({ results, projectId, onSuiteClick, onRun, runningId }) {
  const navigate = useNavigate();
  if (results.length === 0) {
    return <div className="py-12 text-center text-sm text-muted-foreground">No test cases match your search.</div>;
  }
  return (
    <div className="space-y-0.5">
      {results.map((tc) => {
        const id = tc.testCaseId ?? tc.id;
        const isRunning = runningId === id;
        return (
          <div key={tc.id ?? id}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
            onClick={() => navigate(`/projects/${projectId}/test-cases/${id}`)}>
            <FileText className="size-4 shrink-0 text-slate-300 group-hover:text-indigo-300 transition-colors" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{tc.title}</span>
                <Badge className={`shrink-0 text-[10px] border py-0 ${STATUS_BADGE[tc.status] ?? STATUS_BADGE.draft}`}>
                  {tc.status || "draft"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{tc.goal}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onSuiteClick({ id, title: tc.title })} title="Add to test suite"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <ListTodo className="size-4" />
              </button>
              <button onClick={() => onRun(tc)} disabled={isRunning || tc.status === "archived"}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isRunning ? <Loader2 className="size-3 animate-spin" /> : "Run"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestCasesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { testCases, loading: loadingCases } = useTestCases(projectId);

  const [tree, setTree] = useState([]);
  const [categorizedIds, setCategorizedIds] = useState(new Set());
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState("");

  const [expanded, setExpanded] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [runningId, setRunningId] = useState(null);
  const [runError, setRunError] = useState("");
  const [suiteDialog, setSuiteDialog] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // drag state
  const [draggingItem, setDraggingItem] = useState(null); // { testCaseId, itemId, sourceCollectionId }
  const [dragOverId, setDragOverId] = useState(null);
  const [dropping, setDropping] = useState(false);

  // folder dialogs
  const [createFolder, setCreateFolder] = useState(null);
  const [addCasesTarget, setAddCasesTarget] = useState(null);

  // ── Load tree ───────────────────────────────────────────────────────────────

  const fetchTree = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingTree(true); setTreeError("");
      const data = await getCollectionTree(projectId);
      const nodes = data?.tree ?? [];
      setTree(nodes);
      setCategorizedIds(new Set(data?.categorizedTestCaseIds ?? []));
      setExpanded((prev) => {
        const next = new Set(prev);
        nodes.forEach((n) => next.add(n.id));
        return next;
      });
    } catch (e) {
      setTreeError(e?.message || "Failed to load.");
    } finally {
      setLoadingTree(false);
    }
  }, [projectId]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const uncategorized = useMemo(
    () => testCases.filter((tc) => !categorizedIds.has(Number(tc.id))),
    [testCases, categorizedIds]
  );

  const searchResults = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    if (!kw) return [];
    return testCases.filter(
      (tc) => (tc.title ?? "").toLowerCase().includes(kw) || (tc.goal ?? "").toLowerCase().includes(kw)
    );
  }, [testCases, searchTerm]);

  // ── Drag handlers ────────────────────────────────────────────────────────────

  function handleDragEnd() {
    setDraggingItem(null);
    setDragOverId(null);
  }

  // Called with the raw DragEvent — reads dataTransfer for the item info
  async function handleDropOnFolder(e, targetCollectionId) {
    e.preventDefault();
    let payload;
    try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }

    const { testCaseId, itemId, sourceCollectionId } = payload;
    if (sourceCollectionId === targetCollectionId) return;

    try {
      setDropping(true);
      await addCollectionItems(targetCollectionId, [testCaseId]);
      if (sourceCollectionId && itemId) {
        await removeCollectionItem(sourceCollectionId, itemId);
      }
      // Auto-expand target folder
      setExpanded((prev) => new Set([...prev, targetCollectionId]));
      await fetchTree();
    } catch { /* ignore */ } finally {
      setDropping(false);
      setDraggingItem(null);
    }
  }

  async function handleDropOnRoot(e) {
    e.preventDefault();
    setDragOverId(null);
    let payload;
    try { payload = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }

    const { itemId, sourceCollectionId } = payload;
    if (!sourceCollectionId || !itemId) return;

    try {
      setDropping(true);
      await removeCollectionItem(sourceCollectionId, itemId);
      await fetchTree();
    } catch { /* ignore */ } finally {
      setDropping(false);
      setDraggingItem(null);
    }
  }

  // ── Other actions ────────────────────────────────────────────────────────────

  function toggleExpanded(id) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleRun(tc) {
    const testCaseId = tc.testCaseId ?? tc.id;
    try {
      setRunError(""); setRunningId(testCaseId);
      await createTestRun({ testCaseId, promptText: tc.promptText || "" });
      navigate(`/projects/${projectId}/test-runs`);
    } catch (e) {
      setRunError(e?.message || "Failed to start test run.");
    } finally { setRunningId(null); }
  }

  async function handleDeleteFolder(id) {
    if (!window.confirm("Delete this folder? Test cases inside won't be affected.")) return;
    try { await deleteCollection(id); fetchTree(); } catch { /* ignore */ }
  }

  async function handleRemoveItem(collectionId, item) {
    try {
      setRemovingId(item.id);
      await removeCollectionItem(collectionId, item.id);
      fetchTree();
    } finally { setRemovingId(null); }
  }

  function openAddCases(node) {
    const existingIds = new Set(collectAllItemIds(node));
    setAddCasesTarget({ id: node.id, name: node.name, existingIds });
  }

  function collectAllItemIds(node) {
    const ids = node.items.map((i) => i.testCaseId);
    for (const child of node.children) ids.push(...collectAllItemIds(child));
    return ids;
  }

  // shared props for drag passed down the tree
  const dragProps = {
    draggingItem,
    dragOverId,
    setDragOverId,
    onDropOnFolder: handleDropOnFolder,
    onDragStart: setDraggingItem,
    onDragEnd: handleDragEnd,
  };

  const isLoading = loadingTree || loadingCases;
  const isAnyDragging = !!draggingItem;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Cases"
        description="Organize and run your automated test cases"
        action={
          <Button variant="outline" onClick={() => setCreateFolder({ parentId: null, parentName: "" })} className="gap-2">
            <FolderPlus className="size-4" />New Folder
          </Button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="text" placeholder="Search test cases…" value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {/* Tree */}
      <div className={`rounded-xl border bg-white px-3 py-2 min-h-[200px] transition-opacity ${dropping ? "opacity-60 pointer-events-none" : ""}`}>
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner size="lg" label="Loading…" />
          </div>
        ) : treeError ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-red-500">
            {treeError} — <button onClick={fetchTree} className="underline ml-1">Retry</button>
          </div>
        ) : searchTerm ? (
          <SearchResults results={searchResults} projectId={projectId}
            onSuiteClick={setSuiteDialog} onRun={handleRun} runningId={runningId} />
        ) : tree.length === 0 && uncategorized.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
            <FolderPlus className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No test cases yet.</p>
            <p className="text-xs text-muted-foreground/70">Create a folder to start organizing your test cases.</p>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {tree.map((node) => (
              <FolderNode key={node.id} node={node} depth={0} projectId={projectId}
                expanded={expanded} onToggle={toggleExpanded}
                onAddCases={openAddCases}
                onAddSubfolder={(n) => setCreateFolder({ parentId: n.id, parentName: n.name })}
                onDelete={handleDeleteFolder}
                onRemoveItem={handleRemoveItem} removingId={removingId}
                onSuiteClick={setSuiteDialog} onRun={handleRun} runningId={runningId}
                {...dragProps}
              />
            ))}

            {uncategorized.map((tc) => (
              <FileNode key={tc.id} item={{ ...tc, testCaseId: tc.id }} depth={0}
                projectId={projectId} collectionId={null}
                onRemove={() => {}} removingId={null}
                onSuiteClick={setSuiteDialog} onRun={handleRun} runningId={runningId}
                onDragStart={setDraggingItem} onDragEnd={handleDragEnd}
                isDragging={draggingItem?.testCaseId === tc.id && !draggingItem?.sourceCollectionId}
              />
            ))}

            {/* Root drop zone — shown when dragging a file that is inside a folder */}
            {isAnyDragging && draggingItem?.sourceCollectionId && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverId("root"); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={handleDropOnRoot}
                className={`mt-2 rounded-lg border-2 border-dashed p-3 text-center text-xs transition-all ${
                  dragOverId === "root"
                    ? "border-slate-400 bg-slate-50 text-slate-600"
                    : "border-slate-200 text-slate-400"
                }`}
              >
                {dragOverId === "root" ? "Release to remove from folder" : "Drop here to remove from folder"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ErrorPopup open={!!runError} onClose={() => setRunError("")} />

      <AddToSuiteDialog open={!!suiteDialog} onClose={() => setSuiteDialog(null)}
        testCaseId={suiteDialog?.id} testCaseTitle={suiteDialog?.title} projectId={projectId} />

      <CreateFolderDialog open={!!createFolder} onClose={() => setCreateFolder(null)}
        onCreated={() => { fetchTree(); setExpanded((prev) => new Set([...prev, createFolder?.parentId].filter(Boolean))); }}
        projectId={projectId} parentId={createFolder?.parentId} parentName={createFolder?.parentName} />

      {addCasesTarget && (
        <AddCasesDialog open={true} onClose={() => setAddCasesTarget(null)} onAdded={fetchTree}
          collectionId={addCasesTarget.id} existingIds={addCasesTarget.existingIds} allTestCases={testCases} />
      )}
    </div>
  );
}
