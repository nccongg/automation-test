import {
  CheckCircle2,
  XCircle,
  Link,
  Eye,
  EyeOff,
  ShieldCheck,
  Type,
  Hash,
} from "lucide-react";
import { parseAgentError } from "@/shared/utils/parseAgentError";
import ScreenshotList from "./ScreenshotList";

/* ─── Style maps ──────────────────────────────────────────────────────────── */

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

const FAILURE_REASON_META = {
  assertion_mismatch:  { label: "Assertion mismatch", color: "bg-red-500/15 text-red-400" },
  element_not_found:   { label: "Element not found",  color: "bg-orange-500/15 text-orange-400" },
  element_not_visible: { label: "Not visible",        color: "bg-orange-500/15 text-orange-400" },
  timeout:             { label: "Timeout",            color: "bg-yellow-500/15 text-yellow-500" },
  navigation_failed:   { label: "Navigation failed",  color: "bg-red-500/15 text-red-400" },
  value_not_set:       { label: "Value not set",      color: "bg-amber-500/15 text-amber-500" },
  selector_invalid:    { label: "Invalid selector",   color: "bg-purple-500/15 text-purple-400" },
  unexpected_error:    { label: "Unexpected error",   color: "bg-muted text-muted-foreground" },
};

const ANCHOR_TYPE_META = {
  url_contains:       { icon: Link,        label: "URL contains" },
  url_changed:        { icon: Link,        label: "URL changed" },
  text_visible:       { icon: Eye,         label: "Text visible" },
  text_not_visible:   { icon: EyeOff,      label: "Text hidden" },
  no_error_message:   { icon: ShieldCheck, label: "No errors" },
  field_value_equals: { icon: Type,        label: "Field value" },
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function FailureReasonBadge({ reason }) {
  if (!reason) return null;
  const meta = FAILURE_REASON_META[reason] ?? { label: reason, color: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
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

function AnchorResultsPanel({ anchorResults }) {
  if (!anchorResults || anchorResults.length === 0) return null;

  const hasFailed = anchorResults.some((a) => !a.passed && a.required);
  const hasWarning = anchorResults.some((a) => !a.passed && !a.required);

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${
      hasFailed
        ? "bg-red-500/10 border-red-500/20"
        : hasWarning
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-emerald-500/10 border-emerald-500/20"
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
                {anchor.passed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
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

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatStepTitle(raw, stepNo, stepIndex) {
  const text = (raw || "").trim();
  if (!text) return `Step ${stepNo ?? stepIndex + 1}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ─── Step result item ────────────────────────────────────────────────────── */

export default function StepResult({ step, stepIndex, isLast }) {
  const style = getStepStyle(step.status);

  const title = formatStepTitle(step.title, step.stepNo, stepIndex);
  // Hide the action line when it just repeats the title (e.g. title "Input" + action "input").
  const action =
    step.action && step.action.trim().toLowerCase() !== (step.title || "").trim().toLowerCase()
      ? step.action
      : "";

  const hasEvidence = (step.screenshots?.filter((s) => s.imageUrl).length ?? 0) > 0;
  const hasAnchors = (step.anchorResults?.length ?? 0) > 0;
  const hasInfo = action || step.message || step.currentUrl;
  const hasBody = hasInfo || step.extractedContent || hasAnchors || hasEvidence;

  return (
    <div className="relative flex gap-3">
      {!isLast && <div className="absolute left-[13px] top-7 h-full w-0.5 bg-border" />}
      <div className="relative z-10 mt-0.5 flex-shrink-0">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ring-4 ${style.node}`}>
          <span className="text-[10px] font-bold text-white">{step.stepNo ?? stepIndex + 1}</span>
        </div>
      </div>

      <div className="mb-4 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{title}</p>
          <div className="flex items-center gap-1.5">
            {step.failureReason && <FailureReasonBadge reason={step.failureReason} />}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
              {step.status}
            </span>
          </div>
        </div>

        {/* Body: info on the left, evidence on the right */}
        {hasBody && (
          <div className="border-t border-border p-4">
            <div className={`flex flex-col gap-4 ${hasEvidence ? "lg:flex-row" : ""}`}>
              {/* Info column */}
              <div className="min-w-0 flex-1 space-y-2.5">
                {hasInfo && (
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {action && <p><span className="text-muted-foreground/60">Action: </span>{action}</p>}
                    {step.message && <StepErrorMessage raw={step.message} />}
                    {step.currentUrl && (
                      <p>
                        <span className="text-muted-foreground/60">URL: </span>
                        <a href={step.currentUrl} target="_blank" rel="noreferrer"
                          className="text-blue-500 hover:underline break-all">{step.currentUrl}</a>
                      </p>
                    )}
                  </div>
                )}
                {step.extractedContent && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                      Extracted
                    </span>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                      {step.extractedContent}
                    </p>
                  </div>
                )}
                <AnchorResultsPanel anchorResults={step.anchorResults} />
              </div>

              {/* Evidence column */}
              {hasEvidence && (
                <div className="lg:w-2/5 lg:shrink-0">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                    Evidence
                  </p>
                  <ScreenshotList
                    screenshots={step.screenshots}
                    stepNo={step.stepNo}
                    gridClassName="grid grid-cols-2 gap-2 lg:grid-cols-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
