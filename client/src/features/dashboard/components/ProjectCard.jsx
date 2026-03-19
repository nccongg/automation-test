/**
 * Project Card Component
 * 
 * Displays project summary with status, test cases, and pass rate
 * Used on dashboard to show recent projects
 */

/**
 * @param {Object} props
 * @param {string} props.title - Project title
 * @param {string} props.description - Project description
 * @param {string} props.status - Status text
 * @param {'passing'|'failing'|'pending'} props.statusTone - Status color tone
 * @param {number} props.testCases - Number of test cases
 * @param {string} props.passRate - Pass rate percentage
 * @param {string} props.lastRun - Last run timestamp
 * @param {'green'|'red'|'slate'} props.barTone - Progress bar color
 * @param {number} props.projectBarWidth - Progress bar width percentage
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
}) {
  const statusClass =
    statusTone === 'passing'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      : statusTone === 'failing'
        ? 'bg-red-500/10 text-red-700 border-red-500/20'
        : 'bg-slate-500/10 text-slate-700 border-slate-500/20';

  const barClass =
    barTone === 'green'
      ? 'bg-emerald-500'
      : barTone === 'red'
        ? 'bg-red-500'
        : 'bg-slate-400';

  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {description}
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
        >
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="space-y-1">
          <div className="text-muted-foreground">Test Cases</div>
          <div className="font-semibold">{testCases}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Pass Rate</div>
          <div className="font-semibold">{passRate}</div>
        </div>
        <div className="col-span-2 space-y-1">
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
