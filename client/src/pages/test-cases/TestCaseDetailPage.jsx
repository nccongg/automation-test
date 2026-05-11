import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Hash,
  Pencil,
  Play,
  Target,
  Trash2,
  X,
  Database,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getTestCaseById,
  getTestCaseRuns,
  getTestCaseScripts,
  updateTestCase,
  applyRefinement,
  deleteTestCase,
} from "@/features/test-cases/api/testCasesApi";
import { listBatchesForTestCase } from "@/features/test-results/api/testResultsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { STATUS_STYLE } from "@/features/test-cases/constants/styles.jsx";
import RunRow from "@/features/test-cases/components/RunRow";
import RunReplaySection from "@/features/test-cases/components/RunReplaySection";
import RefineSection from "@/features/test-cases/components/RefineSection";

function TestPlanSection({ steps, tc, onStepsUpdated }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSteps, setDraftSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function startEdit(e) {
    e.stopPropagation();
    setDraftSteps(
      steps.map((s, i) => ({
        order: s.order ?? i + 1,
        text: s.description || s.text || "",
        action: s.action || "custom",
      })),
    );
    setEditing(true);
    setSaveError("");
    if (!open) setOpen(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError("");
  }

  function updateStepText(index, value) {
    setDraftSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, text: value } : s)),
    );
  }

  function addStep() {
    setDraftSteps((prev) => [
      ...prev,
      { order: prev.length + 1, text: "", action: "custom" },
    ]);
  }

  function removeStep(index) {
    setDraftSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i + 1 })),
    );
  }

  async function saveSteps() {
    const validSteps = draftSteps.filter((s) => s.text.trim());
    if (validSteps.length === 0) {
      setSaveError("At least one step is required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await applyRefinement(tc.id, {
        title: tc.title,
        goal: tc.goal,
        steps: validSteps.map((s, i) => ({
          order: i + 1,
          text: s.text.trim(),
          action: s.action || "custom",
        })),
        expectedResult: tc.expectedResult || "",
        promptText: "",
      });
      setEditing(false);
      onStepsUpdated(
        validSteps.map((s, i) => ({
          order: i + 1,
          description: s.text.trim(),
          text: s.text.trim(),
          action: s.action || "custom",
        })),
      );
    } catch (e) {
      setSaveError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => !editing && setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          <span className="font-medium">Test Plan</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            {editing ? draftSteps.length : steps.length}
          </span>
          <span className="text-[10px] text-slate-300">· agent intent</span>
        </button>

        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all px-1.5 py-0.5 rounded"
          >
            <Pencil className="size-2.5" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={saveSteps}
              disabled={saving}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <span className="size-2.5 rounded-full border border-white/40 border-t-white animate-spin" />
              ) : (
                <Check className="size-2.5" />
              )}
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="size-2.5" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <p className="mt-1 text-[10px] text-red-500">{saveError}</p>
      )}

      {/* Read mode */}
      {open && !editing && (
        <div className="mt-3 space-y-1.5">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={step.id ?? i} className="relative flex gap-2.5">
                {!isLast && (
                  <div className="absolute left-[9px] top-6 bottom-0 w-px bg-slate-100" />
                )}
                <span className="relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-400">
                  {step.order ?? i + 1}
                </span>
                <div className="flex-1 pb-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {step.description || step.text || `Step ${i + 1}`}
                    </p>
                    {step.action && step.action !== "custom" && (
                      <span className="shrink-0 rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {step.action}
                      </span>
                    )}
                  </div>
                  {step.expectedResult && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      <span className="font-medium">Expected: </span>
                      {step.expectedResult}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit mode */}
      {open && editing && (
        <div className="mt-3 space-y-2">
          {draftSteps.map((step, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="mt-2 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[9px] font-bold text-indigo-400">
                {i + 1}
              </span>
              <textarea
                value={step.text}
                onChange={(e) => updateStepText(i, e.target.value)}
                rows={2}
                placeholder={`Step ${i + 1} description…`}
                disabled={saving}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 placeholder:text-slate-300 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 resize-none transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                disabled={saving}
                className="mt-2 shrink-0 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Remove step"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addStep}
            disabled={saving}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-600 transition-colors px-1 py-0.5 disabled:opacity-50"
          >
            <span className="flex size-[18px] items-center justify-center rounded-full border border-dashed border-slate-300 hover:border-indigo-400 text-slate-400 hover:text-indigo-500 text-xs transition-colors">
              +
            </span>
            Add step
          </button>
        </div>
      )}
    </div>
  );
}

export default function TestCaseDetailPage() {
  const { projectId, testCaseId } = useParams();
  const navigate = useNavigate();

  const [tc, setTc] = useState(null);
  const [runs, setRuns] = useState([]);
  const [batches, setBatches] = useState([]);
  const [historyTab, setHistoryTab] = useState("runs");
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError, setScriptsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(null);
  const goalRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setScriptsLoading(true);
    setScriptsError("");
    try {
      const [caseData, runsData, batchesData] = await Promise.all([
        getTestCaseById(testCaseId),
        getTestCaseRuns(testCaseId),
        listBatchesForTestCase(testCaseId).catch(() => []),
      ]);
      setTc(caseData);
      setRuns(runsData);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      try {
        const scriptsData = await getTestCaseScripts(testCaseId);
        setScripts(Array.isArray(scriptsData) ? scriptsData : []);
      } catch (scriptErr) {
        setScripts([]);
        setScriptsError(scriptErr?.message || "Failed to load test case scripts.");
      }
    } catch (e) {
      setError(e?.message || "Failed to load test case.");
    } finally {
      setLoading(false);
      setScriptsLoading(false);
    }
  }, [testCaseId]);

  useEffect(() => { load(); }, [load]);

  async function handleRunCreated(newRunId) {
    await load();
    if (newRunId) navigate(`/projects/${projectId}/test-runs/${newRunId}`);
  }

  function handleScriptStepsUpdated(scriptId, steps) {
    setScripts((prev) =>
      prev.map((s) =>
        s.id === scriptId ? { ...s, scriptJson: { ...s.scriptJson, steps } } : s,
      ),
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test case…" />
      </div>
    );
  }

  if (error || !tc) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">{error || "Test case not found."}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  function startEditTitle() {
    setDraftTitle(tc.title ?? "");
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  function startEditGoal() {
    setDraftGoal(tc.goal ?? "");
    setEditingGoal(true);
    setTimeout(() => goalRef.current?.focus(), 0);
  }

  async function saveTitle() {
    if (!draftTitle.trim() || draftTitle === tc.title) { setEditingTitle(false); return; }
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: draftTitle.trim(), goal: tc.goal, status: tc.status });
      setTc((prev) => ({ ...prev, title: draftTitle.trim() }));
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveGoal() {
    if (draftGoal === (tc.goal ?? "")) { setEditingGoal(false); return; }
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: tc.title, goal: draftGoal.trim(), status: tc.status });
      setTc((prev) => ({ ...prev, goal: draftGoal.trim() }));
    } finally {
      setSaving(false);
      setEditingGoal(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTestCase(tc.id);
      navigate(`/projects/${projectId}/test-cases`);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function saveStatus(newStatus) {
    if (newStatus === tc.status) return;
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: tc.title, goal: tc.goal, status: newStatus });
      setTc((prev) => ({ ...prev, status: newStatus }));
    } finally {
      setSaving(false);
    }
  }

  const passCount = runs.filter((r) => r.verdict === "pass" || r.verdict === "pass_with_warning").length;
  const failCount = runs.filter((r) => r.verdict === "fail").length;
  const passRate = runs.length > 0 ? Math.round((passCount / runs.length) * 100) : null;

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate(`/projects/${projectId}/test-cases`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Test Cases
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Select value={tc.status} onValueChange={saveStatus} disabled={saving}>
                  <SelectTrigger className="h-7 w-28 text-xs px-2 border-0 shadow-none bg-transparent p-0 focus:ring-0">
                    <Badge className={`capitalize text-xs border-0 cursor-pointer ${STATUS_STYLE[tc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {tc.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={titleRef}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                    onBlur={saveTitle}
                    disabled={saving}
                    className="text-xl font-bold tracking-tight border-b-2 border-indigo-500 bg-transparent outline-none w-full min-w-0"
                  />
                  <button onClick={saveTitle} className="shrink-0 text-indigo-600 hover:text-indigo-800"><Check className="size-4" /></button>
                  <button onClick={() => setEditingTitle(false)} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="size-4" /></button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 cursor-pointer" onClick={startEditTitle}>
                  <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-snug">{tc.title}</h1>
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {editingGoal ? (
                <div className="flex items-start gap-2">
                  <Target className="mt-2 size-3.5 shrink-0 text-slate-400" />
                  <textarea
                    ref={goalRef}
                    value={draftGoal}
                    onChange={(e) => setDraftGoal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingGoal(false); }}
                    onBlur={saveGoal}
                    disabled={saving}
                    rows={3}
                    className="flex-1 text-sm text-slate-600 border-b border-indigo-400 bg-transparent outline-none resize-none leading-relaxed"
                  />
                  <button onClick={saveGoal} className="shrink-0 mt-1 text-indigo-600 hover:text-indigo-800"><Check className="size-3.5" /></button>
                  <button onClick={() => setEditingGoal(false)} className="shrink-0 mt-1 text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button>
                </div>
              ) : (
                <div className="group flex items-start gap-1.5 cursor-pointer" onClick={startEditGoal}>
                  <Target className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {tc.goal || <span className="italic text-slate-300">Add a goal…</span>}
                  </p>
                  <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {tc.steps?.length > 0 && (
                <TestPlanSection
                  steps={tc.steps}
                  tc={tc}
                  onStepsUpdated={(newSteps) =>
                    setTc((prev) => ({ ...prev, steps: newSteps }))
                  }
                />
              )}
              <RefineSection tc={tc} onApplied={load} />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Hash className="size-3" /> {tc.id}
              </span>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Delete this test case?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? (
                      <span className="size-3 rounded-full border border-white/40 border-t-white animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-400">Total Runs</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{runs.length}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-400">Passed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{passCount}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-400">Pass Rate</p>
            {passRate !== null ? (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-800">{passRate}%</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${passRate}%` }} />
                </div>
              </>
            ) : (
              <p className="mt-1 text-2xl font-bold text-slate-400">—</p>
            )}
          </div>
        </div>

      </div>

      <RunReplaySection
        tc={tc}
        projectId={projectId}
        scripts={scripts}
        scriptsLoading={scriptsLoading}
        scriptsError={scriptsError}
        onRunCreated={handleRunCreated}
        onScriptStepsUpdated={handleScriptStepsUpdated}
      />

      {/* Run History + Dataset Runs — tabbed */}
      <section>
        {/* Tab header */}
        <div className="mb-4 flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          <button
            type="button"
            onClick={() => setHistoryTab("runs")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              historyTab === "runs"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Play className="size-3.5" />
            Run History
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              historyTab === "runs" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
            }`}>
              {runs.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab("datasets")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              historyTab === "datasets"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Database className="size-3.5" />
            Dataset Runs
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              historyTab === "datasets" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
            }`}>
              {batches.length}
            </span>
          </button>
        </div>

        {/* Tab: Run History */}
        {historyTab === "runs" && (
          <>
            {runs.length > 0 && failCount > 0 && (
              <p className="mb-3 text-xs text-slate-400">{failCount} failed</p>
            )}
            {runs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
                <Play className="size-8 text-slate-300" />
                <p className="font-medium text-slate-500">No runs yet</p>
                <p className="text-sm text-slate-400">Run this test case to see results here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run, i) => (
                  <RunRow key={run.id} run={run} projectId={projectId} index={i} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab: Dataset Runs */}
        {historyTab === "datasets" && (
          <>
            {batches.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12">
                <Database className="size-8 text-slate-300" />
                <p className="font-medium text-slate-500">No dataset runs yet</p>
                <p className="text-sm text-slate-400">Run a dataset batch from the Replay section above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}/test-runs/batches/${batch.id}`)}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                          <Database className="size-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {batch.dataset_name ?? `Dataset #${batch.dataset_id}`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Batch #{batch.id}
                            {batch.created_at
                              ? ` · ${new Date(batch.created_at).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="size-4" />
                            {batch.passed_rows ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <XCircle className="size-4" />
                            {batch.failed_rows ?? 0}
                          </span>
                          <span className="text-xs text-slate-400 tabular-nums">
                            / {batch.total_rows ?? 0} rows
                          </span>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          batch.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {batch.status}
                        </span>
                        <span className="text-xs text-slate-400">View →</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
