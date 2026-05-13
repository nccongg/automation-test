import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Check, ChevronDown, ChevronRight, Hash, Pencil,
  Play, Target, Trash2, X, Database, CheckCircle2, XCircle,
  MoreHorizontal, Wand2, RotateCcw, Loader2, AlertTriangle, Terminal,
} from "lucide-react";
import {
  getTestCaseById, getTestCaseRuns, getTestCaseScripts,
  updateTestCase, applyRefinement, deleteTestCase,
} from "@/features/test-cases/api/testCasesApi";
import {
  listBatchesForTestCase, replayTestRun, createTestRun,
} from "@/features/test-results/api/testResultsApi";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { STATUS_STYLE, VERDICT_LABEL, VERDICT_BADGE } from "@/features/test-cases/constants/styles.jsx";
import RunRow from "@/features/test-cases/components/RunRow";
import RunReplaySection from "@/features/test-cases/components/RunReplaySection";
import RefineSection from "@/features/test-cases/components/RefineSection";
import {
  getCurrentVersionId, getRuntimeConfigId, fmt, duration,
} from "@/features/test-cases/utils/testCaseUtils";

// ── TestPlanSection ───────────────────────────────────────────────────────────

function TestPlanSection({ steps, tc, onStepsUpdated }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSteps, setDraftSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function startEdit(e) {
    e.stopPropagation();
    setDraftSteps(steps.map((s, i) => ({ order: s.order ?? i + 1, text: s.description || s.text || "", action: s.action || "custom" })));
    setEditing(true); setSaveError("");
    if (!open) setOpen(true);
  }
  function cancelEdit() { setEditing(false); setSaveError(""); }
  function updateStepText(index, value) {
    setDraftSteps(prev => prev.map((s, i) => i === index ? { ...s, text: value } : s));
  }
  function addStep() { setDraftSteps(prev => [...prev, { order: prev.length + 1, text: "", action: "custom" }]); }
  function removeStep(index) {
    setDraftSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }
  async function saveSteps() {
    const validSteps = draftSteps.filter(s => s.text.trim());
    if (!validSteps.length) { setSaveError("At least one step is required."); return; }
    setSaving(true); setSaveError("");
    try {
      await applyRefinement(tc.id, {
        title: tc.title, goal: tc.goal,
        steps: validSteps.map((s, i) => ({ order: i + 1, text: s.text.trim(), action: s.action || "custom" })),
        expectedResult: tc.expectedResult || "", promptText: "",
      });
      setEditing(false);
      onStepsUpdated(validSteps.map((s, i) => ({ order: i + 1, description: s.text.trim(), text: s.text.trim(), action: s.action || "custom" })));
    } catch (e) { setSaveError(e?.message || "Failed to save."); } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => !editing && setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          <span className="font-medium">Test plan</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400">{editing ? draftSteps.length : steps.length} steps</span>
        </button>
        {!editing ? (
          <button type="button" onClick={startEdit}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
            <Pencil className="size-2.5" />Edit
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={saveSteps} disabled={saving}
              className="flex items-center gap-1 rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? <span className="size-2.5 animate-spin rounded-full border border-white/40 border-t-white" /> : <Check className="size-2.5" />}
              Save
            </button>
            <button type="button" onClick={cancelEdit} disabled={saving}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 transition-colors">
              <X className="size-2.5" />Cancel
            </button>
          </div>
        )}
      </div>
      {saveError && <p className="mt-1 text-[10px] text-red-500">{saveError}</p>}

      {open && !editing && (
        <div className="mt-2 space-y-1.5">
          {steps.map((step, i) => (
            <div key={step.id ?? i} className="flex gap-2.5">
              <span className="relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-400">
                {step.order ?? i + 1}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">{step.description || step.text || `Step ${i + 1}`}</p>
            </div>
          ))}
        </div>
      )}

      {open && editing && (
        <div className="mt-2 space-y-2">
          {draftSteps.map((step, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="mt-2 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[9px] font-bold text-indigo-400">{i + 1}</span>
              <textarea value={step.text} onChange={e => updateStepText(i, e.target.value)} rows={2} disabled={saving}
                className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors disabled:opacity-50" />
              <button type="button" onClick={() => removeStep(i)} disabled={saving}
                className="mt-2 shrink-0 text-slate-300 hover:text-red-400 transition-colors">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addStep} disabled={saving}
            className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50">
            <span className="flex size-[18px] items-center justify-center rounded-full border border-dashed border-slate-300 text-xs">+</span>
            Add step
          </button>
        </div>
      )}
    </div>
  );
}

// ── Last run verdict chip ─────────────────────────────────────────────────────

function VerdictChip({ verdict }) {
  const colors = {
    pass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    pass_with_warning: "text-amber-700 bg-amber-50 border-amber-200",
    fail: "text-red-700 bg-red-50 border-red-200",
    error: "text-orange-700 bg-orange-50 border-orange-200",
  };
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${colors[verdict] || "text-slate-500 bg-slate-50 border-slate-200"}`}>
      {VERDICT_LABEL[verdict] ?? verdict}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const goalRef = useRef(null);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // UX state
  const [developerMode, setDeveloperMode] = useState(false);
  const [editStepsOpen, setEditStepsOpen] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [headerError, setHeaderError] = useState("");
  const [runPage, setRunPage] = useState(1);
  const RUN_PAGE_SIZE = 5;

  const scriptSectionRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setScriptsLoading(true); setScriptsError("");
    try {
      const [caseData, runsData, batchesData] = await Promise.all([
        getTestCaseById(testCaseId),
        getTestCaseRuns(testCaseId),
        listBatchesForTestCase(testCaseId).catch(() => []),
      ]);
      setTc(caseData);
      setRuns(runsData);
      setRunPage(1);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      try {
        const scriptsData = await getTestCaseScripts(testCaseId);
        setScripts(Array.isArray(scriptsData) ? scriptsData : []);
      } catch (scriptErr) {
        setScripts([]);
        setScriptsError(scriptErr?.message || "Failed to load scripts.");
      }
    } catch (e) { setError(e?.message || "Failed to load test case."); }
    finally { setLoading(false); setScriptsLoading(false); }
  }, [testCaseId]);

  useEffect(() => { load(); }, [load]);

  async function handleRunCreated(newRunId) {
    await load();
    if (newRunId) navigate(`/projects/${projectId}/test-runs/${newRunId}`);
  }

  function handleScriptStepsUpdated(scriptId, steps) {
    if (steps === null) {
      setScripts(prev => prev.filter(s => s.id !== scriptId));
    } else {
      setScripts(prev => prev.map(s => s.id === scriptId ? { ...s, scriptJson: { ...s.scriptJson, steps } } : s));
    }
  }

  // ── Quick Replay (uses most recent script, no params prompt) ──
  async function handleQuickReplay() {
    if (!scripts.length || busyAction) return;
    const script = scripts[0];
    setBusyAction("quick_replay"); setHeaderError("");
    try {
      const result = await replayTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        executionScriptId: script.id,
        params: {},
      });
      await handleRunCreated(result?.testRunId || result?.id || null);
    } catch (e) {
      setHeaderError(e?.message || "Failed to start replay.");
      setBusyAction("");
    }
  }

  // ── Run with AI Agent ──
  async function handleRunWithAI() {
    if (busyAction) return;
    setBusyAction("ai_run"); setHeaderError("");
    try {
      const result = await createTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
      });
      await handleRunCreated(result?.testRunId || result?.id || null);
    } catch (e) {
      setHeaderError(e?.message || "Failed to start run.");
      setBusyAction("");
    }
  }

  // ── Inline editing ──
  function startEditTitle() { setDraftTitle(tc.title ?? ""); setEditingTitle(true); setTimeout(() => titleRef.current?.focus(), 0); }
  function startEditGoal() { setDraftGoal(tc.goal ?? ""); setEditingGoal(true); setTimeout(() => goalRef.current?.focus(), 0); }
  async function saveTitle() {
    if (!draftTitle.trim() || draftTitle === tc.title) { setEditingTitle(false); return; }
    setSaving(true);
    try { await updateTestCase(tc.id, { title: draftTitle.trim(), goal: tc.goal, status: tc.status }); setTc(prev => ({ ...prev, title: draftTitle.trim() })); }
    finally { setSaving(false); setEditingTitle(false); }
  }
  async function saveGoal() {
    if (draftGoal === (tc.goal ?? "")) { setEditingGoal(false); return; }
    setSaving(true);
    try { await updateTestCase(tc.id, { title: tc.title, goal: draftGoal.trim(), status: tc.status }); setTc(prev => ({ ...prev, goal: draftGoal.trim() })); }
    finally { setSaving(false); setEditingGoal(false); }
  }
  async function saveStatus(newStatus) {
    if (newStatus === tc.status) return;
    setSaving(true);
    try { await updateTestCase(tc.id, { title: tc.title, goal: tc.goal, status: newStatus }); setTc(prev => ({ ...prev, status: newStatus })); }
    finally { setSaving(false); }
  }
  async function handleDelete() {
    setDeleting(true);
    try { await deleteTestCase(tc.id); navigate(`/projects/${projectId}/test-cases`); }
    finally { setDeleting(false); setConfirmDelete(false); }
  }

  function handleEditSteps() {
    setEditStepsOpen(v => !v);
    if (!editStepsOpen) {
      setTimeout(() => scriptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><LoadingSpinner size="lg" label="Loading…" /></div>;
  if (error || !tc) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-500">{error || "Test case not found."}</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );

  const passCount = runs.filter(r => r.verdict === "pass" || r.verdict === "pass_with_warning").length;
  const failCount = runs.filter(r => r.verdict === "fail").length;
  const passRate = runs.length > 0 ? Math.round((passCount / runs.length) * 100) : null;
  const lastRun = runs[0] ?? null;
  const lastRunDur = lastRun ? duration(lastRun.startedAt, lastRun.finishedAt) : null;
  const hasScript = scripts.length > 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate(`/projects/${projectId}/test-cases`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />All Test Cases
      </button>

      {/* ── Header Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-5">
          <div className="flex items-start gap-4">

            {/* Left: info */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Status + ID */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={tc.status} onValueChange={saveStatus} disabled={saving}>
                  <SelectTrigger className="h-auto w-auto border-0 p-0 shadow-none bg-transparent focus:ring-0 gap-1">
                    <Badge className={`capitalize cursor-pointer text-xs ${STATUS_STYLE[tc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {tc.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <span className="flex items-center gap-1 text-xs text-slate-300"><Hash className="size-3" />{tc.id}</span>
                {developerMode && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                    <Terminal className="size-3" />Developer mode
                  </span>
                )}
              </div>

              {/* Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input ref={titleRef} value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                    onBlur={saveTitle} disabled={saving}
                    className="text-xl font-bold tracking-tight border-b-2 border-indigo-500 bg-transparent outline-none w-full" />
                  <button onClick={saveTitle} className="shrink-0 text-indigo-600 hover:text-indigo-800"><Check className="size-4" /></button>
                  <button onClick={() => setEditingTitle(false)} className="shrink-0 text-slate-400"><X className="size-4" /></button>
                </div>
              ) : (
                <div className="group flex cursor-pointer items-center gap-2" onClick={startEditTitle}>
                  <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-snug">{tc.title}</h1>
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Goal */}
              {editingGoal ? (
                <div className="flex items-start gap-2">
                  <Target className="mt-2 size-3.5 shrink-0 text-slate-400" />
                  <textarea ref={goalRef} value={draftGoal} onChange={e => setDraftGoal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") setEditingGoal(false); }}
                    onBlur={saveGoal} disabled={saving} rows={3}
                    className="flex-1 text-sm text-slate-600 border-b border-indigo-400 bg-transparent outline-none resize-none leading-relaxed" />
                  <button onClick={saveGoal} className="mt-1 shrink-0 text-indigo-600"><Check className="size-3.5" /></button>
                  <button onClick={() => setEditingGoal(false)} className="mt-1 shrink-0 text-slate-400"><X className="size-3.5" /></button>
                </div>
              ) : (
                <div className="group flex cursor-pointer items-start gap-1.5" onClick={startEditGoal}>
                  <Target className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {tc.goal || <span className="italic text-slate-300">Add a goal…</span>}
                  </p>
                  <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Inline stats */}
              {lastRun && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                  <span>Last run:</span>
                  <VerdictChip verdict={lastRun.verdict} />
                  {lastRunDur && <span>· {lastRunDur}</span>}
                  <span>· {fmt(lastRun.createdAt)}</span>
                  {passRate !== null && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="font-medium text-slate-500">{passRate}% pass rate</span>
                      <span>· {runs.length} run{runs.length !== 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
              )}

              {/* Test plan (collapsed by default) */}
              {tc.steps?.length > 0 && (
                <TestPlanSection
                  steps={tc.steps} tc={tc}
                  onStepsUpdated={newSteps => setTc(prev => ({ ...prev, steps: newSteps }))}
                />
              )}

              {/* Refine panel — shown only on demand */}
              {showRefine && (
                <RefineSection
                  tc={tc}
                  onApplied={() => { setShowRefine(false); load(); }}
                />
              )}
            </div>

            {/* Right: actions — max 3 buttons */}
            <div className="flex shrink-0 flex-col items-end gap-2 mt-0.5">
              <div className="flex items-center gap-2">
                {/* Primary action */}
                {hasScript ? (
                  <Button
                    onClick={handleQuickReplay}
                    disabled={!!busyAction}
                    className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                  >
                    {busyAction === "quick_replay"
                      ? <><Loader2 className="size-4 animate-spin" />Running…</>
                      : <><RotateCcw className="size-4" />Replay Test</>
                    }
                  </Button>
                ) : (
                  <Button
                    onClick={handleRunWithAI}
                    disabled={!!busyAction}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  >
                    {busyAction === "ai_run"
                      ? <><Loader2 className="size-4 animate-spin" />Starting…</>
                      : <><Play className="size-4" />Run Test</>
                    }
                  </Button>
                )}

                {/* Edit Steps — only if script exists */}
                {hasScript && (
                  <Button variant="outline" onClick={handleEditSteps} className="gap-1.5">
                    <Pencil className="size-4" />
                    {editStepsOpen ? "Done" : "Edit Steps"}
                  </Button>
                )}

                {/* More Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-lg border border-slate-200">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {hasScript && (
                      <DropdownMenuItem onClick={handleRunWithAI} disabled={!!busyAction}>
                        <Play className="size-3.5 mr-2 text-emerald-600" />
                        Run with AI Agent
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowRefine(v => !v)}>
                      <Wand2 className="size-3.5 mr-2 text-violet-600" />
                      {showRefine ? "Hide AI refinement" : "Improve with AI"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeveloperMode(v => !v)}>
                      <Terminal className="size-3.5 mr-2 text-slate-500" />
                      {developerMode ? "Disable developer mode" : "Developer mode"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmDelete(true)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-600"
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      Delete test case
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Header error */}
          {headerError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
              <span className="flex-1 text-sm text-red-600">{headerError}</span>
              <button onClick={() => setHeaderError("")} className="text-red-300 hover:text-red-500"><X className="size-3.5" /></button>
            </div>
          )}

          {/* Delete confirm */}
          {confirmDelete && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-red-500" />
              <p className="flex-1 text-sm text-red-700">Delete this test case? This cannot be undone.</p>
              <Button onClick={handleDelete} disabled={deleting} variant="destructive" size="sm" className="shrink-0">
                {deleting ? <><Loader2 className="size-3 animate-spin mr-1" />Deleting…</> : "Confirm delete"}
              </Button>
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Pass rate bar */}
        {passRate !== null && runs.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-2.5">
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[10px] text-slate-400">Pass rate</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${passRate}%` }} />
              </div>
              <div className="flex w-20 items-center justify-end gap-2">
                <span className="text-[11px] font-semibold text-slate-600">{passRate}%</span>
                <span className="text-[10px] text-slate-400">{passCount}/{runs.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Script / Run section ── */}
      <div ref={scriptSectionRef}>
        <RunReplaySection
          tc={tc}
          projectId={projectId}
          scripts={scripts}
          scriptsLoading={scriptsLoading}
          scriptsError={scriptsError}
          onRunCreated={handleRunCreated}
          onScriptStepsUpdated={handleScriptStepsUpdated}
          editStepsOpen={editStepsOpen}
          onEditStepsOpenChange={setEditStepsOpen}
          developerMode={developerMode}
          onDeveloperModeChange={setDeveloperMode}
        />
      </div>

      {/* ── Run History ── */}
      <section>
        <div className="mb-4 flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {[
            { key: "runs", label: "Run History", count: runs.length, renderIcon: () => <Play className="size-3.5" /> },
            { key: "datasets", label: "Dataset Runs", count: batches.length, renderIcon: () => <Database className="size-3.5" /> },
          ].map(({ key, label, count, renderIcon }) => (
            <button key={key} type="button" onClick={() => setHistoryTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                historyTab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {renderIcon()}
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                historyTab === key ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {historyTab === "runs" && (() => {
          const totalPages = Math.ceil(runs.length / RUN_PAGE_SIZE);
          const pageRuns = runs.slice((runPage - 1) * RUN_PAGE_SIZE, runPage * RUN_PAGE_SIZE);
          const globalOffset = (runPage - 1) * RUN_PAGE_SIZE;

          return (
            <>
              {failCount > 0 && runs.length > 0 && (
                <p className="mb-3 text-xs text-slate-400">{failCount} failed</p>
              )}

              {runs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
                  <Play className="size-8 text-slate-300" />
                  <p className="font-medium text-slate-500">No runs yet</p>
                  <p className="text-sm text-slate-400">Run this test case to see results here</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {pageRuns.map((run, i) => (
                      <RunRow key={run.id} run={run} projectId={projectId} index={globalOffset + i} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        Showing {globalOffset + 1}–{Math.min(globalOffset + RUN_PAGE_SIZE, runs.length)} of {runs.length} runs
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setRunPage(p => Math.max(1, p - 1))}
                          disabled={runPage === 1}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ← Prev
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                          const isEllipsis =
                            totalPages > 7 &&
                            page !== 1 && page !== totalPages &&
                            Math.abs(page - runPage) > 2;
                          if (isEllipsis) {
                            const prevIsEllipsis =
                              totalPages > 7 &&
                              (page - 1) !== 1 && (page - 1) !== totalPages &&
                              Math.abs((page - 1) - runPage) > 2;
                            return prevIsEllipsis ? null : (
                              <span key={page} className="px-1 text-xs text-slate-300">…</span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setRunPage(page)}
                              className={`min-w-[32px] rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                runPage === page
                                  ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setRunPage(p => Math.min(totalPages, p + 1))}
                          disabled={runPage === totalPages}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}

        {historyTab === "datasets" && (
          <>
            {batches.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                <Database className="size-8 text-slate-300" />
                <p className="font-medium text-slate-500">No dataset runs yet</p>
                <p className="text-sm text-slate-400">
                  Use the <strong>Replay section</strong> above to select a dataset and run batch tests.
                </p>
                <button type="button" onClick={() => setDeveloperMode(true)}
                  className="mt-1 text-xs text-slate-400 underline underline-offset-2 hover:text-amber-600 transition-colors">
                  Enable developer mode
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-slate-400">{batches.length} batch run{batches.length !== 1 ? "s" : ""}</p>
                <div className="space-y-2">
                  {batches.map(batch => (
                    <button key={batch.id} type="button"
                      onClick={() => navigate(`/projects/${projectId}/test-runs/batches/${batch.id}`)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
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
                              Batch #{batch.id}{batch.created_at ? ` · ${new Date(batch.created_at).toLocaleString()}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 font-medium text-emerald-600">
                              <CheckCircle2 className="size-4" />{batch.passed_rows ?? 0}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-red-500">
                              <XCircle className="size-4" />{batch.failed_rows ?? 0}
                            </span>
                            <span className="text-xs text-slate-400 tabular-nums">/ {batch.total_rows ?? 0} rows</span>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            batch.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-600"
                          }`}>{batch.status}</span>
                          <span className="text-xs text-slate-400">View →</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
