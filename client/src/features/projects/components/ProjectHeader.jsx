/**
 * Project Header Component
 * 
 * Displays project title, description, status badge, and action buttons
 * Reusable across different views
 */

import { ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UpdateProjectDialog from './UpdateProjectDialog';
import { deleteProject } from '@/features/projects/api/projectsApi';

/**
 * Collapsible description component
 */
function CollapsibleDescription({ text, maxLines = 2, maxChars = 180 }) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text && text.length > maxChars;

  const collapsedStyles = {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  return (
    <div className="text-sm text-muted-foreground max-w-2xl">
      <p
        className="break-words whitespace-pre-wrap"
        style={expanded || !shouldCollapse ? {} : collapsedStyles}
      >
        {text || 'No description'}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {Object} props.project - Project data
 * @param {Function} props.onProjectUpdated - Callback when project is updated
 */
export default function ProjectHeader({ project, onProjectUpdated }) {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const statusClass =
    project.statusTone === 'passing'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      : project.statusTone === 'failing'
        ? 'bg-red-500/10 text-red-700 border-red-500/20'
        : 'bg-slate-500/10 text-slate-700 border-slate-500/20';

  const handleEditClick = () => {
    setShowEditDialog(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      await deleteProject(project.id);
      setShowDeleteConfirm(false);
      onProjectUpdated?.();
      navigate('/');
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete project.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
            <CollapsibleDescription text={project.description} maxLines={2} maxChars={120} />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Base URL: {project.baseUrl}</span>
              <span>•</span>
              <span>Last run: {project.lastRunStatus}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="size-4 mr-2" />
                Edit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEditClick}>
                <Pencil className="size-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Project Dialog */}
      <UpdateProjectDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdated={() => {
          onProjectUpdated?.();
          setShowEditDialog(false);
        }}
        project={project}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent showCloseButton={true} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone 
              and will delete all test cases, test runs, and associated data.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteError('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
