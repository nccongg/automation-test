import { useState } from "react";
import { Wand2, RotateCcw, Pencil, Check, X } from "lucide-react";
import { refineTestCase, applyRefinement } from "@/features/test-cases/api/testCasesApi";

export default function RefineSection({ tc, onApplied }) {
  const [prompt, setPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  function openEdit() {
    setDraft({
      title: suggestion.title,
      goal: suggestion.goal,
      expectedResult: suggestion.expectedResult || "",
      steps: suggestion.steps.map((s, i) => ({ ...s, _key: i })),
    });
    setIsEditing(true);
  }

  function commitEdit() {
    const cleaned = {
      ...draft,
      steps: draft.steps
        .map((s, i) => ({ ...s, order: i + 1, text: s.text.trim() }))
        .filter((s) => s.text),
    };
    setSuggestion(cleaned);
    setIsEditing(false);
    setDraft(null);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(null);
  }

  function updateDraftStep(idx, value) {
    setDraft((d) => ({ ...d, steps: d.steps.map((s, i) => (i === idx ? { ...s, text: value } : s)) }));
  }

  function addStep() {
    setDraft((d) => ({
      ...d,
      steps: [...d.steps, { text: "", order: d.steps.length + 1, action: "custom", _key: Date.now() }],
    }));
  }

  function removeStep(idx) {
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx) }));
  }

  async function handleRefine() {
    if (!prompt.trim()) return;
    setRefining(true);
    setError("");
    setSuggestion(null);
    setIsEditing(false);
    setDraft(null);
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
    <section className="rounded-2xl border border-violet-200 bg-violet-50/40 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-violet-100">
        <Wand2 className="size-4 text-violet-500" />
        <h2 className="text-sm font-semibold text-violet-700">Refine with AI</h2>
        <span className="ml-auto text-xs text-violet-400">
          Describe what to change — AI will suggest a revised version
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRefine(); }}
            placeholder='"Add a step to verify error message when login fails" or "Make steps more detailed"'
            rows={3}
            disabled={refining || applying}
            className="flex-1 resize-none rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
          />
          <button
            onClick={handleRefine}
            disabled={!prompt.trim() || refining || applying}
            className="shrink-0 self-end flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refining ? (
              <><span className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />Thinking…</>
            ) : (
              <><Wand2 className="size-3.5" />Suggest</>
            )}
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {suggestion && (
          <div className="rounded-xl border border-violet-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-violet-100 bg-violet-50">
              <p className="text-xs font-semibold text-violet-600">AI Suggestion — review before applying</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSuggestion(null)}
                  disabled={applying}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="size-3" /> Discard
                </button>
                {!isEditing ? (
                  <button
                    onClick={openEdit}
                    disabled={applying}
                    className="flex items-center gap-1 rounded-lg border border-violet-300 bg-white px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-50 transition-colors"
                  >
                    <Pencil className="size-3" /> Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <X className="size-3" /> Cancel
                    </button>
                    <button
                      onClick={commitEdit}
                      className="flex items-center gap-1 rounded-lg border border-violet-300 bg-white px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                    >
                      <Check className="size-3" /> Done editing
                    </button>
                  </>
                )}
                {!isEditing && (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {applying ? (
                      <><span className="size-2.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />Applying…</>
                    ) : (
                      <><Check className="size-3" /> Apply changes</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {!isEditing && (
              <div className="divide-y divide-slate-100">
                <div className="px-4 py-3 flex gap-3">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-0.5">Title</span>
                  <p className="text-sm font-medium text-slate-800">{suggestion.title}</p>
                </div>
                <div className="px-4 py-3 flex gap-3">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-0.5">Goal</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{suggestion.goal}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-slate-400 mb-3">Steps ({suggestion.steps.length})</p>
                  <ol className="space-y-2">
                    {suggestion.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-600">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed">{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                {suggestion.expectedResult && (
                  <div className="px-4 py-3 flex gap-3 bg-emerald-50/60">
                    <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-0.5">Expected</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{suggestion.expectedResult}</p>
                  </div>
                )}
              </div>
            )}

            {isEditing && draft && (
              <div className="divide-y divide-slate-100">
                <div className="px-4 py-3 flex gap-3 items-start">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-2">Title</span>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    className="flex-1 rounded-lg border border-violet-200 px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div className="px-4 py-3 flex gap-3 items-start">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-2">Goal</span>
                  <textarea
                    value={draft.goal}
                    onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
                    rows={2}
                    className="flex-1 resize-none rounded-lg border border-violet-200 px-3 py-1.5 text-sm text-slate-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-400">Steps ({draft.steps.length})</p>
                    <button
                      onClick={addStep}
                      className="flex items-center gap-1 rounded-lg border border-violet-200 px-2 py-0.5 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                    >
                      + Add step
                    </button>
                  </div>
                  <ol className="space-y-2">
                    {draft.steps.map((step, i) => (
                      <li key={step._key ?? i} className="flex items-start gap-2">
                        <span className="mt-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-600">
                          {i + 1}
                        </span>
                        <input
                          value={step.text}
                          onChange={(e) => updateDraftStep(i, e.target.value)}
                          placeholder={`Step ${i + 1}`}
                          className="flex-1 rounded-lg border border-violet-200 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
                        />
                        <button
                          onClick={() => removeStep(i)}
                          className="mt-1.5 shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="px-4 py-3 flex gap-3 items-start">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-2">Expected</span>
                  <input
                    value={draft.expectedResult}
                    onChange={(e) => setDraft((d) => ({ ...d, expectedResult: e.target.value }))}
                    placeholder="Expected result (optional)"
                    className="flex-1 rounded-lg border border-violet-200 px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
