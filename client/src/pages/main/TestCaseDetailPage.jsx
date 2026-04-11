import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  Play,
  Target,
  Hash,
  Layers,
  Sparkles,
  Lightbulb,
  Pencil,
  Check,
  X,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { getTestCaseById, getTestCaseRuns, updateTestCase, refineTestCase, applyRefinement } from "@/features/test-cases/api/testCasesApi";
import { getTestRunDetail, analyzeTestRun } from "@/features/test-results/api/testResultsApi";
import { parseAgentError } from "@/shared/utils/parseAgentError";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

function duration(s, f) {
  if (!s || !f) return null;
  const ms = new Date(f) - new Date(s);
  if (ms < 0) return null;
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  return m > 0 ? `${m}m ${sec % 60}s` : `${sec}s`;
}

const STATUS_STYLE = {
  draft:    "bg-slate-100 text-slate-600",
  ready:    "bg-emerald-100 text-emerald-700",
  archived: "bg-amber-100 text-amber-700",
};

const VERDICT_STRIPE = {
  pass:  "border-l-emerald-400",
  fail:  "border-l-red-400",
  error: "border-l-orange-400",
};
const VERDICT_BG = {
  pass:  "bg-emerald-50/40",
  fail:  "bg-red-50/40",
  error: "bg-orange-50/20",
};
const VERDICT_BADGE = {
  pass:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  fail:  "bg-red-100 text-red-700 border-red-200",
  error: "bg-orange-100 text-orange-700 border-orange-200",
};
const VERDICT_ICON = {
  pass:  <CheckCircle2 className="size-4 text-emerald-500" />,
  fail:  <XCircle className="size-4 text-red-500" />,
  error: <AlertTriangle className="size-4 text-orange-500" />,
};

/* ─── Step ────────────────────────────────────────────────────────────── */

const ERROR_STYLE = {
  "Invalid API Key":       "bg-red-50 border-red-200 text-red-700",
  "Rate Limit Exceeded":   "bg-orange-50 border-orange-200 text-orange-700",
  "Authentication Failed": "bg-red-50 border-red-200 text-red-700",
  "Permission Denied":     "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Not Found":             "bg-slate-50 border-slate-200 text-slate-600",
  "Invalid Request":       "bg-orange-50 border-orange-200 text-orange-700",
  "Server Error":          "bg-red-50 border-red-200 text-red-700",
  "Timeout":               "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Connection Error":      "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Element Not Found":     "bg-orange-50 border-orange-200 text-orange-700",
  "Navigation Failed":     "bg-orange-50 border-orange-200 text-orange-700",
};

