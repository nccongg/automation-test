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
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SelectorBadge({ type }) {
  const label = SELECTOR_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span className="inline-flex w-20 shrink-0 items-center justify-center rounded border border-border bg-muted py-0.5 text-[10px] font-mono text-muted-foreground">
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
      className="shrink-0 rounded p-0.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}

// ─── Candidate section ────────────────────────────────────────────────────────

function CandidateSection({ projectId, objectId, onAccepted }) {
  const { candidates, loading, accept, dismiss } = useCandidates(
    projectId,
    objectId,
  );
  const [accepting, setAccepting] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  if (loading)
    return (
      <p className="text-xs text-muted-foreground py-2">Loading candidates…</p>
    );
  if (!candidates.length)
    return (
      <p className="text-xs text-muted-foreground py-3 text-center">
        No pending candidates
      </p>
    );

  return (
    <div className="space-y-3">
      {candidates.map((c) => {
        const entries = Object.entries(c.selectorCollection || {});
        return (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-muted/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                From run #{c.testRunId} ·{" "}
                {new Date(c.detectedAt).toLocaleDateString()}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={dismissing === c.id}
                  onClick={async () => {
                    setDismissing(c.id);
                    try {
                      await dismiss(c.id);
                      toast.success("Dismissed");
                    } catch {
                      toast.error("Failed");
                    } finally {
                      setDismissing(null);
                    }
                  }}
                  className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-50"
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
                    } catch {
                      toast.error("Failed");
                    } finally {
                      setAccepting(null);
                    }
                  }}
                  className="rounded-md bg-brand-600 px-2 py-0.5 text-[11px] text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {accepting === c.id ? "…" : "Accept"}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {entries.map(([type, value]) => (
                <div key={type} className="flex items-center gap-2">
                  <SelectorBadge type={type} />
                  <span className="font-mono text-[11px] text-muted-foreground truncate">
                    {value}
                  </span>
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

function ObjectDetail({
  obj,
  projectId,
  onEdit,
  onDelete,
  onConfirm,
  onObjectUpdated,
}) {
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
    } catch {
      toast.error("Failed to confirm");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Object header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold font-mono text-foreground">
              {obj.name}
            </h2>
            {obj.status === "confirmed" ? (
              <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="size-2.5" /> Confirmed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Sparkles className="size-2.5" /> Auto
              </span>
            )}
            {candidates.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">
                {candidates.length} candidate{candidates.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {obj.pageKey && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {obj.pageKey}
            </p>
          )}
          {obj.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {obj.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAuto && (
            <Button
              size="sm"
              variant="outline"
              disabled={confirming}
              onClick={handleConfirm}
              className="gap-1.5"
            >
              <ShieldCheck className="size-3.5" />
              {confirming ? "Confirming…" : "Confirm"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(obj)}
            className="gap-1.5"
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(obj)}
            className="gap-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-400 border-red-500/20"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Selectors */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Selectors
          </h3>

          {/* Primary */}
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/8 px-4 py-3 space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-brand-400">
              Default
            </p>
            <div className="flex items-center gap-2">
              <SelectorBadge type={obj.selectorMethod} />
              <span className="font-mono text-sm text-brand-300 truncate flex-1">
                {obj.selectorCollection?.[obj.selectorMethod] || "—"}
              </span>
              {obj.selectorCollection?.[obj.selectorMethod] && (
                <CopyBtn value={obj.selectorCollection[obj.selectorMethod]} />
              )}
            </div>
          </div>

          {/* Fallbacks */}
          {selEntries.filter(([t]) => t !== obj.selectorMethod).length > 0 && (
            <div className="rounded-xl border border-border divide-y divide-border">
              {selEntries
                .filter(([t]) => t !== obj.selectorMethod)
                .map(([type, value]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 px-4 py-2.5"
                  >
                    <SelectorBadge type={type} />
                    <span className="font-mono text-[11px] text-muted-foreground truncate flex-1">
                      {value}
                    </span>
                    <CopyBtn value={value} />
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* DOM Properties */}
        {obj.elementProperties &&
          Object.keys(obj.elementProperties).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                DOM Properties
              </h3>
              <div className="rounded-xl border border-border divide-y divide-border">
                {Object.entries(obj.elementProperties).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-[10px] font-mono font-medium text-muted-foreground w-28 shrink-0">
                      {k}
                    </span>
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {String(v)}
                    </span>
                    {(obj.selectedProperties || []).includes(k) && (
                      <Badge className="shrink-0 text-[9px] bg-brand-500/10 text-brand-400 border-brand-500/20">
                        used
                      </Badge>
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
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          {showCandidates ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
          Candidate Locators
          {candidates.length > 0 && (
            <span className="ml-1 rounded bg-amber-500/15 text-amber-500 px-1.5 text-[9px]">
              {candidates.length}
            </span>
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
      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t border-border">
        {obj.sourceUrl && (
          <p className="text-[11px] text-muted-foreground">
            Source: <span className="font-mono">{obj.sourceUrl}</span>
          </p>
        )}
        {obj.createdFromRunId && (
          <p className="text-[11px] text-muted-foreground">
            Created from run #{obj.createdFromRunId}
          </p>
        )}
        {obj.updatedAt && (
          <p className="text-[11px] text-muted-foreground">
            Updated {new Date(obj.updatedAt).toLocaleString()}
          </p>
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
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/15 mb-4">
          <Trash2 className="size-5 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Delete Object
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Delete{" "}
          <span className="font-mono font-medium text-foreground">
            {object.name}
          </span>
          ? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
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

  const {
    objects,
    grouped,
    loading,
    error,
    reload,
    create,
    update,
    remove,
    confirm,
  } = useObjectRepository(projectId);

  const objectId = searchParams.get("objectId");
  const selectedObj = objectId
    ? (objects.find((o) => String(o.id) === objectId) ?? null)
    : null;

  // "edit" | "new" | null
  const [editMode, setEditMode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Clear edit mode when objectId changes
  useEffect(() => {
    setEditMode(null);
  }, [objectId]);

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
        <div className="text-center space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </div>
      </div>
    );

  // Edit / new form
  if (editMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={
            editMode === "new"
              ? "New Object"
              : `Edit: ${selectedObj?.name ?? ""}`
          }
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Object Repository"
        description="Test element locators organized by page, detected and managed by the agent"
        action={
          <Button onClick={() => setEditMode("new")} className="gap-2">
            <Plus className="size-4" />
            New Object
          </Button>
        }
      />

      {objects.length === 0 ? (
        /* Empty state */
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
          <Layers className="size-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No test objects yet
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Run a test case — objects are detected automatically
          </p>
        </div>
      ) : (
        <div className="min-h-[500px]">
          {selectedObj ? (
            <div className="rounded-xl border border-border bg-card p-6">
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
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
              <Box className="size-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Select an object
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {objects.length} object{objects.length !== 1 ? "s" : ""}{" "}
                across {totalPages} page{totalPages !== 1 ? "s" : ""}
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
