import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Clock } from "lucide-react";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { getTestRunDetail } from "@/features/test-results/api/testResultsApi";
import { fmt, duration } from "../utils/testCaseUtils";
import { VERDICT_LABEL } from "../constants/styles.jsx";
import StepResult from "@/shared/components/common/StepResult";
import AiAnalysis from "./AiAnalysis";

const FAILURE_REASON_LABEL = {
  element_not_found:  "Element not found",
  timeout:            "Timed out",
  navigation_failed:  "Navigation failed",
  selector_invalid:   "Invalid selector",
  assertion_mismatch: "Assertion failed",
  value_not_set:      "Value not set",
  unexpected_error:   "Unexpected error",
};

function buildFailureHint(run) {
  const stepNo = run.failedStepNo ?? null;
  const reason = run.failureReason ? (FAILURE_REASON_LABEL[run.failureReason] ?? run.failureReason) : null;
  const msg = run.errorMessage ?? null;
  if (stepNo && reason) return `↳ Step ${stepNo} — ${reason}`;
  if (stepNo && msg)    return `↳ Step ${stepNo} — ${msg.slice(0, 60)}${msg.length > 60 ? "…" : ""}`;
  if (reason)           return `↳ ${reason}`;
  if (msg)              return `↳ ${msg.slice(0, 80)}${msg.length > 80 ? "…" : ""}`;
  return "↳ Expand for details";
}

const VERDICT_CLS = {
  pass:              "border-success text-success",
  pass_with_warning: "border-amber-500 text-amber-500",
  fail:              "border-destructive text-destructive",
  error:             "border-orange-500 text-orange-500",
};

const STATUS_CHIP_CLASS =
  "inline-flex h-6 w-[72px] items-center justify-center rounded-[6px] border px-2 text-[11px] font-normal";

export default function RunRow({ run, projectId, index }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);

  const isLive = run.status === "queued" || run.status === "running";

  useEffect(() => {
    if (run.status !== "running" || !run.startedAt) return;
    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [run.status, run.startedAt]);

  async function toggle() {
    if (!expanded && !detail) {
      setLoading(true);
      try { setDetail(await getTestRunDetail(run.id)); }
      finally { setLoading(false); }
    }
    setExpanded((p) => !p);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  }

  const dur    = duration(run.startedAt, run.finishedAt);
  const dateText = `${fmt(run.createdAt)}${dur ? ` · ${dur}` : ""}`;
  const rowBg  = index % 2 === 0 ? "bg-card" : "bg-muted/50";
  const verdictCls   = VERDICT_CLS[run.verdict] ?? "border-border text-muted-foreground";
  const verdictLabel = VERDICT_LABEL[run.verdict] ?? run.verdict;
  const compactVerdictLabel =
    run.verdict === "pass_with_warning" ? "Pass" : verdictLabel;
  const isFailed = run.verdict === "fail" || run.verdict === "error";

  return (
    <div className={`transition-colors ${rowBg}`}>
      {/* ── Collapsed row ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="group grid w-full cursor-pointer grid-cols-[1fr_auto] gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/60 xl:grid-cols-[1.5rem_minmax(0,1fr)_15rem_4.5rem_11rem] xl:items-center xl:gap-x-6 xl:px-8 xl:py-0"
        style={{ minHeight: 46 }}
      >
        <span className="hidden text-center text-[13px] tabular-nums text-muted-foreground xl:block">
          #{index + 1}
        </span>

        <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 xl:col-span-1 xl:flex-nowrap xl:pl-3">
          <span className="text-[13px] tabular-nums text-muted-foreground xl:hidden">
            #{index + 1}
          </span>
          {isLive && (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
          )}
          <p className="shrink-0 text-[14px] text-foreground">Run #{run.id}</p>
          {isFailed && !expanded && (
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
              {buildFailureHint(run)}
            </span>
          )}
        </div>

        <span
          className="col-span-2 min-w-0 truncate text-left text-[13px] text-muted-foreground xl:col-span-1 xl:text-right"
          title={dateText}
        >
          {dateText}
        </span>

        <div className="flex justify-start xl:justify-end">
          {isLive ? (
            <span className={`${STATUS_CHIP_CLASS} gap-1.5 border-blue-400 text-blue-500`}>
              <Clock className="size-3 animate-pulse" />
              {run.status === "running" && elapsed > 0
                ? (elapsed >= 60 ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s` : `${elapsed}s`)
                : run.status}
            </span>
          ) : run.verdict ? (
            <span className={`${STATUS_CHIP_CLASS} ${verdictCls}`} title={verdictLabel}>
              {compactVerdictLabel}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1 whitespace-nowrap rounded-[6px] border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground shadow-[0px_2px_8px_rgba(0,0,0,0.2)]">
            Steps
            <ChevronDown className={`ml-0.5 size-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${projectId}/test-runs/${run.id}`);
            }}
            className="whitespace-nowrap rounded-[6px] border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground shadow-[0px_2px_8px_rgba(0,0,0,0.2)] transition-colors hover:bg-surface-2"
          >
            Detail →
          </button>
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-border bg-muted/40 px-4 py-4 sm:px-8 sm:py-5">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" /> Loading steps…
            </div>
          ) : detail?.steps?.length ? (
            <>
              <p className="mb-4 text-xs font-medium text-muted-foreground">
                {detail.steps.length} step{detail.steps.length !== 1 ? "s" : ""} recorded
              </p>
              <div className="pl-1">
                {detail.steps.map((step, i) => (
                  <StepResult
                    key={step.id}
                    step={step}
                    stepIndex={i}
                    isLast={i === detail.steps.length - 1}
                  />
                ))}
              </div>
              <AiAnalysis runId={run.id} isLive={isLive} initialAnalysis={detail?.analysis} />
            </>
          ) : isLive ? (
            <div className="flex items-center gap-2 py-2 text-sm text-blue-500">
              <LoadingSpinner size="sm" /> Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">No steps recorded for this run.</p>
          )}
        </div>
      )}
    </div>
  );
}
