import { useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  Layers, Plus, ChevronDown, ChevronRight,
  Copy, Check, Sparkles, ShieldCheck, Pencil,
  Trash2,
} from "lucide-react";
import { useObjectRepository, useCandidates } from "@/features/object-repository/hooks/useObjectRepository";
import { SELECTOR_TYPES } from "@/features/object-repository/components/ObjectFormDrawer";
import ObjectEditPanel from "@/features/object-repository/components/ObjectEditPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SelectorBadge({ type }) {
  const label = SELECTOR_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span className="inline-flex w-20 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 py-0.5 text-[10px] font-mono text-slate-600">
      {label}
    </span>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 rounded p-0.5 text-slate-300 hover:text-slate-600 transition-colors"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}

// ─── Candidate section ────────────────────────────────────────────────────────

function CandidateSection({ projectId, objectId, onAccepted }) {
  const { candidates, loading, accept, dismiss } = useCandidates(projectId, objectId);
  const [accepting, setAccepting] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  if (loading) return <p className="text-xs text-slate-400 py-2">Loading candidates…</p>;
  if (!candidates.length) return (
    <p className="text-xs text-slate-400 py-3 text-center">No pending candidates</p>
  );

  return (
    <div className="space-y-3">
      {candidates.map((c) => {
        const entries = Object.entries(c.selectorCollection || {});
        return (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                From run #{c.testRunId} · {new Date(c.detectedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={dismissing === c.id}
                  onClick={async () => {
                    setDismissing(c.id);
                    try { await dismiss(c.id); toast.success("Dismissed"); }
                    catch { toast.error("Failed"); }
                    finally { setDismissing(null); }
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={accepting === c.id}
                  onClick={async () => {
                    setAccepting(c.id);
                    try { const obj = await accept(c.id); toast.success("Locator updated"); onAccepted?.(obj); }
                    catch { toast.error("Failed"); }
                    finally { setAccepting(null); }
                  }}
                  className="rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] text-white hover:bg-indigo-700 disabled:opacity-50"
                >
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

// ─── Object detail view ───────────────────────────────────────────────────────

function ObjectDetail({ obj, projectId, onEdit, onDelete, onConfirm, onObjectUpdated }) {
  const [confirming, setConfirming] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const { candidates } = useCandidates(projectId, obj?.id);

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
    <div className="space-y-6">
      {/* Object header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold font-mono text-slate-900">{obj.name}</h2>
            {obj.status === "confirmed" ? (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                <ShieldCheck className="size-2.5" /> Confirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                <Sparkles className="size-2.5" /> Auto
              </span>
            )}
            {candidates.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
                {candidates.length} candidate{candidates.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {obj.pageKey && (
            <p className="text-sm text-muted-foreground mt-0.5">{obj.pageKey}</p>
          )}
          {obj.description && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{obj.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAuto && (
            <Button size="sm" variant="outline" disabled={confirming} onClick={handleConfirm} className="gap-1.5">
              <ShieldCheck className="size-3.5" />
              {confirming ? "Confirming…" : "Confirm"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(obj)} className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(obj)}
            className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Selectors */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selectors</h3>

          {/* Primary */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">Default</p>
            <div className="flex items-center gap-2">
              <SelectorBadge type={obj.selectorMethod} />
              <span className="font-mono text-sm text-indigo-800 truncate flex-1">
                {obj.selectorCollection?.[obj.selectorMethod] || "—"}
              </span>
              {obj.selectorCollection?.[obj.selectorMethod] && (
                <CopyBtn value={obj.selectorCollection[obj.selectorMethod]} />
              )}
            </div>
          </div>

          {/* Fallbacks */}
          {selEntries.filter(([t]) => t !== obj.selectorMethod).length > 0 && (
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {selEntries.filter(([t]) => t !== obj.selectorMethod).map(([type, value]) => (
                <div key={type} className="flex items-center gap-2 px-4 py-2.5">
                  <SelectorBadge type={type} />
                  <span className="font-mono text-[11px] text-slate-600 truncate flex-1">{value}</span>
                  <CopyBtn value={value} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DOM Properties */}
        {obj.elementProperties && Object.keys(obj.elementProperties).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DOM Properties</h3>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {Object.entries(obj.elementProperties).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-[10px] font-mono font-medium text-slate-400 w-28 shrink-0">{k}</span>
                  <span className="text-xs text-slate-600 truncate flex-1">{String(v)}</span>
                  {(obj.selectedProperties || []).includes(k) && (
                    <Badge className="shrink-0 text-[9px] bg-indigo-50 text-indigo-600 border-indigo-200">used</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Candidate locators */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowCandidates((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-slate-700 transition-colors"
        >
          {showCandidates ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          Candidate Locators
          {candidates.length > 0 && (
            <span className="ml-1 rounded bg-amber-100 text-amber-600 px-1.5 text-[9px]">{candidates.length}</span>
          )}
        </button>
        {showCandidates && (
          <CandidateSection projectId={projectId} objectId={obj.id} onAccepted={onObjectUpdated} />
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-slate-100">
        {obj.sourceUrl && (
          <p className="text-[11px] text-slate-400">Source: <span className="font-mono">{obj.sourceUrl}</span></p>
        )}
        {obj.createdFromRunId && (
          <p className="text-[11px] text-slate-400">Created from run #{obj.createdFromRunId}</p>
        )}
        {obj.updatedAt && (
          <p className="text-[11px] text-slate-400">Updated {new Date(obj.updatedAt).toLocaleString()}</p>
        )}
      </div>
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
  const { projectId, onObjectsUpdated } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const { objects, loading, error, reload, create, update, remove, confirm } =
    useObjectRepository(projectId);

  const objectId = searchParams.get("objectId");
  const selectedObj = objectId ? objects.find((o) => String(o.id) === objectId) ?? null : null;

  // "edit" | "new" | null
  const [editMode, setEditMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Clear edit mode when objectId changes
  useEffect(() => { setEditMode(null); }, [objectId]);

  async function handleSave(payload) {
    if (editMode === "edit" && selectedObj?.id) {
      await update(selectedObj.id, payload);
      onObjectsUpdated?.();
      toast.success("Object updated");
    } else {
      const created = await create(payload);
      onObjectsUpdated?.();
      setSearchParams({ objectId: String(created.id) });
      toast.success("Object created");
    }
    setEditMode(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      onObjectsUpdated?.();
      setSearchParams({});
      toast.success("Object deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" label="Loading objects…" />
    </div>
  );

  if (error) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
      </div>
    </div>
  );

  // Edit / new form
  if (editMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={editMode === "new" ? "New Object" : `Edit: ${selectedObj?.name ?? ""}`}
          description="Define element locators for replay"
        />
        <ObjectEditPanel
          object={editMode === "new" ? null : selectedObj}
          onSave={handleSave}
          onCancel={() => setEditMode(null)}
        />
      </div>
    );
  }

  // No object selected
  if (!selectedObj) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Object Repository"
          description="Test element locators detected and managed by the agent"
          action={
            <Button onClick={() => setEditMode("new")} className="gap-2">
              <Plus className="size-4" />
              New Object
            </Button>
          }
        />

        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
          <Layers className="size-8 text-slate-300 mb-3" />
          {objects.length === 0 ? (
            <>
              <p className="text-sm font-medium text-slate-400">No test objects yet</p>
              <p className="text-xs text-slate-300 mt-1">Run a test case — objects are detected automatically</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-400">Select an object from the sidebar</p>
              <p className="text-xs text-slate-300 mt-1">{objects.length} object{objects.length !== 1 ? "s" : ""} available</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Object selected — show detail
  return (
    <div className="space-y-6">
      <PageHeader
        title="Object Repository"
        description="Test element locators detected and managed by the agent"
        action={
          <Button onClick={() => setEditMode("new")} className="gap-2">
            <Plus className="size-4" />
            New Object
          </Button>
        }
      />

      <ObjectDetail
        obj={selectedObj}
        projectId={projectId}
        onEdit={() => setEditMode("edit")}
        onDelete={setDeleteTarget}
        onConfirm={confirm}
        onObjectUpdated={() => {
          reload();
          onObjectsUpdated?.();
        }}
      />

      <DeleteConfirm
        object={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
