import { useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import { updateTestCase } from "@/features/test-cases/api/testCasesApi";
import { createTestRun } from "@/features/test-results/api/testResultsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import EmptyState from "@/shared/components/common/EmptyState";
import PageHeader from "@/shared/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STATUS_STYLES = {
  ready: "bg-emerald-100 text-emerald-700 border-emerald-500/20",
  draft: "bg-yellow-100 text-yellow-700 border-yellow-500/20",
  archived: "bg-slate-100 text-slate-700 border-slate-500/20",
};

function StatusBadge({ status }) {
  return (
    <Badge className={`border ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status || "draft"}
    </Badge>
  );
}

export default function TestCasesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { testCases = [], loading, error } = useTestCases(projectId);
  const [localCases, setLocalCases] = useState(null);
  const cases = localCases ?? testCases;

  const [searchTerm, setSearchTerm] = useState("");
  const [runningId, setRunningId] = useState(null);
  const [runError, setRunError] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", goal: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const filteredCases = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return cases;
    return cases.filter(
      (tc) =>
        tc.title.toLowerCase().includes(keyword) ||
        tc.goal.toLowerCase().includes(keyword)
    );
  }, [cases, searchTerm]);

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

  const openEdit = (tc) => {
    setEditTarget(tc);
    setEditForm({ title: tc.title, goal: tc.goal, status: tc.status || "draft" });
    setSaveError("");
  };

  const closeEdit = () => {
    setEditTarget(null);
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      const testCaseId = editTarget.testCaseId ?? editTarget.id;
      await updateTestCase(testCaseId, editForm);
      setLocalCases((prev) =>
        (prev ?? testCases).map((tc) =>
          (tc.testCaseId ?? tc.id) === testCaseId
            ? { ...tc, ...editForm }
            : tc
        )
      );
      closeEdit();
    } catch (e) {
      setSaveError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // sync localCases when testCases changes (e.g. page reload)
  useMemo(() => {
    setLocalCases(null);
  }, [testCases]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
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
    <div className="space-y-8">
      <PageHeader
        title="Test Cases"
        description="Test cases loaded from database"
      />

      <ErrorPopup open={!!runError} onClose={() => setRunError("")} />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search test cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
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
        <div className="rounded-xl border bg-white">
          <div className="grid gap-px divide-y">
            {filteredCases.map((tc) => (
              <div
                key={tc.id}
                className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{tc.title}</h3>
                    <StatusBadge status={tc.status} />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Goal:</span>{" "}
                    {tc.goal}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Prompt:</span>{" "}
                    {tc.promptText || "No prompt text"}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Version: {tc.versionNo}</span>
                    <span>Mode: {tc.executionMode}</span>
                    <span>Runtime Config: {tc.runtimeConfigId || "N/A"}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => openEdit(tc)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Edit test case"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => handleRun(tc)}
                    disabled={
                      runningId === (tc.testCaseId ?? tc.id) ||
                      tc.status === "archived"
                    }
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningId === (tc.testCaseId ?? tc.id) ? "Running..." : "Run"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Test case title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-goal">Goal</Label>
              <textarea
                id="edit-goal"
                value={editForm.goal}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, goal: e.target.value }))
                }
                placeholder="What this test case verifies"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(val) =>
                  setEditForm((f) => ({ ...f, status: val }))
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !editForm.title.trim() || !editForm.goal.trim()}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
