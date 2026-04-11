import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Tag,
  Plus,
  Trash2,
  Check,
  X,
  Pencil,
  ExternalLink,
} from "lucide-react";
import {
  getCollection,
  updateCollection,
  addCollectionItems,
  removeCollectionItem,
} from "@/features/test-collection/api/testCollectionApi";
import { getTestCases } from "@/features/test-cases/api/testCasesApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import EmptyState from "@/shared/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Color palette ────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { key: "indigo",  bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500",  ring: "ring-indigo-300",  bar: "bg-indigo-500"  },
  { key: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-300", bar: "bg-emerald-500" },
  { key: "rose",    bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-300",    bar: "bg-rose-500"    },
  { key: "amber",   bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-300",   bar: "bg-amber-500"   },
  { key: "violet",  bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  ring: "ring-violet-300",  bar: "bg-violet-500"  },
  { key: "cyan",    bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500",    ring: "ring-cyan-300",    bar: "bg-cyan-500"    },
  { key: "slate",   bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-500",   ring: "ring-slate-300",   bar: "bg-slate-500"   },
];

function getColor(key) {
  return COLOR_OPTIONS.find((c) => c.key === key) ?? COLOR_OPTIONS[0];
}

const STATUS_BADGE = {
  ready:    "bg-emerald-100 text-emerald-700",
  draft:    "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-700",
};

// ─── Add Cases Dialog ─────────────────────────────────────────────────────────

function AddCasesDialog({ open, onClose, onAdded, projectId, existingIds }) {
  const [allCases, setAllCases] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    getTestCases(projectId).then(setAllCases).catch(() => {});
    setSelected(new Set());
    setQuery("");
  }, [open, projectId]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      setSaving(true);
      await onAdded(ids);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const available = allCases
    .filter((tc) => !existingIds.has(tc.id ?? tc.testCaseId))
    .filter((tc) =>
      query.trim() === "" ||
      tc.title?.toLowerCase().includes(query.toLowerCase()) ||
      tc.goal?.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Test Cases to Collection</DialogTitle>
        </DialogHeader>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 mt-2"
          placeholder="Search by title or goal..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-72 overflow-y-auto divide-y rounded-lg border mt-2">
          {available.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              {allCases.length === 0 ? "Loading..." : "All test cases are already in this collection"}
            </p>
          ) : (
            available.map((tc) => {
              const id = tc.id ?? tc.testCaseId;
              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => toggle(id)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tc.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{tc.goal}</p>
                  </div>
                </label>
              );
            })
          )}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestCollectionDetailPage() {
  const { projectId, collectionId } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Inline edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCollection(collectionId);
      setCollection(data);
      setItems(data?.items ?? []);
    } catch (e) {
      setError(e?.message || "Failed to load collection.");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => { load(); }, [load]);

  function startEditTitle() {
    setDraftTitle(collection?.name ?? "");
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  async function saveTitle() {
    if (!draftTitle.trim() || draftTitle === collection?.name) {
      setEditingTitle(false);
      return;
    }
    try {
      setSaving(true);
      await updateCollection(collectionId, {
        name: draftTitle.trim(),
        description: collection?.description,
        color: collection?.color,
      });
      setCollection((prev) => ({ ...prev, name: draftTitle.trim() }));
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function handleAddItems(testCaseIds) {
    await addCollectionItems(collectionId, testCaseIds);
    load();
  }

  async function handleRemoveItem(itemId) {
    setRemovingId(itemId);
    try {
      await removeCollectionItem(collectionId, itemId);
      load();
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading collection..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={load} onRetry={load} />;
  }

  const c = getColor(collection?.color);
  const existingIds = new Set(items.map((i) => i.testCaseId));

  return (
    <div className="space-y-8">
      {/* Back */}
      <button
        onClick={() => navigate(`/projects/${projectId}/collections`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Collections
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Editable title */}
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                onBlur={saveTitle}
                className="text-2xl font-bold tracking-tight border-b-2 border-indigo-500 bg-transparent outline-none w-full min-w-0"
                disabled={saving}
              />
              <button onClick={saveTitle} className="shrink-0 text-indigo-600 hover:text-indigo-800">
                <Check className="size-4" />
              </button>
              <button onClick={() => setEditingTitle(false)} className="shrink-0 text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div
              className="group flex items-center gap-2 cursor-pointer"
              onClick={startEditTitle}
            >
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${c.bg} ${c.text}`}>
                <Tag className="size-3.5" />
                {collection?.name}
              </span>
              <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {collection?.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}

          {/* Info: no execution */}
          <p className="text-xs text-muted-foreground">
            Organize-only · test cases here can also belong to other collections
          </p>
        </div>

        <Button onClick={() => setShowAddDialog(true)} variant="outline" className="shrink-0 gap-2">
          <Plus className="size-4" />
          Add Cases
        </Button>
      </div>

      {/* Test Cases */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Test Cases ({items.length})
        </h2>

        {items.length === 0 ? (
          <EmptyState
            title="No test cases"
            description='Click "Add Cases" to label test cases with this collection'
          />
        ) : (
          <div className="rounded-xl border bg-white divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-4 hover:bg-slate-50"
              >
                {/* Color accent */}
                <div className={`h-8 w-1 shrink-0 rounded-full ${c.dot}`} />

                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/test-cases/${item.testCaseId}`)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate hover:text-indigo-600 transition-colors">
                      {item.title}
                    </p>
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.goal}</p>
                </div>

                <Badge
                  variant="outline"
                  className={`shrink-0 capitalize text-xs ${STATUS_BADGE[item.status] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {item.status}
                </Badge>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removingId === item.id}
                  title="Remove from collection"
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddCasesDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={handleAddItems}
        projectId={projectId}
        existingIds={existingIds}
      />
    </div>
  );
}
