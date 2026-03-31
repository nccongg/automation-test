import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Pencil,
  Play,
  Save,
} from "lucide-react";
import ProjectHeader from "@/features/projects/components/ProjectHeader";
import ProjectStats from "@/features/projects/components/ProjectStats";
import { createTestRun } from "@/features/test-results/api/testResultsApi";
import {
  generateTestCase,
  saveTestCases,
} from "@/features/test-cases/api/testCasesApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import EmptyState from "@/shared/components/common/EmptyState";
import { formatRelativeTime } from "@/shared/utils";

const TEST_CASE_TYPES = [
  "functional",
  "edge",
  "negative",
  "ui",
  "performance",
  "security",
];

function mapCandidateToUi(c) {
  return {
    id: c.id,
    title: c.title ?? "Untitled test case",
    type: "custom",
    steps: Array.isArray(c.planSnapshot?.steps)
      ? c.planSnapshot.steps
          .map((s) =>
            typeof s === "string" ? s : s?.text ?? s?.description ?? ""
          )
          .filter(Boolean)
      : [],
    expectedResult: c.planSnapshot?.expectedResult ?? "",
    raw: c,
  };
}

function extractSavedTestCaseIds(result) {
  const rows = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.items)
    ? result.items
    : Array.isArray(result?.savedTestCases)
    ? result.savedTestCases
    : [];

  return rows
    .map(
      (item) =>
        item?.id ??
        item?.testCaseId ??
        item?.selected_test_case_id ??
        item?.selectedTestCaseId ??
        null
    )
    .filter(Boolean);
}

