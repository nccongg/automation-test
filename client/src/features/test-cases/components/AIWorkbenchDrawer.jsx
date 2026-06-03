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

function initCandidateState(c) {
  const steps = extractSteps(c);
  const expectedResult = getExpectedResult(c);

  const selectedTestCaseId =
    c.selectedTestCaseId ?? c.selected_test_case_id ?? null;

  const selectedIsAiDraft = Boolean(
    c.selectedIsAiDraft ?? c.selected_is_ai_draft ?? false,
  );

  const isOfficialSaved = Boolean(selectedTestCaseId && !selectedIsAiDraft);

  return {
    ...c,

    title: c.title ?? "Untitled",
    steps,
    expectedResult,

    expanded: true,
    editing: false,
    editTitle: c.title ?? "",
    editStepsText: steps.join("\n"),
    editExpectedResult: expectedResult,

    isSaved: isOfficialSaved,
    draftTestCaseId: selectedIsAiDraft ? selectedTestCaseId : null,
    savedTestCaseId: isOfficialSaved ? selectedTestCaseId : null,
    saving: false,

    runPhase: "idle",
    runId: null,
    runStatus: null,
    runVerdict: null,
    runError: null,
  };
}

const VERDICT_STYLE = {
  pass: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Passed",
  },
  pass_with_warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    label: "Passed (no assertions)",
  },
  fail: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Failed",
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
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
    editTitle,
    editStepsText,
    editExpectedResult,
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
    onUpdate({ editing: true });
  }

  function cancelEdit() {
    onUpdate({
      editing: false,
      editTitle: title,
      editStepsText: steps.join("\n"),
      editExpectedResult: expectedResult,
    });
  }

  function applyEdit() {
    const newSteps = editStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdate({
      title: editTitle.trim() || title,
      steps: newSteps,
      expectedResult: editExpectedResult,
      editing: false,
    });
  }

  async function handleSaveToLibrary() {
    if (isSaved || saving) return;

    onUpdate({ saving: true });

    try {
      if (draftTestCaseId) {
        await commitTestCase(draftTestCaseId);
      } else {
        await saveTestCases({
          projectId,
          batchId,
          candidateIds: [candidate.id],
        });
      }

      toast.success(`"${title}" saved to library!`);
      onSaved?.();
      onDiscard?.();
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
            <Badge className="bg-emerald-100 font-semibold text-emerald-700">
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
            <Badge className="bg-brand-100 font-semibold text-brand-700">
              <Loader2 className="size-3 animate-spin" />
              {runPhase === "saving"
                ? "Preparing…"
                : runPhase === "starting"
                  ? "Starting…"
                  : "Running…"}
            </Badge>
          )}

          {!isSaved && !isRunning && !editing && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={startEdit}
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </Button>
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
                <Button size="sm" onClick={applyEdit}>
                  Apply
                </Button>

                <Button variant="outline" size="sm" onClick={cancelEdit}>
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
                <p className="text-xs font-medium text-emerald-700">
                  Expected: {expectedResult}
                </p>
              )}
            </>
          )}

          {isDone && runError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{runError}</p>
            </div>
          )}

          {!editing && (
            <div className="flex flex-wrap gap-2 pt-1">
              {!isSaved && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunDraft}
                    disabled={isRunning}
                  >
                    {isRunning ? (
                      <Loader2 className="animate-spin" />
                    ) : runPhase === "done" ? (
                      <RotateCcw />
                    ) : (
                      <Play />
                    )}
                    {runPhase === "done" ? "Run Again" : "Run Draft"}
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

              {runId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/projects/${projectId}/test-runs/${runId}`)
                  }
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
    const savedCandidateIds = [];

    for (const c of unsaved) {
      try {
        if (c.draftTestCaseId) {
          await commitTestCase(c.draftTestCaseId);
        } else {
          await saveTestCases({
            projectId,
            batchId,
            candidateIds: [c.id],
          });
        }

        savedCandidateIds.push(c.id);
        successCount += 1;
      } catch {
        updateCandidate(c.id, { saving: false });
        failCount += 1;
      }
    }

    if (savedCandidateIds.length > 0) {
      setCandidates((prev) =>
        prev.filter((c) => !savedCandidateIds.includes(c.id)),
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
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
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
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-100">
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
            <div className="flex size-14 items-center justify-center rounded-full bg-brand-50">
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-100">
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
