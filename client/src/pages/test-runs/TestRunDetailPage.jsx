import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert, Sparkles, Lightbulb, Link, Eye, EyeOff, ShieldCheck, Type, Hash } from "lucide-react";
import { getTestRunDetail, analyzeTestRun } from "@/features/test-results/api/testResultsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import ScreenshotList from "@/shared/components/common/ScreenshotList";
import { Badge } from "@/components/ui/badge";
import { parseAgentError } from "@/shared/utils/parseAgentError";

const FAILURE_REASON_META = {
  assertion_mismatch:  { label: "Assertion mismatch", color: "bg-red-500/15 text-red-400" },
  element_not_found:   { label: "Element not found",  color: "bg-orange-500/15 text-orange-400" },
  element_not_visible: { label: "Not visible",        color: "bg-orange-500/15 text-orange-400" },
  timeout:             { label: "Timeout",             color: "bg-yellow-500/15 text-yellow-500" },
  navigation_failed:   { label: "Navigation failed",  color: "bg-red-500/15 text-red-400" },
  value_not_set:       { label: "Value not set",       color: "bg-amber-500/15 text-amber-500" },
  selector_invalid:    { label: "Invalid selector",   color: "bg-purple-500/15 text-purple-400" },
  unexpected_error:    { label: "Unexpected error",   color: "bg-muted text-muted-foreground" },
};

