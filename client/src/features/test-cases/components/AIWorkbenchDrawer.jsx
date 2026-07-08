import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  Sparkles,
  Play,
  Save,
  CheckCircle2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  RotateCcw,
  Wand2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { FormInput, FormTextarea, FormError } from "@/shared/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateTestCase,
  saveTestCases,
  commitTestCase,
  getLatestAiGeneration,
  clearUnselectedAiGeneration,
  refineAiCandidate,
  updateAiCandidate,
} from "@/features/test-cases/api/testCasesApi";
import {
  createTestRun,
  getTestRunDetail,
} from "@/features/test-results/api/testResultsApi";

function extractSteps(candidate) {
  const planSnapshot = candidate.planSnapshot ?? candidate.plan_snapshot ?? {};

  return Array.isArray(planSnapshot.steps)
    ? planSnapshot.steps
        .map((s) =>
          typeof s === "string" ? s : (s?.text ?? s?.description ?? ""),
        )
        .filter(Boolean)
    : [];
}

function getExpectedResult(candidate) {
  const planSnapshot = candidate.planSnapshot ?? candidate.plan_snapshot ?? {};
  return planSnapshot.expectedResult ?? "";
}

const TERMINAL_RUN_STATUSES = new Set(["completed", "failed", "cancelled"]);

function extractSavedTestCaseId(result, fallback = null) {
  const saved = Array.isArray(result) ? result[0] : result;
  return saved?.id ?? saved?.testCaseId ?? saved?.test_case_id ?? fallback;
}

function initCandidateState(c) {
  const steps = extractSteps(c);
  const expectedResult = getExpectedResult(c);

  const selectedTestCaseId =
    c.selectedTestCaseId ?? c.selected_test_case_id ?? null;

  const selectedIsAiDraft = Boolean(
    c.selectedIsAiDraft ?? c.selected_is_ai_draft ?? false,
  );

  const isOfficialSaved = Boolean(selectedTestCaseId && !selectedIsAiDraft);
  const latestRunId = c.latestRunId ?? c.latest_run_id ?? null;
  const latestRunStatus = c.latestRunStatus ?? c.latest_run_status ?? null;
  const latestRunVerdict = c.latestRunVerdict ?? c.latest_run_verdict ?? null;
  const hasDraftRun = Boolean(selectedIsAiDraft && latestRunId);

  return {
    ...c,

    title: c.title ?? "Untitled",
    steps,
    expectedResult,

    expanded: true,
    editing: false,
    applyingEdit: false,
    editTitle: c.title ?? "",
    editStepsText: steps.join("\n"),
    editExpectedResult: expectedResult,

    aiEditOpen: false,
    aiPrompt: "",
    aiRefining: false,
    aiSuggestion: null,
    aiError: "",

    isSaved: isOfficialSaved,
    draftTestCaseId: selectedIsAiDraft ? selectedTestCaseId : null,
    savedTestCaseId: isOfficialSaved ? selectedTestCaseId : null,
    saving: false,

    runPhase: hasDraftRun
      ? TERMINAL_RUN_STATUSES.has(latestRunStatus)
        ? "done"
        : "running"
      : "idle",
    runId: hasDraftRun ? latestRunId : null,
    runStatus: hasDraftRun ? latestRunStatus : null,
    runVerdict: hasDraftRun ? latestRunVerdict : null,
    runError: null,
  };
}

const VERDICT_STYLE = {
  pass: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    label: "Passed",
  },
  pass_with_warning: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    label: "Passed (no assertions)",
  },
  fail: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800/40",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    label: "Failed",
  },
  error: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800/40",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    label: "Error",
  },
};

