import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Sparkles, Play, Save, CheckCircle2, Pencil, ChevronDown, ChevronUp,
  Loader2, AlertCircle, RefreshCw, Trash2, ExternalLink, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateTestCase, saveTestCases, commitTestCase } from "@/features/test-cases/api/testCasesApi";
import { createTestRun, getTestRunDetail } from "@/features/test-results/api/testResultsApi";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractSteps(candidate) {
  return Array.isArray(candidate.planSnapshot?.steps)
    ? candidate.planSnapshot.steps
        .map((s) => (typeof s === "string" ? s : (s?.text ?? s?.description ?? "")))
        .filter(Boolean)
    : [];
}

function initCandidateState(c) {
  const steps = extractSteps(c);
  return {
    // local editable data
    title: c.title ?? "Untitled",
    steps,
    expectedResult: c.planSnapshot?.expectedResult ?? "",
    // UI toggles
    expanded: true,
    editing: false,
    editTitle: c.title ?? "",
    editStepsText: steps.join("\n"),
    editExpectedResult: c.planSnapshot?.expectedResult ?? "",
    // save state
    isSaved: false,
    draftTestCaseId: null,
    savedTestCaseId: null,
    saving: false,
    // run state
    runPhase: "idle", // idle | saving | starting | running | done
    runId: null,
    runStatus: null,
    runVerdict: null,
    runError: null,
  };
}

