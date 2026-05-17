import { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Layers, Plus, Search, ChevronDown, ChevronRight,
  Box, Copy, Check, Sparkles, ShieldCheck, Pencil,
  Trash2, MoreHorizontal, AlertTriangle, X,
} from "lucide-react";
import { useObjectRepository, useCandidates } from "@/features/object-repository/hooks/useObjectRepository";
import { TYPE_COLORS, SELECTOR_TYPES } from "@/features/object-repository/components/ObjectFormDrawer";
import ObjectEditPanel from "@/features/object-repository/components/ObjectEditPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesSearch(obj, q) {
  if (!q) return true;
  const lq = q.toLowerCase();
  const selectorValues = Object.values(obj.selectorCollection || {}).map((v) => String(v || "").toLowerCase());
  return [obj.name, obj.pageKey, obj.selectorMethod, obj.description, ...selectorValues]
    .filter(Boolean)
    .some((v) => v.toLowerCase().includes(lq));
}

function SelectorBadge({ type }) {
  const label = SELECTOR_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span className="inline-flex w-20 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 py-0.5 text-[10px] font-mono text-slate-600">
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "confirmed") return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
      <ShieldCheck className="size-2.5" /> Confirmed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
      <Sparkles className="size-2.5" /> Auto
    </span>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      className="shrink-0 rounded p-0.5 text-slate-300 hover:text-slate-600 transition-colors">
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}

// ─── Candidate section ────────────────────────────────────────────────────────

