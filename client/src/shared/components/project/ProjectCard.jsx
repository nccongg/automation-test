import { useNavigate } from "react-router-dom";

/**
 * Reusable Project Card Component
 * Displays project information with status, metrics, and progress bar
 *
 * @param {string} title - Project name
 * @param {string} description - Project description
 * @param {string} status - Status text (Passing/Partial/Failing/Pending)
 * @param {string} statusTone - Status tone for styling (passing/failing/partial/pending)
 * @param {number} testCases - Number of test cases
 * @param {string} passRate - Pass rate percentage string
 * @param {string} lastRun - Last run time (relative)
 * @param {string} barTone - Progress bar tone (green/red/slate)
 * @param {number} projectBarWidth - Progress bar width percentage
 * @param {string|number} projectId - Project ID for navigation
 */
export default function ProjectCard({
  title,
  description,
  status,
  statusTone,
  testCases,
  passRate,
  lastRun,
  barTone,
  projectBarWidth,
  projectId,
}) {
  const navigate = useNavigate();

  // Map statusTone to CSS classes
  const statusClass =
    statusTone === "passing"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : statusTone === "failing"
        ? "bg-red-500/10 text-red-700 border-red-500/20"
        : statusTone === "partial"
          ? "bg-sky-500/10 text-sky-700 border-sky-500/20"
          : "bg-slate-500/10 text-slate-700 border-slate-500/20";

  // Map barTone to CSS classes
  const barClass =
    barTone === "green"
      ? "bg-emerald-500"
      : barTone === "red"
        ? "bg-red-500"
        : barTone === "sky"
          ? "bg-sky-500"
          : "bg-slate-400";

  const handleClick = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div
      className="flex flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="max-w-full flex-col gap-2">
        <div className="w-full min-w-0 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="text-lg font-semibold tracking-tight break-words">
            {title}
          </div>
          <div
            className={`w-auto shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
          >
            {status}
          </div>
        </div>

        <div className="mt-1 text-sm text-muted-foreground line-clamp-2 break-words overflow-hidden">
          {description}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="space-y-1">
          <div className="text-muted-foreground">Test Cases</div>
          <div className="font-semibold">{testCases}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Pass Rate</div>
          <div className="font-semibold">{passRate}</div>
        </div>
        <div className="col-span-1 sm:col-span-2 space-y-1">
          <div className="text-muted-foreground">Last run</div>
          <div className="font-semibold">{lastRun}</div>
        </div>
      </div>

      <div className="mt-auto h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full ${barClass}`}
          style={{ width: `${projectBarWidth}%` }}
        />
      </div>
    </div>
  );
}
