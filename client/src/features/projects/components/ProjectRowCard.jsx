/**
 * Project Row Card Component
 * 
 * Displays project information in a row format
 * Used in projects list view
 */

/**
 * @param {Object} props
 * @param {string} props.name - Project name
 * @param {string} props.owner - Project owner
 * @param {string} props.status - Project status
 * @param {string} props.updatedAt - Last update timestamp
 */
export default function ProjectRowCard({
  name,
  owner,
  status,
  updatedAt,
}) {
  const statusTone =
    status === 'Active'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      : status === 'Paused'
        ? 'bg-sky-500/10 text-sky-700 border-sky-500/20'
        : 'bg-slate-500/10 text-slate-700 border-slate-500/20';

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          Owner: {owner}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusTone}`}
        >
          {status}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          Updated {updatedAt}
        </div>
      </div>
    </div>
  );
}
