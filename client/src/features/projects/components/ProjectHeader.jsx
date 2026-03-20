/**
 * Project Header Component
 * 
 * Displays project title, description, status badge, and action buttons
 * Reusable across different views
 */

import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * @param {Object} props
 * @param {Object} props.project - Project data
 */
export default function ProjectHeader({ project }) {
  const navigate = useNavigate();

  const statusClass =
    project.statusTone === 'passing'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      : project.statusTone === 'failing'
        ? 'bg-red-500/10 text-red-700 border-red-500/20'
        : 'bg-slate-500/10 text-slate-700 border-slate-500/20';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mt-1 shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {/* Project Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.title}
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {project.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Base URL: {project.baseUrl}</span>
            <span>•</span>
            <span>Last run: {project.lastRunStatus}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Edit Project
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="size-4" />
        </Button>
      </div>
    </div>
  );
}
