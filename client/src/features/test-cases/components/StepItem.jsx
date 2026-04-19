import { parseAgentError } from "@/shared/utils/parseAgentError";
import { ERROR_STYLE } from "../constants/styles.jsx";

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
  return (
    <p className="text-xs text-slate-500 break-all">
      <span className="text-slate-400">Message: </span>
      {raw}
    </p>
  );
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

export default function StepItem({ step, stepIndex, isLast }) {
  return (
    <div className="relative flex gap-3">
      {!isLast && <div className="absolute left-[13px] top-7 h-full w-0.5 bg-slate-100" />}
      <div className="relative z-10 mt-0.5 shrink-0">
        <div
          className={`size-7 rounded-full ring-4 ${getStepNodeStyle(step.status)} flex items-center justify-center`}
        >
          <span className="text-[10px] font-bold text-white">
            {step.stepNo ?? stepIndex + 1}
          </span>
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
            {step.action && (
              <p>
                <span className="text-slate-400">Action: </span>
                {step.action}
              </p>
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
                    alt={`Step ${step.stepNo}`}
                    className="h-28 w-44 object-cover transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg">
                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-700 text-xs font-medium px-2 py-1 rounded-md transition-opacity">
                      View
                    </span>
                  </div>
                </a>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}
