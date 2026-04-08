import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, Lightbulb } from "lucide-react";
import { getTestRunDetail, analyzeTestRun } from "@/features/test-results/api/testResultsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import { Badge } from "@/components/ui/badge";
import { parseAgentError } from "@/shared/utils/parseAgentError";

function getStepStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "passed" || s === "success" || s === "completed")
    return { node: "bg-emerald-500 ring-emerald-200", tag: "bg-emerald-100 text-emerald-700" };
  if (s === "failed" || s === "error")
    return { node: "bg-red-500 ring-red-200", tag: "bg-red-100 text-red-700" };
  if (s === "running")
    return { node: "bg-blue-500 ring-blue-200", tag: "bg-blue-100 text-blue-700" };
  return { node: "bg-slate-300 ring-slate-100", tag: "bg-slate-100 text-slate-500" };
}

const ERROR_CATEGORY_STYLE = {
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
    const style = ERROR_CATEGORY_STYLE[parsed.category] ?? "bg-slate-50 border-slate-200 text-slate-600";
    return (
      <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs ${style}`}>
        <span className="font-semibold">{parsed.category}</span>
        <span className="text-slate-600">{parsed.brief}</span>
      </div>
    );
  }
  // Fallback: raw message, but cap it sensibly
  return (
    <p className="text-xs text-slate-500 break-all">
      <span className="text-slate-400">Message: </span>{raw}
    </p>
  );
}

function StepItem({ step, stepIndex, isLast }) {
  const style = getStepStyle(step.status);

  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-100" />
      )}
      <div className="relative z-10 mt-0.5 flex-shrink-0">
        <div className={`h-7 w-7 rounded-full ring-4 ${style.node} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>
      <div className="mb-4 flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">{step.title}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
            {step.status}
          </span>
        </div>
        {(step.action || step.message || step.currentUrl) && (
          <div className="mt-2 space-y-1.5 text-sm text-slate-600">
            {step.action && (
              <p><span className="text-slate-400">Action: </span>{step.action}</p>
            )}
            {step.message && <StepErrorMessage raw={step.message} />}
            {step.currentUrl && (
              <p>
                <span className="text-slate-400">URL: </span>
                <a
                  href={step.currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {step.currentUrl}
                </a>
              </p>
            )}
          </div>
        )}
        {step.thoughtText && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-slate-400">Thought: </span>
            {step.thoughtText}
          </div>
        )}
        {step.extractedContent && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-amber-500">Extracted: </span>
            {step.extractedContent}
          </div>
        )}
        {step.screenshots?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.screenshots.map((shot) =>
              shot.imageUrl ? (
                <a
                  key={shot.id}
                  href={shot.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-lg border border-slate-200 shadow-sm"
                >
                  <img
                    src={shot.imageUrl}
                    alt={`Step ${step.stepNo} screenshot`}
                    className="h-28 w-44 object-cover transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 text-xs font-medium px-2 py-1 rounded-md transition-opacity">
                      View
                    </span>
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

const VERDICT_BADGE = {
  pass:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  fail:  "bg-red-100 text-red-700 border-red-200",
  error: "bg-orange-100 text-orange-700 border-orange-200",
};

const VERDICT_ICON = {
  pass:  <CheckCircle2 className="size-5 text-emerald-500" />,
  fail:  <XCircle className="size-5 text-red-500" />,
  error: <AlertTriangle className="size-5 text-orange-500" />,
};

function AiAnalysisSection({ runId, isLive }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const result = await analyzeTestRun(runId);
      setAnalysis(result);
    } catch (e) {
      setAnalysisError(e?.message || "Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-700">AI Analysis</h2>
        </div>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing || isLive}
            className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? (
              <>
                <span className="size-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                {isLive ? "Run must complete first" : "Generate Analysis"}
              </>
            )}
          </button>
        )}
        {analysis && (
          <button
            onClick={() => { setAnalysis(null); setAnalysisError(""); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {!analysis && !analyzing && !analysisError && (
          <p className="text-sm text-muted-foreground">
            {isLive
              ? "Analysis will be available once the run completes."
              : "Click \"Generate Analysis\" to get an AI-powered conclusion and actionable suggestions."}
          </p>
        )}

        {analysisError && (
          <p className="text-sm text-red-500">{analysisError}</p>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="rounded-lg bg-violet-50 border border-violet-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1.5">Conclusion</p>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.conclusion}</p>
            </div>

            {analysis.suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="size-3.5 text-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Suggestions</p>
                </div>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-600">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function TestRunDetailPage() {
  const { projectId, runId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getTestRunDetail(runId)
      .then((data) => {
        if (!mounted) return;
        setDetail(data);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load test run.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [runId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading run details..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={() => window.history.back()} />;
  }

  const run = detail?.run;
  const steps = detail?.steps ?? [];
  const isLive = run?.status === "queued" || run?.status === "running";
  const verdict = run?.verdict;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/projects/${projectId}/test-runs`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Test Runs
      </button>

      {/* Header */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {VERDICT_ICON[verdict] ?? <div className="size-5 rounded-full border-2 border-slate-300" />}
            <div>
              <h1 className="text-lg font-semibold">
                {run?.test_case_title || `Run #${runId}`}
              </h1>
              <p className="text-sm text-muted-foreground">
                Run #{runId}
                {run?.created_at
                  ? ` · ${new Date(run.created_at).toLocaleString()}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1.5 rounded-lg border bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700">
                <Clock className="size-4 animate-pulse" />
                Running
              </div>
            )}
            {verdict && (
              <Badge className={`capitalize border ${VERDICT_BADGE[verdict] ?? "bg-slate-100 text-slate-600"}`}>
                {verdict}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <AiAnalysisSection runId={runId} isLive={isLive} />

      {/* Steps */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Steps ({steps.length})
        </h2>

        {steps.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
            {isLive ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner size="sm" />
                Waiting for steps...
              </div>
            ) : (
              "No steps recorded for this run."
            )}
          </div>
        ) : (
          <div className="pl-1">
            {steps.map((step, i) => (
              <StepItem
                key={step.id}
                step={step}
                stepIndex={i}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
