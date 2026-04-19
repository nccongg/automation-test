import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { getTestRunDetail } from "@/features/test-results/api/testResultsApi";
import { fmt, duration } from "../utils/testCaseUtils";
import { VERDICT_STRIPE, VERDICT_BG, VERDICT_BADGE, VERDICT_ICON } from "../constants/styles.jsx";
import StepItem from "./StepItem";
import AiAnalysis from "./AiAnalysis";

export default function RunRow({ run, projectId, index }) {
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
      try {
        setDetail(await getTestRunDetail(run.id));
      } finally {
        setLoading(false);
      }
    }
    setExpanded((p) => !p);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  const dur = duration(run.startedAt, run.finishedAt);

  return (
    <div className={`rounded-2xl border border-slate-200 overflow-hidden shadow-sm border-l-4 ${stripe} ${bg}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="w-full px-5 py-4 text-left hover:bg-black/[0.02] transition-colors cursor-pointer"
      >
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
                <Badge
                  className={`capitalize border text-xs ${VERDICT_BADGE[run.verdict] ?? "bg-slate-100 text-slate-600"}`}
                >
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
              <ChevronDown
                className={`size-3.5 ml-0.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${projectId}/test-runs/${run.id}`);
              }}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors"
            >
              Detail →
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
              <LoadingSpinner size="sm" /> Loading steps…
            </div>
          ) : detail?.steps?.length ? (
            <>
              <p className="mb-4 text-xs font-medium text-slate-400">
                {detail.steps.length} step{detail.steps.length !== 1 ? "s" : ""} recorded
              </p>
              <div className="pl-1">
                {detail.steps.map((step, i) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    stepIndex={i}
                    isLast={i === detail.steps.length - 1}
                  />
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
