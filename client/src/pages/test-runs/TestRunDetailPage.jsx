import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert, Sparkles, Lightbulb } from "lucide-react";
import { getTestRunDetail, analyzeTestRun } from "@/features/test-results/api/testResultsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorState from "@/shared/components/common/ErrorState";
import StepResult from "@/shared/components/common/StepResult";
import AiAnalysisSection from "@/shared/components/common/AiAnalysisSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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


export default function TestRunDetailPage() {
  const { projectId, runId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(e || new Error("Failed to load test run."));
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
    return <ErrorState error={error} />;
  }

  const run = detail?.run;
  const steps = detail?.steps ?? [];
  const isLive = run?.status === "queued" || run?.status === "running";
  const verdict = run?.verdict;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {VERDICT_ICON[verdict] ?? <div className="size-5 rounded-full border-2 border-border" />}
            <div>
              {run?.testCaseId || run?.test_case_id ? (
                <button
                  onClick={() => navigate(`/projects/${projectId}/test-cases/${run.testCaseId ?? run.test_case_id}`)}
                  className="cursor-pointer text-left text-lg font-semibold hover:text-brand-400 transition-colors"
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
      <AiAnalysisSection
        onAnalyze={() => analyzeTestRun(runId)}
        isLive={isLive}
        initialAnalysis={detail?.analysis}
      />

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
              <StepResult
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
