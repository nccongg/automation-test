import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Tag, ChevronRight, Trash2, Hash } from "lucide-react";
import {
  getCollections,
  createCollection,
  deleteCollection,
} from "@/features/test-collection/api/testCollectionApi";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import EmptyState from "@/shared/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Color palette for collections ───────────────────────────────────────────

const COLOR_OPTIONS = [
  { key: "indigo",  bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500",  ring: "ring-indigo-300"  },
  { key: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-300" },
  { key: "rose",    bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-300"    },
  { key: "amber",   bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-300"   },
  { key: "violet",  bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  ring: "ring-violet-300"  },
  { key: "cyan",    bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500",    ring: "ring-cyan-300"    },
  { key: "slate",   bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-500",   ring: "ring-slate-300"   },
];

function getColor(key) {
  return COLOR_OPTIONS.find((c) => c.key === key) ?? COLOR_OPTIONS[0];
}

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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create Collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
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
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {collections.length === 0 ? (
        <EmptyState
          title="No Collections"
          description="Create a collection to label and organize your test cases by feature, area, or category"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => {
            const c = getColor(col.color);
            return (
              <div
                key={col.id}
                onClick={() => navigate(`/projects/${projectId}/collections/${col.id}`)}
                className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Color bar */}
                <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${c.dot}`} />

                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
                        <Tag className="size-3" />
                        {col.name}
                      </span>
                    </div>
                    {col.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={(e) => handleDelete(e, col.id)}
                      disabled={deletingId === col.id}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="pl-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {col.itemCount ?? 0}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    test case{col.itemCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
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
