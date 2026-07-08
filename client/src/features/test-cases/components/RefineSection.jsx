import { useState } from "react";
import { Wand2, RotateCcw, Check, ChevronDown, ChevronRight } from "lucide-react";
import { refineTestCase, applyRefinement } from "@/features/test-cases/api/testCasesApi";

export default function RefineSection({ tc, onApplied }) {
  const [prompt, setPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  async function handleRefine() {
    if (!prompt.trim()) return;
    setRefining(true);
    setError("");
    setSuggestion(null);
    setShowSteps(false);
    try {
      setSuggestion(await refineTestCase(tc.id, prompt.trim()));
    } catch (e) {
      setError(e?.message || "Failed to get AI suggestion.");
    } finally {
      setRefining(false);
    }
  }

  async function handleApply() {
    if (!suggestion) return;
    setApplying(true);
    setError("");
    try {
      await applyRefinement(tc.id, {
        title: suggestion.title,
        goal: suggestion.goal,
        steps: suggestion.steps,
        expectedResult: suggestion.expectedResult,
        promptText: prompt.trim(),
      });
      setSuggestion(null);
      setPrompt("");
      onApplied();
    } catch (e) {
      setError(e?.message || "Failed to apply changes.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 bg-violet-50/30 dark:border-violet-800/40 dark:bg-violet-950/20">
      <div className="flex items-center gap-2 border-b border-violet-100 px-4 py-3 dark:border-violet-800/40">
        <Wand2 className="size-3.5 text-violet-500" />
        <h2 className="text-xs font-semibold text-violet-700 dark:text-violet-300">Refine Goal with AI</h2>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Prompt input */}
        <div className="flex gap-2 items-end">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
            placeholder='e.g. "Add verification for error messages on failed login"'
            disabled={refining || applying}
            className="flex-1 rounded-lg border border-violet-200 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50 dark:border-violet-800/40"
          />
          <button
            onClick={handleRefine}
            disabled={!prompt.trim() || refining || applying}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refining ? (
              <><span className="size-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />Thinking…</>
            ) : (
              <><Wand2 className="size-3.5" />Suggest</>
            )}
          </button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Suggestion preview */}
        {suggestion && (
          <div className="overflow-hidden rounded-lg border border-violet-200 bg-card dark:border-violet-800/40">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-violet-100 bg-violet-50 px-3 py-2 dark:border-violet-800/40 dark:bg-violet-950/30">
              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-300">AI Suggestion</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSuggestion(null)}
                  disabled={applying}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <RotateCcw className="size-2.5" /> Discard
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {applying ? (
                    <><span className="size-2.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />Applying…</>
                  ) : (
                    <><Check className="size-2.5" />Apply</>
                  )}
                </button>
              </div>
            </div>

            {/* Goal diff */}
            <div className="divide-y divide-border">
              {suggestion.title !== tc.title && (
                <div className="px-3 py-2 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
                  <div className="text-xs text-muted-foreground line-through">{tc.title}</div>
                  <div className="text-xs font-medium text-foreground">{suggestion.title}</div>
                </div>
              )}
              <div className="px-3 py-2 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Goal</span>
                <div className="text-xs text-muted-foreground line-through leading-relaxed">{tc.goal}</div>
                <div className="text-xs text-foreground leading-relaxed">{suggestion.goal}</div>
              </div>

              {/* Steps — collapsed by default */}
              {suggestion.steps?.length > 0 && (
                <div className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setShowSteps((s) => !s)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showSteps ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    Test plan steps ({suggestion.steps.length})
                    <span className="text-[10px] text-muted-foreground/60">· for reference only</span>
                  </button>
                  {showSteps && (
                    <ol className="mt-2 space-y-1">
                      {suggestion.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                          {step.text}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