function StepErrorMessage({ raw }) {
  const parsed = parseAgentError(raw);
  if (parsed) {
    const cls = ERROR_STYLE[parsed.category] ?? "bg-slate-50 border-slate-200 text-slate-600";
    return (
      <div className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-xs ${cls}`}>
        <span className="font-semibold">{parsed.category}</span>
        <span className="text-slate-600">{parsed.brief}</span>
      </div>
    );
  }
  return <p className="text-xs text-slate-500 break-all"><span className="text-slate-400">Message: </span>{raw}</p>;
}

function getStepNodeStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "passed" || s === "success" || s === "completed") return "bg-emerald-500 ring-emerald-200";
  if (s === "failed" || s === "error") return "bg-red-500 ring-red-200";
  if (s === "running") return "bg-blue-500 ring-blue-200";
  return "bg-slate-300 ring-slate-100";
}
function getStepTagStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "passed" || s === "success" || s === "completed") return "bg-emerald-100 text-emerald-700";
  if (s === "failed" || s === "error") return "bg-red-100 text-red-700";
  if (s === "running") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-500";
}

function StepItem({ step, stepIndex, isLast }) {
  return (
    <div className="relative flex gap-3">
      {!isLast && <div className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-100" />}
      <div className="relative z-10 mt-0.5 shrink-0">
        <div className={`size-7 rounded-full ring-4 ${getStepNodeStyle(step.status)} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>
      <div className="mb-4 flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">{step.title}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStepTagStyle(step.status)}`}>
            {step.status}
          </span>
        </div>
        {(step.action || step.message || step.currentUrl) && (
          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
            {step.action && <p><span className="text-slate-400">Action: </span>{step.action}</p>}
            {step.message && <StepErrorMessage raw={step.message} />}
            {step.currentUrl && (
              <p>
                <span className="text-slate-400">URL: </span>
                <a href={step.currentUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">
                  {step.currentUrl}
                </a>
              </p>
            )}
          </div>
        )}
        {step.thoughtText && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-slate-400">Thought: </span>{step.thoughtText}
          </div>
        )}
        {step.extractedContent && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-amber-500">Extracted: </span>{step.extractedContent}
          </div>
        )}
        {step.screenshots?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.screenshots.map((shot) =>
              shot.imageUrl ? (
                <a key={shot.id} href={shot.imageUrl} target="_blank" rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <img src={shot.imageUrl} alt={`Step ${step.stepNo}`}
                    className="h-28 w-44 object-cover transition-opacity group-hover:opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 text-xs font-medium px-2 py-1 rounded-md transition-opacity">View</span>
                  </div>
                </a>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── AI Analysis ─────────────────────────────────────────────────────── */

function AiAnalysis({ runId, isLive }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setAnalyzing(true); setErr("");
    try { setAnalysis(await analyzeTestRun(runId)); }
    catch (e) { setErr(e?.message || "Failed"); }
    finally { setAnalyzing(false); }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Sparkles className="size-3.5 text-violet-400" /> AI Analysis
        </div>
        {!analysis && (
          <button onClick={run} disabled={analyzing || isLive}
            className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 transition-colors">
            {analyzing ? <><span className="size-2.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" /> Analyzing…</> : <><Sparkles className="size-3" />{isLive ? "Run first" : "Generate"}</>}
          </button>
        )}
        {analysis && (
          <button onClick={() => { setAnalysis(null); setErr(""); }} className="text-xs text-slate-400 hover:text-slate-600">Regenerate</button>
        )}
      </div>
      <div className="px-4 py-3">
        {!analysis && !analyzing && !err && (
          <p className="text-xs text-slate-400">{isLive ? "Available once run completes." : "Get AI-powered insights for this run."}</p>
        )}
        {err && <p className="text-xs text-red-500">{err}</p>}
        {analysis && (
          <div className="space-y-3">
            <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-1">Conclusion</p>
              <p className="text-xs text-slate-700 leading-relaxed">{analysis.conclusion}</p>
            </div>
            {analysis.suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Lightbulb className="size-3 text-amber-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Suggestions</p>
                </div>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-0.5 shrink-0 size-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[9px] font-bold text-amber-600">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Run Row ─────────────────────────────────────────────────────────── */

function RunRow({ run, projectId, index }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const isLive = run.status === "queued" || run.status === "running";
  const stripe = VERDICT_STRIPE[run.verdict] ?? "border-l-slate-200";
  const bg = VERDICT_BG[run.verdict] ?? "";

  async function toggle() {
    if (!expanded && !detail) {
      setLoading(true);
      try { setDetail(await getTestRunDetail(run.id)); }
      finally { setLoading(false); }
    }
    setExpanded((p) => !p);
  }

  const dur = duration(run.startedAt, run.finishedAt);

  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden shadow-sm border-l-4 ${stripe} ${bg}`}>
      <button onClick={toggle} className="w-full px-5 py-4 text-left hover:bg-black/[0.02] transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400 tabular-nums">
              #{index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isLive && (
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
                  </span>
                )}
                <p className="text-sm font-semibold text-slate-700">Run #{run.id}</p>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {fmt(run.createdAt)}
                {dur ? ` · ${dur}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {run.verdict ? (
              <div className="flex items-center gap-1.5">
                {VERDICT_ICON[run.verdict]}
                <Badge className={`capitalize border text-xs ${VERDICT_BADGE[run.verdict] ?? "bg-slate-100 text-slate-600"}`}>
                  {run.verdict}
                </Badge>
              </div>
            ) : isLive ? (
              <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                <Clock className="size-3.5 animate-pulse" /> Running
              </span>
            ) : null}
            <div className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
              {expanded ? "Hide" : "Steps"}
              <ChevronDown className={`size-3.5 ml-0.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/test-runs/${run.id}`); }}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors"
            >
              Detail →
            </button>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <LoadingSpinner size="sm" /> Loading steps…
            </div>
          ) : detail?.steps?.length ? (
            <>
              <p className="mb-4 text-xs font-medium text-slate-400">{detail.steps.length} step{detail.steps.length !== 1 ? "s" : ""} recorded</p>
              <div className="pl-1">
                {detail.steps.map((step, i) => (
                  <StepItem key={step.id} step={step} stepIndex={i} isLast={i === detail.steps.length - 1} />
                ))}
              </div>
              <AiAnalysis runId={run.id} isLive={isLive} />
            </>
          ) : isLive ? (
            <div className="flex items-center gap-2 text-sm text-blue-500 py-2">
              <LoadingSpinner size="sm" /> Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-slate-400">No steps recorded for this run.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Refine with AI ──────────────────────────────────────────────────── */

function RefineSection({ tc, onApplied }) {
  const [prompt, setPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");

  // edit-mode draft mirrors suggestion
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
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => i === idx ? { ...s, text: value } : s),
    }));
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
    setRefining(true); setError(""); setSuggestion(null); setIsEditing(false); setDraft(null);
    try {
      const result = await refineTestCase(tc.id, prompt.trim());
      setSuggestion(result);
    } catch (e) {
      setError(e?.message || "Failed to get AI suggestion.");
    } finally {
      setRefining(false);
    }
  }

  async function handleApply() {
    if (!suggestion) return;
    setApplying(true); setError("");
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
        <span className="ml-auto text-xs text-violet-400">Describe what to change — AI will suggest a revised version</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Prompt */}
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRefine(); }}
            placeholder='e.g. "Add a step to verify error message when login fails" or "Make steps more detailed"'
            rows={3}
            disabled={refining || applying}
            className="flex-1 resize-none rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
          />
          <button
            onClick={handleRefine}
            disabled={!prompt.trim() || refining || applying}
            className="shrink-0 self-end flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refining
              ? <><span className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Thinking…</>
              : <><Wand2 className="size-3.5" /> Suggest</>}
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Suggestion card */}
        {suggestion && (
          <div className="rounded-xl border border-violet-200 bg-white overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-violet-100 bg-violet-50">
              <p className="text-xs font-semibold text-violet-600">
                AI Suggestion — review before applying
              </p>
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
                    {applying
                      ? <><span className="size-2.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Applying…</>
                      : <><Check className="size-3" /> Apply changes</>}
                  </button>
                )}
              </div>
            </div>

            {/* View mode */}
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

            {/* Edit mode */}
            {isEditing && draft && (
              <div className="divide-y divide-slate-100">
                {/* Title */}
                <div className="px-4 py-3 flex gap-3 items-start">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-2">Title</span>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    className="flex-1 rounded-lg border border-violet-200 px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>

                {/* Goal */}
                <div className="px-4 py-3 flex gap-3 items-start">
                  <span className="shrink-0 text-xs font-semibold text-slate-400 w-14 pt-2">Goal</span>
                  <textarea
                    value={draft.goal}
                    onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
                    rows={2}
                    className="flex-1 resize-none rounded-lg border border-violet-200 px-3 py-1.5 text-sm text-slate-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>

                {/* Steps */}
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
                          title="Remove step"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Expected result */}
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

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function TestCaseDetailPage() {
  const { projectId, testCaseId } = useParams();
  const navigate = useNavigate();

  const [tc, setTc] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Inline edit state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const goalRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [caseData, runsData] = await Promise.all([
        getTestCaseById(testCaseId),
        getTestCaseRuns(testCaseId),
      ]);
      setTc(caseData);
      setRuns(runsData);
    } catch (e) {
      setError(e?.message || "Failed to load test case.");
    } finally {
      setLoading(false);
    }
  }, [testCaseId]);

  useEffect(() => { load(); }, [load]);

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
    } finally { setSaving(false); setEditingTitle(false); }
  }

  async function saveGoal() {
    if (draftGoal === (tc.goal ?? "")) { setEditingGoal(false); return; }
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: tc.title, goal: draftGoal.trim(), status: tc.status });
      setTc((prev) => ({ ...prev, goal: draftGoal.trim() }));
    } finally { setSaving(false); setEditingGoal(false); }
  }

  async function saveStatus(newStatus) {
    if (newStatus === tc.status) return;
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: tc.title, goal: tc.goal, status: newStatus });
      setTc((prev) => ({ ...prev, status: newStatus }));
    } finally { setSaving(false); }
  }

  const passCount = runs.filter((r) => r.verdict === "pass").length;
  const failCount = runs.filter((r) => r.verdict === "fail").length;
  const passRate  = runs.length > 0 ? Math.round((passCount / runs.length) * 100) : null;

  return (
    <div className="space-y-8">
      {/* Back */}
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
              {/* Status selector */}
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
                {tc.steps?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Layers className="size-3" /> {tc.steps.length} steps
                  </span>
                )}
              </div>

              {/* Editable title */}
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

              {/* Editable goal */}
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
                  <p className="text-sm text-slate-500 leading-relaxed">{tc.goal || <span className="italic text-slate-300">Add a goal…</span>}</p>
                  <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400 mt-1">
              <Hash className="size-3" /> {tc.id}
            </span>
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
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                    style={{ width: `${passRate}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-1 text-2xl font-bold text-slate-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Test Steps */}
      {tc.steps?.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Test Steps ({tc.steps.length})
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
            {tc.steps.map((step, i) => (
              <div key={step.id ?? i} className="flex items-start gap-4 px-5 py-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-500">
                  {step.order ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {step.description || step.text || `Step ${i + 1}`}
                  </p>
                  {step.expectedResult && (
                    <p className="mt-1 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">Expected: </span>
                      {step.expectedResult}
                    </p>
                  )}
                </div>
                {step.action && step.action !== "custom" && (
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {step.action}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Refine with AI */}
      <RefineSection tc={tc} onApplied={load} />

      {/* Run history */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Run History ({runs.length})
          </h2>
          {runs.length > 0 && failCount > 0 && (
            <span className="text-xs text-slate-400">{failCount} failed</span>
          )}
        </div>

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
      </section>
    </div>
  );
}
