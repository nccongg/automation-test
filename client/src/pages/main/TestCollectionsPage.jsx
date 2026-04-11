import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Tag,
  ChevronDown,
  Trash2,
  ExternalLink,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  getCollections,
  getCollection,
  createCollection,
  deleteCollection,
} from "@/features/test-collection/api/testCollectionApi";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import EmptyState from "@/shared/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Color palette ────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { key: "indigo",  bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500",  ring: "ring-indigo-300",  border: "border-indigo-200"  },
  { key: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-300", border: "border-emerald-200" },
  { key: "rose",    bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-300",    border: "border-rose-200"    },
  { key: "amber",   bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-300",   border: "border-amber-200"   },
  { key: "violet",  bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  ring: "ring-violet-300",  border: "border-violet-200"  },
  { key: "cyan",    bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500",    ring: "ring-cyan-300",    border: "border-cyan-200"    },
  { key: "slate",   bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-500",   ring: "ring-slate-300",   border: "border-slate-200"   },
];

function getColor(key) {
  return COLOR_OPTIONS.find((c) => c.key === key) ?? COLOR_OPTIONS[0];
}

const STATUS_BADGE = {
  ready:    "bg-emerald-100 text-emerald-700",
  draft:    "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-700",
};

// ─── Create Dialog ────────────────────────────────────────────────────────────

function CreateCollectionDialog({ open, onClose, onCreated, projectId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("indigo");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      setErr("");
      await createCollection({ projectId: Number(projectId), name, description, color });
      onCreated();
      setName("");
      setDescription("");
      setColor("indigo");
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to create collection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Login, Payment, Smoke Tests"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-desc">Description (optional)</Label>
            <Input
              id="col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this collection cover?"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`h-7 w-7 rounded-full ${c.dot} ring-2 ring-offset-2 transition-all ${
                    color === c.key ? c.ring : "ring-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create Collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Collection Row (collapsible) ─────────────────────────────────────────────

function CollectionRow({ col, projectId, onDelete, deletingId, navigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null = not yet loaded
  const [loadingItems, setLoadingItems] = useState(false);
  const c = getColor(col.color);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      try {
        setLoadingItems(true);
        const data = await getCollection(col.id);
        setItems(data?.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    }
  }

  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-shadow ${open ? "shadow-sm" : ""}`}>
      {/* Header row */}
      <div className="group flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
        {/* Clickable toggle area */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => e.key === "Enter" && toggle()}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
        >
          {/* Color dot */}
          <span className={`size-2.5 shrink-0 rounded-full ${c.dot}`} />

          {/* Name badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text} shrink-0`}>
            <Tag className="size-3" />
            {col.name}
          </span>

          {/* Description */}
          {col.description && (
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {col.description}
            </span>
          )}
          {!col.description && <span className="flex-1" />}
        </div>

        {/* Item count */}
        <span className="shrink-0 text-xs text-muted-foreground mr-1">
          {col.itemCount ?? 0} case{col.itemCount !== 1 ? "s" : ""}
        </span>

        {/* Delete */}
        <button
          type="button"
          onClick={(e) => onDelete(e, col.id)}
          disabled={deletingId === col.id}
          title="Delete collection"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>

        {/* Open in detail */}
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/collections/${col.id}`)}
          title="Open full view"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
        >
          <ExternalLink className="size-3.5" />
        </button>

        {/* Chevron toggle */}
        <button
          type="button"
          onClick={toggle}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Expandable content */}
      {open && (
        <div className={`border-t ${c.border}`}>
          {loadingItems ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : items === null || items.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <FolderOpen className="size-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No test cases yet</p>
              <button
                onClick={() => navigate(`/projects/${projectId}/collections/${col.id}`)}
                className={`mt-1 text-xs font-medium ${c.text} hover:underline`}
              >
                Add cases →
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/test-cases/${item.testCaseId}`)}
                >
                  <div className={`h-7 w-0.5 shrink-0 rounded-full ${c.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </p>
                    {item.goal && (
                      <p className="text-xs text-muted-foreground truncate">{item.goal}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 capitalize text-xs ${STATUS_BADGE[item.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {item.status}
                  </Badge>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TestCollectionsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCollections = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError("");
      const data = await getCollections(projectId);
      setCollections(data);
    } catch (e) {
      setError(e?.message || "Failed to load collections.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this collection? Test cases won't be affected.")) return;
    try {
      setDeletingId(id);
      await deleteCollection(id);
      fetchCollections();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading collections..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Collections"
        description="Organize test cases with labels and folders. A test case can belong to multiple collections."
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="size-4" />
            New Collection
          </Button>
        }
      />

      {/* Info banner */}
      {/* <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        <Hash className="mt-0.5 size-4 shrink-0" />
        <p>
          Collections are <span className="font-semibold">organize-only</span> — they group test cases like labels or folders.
          To execute tests in order and get aggregated results, use{" "}
          <button
            onClick={() => navigate(`/projects/${projectId}/suites`)}
            className="font-semibold underline underline-offset-2 hover:text-indigo-900"
          >
            Test Suites
          </button>.
        </p>
      </div> */}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {collections.length === 0 ? (
        <EmptyState
          title="No Collections"
          description="Create a collection to label and organize your test cases by feature, area, or category"
        />
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <CollectionRow
              key={col.id}
              col={col}
              projectId={projectId}
              onDelete={handleDelete}
              deletingId={deletingId}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      <CreateCollectionDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchCollections}
        projectId={projectId}
      />
    </div>
  );
}
