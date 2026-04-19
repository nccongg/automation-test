import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Pencil, Play, Save, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { createTestRun } from "@/features/test-results/api/testResultsApi";
import { generateTestCase, saveTestCases } from "@/features/test-cases/api/testCasesApi";
import { getTestSheets, createTestSheet, addSheetItems } from "@/features/test-collection/api/testSheetApi";
import { toast } from "sonner";
import AddToSheetDialog from "./AddToSheetDialog";
import EditTestCaseDialog from "./EditTestCaseDialog";

function mapCandidateToUi(c) {
  return {
    id: c.id,
    title: c.title ?? "Untitled test case",
    type: "custom",
    steps: Array.isArray(c.planSnapshot?.steps)
      ? c.planSnapshot.steps.map((s) => typeof s === "string" ? s : (s?.text ?? s?.description ?? "")).filter(Boolean)
      : [],
    expectedResult: c.planSnapshot?.expectedResult ?? "",
    raw: c,
  };
}

function extractSavedTestCaseIds(result) {
  const rows = Array.isArray(result) ? result
    : Array.isArray(result?.data) ? result.data
    : Array.isArray(result?.items) ? result.items
    : Array.isArray(result?.savedTestCases) ? result.savedTestCases
    : [];
  return rows
    .map((item) => item?.id ?? item?.testCaseId ?? item?.selected_test_case_id ?? item?.selectedTestCaseId ?? null)
    .filter(Boolean);
}