function CandidateCard({
  candidate,
  state,
  batchId,
  projectId,
  onUpdate,
  onSaved,
  onDiscard,
  rowIndex = 0,
  isInline = false,
}) {
  const navigate = useNavigate();

  const {
    title,
    steps,
    expectedResult,
    expanded,
    editing,
    applyingEdit,
    editTitle,
    editStepsText,
    editExpectedResult,
    aiEditOpen,
    aiPrompt,
    aiRefining,
    aiSuggestion,
    aiError,
    isSaved,
    saving,
    draftTestCaseId,
    savedTestCaseId,
    runPhase,
    runId,
    runVerdict,
    runError,
  } = state;

  function startEdit() {
    onUpdate({ editing: true, aiEditOpen: false, expanded: true });
  }

  function cancelEdit() {
    onUpdate({
      editing: false,
      editTitle: title,
      editStepsText: steps.join("\n"),
      editExpectedResult: expectedResult,
    });
  }

  // Persists candidate content on the server, then syncs local card state.
  // Editing invalidates a previous draft run, so run state is reset too.
  async function persistCandidate({ newTitle, newSteps, newExpectedResult }) {
    const updated = await updateAiCandidate(candidate.id, {
      title: newTitle,
      steps: newSteps,
      expectedResult: newExpectedResult,
    });

    const nextTitle = updated?.title ?? newTitle;
    const nextSteps = updated ? extractSteps(updated) : newSteps;
    const nextExpected = updated ? getExpectedResult(updated) : newExpectedResult;

    onUpdate({
      title: nextTitle,
      steps: nextSteps,
      expectedResult: nextExpected,
      editTitle: nextTitle,
      editStepsText: nextSteps.join("\n"),
      editExpectedResult: nextExpected,
      draftTestCaseId: null,
      runPhase: "idle",
      runId: null,
      runStatus: null,
      runVerdict: null,
      runError: null,
    });
  }

  async function applyEdit() {
    const newSteps = editStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (newSteps.length === 0) {
      toast.error("At least one step is required.");
      return;
    }

    onUpdate({ applyingEdit: true });

    try {
      await persistCandidate({
        newTitle: editTitle.trim() || title,
        newSteps,
        newExpectedResult: editExpectedResult,
      });

      onUpdate({ editing: false, applyingEdit: false });
    } catch (e) {
      onUpdate({ applyingEdit: false });
      toast.error(e?.message || "Failed to save changes.");
    }
  }

  function toggleAiEdit() {
    onUpdate({
      aiEditOpen: !aiEditOpen,
      editing: false,
      expanded: true,
      aiError: "",
    });
  }

  async function handleAiRefine() {
    if (!aiPrompt.trim() || aiRefining) return;

    onUpdate({ aiRefining: true, aiError: "", aiSuggestion: null });

    try {
      const suggestion = await refineAiCandidate(candidate.id, aiPrompt.trim());
      onUpdate({ aiRefining: false, aiSuggestion: suggestion });
    } catch (e) {
      onUpdate({
        aiRefining: false,
        aiError: e?.message || "Failed to get AI suggestion.",
      });
    }
  }

  async function handleAiApply() {
    if (!aiSuggestion || applyingEdit) return;

    onUpdate({ applyingEdit: true, aiError: "" });

    try {
      await persistCandidate({
        newTitle: aiSuggestion.title,
        newSteps: (aiSuggestion.steps ?? []).map((s) =>
          typeof s === "string" ? s : (s?.text ?? s?.description ?? ""),
        ).filter(Boolean),
        newExpectedResult: aiSuggestion.expectedResult ?? "",
      });

      onUpdate({
        applyingEdit: false,
        aiEditOpen: false,
        aiPrompt: "",
        aiSuggestion: null,
      });

      toast.success("AI changes applied.");
    } catch (e) {
      onUpdate({
        applyingEdit: false,
        aiError: e?.message || "Failed to apply AI changes.",
      });
    }
  }

  async function handleSaveToLibrary() {
    if (isSaved || saving) return;

    onUpdate({ saving: true });

    try {
      let nextSavedTestCaseId = null;

      if (draftTestCaseId) {
        const committed = await commitTestCase(draftTestCaseId);
        nextSavedTestCaseId = extractSavedTestCaseId(
          committed,
          draftTestCaseId,
        );
      } else {
        const saved = await saveTestCases({
          projectId,
          batchId,
          candidateIds: [candidate.id],
        });
        nextSavedTestCaseId = extractSavedTestCaseId(saved);
      }

      onUpdate({
        isSaved: true,
        savedTestCaseId: nextSavedTestCaseId,
        draftTestCaseId: null,
        saving: false,
        aiEditOpen: false,
        editing: false,
      });

      toast.success(`"${title}" saved to library!`);
      onSaved?.();
    } catch (e) {
      onUpdate({ saving: false });
      toast.error(e?.message || "Failed to save.");
    }
  }

  async function handleRunDraft() {
    if (runPhase !== "idle" && runPhase !== "done") return;

    onUpdate({
      runPhase: "saving",
      runId: null,
      runStatus: null,
      runVerdict: null,
      runError: null,
    });

    try {
      let tcId = draftTestCaseId;

      if (!tcId) {
        const result = await saveTestCases({
          projectId,
          batchId,
          candidateIds: [candidate.id],
          isAiDraft: true,
        });

        const saved = Array.isArray(result) ? result[0] : result;
        tcId = saved?.id;

        if (!tcId) {
          throw new Error("Failed to create draft test case.");
        }

        onUpdate({
          draftTestCaseId: tcId,
          runPhase: "starting",
        });
      } else {
        onUpdate({ runPhase: "starting" });
      }

      const run = await createTestRun({ testCaseId: tcId });
      const newRunId = run?.id ?? run?.testRunId ?? run?.run?.id;

      if (!newRunId) {
        throw new Error("Test run did not return an ID.");
      }

      onUpdate({
        runId: newRunId,
        runPhase: "running",
        runStatus: "queued",
      });
    } catch (e) {
      onUpdate({
        runPhase: "done",
        runError: e?.message || "Failed to start run.",
      });
    }
  }

  const verdictStyle = VERDICT_STYLE[runVerdict] ?? null;

  const isRunning =
    runPhase === "saving" || runPhase === "starting" || runPhase === "running";

  const isDone = runPhase === "done";
  const hasDraftResult = Boolean(runId) && !isRunning;

  function openRunResult() {
    if (!runId) return;
    navigate(`/projects/${projectId}/test-runs/${runId}`);
  }

  const borderClass = isSaved
    ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10"
    : isDone && verdictStyle
      ? `${verdictStyle.border} ${verdictStyle.bg}`
      : "border-border bg-card";

  const inlineRowBg = isSaved
    ? "bg-emerald-50/30 dark:bg-emerald-950/10"
    : isDone && verdictStyle
      ? verdictStyle.bg
      : rowIndex % 2 === 0
        ? "bg-card"
        : "bg-muted/50";

  return (
    <div className={isInline
      ? `transition-colors ${inlineRowBg}`
      : `rounded-xl border transition-colors ${borderClass}`
    }>
      <div className={`flex items-start gap-2 ${isInline ? "px-8 py-3" : "p-4 pb-2"}`}>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onUpdate({ expanded: !expanded })}
          className="mt-0.5 text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </Button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <FormInput
              autoFocus
              value={editTitle}
              onChange={(e) => onUpdate({ editTitle: e.target.value })}
              className="font-semibold"
            />
          ) : (
            <p className="text-sm font-semibold leading-snug text-foreground">
              {title}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isSaved && (
            <Badge className="bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Saved
            </Badge>
          )}

          {isDone && runVerdict && verdictStyle && (
            <Badge className={`font-semibold ${verdictStyle.badge}`}>
              {verdictStyle.label}
            </Badge>
          )}

          {isRunning && (
            <Badge className="bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/35 dark:text-brand-200">
              <Loader2 className="size-3 animate-spin" />
              {runPhase === "saving"
                ? "Preparing…"
                : runPhase === "starting"
                  ? "Starting…"
                  : "Running…"}
            </Badge>
          )}

          {!isSaved && !isRunning && !editing && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={toggleAiEdit}
                title="Edit with AI"
                className={aiEditOpen ? "bg-violet-100 text-violet-600 hover:bg-violet-100 hover:text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" : "text-violet-500 hover:text-violet-600"}
              >
                <Wand2 className="size-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={startEdit}
                title="Edit"
              >
                <Pencil className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className={`space-y-3 ${isInline ? "px-8 pb-4 pl-14" : "px-4 pb-4 pl-10"}`}>
          {editing ? (
            <div className="space-y-2">
              <FormTextarea
                value={editStepsText}
                onChange={(e) => onUpdate({ editStepsText: e.target.value })}
                rows={5}
                placeholder="One step per line…"
                className="text-xs"
              />

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Expected Result
                </label>
                <FormInput
                  value={editExpectedResult}
                  onChange={(e) => onUpdate({ editExpectedResult: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={applyEdit} disabled={applyingEdit}>
                  {applyingEdit && <Loader2 className="animate-spin" />}
                  Apply
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={applyingEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {steps.length > 0 && (
                <ol className="space-y-1">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground/60">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}

              {expectedResult && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Expected: {expectedResult}
                </p>
              )}
            </>
          )}

          {aiEditOpen && !editing && !isSaved && (
            <div className="overflow-hidden rounded-lg border border-violet-200 bg-violet-50/40 dark:border-violet-800/40 dark:bg-violet-950/20">
              <div className="flex items-center gap-1.5 border-b border-violet-100 px-3 py-2 dark:border-violet-800/40">
                <Wand2 className="size-3 text-violet-500" />
                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                  Edit with AI
                </span>
              </div>

              <div className="space-y-2 p-3">
                <div className="flex gap-2">
                  <FormInput
                    autoFocus
                    value={aiPrompt}
                    onChange={(e) => onUpdate({ aiPrompt: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAiRefine();
                    }}
                    placeholder='e.g. "Add a step verifying the error message"'
                    disabled={aiRefining || applyingEdit}
                    className="text-xs"
                  />

                  <Button
                    size="sm"
                    onClick={handleAiRefine}
                    disabled={!aiPrompt.trim() || aiRefining || applyingEdit}
                    className="shrink-0 bg-violet-600 hover:bg-violet-700"
                  >
                    {aiRefining ? (
                      <><Loader2 className="animate-spin" />Thinking…</>
                    ) : (
                      <><Wand2 />Suggest</>
                    )}
                  </Button>
                </div>

                {aiError && <p className="text-xs text-red-600">{aiError}</p>}

                {aiSuggestion && (
                  <div className="overflow-hidden rounded-lg border border-violet-200 bg-card dark:border-violet-800/40">
                    <div className="flex items-center justify-between gap-2 border-b border-violet-100 bg-violet-50 px-3 py-1.5 dark:border-violet-800/40 dark:bg-violet-950/30">
                      <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-300">
                        AI Suggestion
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdate({ aiSuggestion: null })}
                          disabled={applyingEdit}
                          className="h-6 px-2 text-[11px] text-muted-foreground"
                        >
                          <RotateCcw className="size-2.5" />
                          Discard
                        </Button>

                        <Button
                          size="sm"
                          onClick={handleAiApply}
                          disabled={applyingEdit}
                          className="h-6 bg-violet-600 px-2 text-[11px] hover:bg-violet-700"
                        >
                          {applyingEdit ? (
                            <><Loader2 className="size-2.5 animate-spin" />Applying…</>
                          ) : (
                            <><Check className="size-2.5" />Apply</>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 p-3">
                      {aiSuggestion.title !== title && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground line-through">
                            {title}
                          </p>
                          <p className="text-xs font-semibold text-foreground">
                            {aiSuggestion.title}
                          </p>
                        </div>
                      )}

                      {(aiSuggestion.steps ?? []).length > 0 && (
                        <ol className="space-y-1">
                          {aiSuggestion.steps.map((step, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-xs text-muted-foreground"
                            >
                              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-500 dark:bg-violet-950/40">
                                {i + 1}
                              </span>
                              {typeof step === "string"
                                ? step
                                : (step?.text ?? step?.description ?? "")}
                            </li>
                          ))}
                        </ol>
                      )}

                      {aiSuggestion.expectedResult && (
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Expected: {aiSuggestion.expectedResult}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isDone && runError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-950/20">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-700 dark:text-red-300">{runError}</p>
            </div>
          )}

          {!editing && (
            <div className="flex flex-wrap gap-2 pt-1">
              {!isSaved && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hasDraftResult ? openRunResult : handleRunDraft}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <Loader2 className="animate-spin" />
                    ) : hasDraftResult ? (
                      <ExternalLink />
                    ) : (
                      <Play />
                    )}
                    {hasDraftResult ? "View Draft Result" : "Run Draft"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveToLibrary}
                    disabled={saving || isRunning}
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Save to Library
                  </Button>
                </>
              )}

              {runId && (!hasDraftResult || isSaved) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRunResult}
                >
                  <ExternalLink />
                  Open Full Result
                </Button>
              )}

              {isSaved && savedTestCaseId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/projects/${projectId}/test-cases/${savedTestCaseId}`,
                    )
                  }
                >
                  <ExternalLink />
                  View Detail
                </Button>
              )}

              {!isRunning && (
                <Button
                  variant="ds-outlined-destructive"
                  size="sm"
                  onClick={onDiscard}
                >
                  <Trash2 />
                  {isSaved ? "Remove" : "Discard"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useRunPolling(candidates, updateCandidate) {
  const pollingRefs = useRef({});

  const startPolling = useCallback(
    (candidateId, runId) => {
      if (pollingRefs.current[candidateId]) return;

      async function poll() {
        try {
          const detail = await getTestRunDetail(runId);
          const run = detail?.run;

          if (!run) return;

          const done = ["completed", "failed", "cancelled"].includes(
            run.status,
          );

          updateCandidate(candidateId, {
            runStatus: run.status,
            runVerdict: run.verdict,
            ...(done ? { runPhase: "done" } : {}),
          });

          if (done) {
            clearInterval(pollingRefs.current[candidateId]);
            delete pollingRefs.current[candidateId];
          }
        } catch {
          updateCandidate(candidateId, {
            runPhase: "done",
            runError: "Failed to fetch run status.",
          });

          clearInterval(pollingRefs.current[candidateId]);
          delete pollingRefs.current[candidateId];
        }
      }

      pollingRefs.current[candidateId] = setInterval(poll, 3000);
      poll();
    },
    [updateCandidate],
  );

  useEffect(() => {
    candidates.forEach((c) => {
      if (c.runPhase === "running" && c.runId && !pollingRefs.current[c.id]) {
        startPolling(c.id, c.runId);
      }
    });
  }, [candidates, startPolling]);

  useEffect(() => {
    const refs = pollingRefs.current;
    return () => {
      Object.values(refs).forEach(clearInterval);
    };
  }, []);
}

export default function AIWorkbenchDrawer({
  open,
  onClose,
  projectId,
  onSaved,
  inline = false,
  onGeneratingChange,
  candidatesTarget = null,
}) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [genError, setGenError] = useState("");
  const [batchId, setBatchId] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const textareaRef = useRef(null);

  function updateCandidate(candidateId, updates) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, ...updates } : c)),
    );
  }

  useRunPolling(candidates, updateCandidate);

  useEffect(() => {
    if ((!open && !inline) || !projectId) return;

    let cancelled = false;

    async function loadLatestGeneration() {
      setLoadingLatest(true);
      setGenError("");

      try {
        const result = await getLatestAiGeneration(projectId);

        if (cancelled) return;

        if (!result?.batch || !Array.isArray(result?.candidates)) {
          setBatchId(null);
          setCandidates([]);
          return;
        }

        setBatchId(result.batch.id);
        setPrompt(result.batch.sourcePrompt ?? "");

        setCandidates(
          result.candidates.map((candidate) => initCandidateState(candidate)),
        );
      } catch (e) {
        if (!cancelled) {
          setBatchId(null);
          setCandidates([]);
          setGenError(e?.message || "Failed to load AI candidates.");
        }
      } finally {
        if (!cancelled) {
          setLoadingLatest(false);
        }
      }
    }

    loadLatestGeneration();

    return () => {
      cancelled = true;
    };
  }, [open, inline, projectId]);

  useEffect(() => {
    if (open || inline) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open, inline]);

  async function handleGenerate() {
    if (!prompt.trim() || generating || !projectId) return;

    setGenerating(true);
    onGeneratingChange?.(true);
    setGenError("");

    try {
      await clearUnselectedAiGeneration(projectId);

      setCandidates([]);
      setBatchId(null);

      const result = await generateTestCase(prompt.trim(), projectId);

      setBatchId(result?.batch?.id ?? null);
      setCandidates(
        (result?.candidates ?? []).map((candidate) =>
          initCandidateState(candidate),
        ),
      );
    } catch (e) {
      setGenError(e?.message || "Failed to generate test cases.");
    } finally {
      setGenerating(false);
      onGeneratingChange?.(false);
    }
  }

  async function handleSaveAll() {
    const unsaved = candidates.filter((c) => !c.isSaved && !c.saving);

    if (!unsaved.length) return;

    setCandidates((prev) =>
      prev.map((c) => (!c.isSaved && !c.saving ? { ...c, saving: true } : c)),
    );

    let successCount = 0;
    let failCount = 0;
    const savedCandidateIds = new Map();

    for (const c of unsaved) {
      try {
        let savedTestCaseId = null;

        if (c.draftTestCaseId) {
          const committed = await commitTestCase(c.draftTestCaseId);
          savedTestCaseId = extractSavedTestCaseId(committed, c.draftTestCaseId);
        } else {
          const saved = await saveTestCases({
            projectId,
            batchId,
            candidateIds: [c.id],
          });
          savedTestCaseId = extractSavedTestCaseId(saved);
        }

        savedCandidateIds.set(c.id, savedTestCaseId);
        successCount += 1;
      } catch {
        updateCandidate(c.id, { saving: false });
        failCount += 1;
      }
    }

    if (savedCandidateIds.size > 0) {
      setCandidates((prev) =>
        prev.map((c) => {
          if (!savedCandidateIds.has(c.id)) return c;

          return {
            ...c,
            isSaved: true,
            savedTestCaseId: savedCandidateIds.get(c.id),
            draftTestCaseId: null,
            saving: false,
            aiEditOpen: false,
            editing: false,
          };
        }),
      );
    }

    if (successCount > 0) {
      onSaved?.();
    }

    if (failCount === 0) {
      toast.success(
        `${successCount} test case${successCount !== 1 ? "s" : ""} saved to library!`,
      );
    } else {
      toast.warning(
        `Saved ${successCount}/${unsaved.length}. ${failCount} failed.`,
      );
    }
  }

  async function handleClearCandidates() {
    if (!projectId) return;

    try {
      await clearUnselectedAiGeneration(projectId);

      setCandidates([]);
      setBatchId(null);
      setGenError("");

      toast.success("Unsaved AI candidates cleared.");
    } catch (e) {
      toast.error(e?.message || "Failed to clear AI candidates.");
    }
  }

  function handleDiscard(candidateId) {
    const candidate = candidates.find((c) => c.id === candidateId);

    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));

    toast.success(
      candidate?.isSaved
        ? "Candidate removed from workspace."
        : "Draft candidate discarded.",
    );
  }

  const hasResults = candidates.length > 0;
  const unsavedCount = candidates.filter((c) => !c.isSaved).length;
  const allSaved = hasResults && unsavedCount === 0;

  const anyRunning = candidates.some(
    (c) =>
      c.runPhase === "saving" ||
      c.runPhase === "starting" ||
      c.runPhase === "running",
  );

  const content = (
    <>
      <div className={`flex shrink-0 items-center justify-between border-b py-4 ${inline ? "px-8" : "px-5"}`}>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/35">
            <Sparkles className="size-4 text-brand-600" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI Test Case Generator
            </h2>
            <p className="text-xs text-muted-foreground">
              Generate, validate, then save to library
            </p>
          </div>
        </div>

        {!inline && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-muted-foreground"
          >
            <X />
          </Button>
        )}
      </div>

      <div className={inline ? "flex-1" : "flex-1 overflow-y-auto"}>
        <div className={`space-y-3 border-b py-4 ${inline ? "px-8" : "px-5"}`}>
          <FormTextarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={"Describe what you want to test…\n\nE.g. Login with valid and invalid credentials, check error messages and redirect on success."}
            rows={4}
            disabled={generating}
            className="py-2.5 disabled:opacity-60"
          />

          {genError && (
            <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/5 px-3 py-2.5">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{genError}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Enter to generate · Shift+Enter for new line
            </p>

            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating || loadingLatest}
            >
              {generating ? (
                <><Loader2 className="animate-spin" />Generating…</>
              ) : (
                <><Sparkles />Generate</>
              )}
            </Button>
          </div>
        </div>

        {loadingLatest && !hasResults && (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
            <Loader2 className="size-6 animate-spin text-brand-400" />
            <p className="text-xs text-slate-400">
              Loading latest AI candidates…
            </p>
          </div>
        )}

        {hasResults && (
          <div className={inline ? "" : "space-y-3 px-5 py-4"}>
            <div className={`flex items-center justify-between ${inline ? "border-b border-border px-8 py-3" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {candidates.length} candidate
                {candidates.length !== 1 ? "s" : ""} generated
                {unsavedCount > 0 && ` · ${unsavedCount} unsaved`}
              </p>

              <div className="flex items-center gap-2">
                {allSaved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="size-3.5" />
                    All saved
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={anyRunning || allSaved}
                  >
                    <Save />
                    Save All ({unsavedCount})
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCandidates}
                  disabled={anyRunning}
                >
                  <RefreshCw />
                  Clear
                </Button>
              </div>
            </div>

            <div className={inline ? "divide-y divide-border" : "space-y-3"}>
              {candidates.map((c, index) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  state={c}
                  batchId={batchId}
                  projectId={projectId}
                  onUpdate={(updates) => updateCandidate(c.id, updates)}
                  onSaved={onSaved}
                  onDiscard={() => handleDiscard(c.id)}
                  rowIndex={index}
                  isInline={inline}
                />
              ))}
            </div>
          </div>
        )}

        {!hasResults && !generating && !loadingLatest && !genError && (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30">
              <Sparkles className="size-6 text-brand-400" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Describe your test scenario
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Enter a prompt above and click Generate. AI will create test
                case candidates you can review, edit, validate, and save.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={`shrink-0 border-t py-3 ${inline ? "px-8" : "px-5"}`}>
        <p className={`text-[11px] text-muted-foreground ${inline ? "" : "text-center"}`}>
          Candidates are stored in the database until you{" "}
          <strong>Save to Library</strong>. Unsaved AI candidates are cleared
          when generating a new batch.
        </p>
      </div>
    </>
  );

  if (inline) {
    const candidatesSection = hasResults ? (
      <div className="mt-4 overflow-hidden rounded-xl bg-card">
        <div className="flex items-center justify-between border-b border-border px-8 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} generated
            {unsavedCount > 0 && ` · ${unsavedCount} unsaved`}
          </p>
          <div className="flex items-center gap-2">
            {allSaved ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                All saved
              </span>
            ) : (
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={anyRunning || allSaved}
              >
                <Save />
                Save All ({unsavedCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCandidates}
              disabled={anyRunning}
            >
              <RefreshCw />
              Clear
            </Button>
          </div>
        </div>
        <div className="divide-y divide-border">
          {candidates.map((c, index) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              state={c}
              batchId={batchId}
              projectId={projectId}
              onUpdate={(updates) => updateCandidate(c.id, updates)}
              onSaved={onSaved}
              onDiscard={() => handleDiscard(c.id)}
              rowIndex={index}
              isInline
            />
          ))}
        </div>
      </div>
    ) : null;

    return (
      <>
        <div id="ai-test-case-generator">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b py-4 px-8">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/35">
                <Sparkles className="size-4 text-brand-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">AI Test Case Generator</h2>
                <p className="text-xs text-muted-foreground">Generate, validate, then save to library</p>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className={`space-y-3 py-4 px-8 ${loadingLatest && !hasResults ? "border-b" : ""}`}>
            <FormTextarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={"Describe what you want to test…\n\nE.g. Login with valid and invalid credentials, check error messages and redirect on success."}
              rows={4}
              disabled={generating}
              className="py-2.5 disabled:opacity-60"
            />
            {genError && (
              <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="size-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{genError}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Enter to generate · Shift+Enter for new line
              </p>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating || loadingLatest}
              >
                {generating ? (
                  <><Loader2 className="animate-spin" />Generating…</>
                ) : (
                  <><Sparkles />Generate</>
                )}
              </Button>
            </div>
          </div>

          {/* Loading state */}
          {loadingLatest && !hasResults && (
            <div className="flex items-center gap-2 px-8 py-3 border-b">
              <Loader2 className="size-3.5 animate-spin text-brand-400" />
              <p className="text-xs text-muted-foreground">Loading latest AI candidates…</p>
            </div>
          )}

          {/* Footer */}
          <div className="shrink-0 border-t py-3 px-8">
            <p className="text-[11px] text-muted-foreground">
              Candidates are stored in the database until you{" "}
              <strong>Save to Library</strong>. Unsaved AI candidates are cleared
              when generating a new batch.
            </p>
          </div>
        </div>

        {/* Candidates section — portaled outside the border wrapper */}
        {candidatesSection &&
          (candidatesTarget
            ? createPortal(candidatesSection, candidatesTarget)
            : candidatesSection)}
      </>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[520px] max-w-[95vw] flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {content}
      </div>
    </>
  );
}
