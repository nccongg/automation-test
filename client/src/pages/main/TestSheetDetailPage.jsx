import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  History,
} from "lucide-react";
import {
  getTestSheet,
  addSheetItems,
  removeSheetItem,
  runTestSheet,
} from "@/features/test-collection/api/testSheetApi";
import { getTestCases } from "@/features/test-cases/api/testCasesApi";
import { getSheetRuns } from "@/features/test-collection/api/testSheetApi";
import PageHeader from "@/shared/components/common/PageHeader";
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

const STATUS_STYLES = {
  pass:      "bg-emerald-100 text-emerald-700",
  fail:      "bg-red-100 text-red-700",
  error:     "bg-orange-100 text-orange-700",
  completed: "bg-blue-100 text-blue-700",
  running:   "bg-yellow-100 text-yellow-700",
  queued:    "bg-slate-100 text-slate-600",
};

function AddCasesDialog({ open, onClose, onAdded, projectId, existingIds }) {
  const [allCases, setAllCases] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getTestCases(projectId).then(setAllCases).catch(() => {});
    setSelected(new Set());
  }, [open, projectId]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const available = allCases.filter((tc) => !existingIds.has(tc.id ?? tc.testCaseId));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Test Cases</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto divide-y rounded-lg border mt-2">
          {available.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              All test cases are already in this sheet
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

export default function TestSheetDetailPage() {
  const { projectId, sheetId } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [items, setItems] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [running, setRunning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [sheetData, runsData] = await Promise.all([
        getTestSheet(sheetId),
        getSheetRuns(projectId),
      ]);
      setSheet(sheetData);
      setItems(sheetData?.items ?? []);
      setRecentRuns(
        (runsData ?? [])
          .filter((r) => String(r.testSheetId) === String(sheetId))
          .slice(0, 5)
      );
    } catch (e) {
      setError(e?.message || "Failed to load sheet.");
    } finally {
      setLoading(false);
    }
  }, [sheetId, projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleAddItems(testCaseIds) {
    await addSheetItems(sheetId, testCaseIds);
    load();
  }

  async function handleRemoveItem(itemId) {
    setRemovingId(itemId);
    try {
      await removeSheetItem(sheetId, itemId);
      load();
    } finally {
      setRemovingId(null);
    }
  }

  async function handleRun() {
    try {
      setRunning(true);
      const result = await runTestSheet(sheetId);
      const runId = result?.sheetRun?.id;
      if (runId) {
        navigate(`/projects/${projectId}/collections/${sheetId}/runs/${runId}`);
      }
    } catch (e) {
      setError(e?.message || "Failed to start sheet run.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading sheet..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={load} onRetry={load} />;
  }

  const existingIds = new Set(items.map((i) => i.testCaseId));

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(`/projects/${projectId}/collections`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          All Sheets
        </button>

        <PageHeader
          title={sheet?.name ?? "Test Sheet"}
          description={sheet?.description || `${items.length} test case${items.length !== 1 ? "s" : ""}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="size-4" />
                Add Cases
              </Button>
              <Button
                onClick={handleRun}
                disabled={running || items.length === 0}
                className="gap-2"
              >
                <Play className="size-4" />
                {running ? "Starting..." : "Run Sheet"}
              </Button>
            </div>
          }
        />
      </div>

      {/* Test Cases in Sheet */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Test Cases ({items.length})
        </h2>
        {items.length === 0 ? (
          <EmptyState
            title="No test cases"
            description='Click "Add Cases" to add test cases to this sheet'
          />
        ) : (
          <div className="rounded-xl border bg-white divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-4 hover:bg-slate-50"
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.goal}</p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize text-xs">
                  {item.status}
                </Badge>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removingId === item.id}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Runs
            </h2>
            <button
              onClick={() => navigate(`/projects/${projectId}/test-sheet-runs?sheetId=${sheetId}`)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              <History className="size-3" />
              View all
            </button>
          </div>
          <div className="rounded-xl border bg-white divide-y">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-slate-50"
                onClick={() =>
                  navigate(`/projects/${projectId}/collections/${sheetId}/runs/${run.id}`)
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  {run.status === "completed" ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : run.status === "running" ? (
                    <Clock className="size-4 shrink-0 text-yellow-500 animate-pulse" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Run #{run.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <span className="text-emerald-600 font-medium">{run.passed} pass</span>
                  <span className="text-red-500">{run.failed} fail</span>
                  <Badge className={`${STATUS_STYLES[run.status] ?? "bg-slate-100 text-slate-600"} capitalize`}>
                    {run.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
