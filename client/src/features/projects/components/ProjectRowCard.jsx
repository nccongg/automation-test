/**
 * Project Row Card Component
 *
 * Displays project information in a row format
 * Used in projects list view
 */

/**
 * @param {Object} props
 * @param {string|number} props.id - Project ID for navigation
 * @param {string} props.name - Project name
 * @param {string} props.owner - Project owner
 * @param {string} props.status - Project status
 * @param {'passing'|'pending'|'failing'} props.statusTone - Project status tone
 * @param {string} props.updatedAt - Last update timestamp
 */
export default function ProjectRowCard({
  id,
  name,
  owner,
  status,
  statusTone = "pending",
  updatedAt,
}) {
  const statusClass =
    statusTone === "passing"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : statusTone === "failing"
        ? "bg-red-500/10 text-red-700 border-red-500/20"
        : "bg-slate-500/10 text-slate-700 border-slate-500/20";

  const onClick = () => {
    if (!id) return;
    window.location.href = `/projects/${id}`;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all hover:shadow-sm hover:border-[var(--brand-primary)]/30"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold break-words">{name}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          Owner: {owner}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
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