export default function ProjectOverviewPage() {
  const { project, onProjectUpdated } = useOutletContext();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [batchId, setBatchId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [selected, setSelected] = useState(new Set());

  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [showTestCasesDialog, setShowTestCasesDialog] = useState(false);

  const [runningSelected, setRunningSelected] = useState(false);
  const [runResult, setRunResult] = useState("");

  const getSelectedCandidateIds = () => {
    if (!testCases?.length) return [];

    if (selected.size > 0) {
      return [...selected]
        .map((i) => testCases[i]?.id)
        .filter(Boolean);
    }

    return testCases.map((tc) => tc.id).filter(Boolean);
  };

  const saveSelectedCandidatesToDb = async () => {
    if (!project?.id) {
      throw new Error("Missing project id.");
    }

    if (!batchId) {
      throw new Error("Missing batchId. Please generate test cases again.");
    }

    const candidateIds = getSelectedCandidateIds();

    if (!candidateIds.length) {
      throw new Error("No selected test cases to save.");
    }

  saveTestCases({
    projectId: project.id,
    batchId,
    candidates: selectedCandidates.map((tc) => ({
      candidateId: tc.id,
      title: tc.title,
      goal: tc.expectedResult,
      steps: tc.steps,
      expectedResult: tc.expectedResult,
    })),
  })

    const savedTestCaseIds = extractSavedTestCaseIds(result);

    if (!savedTestCaseIds.length) {
      throw new Error(
        "Saved successfully but API did not return saved testCaseIds."
      );
    }

    return { result, savedTestCaseIds };
  };

  const handleGenerateTestCase = async () => {
    if (!prompt.trim() || !project?.id) return;

    try {
      setRunning(true);
      setRunError("");
      setRunResult("");
      setSaveMessage("");
      setSelected(new Set());
      setBatchId(null);

      const result = await generateTestCase(prompt.trim(), project.id);

      const batch = result?.batch ?? null;
      const candidates = result?.candidates ?? [];

      setBatchId(batch?.id ?? null);
      setTestCases(candidates.map(mapCandidateToUi));
      setShowTestCasesDialog(true);
    } catch (error) {
      setRunError(error?.message || "Failed to generate test cases.");
      setTestCases([]);
      setBatchId(null);
    } finally {
      setRunning(false);
    }
  };

  const toggleSelect = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === testCases.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(testCases.map((_, i) => i)));
    }
  };

  const openEdit = (i) => {
    setEditIndex(i);
    setEditForm({
      ...testCases[i],
      stepsText: testCases[i].steps.join("\n"),
    });
  };

  const closeEdit = () => {
    setEditIndex(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    const updated = [...testCases];
    updated[editIndex] = {
      ...updated[editIndex],
      title: editForm.title,
      type: editForm.type,
      steps: editForm.stepsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      expectedResult: editForm.expectedResult,
    };
    setTestCases(updated);
    closeEdit();
  };

  const handleSaveTestCases = async () => {
    if (!testCases?.length) return;

    try {
      setSaving(true);
      setSaveMessage("");

      const { savedTestCaseIds } = await saveSelectedCandidatesToDb();

      setSaveMessage(`${savedTestCaseIds.length} test case(s) saved successfully.`);
      toast.success(`${savedTestCaseIds.length} test case(s) saved successfully!`);
      setShowTestCasesDialog(false);
      navigate(`/projects/${project.id}/test-cases`);
    } catch (error) {
      toast.error(error?.message || "Failed to save test cases.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunSelected = async () => {
    if (selected.size === 0) return;

    try {
      setRunningSelected(true);
      setRunError("");
      setRunResult("");

      const { savedTestCaseIds } = await saveSelectedCandidatesToDb();

      await Promise.all(
        savedTestCaseIds.map((testCaseId) =>
          createTestRun({
            testCaseId,
          })
        )
      );

      setRunResult(`${savedTestCaseIds.length} test run(s) started. Redirecting...`);
      toast.success(`${savedTestCaseIds.length} test run(s) started.`);
      setShowTestCasesDialog(false);

      setTimeout(() => {
        navigate(`/projects/${project.id}/test-runs`);
      }, 1200);
    } catch (error) {
      setRunError(error?.message || "Failed to save and start test runs.");
      toast.error(error?.message || "Failed to save and start test runs.");
    } finally {
      setRunningSelected(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onProjectUpdated={onProjectUpdated} />

      <section className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Generate Test Cases
            </h2>
            <p className="text-sm text-muted-foreground">
              Describe what you want to test and let AI generate test cases for
              you.
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Sparkles className="size-5" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ai-prompt" className="text-sm">
              Test Prompt
            </Label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Open login page, enter valid credentials, click login, verify dashboard is visible"
              disabled={running}
              className="min-h-[100px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button
            type="button"
            onClick={handleGenerateTestCase}
            disabled={running || !prompt.trim()}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] md:w-auto mb-2"
          >
            {running ? (
              <LoadingSpinner size="sm" label="Generating..." />
            ) : (
              "Generate Test Cases"
            )}
          </Button>
        </div>

        {runError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {runError}
          </div>
        )}
        {runResult && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            {runResult}
          </div>
        )}
        {saveMessage && (
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            {saveMessage}
          </div>
        )}

        {testCases?.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTestCasesDialog(true)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" />
            View Generated Test Cases ({testCases.length})
          </Button>
        )}
      </section>

      <ProjectStats project={project} />

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">
          Recent Activity
        </h3>
        {project.recentActivity?.length ? (
          <div className="rounded-xl border bg-white">
            <div className="divide-y">
              {project.recentActivity.map((a) => {
                const isPass = a.verdict === "pass";
                const Icon = isPass ? CheckCircle2 : XCircle;
                const tone = isPass ? "text-emerald-600" : "text-red-600";
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`size-4 ${tone}`} />
                        <div className="truncate text-sm font-medium">
                          {a.testTitle}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Verdict: {a.verdict}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(a.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            title="No activity yet"
            description="Run your first test case to populate the project history."
          />
        )}
      </section>

      <Dialog open={showTestCasesDialog} onOpenChange={setShowTestCasesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Generated Test Cases ({testCases?.length ?? 0})
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  testCases?.length > 0 && selected.size === testCases.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveTestCases}
                disabled={saving || !testCases?.length}
                className="flex items-center gap-1.5"
              >
                {saving ? (
                  <LoadingSpinner size="sm" label="Saving..." />
                ) : (
                  <>
                    <Save className="size-3.5" />
                    Save
                  </>
                )}
              </Button>

              {selected.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleRunSelected}
                  disabled={runningSelected}
                  className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] flex items-center gap-1.5"
                >
                  {runningSelected ? (
                    <LoadingSpinner size="sm" label="Running..." />
                  ) : (
                    <>
                      <Play className="size-3.5" />
                      Run Selected ({selected.size})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {testCases?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No test cases returned.
              </p>
            ) : (
              testCases.map((tc, i) => (
                <div
                  key={tc.id ?? i}
                  onClick={() => toggleSelect(i)}
                  className={`rounded-lg border p-4 space-y-2 transition-colors cursor-pointer ${
                    selected.has(i)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={() => toggleSelect(i)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="text-sm font-medium leading-snug">
                        {tc.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">
                        {tc.type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(i);
                        }}
                        className="rounded p-1 hover:bg-slate-200 transition-colors"
                        title="Edit test case"
                      >
                        <Pencil className="size-3.5 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <ol className="list-decimal list-inside space-y-1 pl-6">
                    {tc.steps.map((step, j) => (
                      <li key={j} className="text-xs text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>

                  <p className="text-xs text-emerald-700 font-medium pl-6">
                    Expected: {tc.expectedResult}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {editForm && (
        <Dialog open={editIndex !== null} onOpenChange={closeEdit}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Test Case</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <input
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
                  }
                >
                  {TEST_CASE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Steps{" "}
                  <span className="text-muted-foreground font-normal">
                    (one per line)
                  </span>
                </Label>
                <textarea
                  className="w-full min-h-[120px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={editForm.stepsText}
                  onChange={(e) =>
                    setEditForm({ ...editForm, stepsText: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Expected Result</Label>
                <textarea
                  className="w-full min-h-[72px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={editForm.expectedResult}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expectedResult: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeEdit}>
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={!editForm.title.trim()}
                className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}