export default function GenerateTestCasesSection({ project }) {
  const navigate = useNavigate();
  const sessionKey = project?.id ? `gen_testcases_${project.id}` : null;

  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [runResult, setRunResult] = useState("");
  const [testCases, setTestCases] = useState(() => {
    if (!project?.id) return [];
    try {
      const saved = sessionStorage.getItem(`gen_testcases_${project.id}`);
      return saved ? JSON.parse(saved).testCases : [];
    } catch { return []; }
  });
  const [batchId, setBatchId] = useState(() => {
    if (!project?.id) return null;
    try {
      const saved = sessionStorage.getItem(`gen_testcases_${project.id}`);
      return saved ? JSON.parse(saved).batchId : null;
    } catch { return null; }
  });

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [editForm, setEditForm] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [runningSelected, setRunningSelected] = useState(false);

  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [sheetMode, setSheetMode] = useState("existing");
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState("");
  const [newSheetName, setNewSheetName] = useState("");
  const [addingToSheet, setAddingToSheet] = useState(false);

  useEffect(() => {
    if (!sessionKey) return;
    if (testCases.length > 0) {
      sessionStorage.setItem(sessionKey, JSON.stringify({ testCases, batchId }));
    } else {
      sessionStorage.removeItem(sessionKey);
    }
  }, [testCases, batchId, sessionKey]);

  useEffect(() => {
    if (!showSheetDialog || !project?.id) return;
    setLoadingSheets(true);
    getTestSheets(project.id)
      .then((list) => {
        setSheets(list);
        setSelectedSheetId(list[0]?.id ? String(list[0].id) : "");
        if (list.length === 0) setSheetMode("new");
      })
      .catch(() => { setSheets([]); setSheetMode("new"); })
      .finally(() => setLoadingSheets(false));
  }, [showSheetDialog, project?.id]);

  const getSelectedCandidateIds = () => {
    if (!testCases?.length) return [];
    if (selected.size > 0) return [...selected].map((i) => testCases[i]?.id).filter(Boolean);
    return testCases.map((tc) => tc.id).filter(Boolean);
  };

  const saveSelectedCandidatesToDb = async () => {
    if (!project?.id) throw new Error("Missing project id.");
    if (!batchId) throw new Error("Missing batchId. Please generate test cases again.");
    const candidateIds = getSelectedCandidateIds();
    if (!candidateIds.length) throw new Error("No selected test cases to save.");
    const result = await saveTestCases({ projectId: project.id, batchId, candidateIds });
    const savedTestCaseIds = extractSavedTestCaseIds(result);
    if (!savedTestCaseIds.length) throw new Error("Saved successfully but API did not return saved testCaseIds.");
    return { result, savedTestCaseIds };
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !project?.id) return;
    setRunning(true);
    setRunError("");
    setRunResult("");
    setSelected(new Set());
    setBatchId(null);
    setTestCases([]);
    try {
      const result = await generateTestCase(prompt.trim(), project.id);
      setBatchId(result?.batch?.id ?? null);
      setTestCases((result?.candidates ?? []).map(mapCandidateToUi));
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
    setSelected(selected.size === testCases.length ? new Set() : new Set(testCases.map((_, i) => i)));
  };

  const openEdit = (i) => {
    setEditIndex(i);
    setEditForm({ ...testCases[i], stepsText: testCases[i].steps.join("\n") });
  };

  const closeEdit = () => { setEditIndex(null); setEditForm(null); };

  const saveEdit = () => {
    const updated = [...testCases];
    updated[editIndex] = {
      ...updated[editIndex],
      title: editForm.title,
      type: editForm.type,
      steps: editForm.stepsText.split("\n").map((s) => s.trim()).filter(Boolean),
      expectedResult: editForm.expectedResult,
    };
    setTestCases(updated);
    closeEdit();
  };

  const handleSave = async () => {
    if (!testCases?.length) return;
    setSaving(true);
    try {
      const { savedTestCaseIds } = await saveSelectedCandidatesToDb();
      toast.success(`${savedTestCaseIds.length} test case(s) saved successfully!`);
      setTestCases([]);
      navigate(`/projects/${project.id}/test-cases`);
    } catch (error) {
      toast.error(error?.message || "Failed to save test cases.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunSelected = async () => {
    if (selected.size === 0) return;
    setRunningSelected(true);
    setRunError("");
    setRunResult("");
    try {
      const { savedTestCaseIds } = await saveSelectedCandidatesToDb();
      await Promise.all(savedTestCaseIds.map((testCaseId) => createTestRun({ testCaseId })));
      setRunResult(`${savedTestCaseIds.length} test run(s) started. Redirecting...`);
      toast.success(`${savedTestCaseIds.length} test run(s) started.`);
      setTestCases([]);
      setTimeout(() => navigate(`/projects/${project.id}/test-runs`), 1200);
    } catch (error) {
      setRunError(error?.message || "Failed to save and start test runs.");
      toast.error(error?.message || "Failed to save and start test runs.");
    } finally {
      setRunningSelected(false);
    }
  };

  const handleAddToSheet = async () => {
    setAddingToSheet(true);
    try {
      const { savedTestCaseIds } = await saveSelectedCandidatesToDb();
      let sheetId;
      if (sheetMode === "new") {
        if (!newSheetName.trim()) throw new Error("Please enter a sheet name.");
        const sheet = await createTestSheet({ projectId: project.id, name: newSheetName.trim() });
        sheetId = sheet?.id ?? sheet?.data?.id;
      } else {
        if (!selectedSheetId) throw new Error("Please select a sheet.");
        sheetId = selectedSheetId;
      }
      await addSheetItems(sheetId, savedTestCaseIds);
      toast.success(`${savedTestCaseIds.length} test case(s) added to "${sheetMode === "new" ? newSheetName.trim() : sheets.find((s) => String(s.id) === String(sheetId))?.name ?? "sheet"}".`);
      setShowSheetDialog(false);
      setTestCases([]);
      navigate(`/projects/${project.id}/collections`);
    } catch (error) {
      toast.error(error?.message || "Failed to add to sheet.");
    } finally {
      setAddingToSheet(false);
    }
  };

  return (
    <>
      <section className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Generate Test Cases</h2>
            <p className="text-sm text-muted-foreground">
              Describe what you want to test and let AI generate test cases for you.
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Sparkles className="size-5" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ai-prompt" className="text-sm">Test Prompt</Label>
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
            onClick={handleGenerate}
            disabled={running || !prompt.trim()}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] md:w-auto mb-2"
          >
            {running ? <LoadingSpinner size="sm" label="Generating..." /> : "Generate Test Cases"}
          </Button>
        </div>

        {runError && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{runError}</div>}
        {runResult && <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{runResult}</div>}

        {testCases?.length > 0 && (
          <div className="border-t pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={testCases.length > 0 && selected.size === testCases.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  Generated Test Cases ({testCases.length})
                </span>
                {selected.size > 0 && (
                  <span className="text-xs text-muted-foreground">— {selected.size} selected</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving || !testCases?.length}
                  className="flex items-center gap-1.5"
                >
                  {saving ? <LoadingSpinner size="sm" label="Saving..." /> : <><Save className="size-3.5" />Save</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSheetMode("existing"); setNewSheetName(""); setShowSheetDialog(true); }}
                  disabled={saving || !testCases?.length}
                  className="flex items-center gap-1.5"
                >
                  <FolderPlus className="size-3.5" />Add to Sheet
                </Button>
                {selected.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleRunSelected}
                    disabled={runningSelected}
                    className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] flex items-center gap-1.5"
                  >
                    {runningSelected ? <LoadingSpinner size="sm" label="Running..." /> : <><Play className="size-3.5" />Run Selected ({selected.size})</>}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, i) => (
                <div
                  key={tc.id ?? i}
                  onClick={() => toggleSelect(i)}
                  className={`rounded-lg border p-4 space-y-2 transition-colors cursor-pointer ${
                    selected.has(i) ? "bg-blue-50 border-blue-200" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleSelect(i)} className="mt-0.5 shrink-0" />
                      <span className="text-sm font-medium leading-snug">{tc.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">{tc.type}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(i); }}
                        className="rounded p-1 hover:bg-slate-200 transition-colors"
                      >
                        <Pencil className="size-3.5 text-slate-500" />
                      </button>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-6">
                    {tc.steps.map((step, j) => (
                      <li key={j} className="text-xs text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                  <p className="text-xs text-emerald-700 font-medium pl-6">Expected: {tc.expectedResult}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <AddToSheetDialog
        open={showSheetDialog}
        onOpenChange={setShowSheetDialog}
        sheets={sheets}
        loadingSheets={loadingSheets}
        sheetMode={sheetMode}
        setSheetMode={setSheetMode}
        selectedSheetId={selectedSheetId}
        setSelectedSheetId={setSelectedSheetId}
        newSheetName={newSheetName}
        setNewSheetName={setNewSheetName}
        addingToSheet={addingToSheet}
        onAdd={handleAddToSheet}
        selectedCount={selected.size}
        totalCount={testCases.length}
      />

      <EditTestCaseDialog
        editForm={editForm}
        setEditForm={setEditForm}
        onClose={closeEdit}
        onSave={saveEdit}
      />
    </>
  );
}
