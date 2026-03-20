/**
 * Project Stats Component
 * 
 * Displays key project metrics in a card layout
 * Reusable stats display for projects
 */

import { TestTube2, CheckCircle2, XCircle, Clock } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.project - Project data with stats
 */
export default function ProjectStats({ project }) {
  const lastRunStatus = project?.lastRunStatus || 'Never';

  let lastRunMeta = {
    icon: Clock,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  };

  if (lastRunStatus === 'Pass') {
    lastRunMeta = {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
    };
  } else if (lastRunStatus === 'Fail' || lastRunStatus === 'Error') {
    lastRunMeta = {
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-700',
    };
  }

  const stats = [
    {
      label: 'Total Test',
      value: project?.totalTests ?? 0,
      icon: TestTube2,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-700',
    },
    {
      label: 'Last run status',
      value: lastRunStatus,
      ...lastRunMeta,
    },
    {
      label: 'Total runs',
      value: project?.totalRuns ?? 0,
      icon: Clock,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm"
          >
            <div
              className={`grid size-12 place-items-center rounded-full ${stat.iconBg}`}
            >
              <Icon className={`size-6 ${stat.iconColor}`} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className="text-xl font-semibold">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