function CandidateSection({ projectId, objectId, onAccepted }) {
  const { candidates, loading, accept, dismiss } = useCandidates(projectId, objectId);
  const [accepting, setAccepting] = useState(null);
  const [dismissing, setDismissing] = useState(null);
  const [compare, setCompare] = useState(null);

  if (loading) return <p className="text-xs text-slate-400 py-2">Loading candidates…</p>;
  if (!candidates.length) return (
    <p className="text-xs text-slate-400 py-3 text-center">No pending candidates</p>
  );

  return (
    <div className="space-y-3">
      {candidates.map((c) => {
        const entries = Object.entries(c.selectorCollection || {});
        const isComparing = compare === c.id;
        return (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                From run #{c.testRunId} · {new Date(c.detectedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setCompare(isComparing ? null : c.id)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50">
                  {isComparing ? "Hide" : "Compare"}
                </button>
                <button type="button" disabled={dismissing === c.id}
                  onClick={async () => { setDismissing(c.id); try { await dismiss(c.id); toast.success("Dismissed"); } catch { toast.error("Failed"); } finally { setDismissing(null); } }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-red-500 hover:bg-red-50 disabled:opacity-50">
                  Dismiss
                </button>
                <button type="button" disabled={accepting === c.id}
                  onClick={async () => { setAccepting(c.id); try { const obj = await accept(c.id); toast.success("Locator updated"); onAccepted?.(obj); } catch { toast.error("Failed"); } finally { setAccepting(null); } }}
                  className="rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] text-white hover:bg-indigo-700 disabled:opacity-50">
                  {accepting === c.id ? "…" : "Accept"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {entries.map(([type, value]) => (
                <div key={type} className="flex items-center gap-2">
                  <SelectorBadge type={type} />
                  <span className="font-mono text-[11px] text-slate-600 truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Object detail panel ──────────────────────────────────────────────────────

function ObjectDetail({ obj, projectId, onEdit, onDelete, onConfirm, onObjectUpdated, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const { candidates } = useCandidates(projectId, obj?.id);

  if (!obj) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <Box className="size-10 text-slate-200 mb-3" />
      <p className="text-sm text-slate-400">Select an object to view details</p>
    </div>
  );

  const selEntries = Object.entries(obj.selectorCollection || {});
  const isAuto = obj.status === "auto";

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm(obj.id);
      toast.success("Object confirmed");
    } catch { toast.error("Failed to confirm"); }
    finally { setConfirming(false); }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 font-mono text-sm">{obj.name}</h3>
            <StatusBadge status={obj.status} />
            {candidates.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {candidates.length} candidate{candidates.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {obj.pageKey && <p className="text-[11px] text-slate-400 mt-0.5">{obj.pageKey}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isAuto && (
            <Button size="sm" variant="outline" disabled={confirming}
              onClick={handleConfirm}
              className="h-7 text-xs gap-1">
              <ShieldCheck className="size-3" />
              {confirming ? "…" : "Confirm"}
            </Button>
          )}
          <button onClick={() => onEdit(obj)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Pencil className="size-4" />
          </button>
          <button onClick={() => onDelete(obj)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="size-4" />
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Description */}
        {obj.description && (
          <p className="text-xs text-slate-500 leading-relaxed">{obj.description}</p>
        )}

        {/* Default selector */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Default Selector</p>
          <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
            <SelectorBadge type={obj.selectorMethod} />
            <span className="font-mono text-xs text-indigo-800 truncate flex-1">
              {obj.selectorCollection?.[obj.selectorMethod] || "—"}
            </span>
            {obj.selectorCollection?.[obj.selectorMethod] && (
              <CopyBtn value={obj.selectorCollection[obj.selectorMethod]} />
            )}
          </div>
        </div>

        {/* Selector collection */}
        {selEntries.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Fallback Selectors ({selEntries.length - 1})
            </p>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {selEntries.filter(([t]) => t !== obj.selectorMethod).map(([type, value]) => (
                <div key={type} className="flex items-center gap-2 px-3 py-2">
                  <SelectorBadge type={type} />
                  <span className="font-mono text-[11px] text-slate-600 truncate flex-1">{value}</span>
                  <CopyBtn value={value} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Element properties */}
        {obj.elementProperties && Object.keys(obj.elementProperties).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">DOM Properties</p>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {Object.entries(obj.elementProperties).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-3 py-1.5">
                  <span className="text-[10px] font-mono font-medium text-slate-400 w-24 shrink-0">{k}</span>
                  <span className="text-[11px] text-slate-600 truncate">{String(v)}</span>
                  {(obj.selectedProperties || []).includes(k) && (
                    <Badge className="shrink-0 text-[9px] bg-indigo-50 text-indigo-600 border-indigo-200 ml-auto">used</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidate locators */}
        <div className="space-y-1.5">
          <button type="button" onClick={() => setShowCandidates((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors w-full">
            {showCandidates ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            Candidate Locators
            {candidates.length > 0 && (
              <span className="ml-1 rounded bg-slate-200 text-slate-600 px-1 text-[9px]">{candidates.length}</span>
            )}
          </button>
          {showCandidates && (
            <CandidateSection
              projectId={projectId}
              objectId={obj.id}
              onAccepted={onObjectUpdated}
            />
          )}
        </div>

        {/* Meta */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          {obj.sourceUrl && (
            <p className="text-[10px] text-slate-400">
              Source: <span className="font-mono">{obj.sourceUrl}</span>
            </p>
          )}
          {obj.createdFromRunId && (
            <p className="text-[10px] text-slate-400">Created from run #{obj.createdFromRunId}</p>
          )}
          {obj.updatedAt && (
            <p className="text-[10px] text-slate-400">
              Updated {new Date(obj.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Left tree ────────────────────────────────────────────────────────────────

function ObjectTree({ grouped, selectedId, onSelect, search }) {
  const [collapsed, setCollapsed] = useState({});

  return (
    <div className="overflow-y-auto flex-1 py-2">
      {Object.entries(grouped).map(([pageKey, objs]) => {
        const isCollapsed = collapsed[pageKey];
        return (
          <div key={pageKey} className="mb-1">
            <button type="button"
              onClick={() => setCollapsed((p) => ({ ...p, [pageKey]: !p[pageKey] }))}
              className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left group">
              {isCollapsed ? <ChevronRight className="size-3 text-slate-400" /> : <ChevronDown className="size-3 text-slate-400" />}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 group-hover:text-slate-700 truncate flex-1">
                {pageKey}
              </span>
              <span className="text-[10px] text-slate-400">{objs.length}</span>
            </button>

            {!isCollapsed && objs.map((obj) => (
              <button key={obj.id} type="button"
                onClick={() => onSelect(obj)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-left rounded-lg mx-1 transition-colors ${
                  selectedId === obj.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                style={{ width: "calc(100% - 8px)" }}>
                <Box className={`size-3 shrink-0 ${selectedId === obj.id ? "text-indigo-200" : "text-slate-400"}`} />
                <span className="text-xs font-mono truncate flex-1">{obj.name}</span>
                {obj.status === "confirmed"
                  ? <ShieldCheck className={`size-3 shrink-0 ${selectedId === obj.id ? "text-indigo-200" : "text-slate-400"}`} />
                  : <Sparkles className={`size-3 shrink-0 ${selectedId === obj.id ? "text-indigo-200" : "text-slate-400"}`} />
                }
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ object, onConfirm, onCancel, loading }) {
  if (!object) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 mb-4">
          <Trash2 className="size-5 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Object</h3>
        <p className="text-sm text-slate-500 mb-5">
          Delete <span className="font-mono font-medium text-slate-800">{object.name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ObjectRepositoryPage() {
  const { projectId } = useOutletContext();
  const { objects, grouped, loading, error, reload, create, update, remove, confirm } =
    useObjectRepository(projectId);

  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState(null);
  // panelMode: "detail" | "edit" | "new"
  const [panelMode, setPanelMode]       = useState("detail");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Fix 1: search across selectorCollection values
  const filtered = useMemo(() => {
    const result = {};
    for (const [page, objs] of Object.entries(grouped)) {
      const matches = objs.filter((o) => matchesSearch(o, search));
      if (matches.length) result[page] = matches;
    }
    return result;
  }, [grouped, search]);

  // Keep selected in sync if its data changes (e.g. after confirm/accept)
  const selectedObj = useMemo(
    () => selected ? objects.find((o) => o.id === selected.id) || selected : null,
    [objects, selected],
  );

  function openNew() {
    setSelected(null);
    setPanelMode("new");
  }

  function openEdit(obj) {
    setSelected(obj);
    setPanelMode("edit");
  }

  async function handleSave(payload) {
    if (panelMode === "edit" && selected?.id) {
      const updated = await update(selected.id, payload);
      setSelected(updated);
      setPanelMode("detail");
      toast.success("Object updated");
    } else {
      const created = await create(payload);
      setSelected(created);
      setPanelMode("detail");
      toast.success("Object created");
    }
  }

  function handleCancelEdit() {
    setPanelMode(selected ? "detail" : "detail");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      if (selected?.id === deleteTarget.id) { setSelected(null); setPanelMode("detail"); }
      toast.success("Object deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><LoadingSpinner size="lg" label="Loading objects…" /></div>;
  if (error)   return <div className="flex min-h-[400px] items-center justify-center"><div className="text-center space-y-2"><p className="text-sm text-red-600">{error}</p><Button variant="outline" size="sm" onClick={reload}>Retry</Button></div></div>;

  const totalFiltered = Object.values(filtered).reduce((n, a) => n + a.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100">
            <Layers className="size-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Object Repository</h1>
            <p className="text-xs text-slate-400">
              {objects.length} objects · {Object.keys(grouped).length} pages
            </p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0">
          <Plus className="size-4" /> New Object
        </Button>
      </div>

      {objects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <Layers className="size-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No test objects yet</h3>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">
            Run a test case with the agent — objects are detected automatically.
          </p>
          <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="size-4" /> New Object
          </Button>
        </div>
      ) : (
        /* 2-panel layout */
        <div className="flex gap-0 rounded-2xl border border-slate-200 bg-white overflow-hidden" style={{ minHeight: 520 }}>

          {/* Left: tree */}
          <div className="w-56 shrink-0 border-r border-slate-100 flex flex-col">
            <div className="px-3 pt-3 pb-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-slate-200 pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {search && (
                <p className="text-[10px] text-slate-400 mt-1 px-1">{totalFiltered} result{totalFiltered !== 1 ? "s" : ""}</p>
              )}
            </div>
            {Object.keys(filtered).length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
                <p className="text-xs text-slate-400">No match</p>
              </div>
            ) : (
              <ObjectTree
                grouped={filtered}
                selectedId={selectedObj?.id}
                onSelect={(obj) => { setSelected(obj); setPanelMode("detail"); }}
                search={search}
              />
            )}
          </div>

          {/* Right: detail or edit */}
          <div className="flex-1 min-w-0">
            {panelMode === "edit" || panelMode === "new" ? (
              <ObjectEditPanel
                object={panelMode === "new" ? null : selectedObj}
                onSave={handleSave}
                onCancel={handleCancelEdit}
              />
            ) : (
              <ObjectDetail
                obj={selectedObj}
                projectId={projectId}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onConfirm={confirm}
                onObjectUpdated={(updatedObj) => {
                  if (updatedObj) setSelected(updatedObj);
                  reload();
                }}
                onClose={() => { setSelected(null); setPanelMode("detail"); }}
              />
            )}
          </div>
        </div>
      )}

      <DeleteConfirm
        object={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
