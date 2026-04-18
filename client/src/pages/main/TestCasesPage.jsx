import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Search,
  ListTodo,
  Plus,
  Tag,
  ChevronDown,
  Trash2,
  ExternalLink,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import { createTestRun } from "@/features/test-results/api/testResultsApi";
import {
  getCollections,
  getCollection,
  createCollection,
  deleteCollection,
} from "@/features/test-collection/api/testCollectionApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import EmptyState from "@/shared/components/common/EmptyState";
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

// ─── Shared constants ──────────────────────────────────────────────────────────

const STATUS_STYLES = {
  ready:    "bg-emerald-100 text-emerald-700 border-emerald-500/20",
  draft:    "bg-yellow-100 text-yellow-700 border-yellow-500/20",
  archived: "bg-slate-100 text-slate-700 border-slate-500/20",
};

const STATUS_BADGE = {
  ready:    "bg-emerald-100 text-emerald-700",
  draft:    "bg-slate-100 text-slate-600",
  archived: "bg-amber-100 text-amber-700",
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <Badge className={`border ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status || "draft"}
    </Badge>
  );
}

// ─── Create Collection Dialog ──────────────────────────────────────────────────

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

// ─── Collection Row ────────────────────────────────────────────────────────────

function CollectionRow({ col, projectId, onDelete, deletingId, navigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [suiteDialog, setSuiteDialog] = useState(null);
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
      <div className="group flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
        <div
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => e.key === "Enter" && toggle()}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
        >
          <span className={`size-2.5 shrink-0 rounded-full ${c.dot}`} />
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text} shrink-0`}>
            <Tag className="size-3" />
            {col.name}
          </span>
          {col.description && (
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{col.description}</span>
          )}
          {!col.description && <span className="flex-1" />}
        </div>

        <span className="shrink-0 text-xs text-muted-foreground mr-1">
          {col.itemCount ?? 0} case{col.itemCount !== 1 ? "s" : ""}
        </span>

        <button
          type="button"
          onClick={(e) => onDelete(e, col.id)}
          disabled={deletingId === col.id}
          title="Delete collection"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/collections/${col.id}`)}
          title="Open full view"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
        >
          <ExternalLink className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={toggle}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-slate-100 transition-colors"
        >
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

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
            <>
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group/item flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <div
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      onClick={() => navigate(`/projects/${projectId}/test-cases/${item.testCaseId}`)}
                    >
                      <div className={`h-7 w-0.5 shrink-0 rounded-full ${c.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate group-hover/item:text-indigo-600 transition-colors">
                          {item.title}
                        </p>
                        {item.goal && (
                          <p className="text-xs text-muted-foreground truncate">{item.goal}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 capitalize text-xs ${STATUS_BADGE[item.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {item.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSuiteDialog({ id: item.testCaseId, title: item.title });
                      }}
                      title="Add to test suite"
                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <ListTodo className="size-3.5" />
                    </button>
                    <ExternalLink
                      className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => navigate(`/projects/${projectId}/test-cases/${item.testCaseId}`)}
                    />
                  </div>
                ))}
              </div>
              <AddToSuiteDialog
                open={!!suiteDialog}
                onClose={() => setSuiteDialog(null)}
                testCaseId={suiteDialog?.id}
                testCaseTitle={suiteDialog?.title}
                projectId={projectId}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Test Cases Tab ────────────────────────────────────────────────────────────

function TestCasesTab({ projectId }) {
  const navigate = useNavigate();
  const { testCases = [], loading, error } = useTestCases(projectId);
  const [searchTerm, setSearchTerm] = useState("");
  const [runningId, setRunningId] = useState(null);
  const [runError, setRunError] = useState("");
  const [suiteDialog, setSuiteDialog] = useState(null);

  const filteredCases = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return testCases;
    return testCases.filter(
      (tc) =>
        tc.title.toLowerCase().includes(keyword) ||
        tc.goal.toLowerCase().includes(keyword)
    );
  }, [testCases, searchTerm]);

  const handleRun = async (tc) => {
    const testCaseId = tc.testCaseId ?? tc.id;
    try {
      setRunError("");
      setRunningId(testCaseId);
      await createTestRun({ testCaseId, promptText: tc.promptText || "" });
      navigate(`/projects/${projectId}/test-runs`);
    } catch (e) {
      setRunError(e?.message || "Failed to start test run.");
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test cases..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPopup
        open={true}
        onClose={() => window.location.reload()}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ErrorPopup open={!!runError} onClose={() => setRunError("")} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search test cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredCases.length === 0 ? (
        <EmptyState
          title={searchTerm ? "No test cases found" : "No Test Cases"}
          description={
            searchTerm
              ? "Try adjusting your search terms"
              : "No test cases available in this project"
          }
        />
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {filteredCases.map((tc) => {
            const id = tc.testCaseId ?? tc.id;
            return (
              <div
                key={id}
                className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/projects/${projectId}/test-cases/${id}`)}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{tc.title}</h3>
                    <StatusBadge status={tc.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Goal:</span> {tc.goal}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Version: {tc.versionNo}</span>
                    <span>Mode: {tc.executionMode}</span>
                    <span>{tc.stepCount ?? 0} steps</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSuiteDialog({ id, title: tc.title });
                  }}
                  title="Add to test suite"
                  className="shrink-0 rounded-lg border border-slate-200 p-2 text-muted-foreground hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <ListTodo className="size-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRun(tc); }}
                  disabled={runningId === id || tc.status === "archived"}
                  className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runningId === id ? "Running..." : "Run"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddToSuiteDialog
        open={!!suiteDialog}
        onClose={() => setSuiteDialog(null)}
        testCaseId={suiteDialog?.id}
        testCaseTitle={suiteDialog?.title}
        projectId={projectId}
      />
    </div>
  );
}

// ─── Collections Tab ───────────────────────────────────────────────────────────

function CollectionsTab({ projectId }) {
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
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading collections..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Group test cases with labels. A test case can belong to multiple collections.
        </p>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="size-4" />
          New Collection
        </Button>
      </div>

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

// ─── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "cases", label: "Test Cases" },
  { key: "collections", label: "Collections" },
];

export default function TestCasesPage() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("cases");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Cases"
        description="Manage and run your automated test cases"
      />

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border bg-white p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-slate-900 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "cases" ? (
        <TestCasesTab projectId={projectId} />
      ) : (
        <CollectionsTab projectId={projectId} />
      )}
    </div>
  );
}
