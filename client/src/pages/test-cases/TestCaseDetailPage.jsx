import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorState from "@/shared/components/common/ErrorState";
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
  MoreHorizontal,
  Wand2,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import {
  getTestCaseById,
  getTestCaseRuns,
  getTestCaseScripts,
  updateTestCase,
  applyRefinement,
  deleteTestCase,
} from "@/features/test-cases/api/testCasesApi";
import {
  listBatchesForTestCase,
  replayTestRun,
  createTestRun,
} from "@/features/test-results/api/testResultsApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import {
  STATUS_STYLE,
  VERDICT_LABEL,
  VERDICT_BADGE,
} from "@/features/test-cases/constants/styles.jsx";
import RunRow from "@/features/test-cases/components/RunRow";
import RunReplaySection from "@/features/test-cases/components/RunReplaySection";
import RefineSection from "@/features/test-cases/components/RefineSection";
import {
  getCurrentVersionId,
  getRuntimeConfigId,
  fmt,
  duration,
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
    if (!validSteps.length) {
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
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => !editing && setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          <span className="font-medium">Test plan</span>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-muted-foreground">
            {editing ? draftSteps.length : steps.length} steps
          </span>
        </button>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={startEdit}
            className="text-muted-foreground hover:text-primary"
          >
            <Pencil className="size-2.5" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="xs" onClick={saveSteps} disabled={saving}>
              {saving ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : (
                <Check className="size-2.5" />
              )}
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={cancelEdit}
              disabled={saving}
              className="text-muted-foreground"
            >
              <X className="size-2.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>
      {saveError && (
        <p className="mt-1 text-[10px] text-red-500">{saveError}</p>
      )}

      {open && !editing && (
        <div className="mt-2 space-y-1.5">
          {steps.map((step, i) => (
            <div key={step.id ?? i} className="flex gap-2.5">
              <span className="relative z-10 mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-surface-2 text-[9px] font-bold text-muted-foreground">
                {step.order ?? i + 1}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description || step.text || `Step ${i + 1}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {open && editing && (
        <div className="mt-2 space-y-2">
          {draftSteps.map((step, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="mt-2 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                {i + 1}
              </span>
              <textarea
                value={step.text}
                onChange={(e) => updateStepText(i, e.target.value)}
                rows={2}
                disabled={saving}
                className="flex-1 resize-none rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                disabled={saving}
                className="mt-2 shrink-0 cursor-pointer text-muted-foreground/30 hover:text-destructive transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            disabled={saving}
            className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <span className="flex size-[18px] items-center justify-center rounded-full border border-dashed border-border text-xs">
              +
            </span>
            Add step
          </button>
        </div>
      )}
    </div>
  );
}

// ── Last run verdict chip ─────────────────────────────────────────────────────

function VerdictChip({ verdict }) {
  return (
    <span
      className={`rounded-[6px] border px-1.5 py-0.5 text-[10px] font-normal ${VERDICT_BADGE[verdict] || "border-border text-muted-foreground"}`}
    >
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
  const [error, setError] = useState(null);

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
    setLoading(true);
    setError(null);
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
      setRunPage(1);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      try {
        const scriptsData = await getTestCaseScripts(testCaseId);
        setScripts(Array.isArray(scriptsData) ? scriptsData : []);
      } catch (scriptErr) {
        setScripts([]);
        setScriptsError(scriptErr?.message || "Failed to load scripts.");
      }
    } catch (e) {
      setError(e || new Error("Failed to load test case."));
    } finally {
      setLoading(false);
      setScriptsLoading(false);
    }
  }, [testCaseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRunCreated(newRunId) {
    await load();
    if (newRunId) navigate(`/projects/${projectId}/test-runs/${newRunId}`);
  }

  function handleScriptStepsUpdated(scriptId, steps) {
    if (steps === null) {
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
    } else {
      setScripts((prev) =>
        prev.map((s) =>
          s.id === scriptId
            ? { ...s, scriptJson: { ...s.scriptJson, steps } }
            : s,
        ),
      );
    }
  }

  // ── Quick Replay (uses most recent script, no params prompt) ──
  async function handleQuickReplay() {
    if (!scripts.length || busyAction) return;
    const script = scripts[0];
    setBusyAction("quick_replay");
    setHeaderError("");
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
    setBusyAction("ai_run");
    setHeaderError("");
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
    if (!draftTitle.trim() || draftTitle === tc.title) {
      setEditingTitle(false);
      return;
    }
    setSaving(true);
    try {
      await updateTestCase(tc.id, {
        title: draftTitle.trim(),
        goal: tc.goal,
        status: tc.status,
      });
      setTc((prev) => ({ ...prev, title: draftTitle.trim() }));
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }
  async function saveGoal() {
    if (draftGoal === (tc.goal ?? "")) {
      setEditingGoal(false);
      return;
    }
    setSaving(true);
    try {
      await updateTestCase(tc.id, {
        title: tc.title,
        goal: draftGoal.trim(),
        status: tc.status,
      });
      setTc((prev) => ({ ...prev, goal: draftGoal.trim() }));
    } finally {
      setSaving(false);
      setEditingGoal(false);
    }
  }
  async function saveStatus(newStatus) {
    if (newStatus === tc.status) return;
    setSaving(true);
    try {
      await updateTestCase(tc.id, {
        title: tc.title,
        goal: tc.goal,
        status: newStatus,
      });
      setTc((prev) => ({ ...prev, status: newStatus }));
    } finally {
      setSaving(false);
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

  function handleEditSteps() {
    setEditStepsOpen((v) => !v);
    if (!editStepsOpen) {
      setTimeout(
        () =>
          scriptSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        50,
      );
    }
  }

  if (loading)
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading…" />
      </div>
    );
  if (error)
    return (
      <ErrorState error={error} onRetry={load} onBack={() => navigate(-1)} />
    );
  if (!tc)
    return (
      <ErrorState error={{ status: 404 }} onBack={() => navigate(-1)} />
    );

  const passCount = runs.filter(
    (r) => r.verdict === "pass" || r.verdict === "pass_with_warning",
  ).length;
  const passRate =
    runs.length > 0 ? Math.round((passCount / runs.length) * 100) : null;
  const lastRun = runs[0] ?? null;
  const lastRunDur = lastRun
    ? duration(lastRun.startedAt, lastRun.finishedAt)
    : null;
  const hasScript = scripts.length > 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/projects/${projectId}/test-cases`)}
        className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Test Cases
      </button>

      {/* ── Header Card ── */}
      <div className="overflow-hidden rounded-[6px] bg-surface shadow-[0px_4px_24px_rgba(0,0,0,0.15)] border border-border">
        <div className="px-8 pt-6 pb-6">
          <div className="flex items-start gap-4">
            {/* Left: info */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Status + ID */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={tc.status}
                  onValueChange={saveStatus}
                  disabled={saving}
                >
                  <SelectTrigger className="h-auto w-auto border-0 p-0 shadow-none bg-transparent focus:ring-0 gap-1">
                    <Badge
                      className={`capitalize cursor-pointer text-xs ${STATUS_STYLE[tc.status] ?? "bg-surface-2 text-muted-foreground"}`}
                    >
                      {tc.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <span className="flex items-center gap-1 text-xs text-muted-foreground/40">
                  <Hash className="size-3" />
                  {tc.id}
                </span>
                {developerMode && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                    <Terminal className="size-3" />
                    Developer mode
                  </span>
                )}
              </div>

              {/* Title */}
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
                    disabled={saving}
                    className="text-[22px] font-bold leading-[30px] tracking-[0.5px] border-b-2 border-primary bg-transparent outline-none w-full text-foreground"
                  />
                  <button
                    onClick={saveTitle}
                    className="shrink-0 cursor-pointer text-primary hover:text-primary/80"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="shrink-0 cursor-pointer text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="group flex cursor-pointer items-center gap-2"
                  onClick={startEditTitle}
                >
                  <h1 className="text-[22px] font-bold leading-[30px] tracking-[0.5px] text-foreground">
                    {tc.title}
                  </h1>
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Goal */}
              {editingGoal ? (
                <div className="flex items-start gap-2">
                  <Target className="mt-2 size-3.5 shrink-0 text-muted-foreground" />
                  <textarea
                    ref={goalRef}
                    value={draftGoal}
                    onChange={(e) => setDraftGoal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingGoal(false);
                    }}
                    onBlur={saveGoal}
                    disabled={saving}
                    rows={3}
                    className="flex-1 text-sm text-muted-foreground border-b border-primary bg-transparent outline-none resize-none leading-relaxed"
                  />
                  <button
                    onClick={saveGoal}
                    className="mt-1 shrink-0 cursor-pointer text-primary"
                  >
                    <Check className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingGoal(false)}
                    className="mt-1 shrink-0 cursor-pointer text-muted-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  className="group flex cursor-pointer items-start gap-1.5"
                  onClick={startEditGoal}
                >
                  <Target className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tc.goal || (
                      <span className="italic text-muted-foreground/40">
                        Add a goal…
                      </span>
                    )}
                  </p>
                  <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Inline stats */}
              {lastRun && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>Last run:</span>
                  <VerdictChip verdict={lastRun.verdict} />
                  {lastRunDur && <span>· {lastRunDur}</span>}
                  <span>· {fmt(lastRun.createdAt)}</span>
                  {passRate !== null && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="font-medium text-muted-foreground">
                        {passRate}% pass rate
                      </span>
                      <span>
                        · {runs.length} run{runs.length !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Test plan (collapsed by default) */}
              {tc.steps?.length > 0 && (
                <TestPlanSection
                  steps={tc.steps}
                  tc={tc}
                  onStepsUpdated={(newSteps) =>
                    setTc((prev) => ({ ...prev, steps: newSteps }))
                  }
                />
              )}

              {/* Refine panel — shown only on demand */}
              {showRefine && (
                <RefineSection
                  tc={tc}
                  onApplied={() => {
                    setShowRefine(false);
                    load();
                  }}
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
                    className="gap-1.5"
                  >
                    {busyAction === "quick_replay" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Running…
                      </>
                    ) : (
                      <>
                        <RotateCcw className="size-4" />
                        Replay Test
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleRunWithAI}
                    disabled={!!busyAction}
                    className="gap-1.5"
                  >
                    {busyAction === "ai_run" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        <Play className="size-4" />
                        Run Test
                      </>
                    )}
                  </Button>
                )}

                {/* Edit Steps — only if script exists */}
                {hasScript && (
                  <Button
                    variant="outline"
                    onClick={handleEditSteps}
                    className="gap-1.5"
                  >
                    <Pencil className="size-4" />
                    {editStepsOpen ? "Done" : "Edit Steps"}
                  </Button>
                )}

                {/* More Actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-[6px] border border-border"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {hasScript && (
                      <DropdownMenuItem
                        onClick={handleRunWithAI}
                        disabled={!!busyAction}
                      >
                        <Play className="size-3.5 mr-2 text-primary" />
                        Run with AI Agent
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowRefine((v) => !v)}>
                      <Wand2 className="size-3.5 mr-2 text-violet-600" />
                      {showRefine ? "Hide AI refinement" : "Improve with AI"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeveloperMode((v) => !v)}
                    >
                      <Terminal className="size-3.5 mr-2 text-muted-foreground" />
                      {developerMode
                        ? "Disable developer mode"
                        : "Developer mode"}
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
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
              <AlertTriangle className="size-3.5 shrink-0 text-red-400" />
              <span className="flex-1 text-sm text-red-400">{headerError}</span>
              <button
                onClick={() => setHeaderError("")}
                className="cursor-pointer text-red-400/50 hover:text-red-400"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Delete confirm */}
          {confirmDelete && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <p className="flex-1 text-sm text-red-400">
                Delete this test case? This cannot be undone.
              </p>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                variant="destructive"
                size="sm"
                className="shrink-0"
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1" />
                    Deleting…
                  </>
                ) : (
                  "Confirm delete"
                )}
              </Button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Pass rate bar */}
        {passRate !== null && runs.length > 0 && (
          <div className="border-t border-border px-8 py-3">
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[13px] text-muted-foreground">
                Pass rate
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{ width: `${passRate}%` }}
                />
              </div>
              <div className="flex w-20 items-center justify-end gap-2">
                <span className="text-[13px] font-bold text-foreground">
                  {passRate}%
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {passCount}/{runs.length}
                </span>
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
      <section className="overflow-hidden rounded-xl bg-card">

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { key: "runs",     label: "Run History",  count: runs.length,    icon: <Play className="size-4" /> },
            { key: "datasets", label: "Dataset Runs", count: batches.length, icon: <Database className="size-4" /> },
          ].map(({ key, label, count, icon }) => {
            const isActive = historyTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setHistoryTab(key)}
                className={`relative flex h-[50px] items-center gap-2 px-6 text-[16px] font-bold tracking-[0.5px] transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {icon}
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  isActive ? "bg-muted text-muted-foreground" : "bg-muted/60 text-muted-foreground"
                }`}>
                  {count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Runs tab ── */}
        {historyTab === "runs" && (() => {
          const totalPages  = Math.ceil(runs.length / RUN_PAGE_SIZE);
          const pageRuns    = runs.slice((runPage - 1) * RUN_PAGE_SIZE, runPage * RUN_PAGE_SIZE);
          const globalOffset = (runPage - 1) * RUN_PAGE_SIZE;

          return (
            <>
              {/* Column headers */}
              <div className="flex items-center border-b border-border bg-muted/40 px-8" style={{ height: 46 }}>
                <span className="w-6 shrink-0" />
                <span className="flex-1 pl-3 text-[13px] font-bold text-foreground">Run</span>
                <span className="w-44 text-right text-[13px] font-bold text-foreground">Date · Duration</span>
                <span className="w-32 text-right text-[13px] font-bold text-foreground">Status</span>
                <span className="w-40 text-right text-[13px] font-bold text-foreground">Actions</span>
              </div>

              {runs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Play className="mx-auto size-8 text-muted-foreground/30" />
                  <p className="text-[14px] font-medium text-muted-foreground">No runs yet</p>
                  <p className="text-[13px] text-muted-foreground/60">Run this test case to see results here</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pageRuns.map((run, i) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      projectId={projectId}
                      index={globalOffset + i}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-8 py-3">
                  <p className="text-[13px] tracking-[0.5px] text-muted-foreground tabular-nums">
                    {globalOffset + 1}–{Math.min(globalOffset + RUN_PAGE_SIZE, runs.length)} of {runs.length} runs
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setRunPage((p) => Math.max(1, p - 1))}
                      disabled={runPage === 1}
                      className="h-[38px] w-[38px] p-0 text-muted-foreground"
                    >
                      ←
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        type="button"
                        variant={runPage === page ? "default" : "secondary"}
                        onClick={() => setRunPage(page)}
                        className={`h-[38px] min-w-[38px] px-2 text-[13px] font-medium ${
                          runPage === page ? "" : "text-muted-foreground"
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setRunPage((p) => Math.min(totalPages, p + 1))}
                      disabled={runPage === totalPages}
                      className="h-[38px] w-[38px] p-0 text-muted-foreground"
                    >
                      →
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* ── Datasets tab ── */}
        {historyTab === "datasets" && (
          <>
            {/* Column headers */}
            <div className="flex items-center border-b border-border bg-muted/40 px-8" style={{ height: 46 }}>
              <span className="flex-1 text-[13px] font-bold text-foreground">Dataset</span>
              <span className="w-44 text-right text-[13px] font-bold text-foreground">Date</span>
              <span className="w-36 text-right text-[13px] font-bold text-foreground">Results</span>
              <span className="w-24 text-right text-[13px] font-bold text-foreground">Status</span>
              <span className="w-14" />
            </div>

            {batches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Database className="mx-auto size-8 text-muted-foreground/30" />
                <p className="text-[14px] font-medium text-muted-foreground">No dataset runs yet</p>
                <p className="text-[13px] text-muted-foreground/60">
                  Use the Replay section above to select a dataset and run batch tests.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {batches.map((batch, index) => {
                  const rowBg = index % 2 === 0 ? "bg-card" : "bg-muted/50";
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/test-runs/batches/${batch.id}`)}
                      className={`group flex w-full cursor-pointer items-center gap-4 px-8 transition-colors hover:bg-muted/60 ${rowBg}`}
                      style={{ minHeight: 46 }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <p className="truncate text-[14px] text-foreground">
                          {batch.dataset_name ?? `Dataset #${batch.dataset_id}`}
                        </p>
                        <span className="shrink-0 text-[13px] text-muted-foreground">
                          Batch #{batch.id}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-5">
                        <span className="w-44 text-right text-[13px] text-muted-foreground">
                          {batch.created_at ? new Date(batch.created_at).toLocaleString() : "—"}
                        </span>
                        <span className="flex w-36 items-center justify-end gap-2 text-[13px]">
                          <span className="text-success">{batch.passed_rows ?? 0} ✓</span>
                          <span className="text-destructive">{batch.failed_rows ?? 0} ✗</span>
                          <span className="text-muted-foreground">/ {batch.total_rows ?? 0}</span>
                        </span>
                        <span className={`w-24 rounded-[6px] border px-2 py-0.5 text-right text-xs font-normal ${
                          batch.status === "completed"
                            ? "border-success text-success"
                            : "border-blue-400 text-blue-500"
                        }`}>
                          {batch.status}
                        </span>
                        <span className="w-14 text-right text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          View →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