const VERDICT_STYLE = {
  pass:              { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", label: "Passed" },
  pass_with_warning: { bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-700",   label: "Passed (no assertions)" },
  fail:              { bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100 text-red-700",       label: "Failed" },
  error:             { bg: "bg-rose-50",    border: "border-rose-200",    badge: "bg-rose-100 text-rose-700",     label: "Error" },
};

// ─── CandidateCard ────────────────────────────────────────────────────────────

function CandidateCard({ candidate, state, batchId, projectId, onUpdate, onSaved, onDiscard }) {
  const navigate = useNavigate();
  const {
    title, steps, expectedResult,
    expanded, editing, editTitle, editStepsText, editExpectedResult,
    isSaved, saving, draftTestCaseId, savedTestCaseId,
    runPhase, runId, runVerdict, runError,
  } = state;

  function startEdit() { onUpdate({ editing: true }); }

  function cancelEdit() {
    onUpdate({ editing: false, editTitle: title, editStepsText: steps.join("\n"), editExpectedResult: expectedResult });
  }

  function applyEdit() {
    const newSteps = editStepsText.split("\n").map((s) => s.trim()).filter(Boolean);
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
        onUpdate({ isSaved: true, savedTestCaseId: draftTestCaseId, saving: false });
      } else {
        const result = await saveTestCases({ projectId, batchId, candidateIds: [candidate.id] });
        const saved = Array.isArray(result) ? result[0] : result;
        onUpdate({ isSaved: true, savedTestCaseId: saved?.id ?? null, saving: false });
      }
      toast.success(`"${title}" saved to library!`);
      onSaved?.();
    } catch (e) {
      onUpdate({ saving: false });
      toast.error(e?.message || "Failed to save.");
    }
  }

  async function handleRunDraft() {
    if (runPhase !== "idle" && runPhase !== "done") return;
    onUpdate({ runPhase: "saving", runId: null, runStatus: null, runVerdict: null, runError: null });
    try {
      let tcId = draftTestCaseId;
      if (!tcId) {
        const result = await saveTestCases({
          projectId, batchId, candidateIds: [candidate.id], isAiDraft: true,
        });
        const saved = Array.isArray(result) ? result[0] : result;
        tcId = saved?.id;
        if (!tcId) throw new Error("Failed to create draft test case.");
        onUpdate({ draftTestCaseId: tcId, runPhase: "starting" });
      } else {
        onUpdate({ runPhase: "starting" });
      }

      const run = await createTestRun({ testCaseId: tcId });
      const runId = run?.id ?? run?.testRunId ?? run?.run?.id;
      if (!runId) throw new Error("Test run did not return an ID.");

      onUpdate({ runId, runPhase: "running", runStatus: "queued" });
    } catch (e) {
      onUpdate({ runPhase: "done", runError: e?.message || "Failed to start run." });
    }
  }

  const verdictStyle = VERDICT_STYLE[runVerdict] ?? null;
  const isRunning = runPhase === "saving" || runPhase === "starting" || runPhase === "running";
  const isDone = runPhase === "done";

  const borderClass = isSaved
    ? "border-emerald-200 bg-emerald-50/30"
    : isDone && verdictStyle
    ? `${verdictStyle.border} ${verdictStyle.bg}`
    : "border-slate-200 bg-white";

  return (
    <div className={`rounded-xl border transition-colors ${borderClass}`}>
      <div className="flex items-start gap-2 p-4 pb-2">
        <button
          onClick={() => onUpdate({ expanded: !expanded })}
          className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600"
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => onUpdate({ editTitle: e.target.value })}
              className="w-full rounded border border-indigo-300 px-2 py-1 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isSaved && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="size-3" /> Saved
            </span>
          )}
          {isDone && runVerdict && verdictStyle && (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${verdictStyle.badge}`}>
              {verdictStyle.label}
            </span>
          )}
          {isRunning && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              <Loader2 className="size-3 animate-spin" />
              {runPhase === "saving" ? "Preparing…" : runPhase === "starting" ? "Starting…" : "Running…"}
            </span>
          )}
          {!isSaved && !isRunning && !editing && (
            <button
              onClick={startEdit}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-10 space-y-3">
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editStepsText}
                onChange={(e) => onUpdate({ editStepsText: e.target.value })}
                rows={5}
                placeholder="One step per line…"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Expected Result</label>
                <input
                  value={editExpectedResult}
                  onChange={(e) => onUpdate({ editExpectedResult: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={applyEdit}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                  Apply
                </button>
                <button onClick={cancelEdit}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {steps.length > 0 && (
                <ol className="space-y-1">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-500">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-400">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {expectedResult && (
                <p className="text-xs text-emerald-700 font-medium">
                  Expected: {expectedResult}
                </p>
              )}
            </>
          )}

          {isDone && runError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
              <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
              <p className="text-xs text-red-700">{runError}</p>
            </div>
          )}

          {!editing && (
            <div className="flex flex-wrap gap-2 pt-1">
              {!isSaved && (
                <>
                  <button
                    onClick={handleRunDraft}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRunning
                      ? <Loader2 className="size-3 animate-spin" />
                      : runPhase === "done"
                      ? <RotateCcw className="size-3" />
                      : <Play className="size-3" />
                    }
                    {runPhase === "done" ? "Run Again" : "Run Draft"}
                  </button>

                  <button
                    onClick={handleSaveToLibrary}
                    disabled={saving || isRunning}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving
                      ? <Loader2 className="size-3 animate-spin" />
                      : <Save className="size-3" />
                    }
                    Save to Library
                  </button>
                </>
              )}

              {runId && (
                <button
                  onClick={() => navigate(`/projects/${projectId}/test-runs/${runId}`)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="size-3" /> Open Full Result
                </button>
              )}

              {isSaved && savedTestCaseId && (
                <button
                  onClick={() => navigate(`/projects/${projectId}/test-cases/${savedTestCaseId}`)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="size-3" /> View Detail
                </button>
              )}

              {!isRunning && (
                <button
                  onClick={onDiscard}
                  className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="size-3" />
                  {isSaved ? "Remove" : "Discard"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Polling hook ─────────────────────────────────────────────────────────────

function useRunPolling(candidates, updateCandidate) {
  const pollingRefs = useRef({});

  const startPolling = useCallback((candidateId, runId) => {
    if (pollingRefs.current[candidateId]) return;

    async function poll() {
      try {
        const detail = await getTestRunDetail(runId);
        const run = detail?.run;
        if (!run) return;

        const done = ["completed", "failed", "cancelled"].includes(run.status);
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
        updateCandidate(candidateId, { runPhase: "done", runError: "Failed to fetch run status." });
        clearInterval(pollingRefs.current[candidateId]);
        delete pollingRefs.current[candidateId];
      }
    }

    pollingRefs.current[candidateId] = setInterval(poll, 3000);
    poll();
  }, [updateCandidate]);

  useEffect(() => {
    candidates.forEach((c) => {
      if (c.runPhase === "running" && c.runId && !pollingRefs.current[c.id]) {
        startPolling(c.id, c.runId);
      }
    });
  }, [candidates, startPolling]);

  useEffect(() => {
    const refs = pollingRefs.current;
    return () => { Object.values(refs).forEach(clearInterval); };
  }, []);
}

// ─── Session persistence helpers ─────────────────────────────────────────────

function sessionKey(projectId) {
  return `ai_workbench_${projectId}`;
}

function loadSession(projectId) {
  try {
    const raw = localStorage.getItem(sessionKey(projectId));
    if (!raw) return null;
    const { prompt, batchId, candidates } = JSON.parse(raw);
    const restoredCandidates = (candidates ?? []).map((c) => ({
      ...c,
      saving: false,
      editing: false,
      runPhase: c.runPhase === "saving" || c.runPhase === "starting" ? "idle" : c.runPhase,
    }));
    return { prompt: prompt ?? "", batchId: batchId ?? null, candidates: restoredCandidates };
  } catch {
    return null;
  }
}

function saveSession(projectId, { prompt, batchId, candidates }) {
  try {
    if (!candidates.length && !batchId) {
      localStorage.removeItem(sessionKey(projectId));
    } else {
      localStorage.setItem(sessionKey(projectId), JSON.stringify({ prompt, batchId, candidates }));
    }
  } catch { /* quota exceeded — ignore */ }
}

function clearSession(projectId) {
  try { localStorage.removeItem(sessionKey(projectId)); } catch { /* ignore */ }
}

// ─── AIWorkbenchDrawer ────────────────────────────────────────────────────────

export default function AIWorkbenchDrawer({ open, onClose, projectId, onSaved, inline = false }) {
  const session = loadSession(projectId);

  const [prompt, setPrompt] = useState(session?.prompt ?? "");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [batchId, setBatchId] = useState(session?.batchId ?? null);
  const [candidates, setCandidates] = useState(session?.candidates ?? []);

  const textareaRef = useRef(null);

  function updateCandidate(candidateId, updates) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, ...updates } : c))
    );
  }

  useRunPolling(candidates, updateCandidate);

  useEffect(() => {
    if (!projectId) return;
    saveSession(projectId, { prompt, batchId, candidates });
  }, [projectId, prompt, batchId, candidates]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150);
  }, [open]);

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGenError("");
    setCandidates([]);
    setBatchId(null);
    try {
      const result = await generateTestCase(prompt.trim(), projectId);
      setBatchId(result?.batch?.id ?? null);
      setCandidates((result?.candidates ?? []).map((c) => ({ ...c, ...initCandidateState(c) })));
    } catch (e) {
      setGenError(e?.message || "Failed to generate test cases.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAll() {
    const unsaved = candidates.filter((c) => !c.isSaved && !c.saving);
    if (!unsaved.length) return;

    setCandidates((prev) =>
      prev.map((c) => (!c.isSaved && !c.saving ? { ...c, saving: true } : c))
    );

    let successCount = 0;
    let failCount = 0;

    for (const c of unsaved) {
      try {
        if (c.draftTestCaseId) {
          await commitTestCase(c.draftTestCaseId);
          updateCandidate(c.id, { isSaved: true, savedTestCaseId: c.draftTestCaseId, saving: false });
        } else {
          const result = await saveTestCases({ projectId, batchId, candidateIds: [c.id] });
          const saved = Array.isArray(result) ? result[0] : result;
          updateCandidate(c.id, { isSaved: true, savedTestCaseId: saved?.id ?? null, saving: false });
        }
        successCount++;
      } catch {
        updateCandidate(c.id, { saving: false });
        failCount++;
      }
    }

    if (successCount > 0) onSaved?.();

    if (failCount === 0) {
      toast.success(`${successCount} test case${successCount !== 1 ? "s" : ""} saved to library!`);
    } else {
      toast.warning(`Saved ${successCount}/${unsaved.length}. ${failCount} failed.`);
    }
  }

  function handleClearCandidates() {
    setCandidates([]);
    setBatchId(null);
    setGenError("");
    clearSession(projectId);
  }

  function handleDiscard(candidateId) {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
  }

  const hasResults = candidates.length > 0;
  const unsavedCount = candidates.filter((c) => !c.isSaved).length;
  const allSaved = hasResults && unsavedCount === 0;
  const anyRunning = candidates.some(
    (c) => c.runPhase === "saving" || c.runPhase === "starting" || c.runPhase === "running"
  );

  const content = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100">
            <Sparkles className="size-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">AI Test Case Generator</h2>
            <p className="text-xs text-slate-500">Generate, validate, then save to library</p>
          </div>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className={inline ? "flex-1" : "flex-1 overflow-y-auto"}>
        <div className="border-b px-5 py-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={
              "Describe what you want to test…\n\nE.g. Login with valid and invalid credentials, check error messages and redirect on success."
            }
            rows={4}
            disabled={generating}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />

          {genError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{genError}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">Enter to generate · Shift+Enter for new line</p>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {hasResults && (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} generated
                {unsavedCount > 0 && ` · ${unsavedCount} unsaved`}
              </p>
              <div className="flex items-center gap-2">
                {allSaved ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="size-3.5" /> All saved
                  </span>
                ) : (
                  <button
                    onClick={handleSaveAll}
                    disabled={anyRunning || allSaved}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="size-3" />
                    Save All ({unsavedCount})
                  </button>
                )}
                <button
                  onClick={handleClearCandidates}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="size-3" />
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {candidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  state={c}
                  batchId={batchId}
                  projectId={projectId}
                  onUpdate={(updates) => updateCandidate(c.id, updates)}
                  onSaved={onSaved}
                  onDiscard={() => handleDiscard(c.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!hasResults && !generating && !genError && (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50">
              <Sparkles className="size-6 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Describe your test scenario</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Enter a prompt above and click Generate. AI will create test case candidates you can review, edit, validate, and save.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-slate-50/80 px-5 py-3">
        <p className="text-[11px] text-slate-400 text-center">
          Candidates stay here until you <strong>Save to Library</strong>. Run Draft tests won&apos;t appear in your test case list.
        </p>
      </div>
    </>
  );

  if (inline) {
    return (
      <section
        id="ai-test-case-generator"
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        {content}
      </section>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[520px] max-w-[95vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {content}
      </div>
    </>
  );
}