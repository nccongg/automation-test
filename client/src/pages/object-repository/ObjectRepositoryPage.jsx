import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  Layers,
  Plus,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Pencil,
  Trash2,
  Box,
} from "lucide-react";
import {
  useObjectRepository,
  useCandidates,
} from "@/features/object-repository/hooks/useObjectRepository";
import { SELECTOR_TYPES } from "@/features/object-repository/components/ObjectFormDrawer";
import ObjectEditPanel from "@/features/object-repository/components/ObjectEditPanel";
import { Button } from "@/components/ui/button";
import { FormLabel, FormValue } from "@/shared/components/ui/FormField";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { toast } from "sonner";

// ─── Copy button ──────────────────────────────────────────────────────────────

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
      className="ml-auto shrink-0 rounded p-1 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ─── Candidate section ────────────────────────────────────────────────────────

function CandidateSection({ projectId, objectId, onAccepted }) {
  const { candidates, loading, accept, dismiss } = useCandidates(projectId, objectId);
  const [accepting, setAccepting] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  if (loading)
    return <p className="py-2 text-sm text-muted-foreground">Loading candidates…</p>;
  if (!candidates.length)
    return (
      <p className="py-3 text-center text-sm text-muted-foreground">No pending candidates</p>
    );

  return (
    <div className="flex flex-col gap-3">
      {candidates.map((c) => {
        const entries = Object.entries(c.selectorCollection || {});
        return (
          <div key={c.id} className="flex flex-col gap-3 rounded border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                From run #{c.testRunId} · {new Date(c.detectedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={dismissing === c.id}
                  onClick={async () => {
                    setDismissing(c.id);
                    try { await dismiss(c.id); toast.success("Dismissed"); }
                    catch { toast.error("Failed"); }
                    finally { setDismissing(null); }
                  }}
                  className="rounded border border-border bg-card px-3 py-1 text-sm text-red-400 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/20"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={accepting === c.id}
                  onClick={async () => {
                    setAccepting(c.id);
                    try {
                      const obj = await accept(c.id);
                      toast.success("Locator updated");
                      onAccepted?.(obj);
                    } catch { toast.error("Failed"); }
                    finally { setAccepting(null); }
                  }}
                  className="rounded bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {accepting === c.id ? "…" : "Accept"}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {entries.map(([type, value]) => {
                const label = SELECTOR_TYPES.find((t) => t.value === type)?.label ?? type;
                return (
                  <div key={type} className="flex gap-4">
                    <div className="w-28 shrink-0">
                      <FormValue className="text-sm text-muted-foreground">{label}</FormValue>
                    </div>
                    <FormValue className="flex-1 font-mono text-sm">
                      <span className="truncate flex-1">{value}</span>
                    </FormValue>
                  </div>
                );
              })}
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
  const [showDomProps, setShowDomProps] = useState(false);
  const { candidates } = useCandidates(projectId, obj?.id);

  const selEntries = Object.entries(obj.selectorCollection || {});
  const fallbacks = selEntries.filter(([t]) => t !== obj.selectorMethod);
  const isAuto = obj.status === "auto";

  async function handleConfirm() {
    setConfirming(true);
    try { await onConfirm(obj.id); toast.success("Object confirmed"); }
    catch { toast.error("Failed to confirm"); }
    finally { setConfirming(false); }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card p-6 shadow-[0_0_14px_rgba(0,0,0,0.1)] dark:shadow-[0_0_14px_rgba(0,0,0,0.35)]">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xl font-semibold text-foreground">{obj.name}</h2>
            {obj.status === "confirmed" ? (
              <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3" /> Confirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
                <Sparkles className="size-3" /> Auto
              </span>
            )}
            {candidates.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">
                {candidates.length} candidate{candidates.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAuto && (
            <Button size="sm" variant="outline" disabled={confirming} onClick={handleConfirm} className="gap-1.5">
              <ShieldCheck className="size-3.5" />
              {confirming ? "Confirming…" : "Confirm"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(obj)} className="gap-1.5">
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(obj)}
            className="gap-1.5 border-red-200 text-red-400 hover:bg-red-50 hover:text-red-500 dark:border-red-800/30 dark:hover:bg-red-950/20">
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Info row: Page + Description */}
      {(obj.pageKey || obj.description) && (
        <div className="flex gap-4">
          {obj.pageKey && (
            <div className="flex flex-1 flex-col gap-1.5">
              <FormLabel>Page / Group</FormLabel>
              <FormValue>{obj.pageKey}</FormValue>
            </div>
          )}
          {obj.description && (
            <div className="flex flex-1 flex-col gap-1.5">
              <FormLabel>Description</FormLabel>
              <FormValue className="text-muted-foreground">{obj.description}</FormValue>
            </div>
          )}
        </div>
      )}

      {/* Default selector */}
      <div className="flex flex-col gap-1.5">
        <FormLabel>Default Selector</FormLabel>
        <div className="flex gap-4">
          <div className="w-28 shrink-0">
            <FormValue className="text-sm font-medium text-brand-500">
              {SELECTOR_TYPES.find((t) => t.value === obj.selectorMethod)?.label ?? obj.selectorMethod}
            </FormValue>
          </div>
          <FormValue className="flex-1 min-w-0">
            <span className="flex-1 truncate font-mono text-sm">
              {obj.selectorCollection?.[obj.selectorMethod] || "—"}
            </span>
            {obj.selectorCollection?.[obj.selectorMethod] && (
              <CopyBtn value={obj.selectorCollection[obj.selectorMethod]} />
            )}
          </FormValue>
        </div>
      </div>

      {/* Fallback selectors */}
      {fallbacks.length > 0 && (
        <div className="flex flex-col gap-3">
          <FormLabel>Fallback Selectors</FormLabel>
          {fallbacks.map(([type, value]) => (
            <div key={type} className="flex gap-4">
              <div className="w-28 shrink-0">
                <FormValue className="text-sm text-muted-foreground">
                  {SELECTOR_TYPES.find((t) => t.value === type)?.label ?? type}
                </FormValue>
              </div>
              <FormValue className="flex-1 min-w-0">
                <span className="flex-1 truncate font-mono text-sm text-muted-foreground">{value}</span>
                <CopyBtn value={value} />
              </FormValue>
            </div>
          ))}
        </div>
      )}

      {/* DOM Properties */}
      {obj.elementProperties && Object.keys(obj.elementProperties).length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowDomProps((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {showDomProps ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            DOM properties snapshot
          </button>
          {showDomProps && (
            <div className="divide-y divide-border rounded border border-border">
              {Object.entries(obj.elementProperties).map(([k, v]) => (
                <div key={k} className="flex items-center gap-4 px-4 py-2">
                  <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{k}</span>
                  <span className="flex-1 truncate text-xs text-foreground">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidate locators */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowCandidates((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {showCandidates ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          Candidate Locators
          {candidates.length > 0 && (
            <span className="ml-1 rounded bg-amber-500/15 px-1.5 text-xs text-amber-500">
              {candidates.length}
            </span>
          )}
        </button>
        {showCandidates && (
          <CandidateSection projectId={projectId} objectId={obj.id} onAccepted={onObjectUpdated} />
        )}
      </div>

      {/* Meta */}
      {(obj.sourceUrl || obj.createdFromRunId || obj.updatedAt) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4">
          {obj.sourceUrl && (
            <p className="text-xs text-muted-foreground">
              Source: <span className="font-mono">{obj.sourceUrl}</span>
            </p>
          )}
          {obj.createdFromRunId && (
            <p className="text-xs text-muted-foreground">Created from run #{obj.createdFromRunId}</p>
          )}
          {obj.updatedAt && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(obj.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ object, onConfirm, onCancel, loading }) {
  if (!object) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-lg bg-card p-8 shadow-[0_0_14px_rgba(0,0,0,0.15)]">
        <div className="mb-4 flex size-10 items-center justify-center rounded border border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-950/20">
          <Trash2 className="size-5 text-red-400" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">Delete Object</h3>
        <p className="mb-6 text-base leading-6 text-muted-foreground">
          Delete <span className="font-mono font-medium text-foreground">{object.name}</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-red-600 text-white hover:bg-red-700">
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

  const { objects, grouped, loading, error, reload, create, update, remove, confirm } =
    useObjectRepository(projectId);

  const objectId = searchParams.get("objectId");
  const selectedObj = objectId ? (objects.find((o) => String(o.id) === objectId) ?? null) : null;

  const [editMode, setEditMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const totalPages = useMemo(() => Object.keys(grouped).length, [grouped]);

  if (loading)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading objects…" />
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
        </div>
      </div>
    );

  if (editMode) {
    return (
      <div className="space-y-6">
        <ObjectEditPanel
          object={editMode === "new" ? null : selectedObj}
          onSave={handleSave}
          onCancel={() => setEditMode(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Object Repository"
        description="Test element locators organized by page, detected and managed by the agent"
        action={
          <Button onClick={() => setEditMode("new")} className="gap-2">
            <Plus className="size-4" /> New Object
          </Button>
        }
      />

      {objects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <Layers className="mb-3 size-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No test objects yet</p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            Run a test case — objects are detected automatically
          </p>
        </div>
      ) : (
        <div className="min-h-[500px]">
          {selectedObj ? (
            <ObjectDetail
              obj={selectedObj}
              projectId={projectId}
              onEdit={() => setEditMode("edit")}
              onDelete={setDeleteTarget}
              onConfirm={confirm}
              onObjectUpdated={() => { reload(); onObjectsUpdated?.(); }}
            />
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
              <Box className="mb-3 size-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Select an object</p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                {objects.length} object{objects.length !== 1 ? "s" : ""} across {totalPages} page{totalPages !== 1 ? "s" : ""}
              </p>
            </div>
          )}
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
