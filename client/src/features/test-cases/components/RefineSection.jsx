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
    <div className="rounded-xl border border-violet-200 bg-violet-50/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100">
        <Wand2 className="size-3.5 text-violet-500" />
        <h2 className="text-xs font-semibold text-violet-700">Refine Goal with AI</h2>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Prompt input */}
        <div className="flex gap-2 items-end">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
            placeholder='e.g. "Add verification for error messages on failed login"'
            disabled={refining || applying}
            className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
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
          <div className="rounded-lg border border-violet-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-violet-50 border-b border-violet-100">
              <span className="text-[11px] font-semibold text-violet-600">AI Suggestion</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSuggestion(null)}
                  disabled={applying}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-colors"
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
            <div className="divide-y divide-slate-100">
              {suggestion.title !== tc.title && (
                <div className="px-3 py-2 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Title</span>
                  <div className="text-xs line-through text-slate-400">{tc.title}</div>
                  <div className="text-xs font-medium text-slate-800">{suggestion.title}</div>
                </div>
              )}
              <div className="px-3 py-2 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Goal</span>
                <div className="text-xs text-slate-400 line-through leading-relaxed">{tc.goal}</div>
                <div className="text-xs text-slate-700 leading-relaxed">{suggestion.goal}</div>
              </div>

              {/* Steps — collapsed by default */}
              {suggestion.steps?.length > 0 && (
                <div className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setShowSteps((s) => !s)}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSteps ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    Test plan steps ({suggestion.steps.length})
                    <span className="text-[10px] text-slate-300">· for reference only</span>
                  </button>
                  {showSteps && (
                    <ol className="mt-2 space-y-1">
                      {suggestion.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-400">
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