function FailureReasonBadge({ reason }) {
  if (!reason) return null;
  const meta = FAILURE_REASON_META[reason] ?? { label: reason, color: "bg-slate-100 text-slate-500" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function getStepStyle(status) {
  const s = (status || "").toLowerCase();
  if (s === "passed" || s === "success" || s === "completed")
    return { node: "bg-emerald-500 ring-emerald-500/20", tag: "bg-emerald-500/15 text-emerald-500" };
  if (s === "failed" || s === "error")
    return { node: "bg-red-500 ring-red-500/20", tag: "bg-red-500/15 text-red-400" };
  if (s === "running")
    return { node: "bg-blue-500 ring-blue-500/20", tag: "bg-blue-500/15 text-blue-400" };
  return { node: "bg-muted-foreground/40 ring-border", tag: "bg-muted text-muted-foreground" };
}

const ERROR_CATEGORY_STYLE = {
  "Invalid API Key":       "bg-red-500/10 border-red-500/20 text-red-400",
  "Rate Limit Exceeded":   "bg-orange-500/10 border-orange-500/20 text-orange-400",
  "Authentication Failed": "bg-red-500/10 border-red-500/20 text-red-400",
  "Permission Denied":     "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  "Not Found":             "bg-muted border-border text-muted-foreground",
  "Invalid Request":       "bg-orange-500/10 border-orange-500/20 text-orange-400",
  "Server Error":          "bg-red-500/10 border-red-500/20 text-red-400",
  "Timeout":               "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  "Connection Error":      "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  "Element Not Found":     "bg-orange-500/10 border-orange-500/20 text-orange-400",
  "Navigation Failed":     "bg-orange-500/10 border-orange-500/20 text-orange-400",
};

const ANCHOR_TYPE_META = {
  url_contains:       { icon: Link,       label: "URL contains" },
  url_changed:        { icon: Link,       label: "URL changed" },
  text_visible:       { icon: Eye,        label: "Text visible" },
  text_not_visible:   { icon: EyeOff,     label: "Text hidden" },
  no_error_message:   { icon: ShieldCheck,label: "No errors" },
  field_value_equals: { icon: Type,       label: "Field value" },
};

function AnchorResultsPanel({ anchorResults }) {
  if (!anchorResults || anchorResults.length === 0) return null;

  const hasFailed = anchorResults.some((a) => !a.passed && a.required);
  const hasWarning = anchorResults.some((a) => !a.passed && !a.required);

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2.5 ${
      hasFailed
        ? "bg-red-500/8 border-red-500/15"
        : hasWarning
          ? "bg-amber-500/8 border-amber-500/15"
          : "bg-emerald-500/8 border-emerald-500/15"
    }`}>
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-wide ${
        hasFailed ? "text-red-400" : hasWarning ? "text-amber-500" : "text-emerald-500"
      }`}>
        State Anchors
      </p>
      <div className="flex flex-col gap-1.5">
        {anchorResults.map((anchor, i) => {
          const meta = ANCHOR_TYPE_META[anchor.type] ?? { icon: Hash, label: anchor.type };
          const Icon = meta.icon;
          return (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 ${
                anchor.passed
                  ? "bg-emerald-500/15 text-emerald-500"
                  : anchor.required
                    ? "bg-red-500/15 text-red-400"
                    : "bg-amber-500/15 text-amber-500"
              }`}>
                {anchor.passed
                  ? <CheckCircle2 size={11} />
                  : <XCircle size={11} />}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  <Icon size={9} className="mr-0.5 inline-block" />
                  {meta.label}
                  {!anchor.required && (
                    <span className="ml-1 text-muted-foreground/60">(optional)</span>
                  )}
                </span>
                {anchor.value && (
                  <span className="ml-1.5 text-[10px] font-mono text-foreground">
                    "{anchor.value}"
                  </span>
                )}
                {!anchor.passed && anchor.message && (
                  <p className="mt-0.5 text-[10px] text-red-400">{anchor.message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepErrorMessage({ raw }) {
  const parsed = parseAgentError(raw);
  if (parsed) {
    const style = ERROR_CATEGORY_STYLE[parsed.category] ?? "bg-muted border-border text-muted-foreground";
    return (
      <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs ${style}`}>
        <span className="font-semibold">{parsed.category}</span>
        <span className="text-muted-foreground">{parsed.brief}</span>
      </div>
    );
  }
  return (
    <p className="text-xs text-muted-foreground break-all">
      <span className="text-muted-foreground/60">Message: </span>{raw}
    </p>
  );
}

function StepItem({ step, stepIndex, isLast }) {
  const style = getStepStyle(step.status);

  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <div className="absolute left-[13px] top-7 h-full w-0.5 bg-border" />
      )}
      <div className="relative z-10 mt-0.5 flex-shrink-0">
        <div className={`h-7 w-7 rounded-full ring-4 ${style.node} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>
      <div className="mb-4 flex-1 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{step.title}</p>
          <div className="flex items-center gap-1.5">
            {step.failureReason && <FailureReasonBadge reason={step.failureReason} />}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
              {step.status}
            </span>
          </div>
        </div>
        {(step.action || step.message || step.currentUrl) && (
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {step.action && (
              <p><span className="text-muted-foreground/60">Action: </span>{step.action}</p>
            )}
            {step.message && <StepErrorMessage raw={step.message} />}
            {step.currentUrl && (
              <p>
                <span className="text-muted-foreground/60">URL: </span>
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
          <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-muted-foreground/60">Thought: </span>
            {step.thoughtText}
          </div>
        )}
        {step.extractedContent && (
          <div className="mt-2 rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            <span className="font-medium text-amber-500">Extracted: </span>
            {step.extractedContent}
          </div>
        )}
        <AnchorResultsPanel anchorResults={step.anchorResults} />
        <ScreenshotList screenshots={step.screenshots} stepNo={step.stepNo} />
      </div>
    </div>
  );
}

const VERDICT_BADGE = {
  pass:              "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  pass_with_warning: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  fail:              "bg-red-500/15 text-red-400 border-red-500/20",
  error:             "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

const VERDICT_LABEL = {
  pass:              "Pass",
  pass_with_warning: "Pass (no assertion)",
  fail:              "Fail",
  error:             "Error",
};

const VERDICT_ICON = {
  pass:              <CheckCircle2 className="size-5 text-emerald-500" />,
  pass_with_warning: <ShieldAlert className="size-5 text-amber-500" />,
  fail:              <XCircle className="size-5 text-red-500" />,
  error:             <AlertTriangle className="size-5 text-orange-500" />,
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
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-foreground">AI Analysis</h2>
        </div>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing || isLive}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500/8 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? (
              <>
                <span className="size-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
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
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
          <p className="text-sm text-red-400">{analysisError}</p>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="rounded-lg bg-brand-500/8 border border-brand-500/15 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-1.5">Conclusion</p>
              <p className="text-sm text-foreground leading-relaxed">{analysis.conclusion}</p>
            </div>

            {analysis.suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="size-3.5 text-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggestions</p>
                </div>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex-shrink-0 size-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500">
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
    let pollTimer = null;

    async function fetchDetail() {
      try {
        const data = await getTestRunDetail(runId);
        if (!mounted) return;
        setDetail(data);
        setLoading(false);

        const status = data?.run?.status;
        const stillLive = status === "queued" || status === "running";
        if (stillLive) {
          pollTimer = setTimeout(fetchDetail, 3000);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load test run.");
        setLoading(false);
      }
    }

    setLoading(true);
    fetchDetail();

    return () => {
      mounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
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
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {VERDICT_ICON[verdict] ?? <div className="size-5 rounded-full border-2 border-border" />}
            <div>
              {run?.testCaseId || run?.test_case_id ? (
                <button
                  onClick={() => navigate(`/projects/${projectId}/test-cases/${run.testCaseId ?? run.test_case_id}`)}
                  className="text-lg font-semibold hover:text-brand-400 transition-colors text-left"
                >
                  {run?.testCaseTitle ?? run?.test_case_title ?? `Run #${runId}`}
                </button>
              ) : (
                <h1 className="text-lg font-semibold">
                  {run?.testCaseTitle ?? run?.test_case_title ?? `Run #${runId}`}
                </h1>
              )}
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
              <div className="flex items-center gap-1.5 rounded-lg border bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-500">
                <Clock className="size-4 animate-pulse" />
                Running
              </div>
            )}
            {verdict && (
              <Badge className={`border ${VERDICT_BADGE[verdict] ?? "bg-muted text-muted-foreground"}`}>
                {VERDICT_LABEL[verdict] ?? verdict}
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
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
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
