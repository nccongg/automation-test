/**
 * Project Header Component
 * 
 * Displays project title, description, status badge, and action buttons
 * Reusable across different views
 */

import { ArrowLeft, Pencil, Trash2, ScanLine, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { triggerScan, getScanById, getLatestScan, cancelScan } from '@/features/projects/api/scanApi';
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

// ── Scan status config ─────────────────────────────────────────────────────
const SCAN_STATUS_CONFIG = {
  queued:    { label: 'Queued',      icon: Clock,        className: 'text-amber-600   bg-amber-50   border-amber-200' },
  running:   { label: 'Scanning…',   icon: Loader2,      className: 'text-blue-600    bg-blue-50    border-blue-200', spin: true },
  completed: { label: 'Scanned',     icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed:    { label: 'Scan failed', icon: AlertCircle,  className: 'text-red-600     bg-red-50     border-red-200' },
  cancelled: { label: 'Cancelled',   icon: AlertCircle,  className: 'text-slate-600   bg-slate-50   border-slate-200' },
};

const POLL_INTERVAL_MS  = 4000;
const MAX_POLL_ATTEMPTS = 75; // stop after 5 min

// Depth → indentation + colour
const DEPTH_STYLES = ['', 'pl-3 text-slate-500', 'pl-6 text-slate-400'];

function depthStyle(depth) {
  return DEPTH_STYLES[Math.min(depth, 2)] ?? DEPTH_STYLES[2];
}

/**
 * Scan status badge + trigger button + live progress / results panel.
 */
function ScanWebsiteButton({ projectId }) {
  const [scan, setScan]         = useState(undefined);
  const [triggering, setTriggering] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError]       = useState('');
  const [open, setOpen]         = useState(false);   // panel open
  const pollRef                 = useRef(null);
  const pollCountRef            = useRef(0);
  const listRef                 = useRef(null);

  // Fetch latest scan on mount
  useEffect(() => {
    let cancelled = false;
    getLatestScan(projectId)
      .then((d) => { if (!cancelled) setScan(d ?? null); })
      .catch(() => { if (!cancelled) setScan(null); });
    return () => { cancelled = true; };
  }, [projectId]);

  // Auto-open panel when scanning starts
  useEffect(() => {
    if (scan?.status === 'running' || scan?.status === 'queued') setOpen(true);
  }, [scan?.status]);

  // Scroll page list to bottom as new pages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [scan?.pages?.length]);

  // Poll only while active
  useEffect(() => {
    const isActive = scan?.status === 'queued' || scan?.status === 'running';
    clearInterval(pollRef.current);
    if (!isActive) { pollCountRef.current = 0; return; }

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        clearInterval(pollRef.current);
        setScan((p) => p ? { ...p, status: 'failed', errorMessage: 'Timed out.' } : p);
        return;
      }
      try {
        const updated = await getScanById(scan.id);
        setScan(updated);
      } catch { /* ignore */ }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [scan?.id, scan?.status]);

  const handleStop = async () => {
    if (!scan?.id) return;
    try {
      setStopping(true);
      setError('');
      const updated = await cancelScan(scan.id);
      setScan(updated);
    } catch (err) {
      setError(err?.message || 'Failed to stop scan.');
    } finally {
      setStopping(false);
    }
  };

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      setError('');
      pollCountRef.current = 0;
      const newScan = await triggerScan(projectId);
      setScan(newScan);
      setOpen(true);
    } catch (err) {
      setError(err?.message || 'Failed to start scan.');
    } finally {
      setTriggering(false);
    }
  };

  const isScanning = scan?.status === 'queued' || scan?.status === 'running';
  const cfg = scan ? SCAN_STATUS_CONFIG[scan.status] : null;
  const pages = scan?.pages ?? [];

  return (
    <div className="relative flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">

        {/* Status badge — click to toggle panel */}
        {cfg && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity cursor-pointer hover:opacity-80 ${cfg.className}`}
          >
            <cfg.icon className={`size-3 ${cfg.spin ? 'animate-spin' : ''}`} />
            {cfg.label}
            {pages.length > 0 && <span className="opacity-75">· {pages.length} pages</span>}
            <span className="opacity-50">{open ? '▲' : '▼'}</span>
          </button>
        )}

        {/* Stop button — only while scanning */}
        {isScanning && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={stopping}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            {stopping ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {stopping ? 'Stopping…' : 'Stop'}
          </Button>
        )}

        {/* Trigger button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTrigger}
          disabled={triggering || isScanning}
          title="Crawl the site so AI can use real page structure when generating test cases"
        >
          {triggering || isScanning
            ? <Loader2 className="size-4 mr-2 animate-spin" />
            : <ScanLine className="size-4 mr-2" />}
          {isScanning ? 'Scanning…' : scan?.status === 'completed' ? 'Re-scan' : 'Scan Website'}
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* ── Live progress / results panel ─────────────────────────────── */}
      {open && scan && (
        <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-xl border bg-white shadow-xl text-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              {cfg && <cfg.icon className={`size-4 ${cfg.className.split(' ')[0]} ${cfg.spin ? 'animate-spin' : ''}`} />}
              {isScanning ? 'Scanning in progress…' : scan.status === 'completed' ? 'Scan complete' : scan.status === 'cancelled' ? 'Scan stopped' : 'Scan failed'}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
            >×</button>
          </div>

          {/* Stats row */}
          {(pages.length > 0 || scan.finishedAt) && (
            <div className="flex gap-4 px-4 py-2 border-b text-xs text-muted-foreground bg-slate-50/60">
              <span><strong className="text-foreground">{pages.length}</strong> pages crawled</span>
              {scan.finishedAt && (
                <span>
                  <strong className="text-foreground">
                    {Math.round((new Date(scan.finishedAt) - new Date(scan.startedAt)) / 1000)}s
                  </strong> total
                </span>
              )}
              {isScanning && (
                <span className="ml-auto text-blue-500 animate-pulse">Live</span>
              )}
            </div>
          )}

          {/* Page list */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto divide-y divide-slate-100"
          >
            {pages.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                {isScanning ? 'Waiting for first page…' : 'No pages recorded.'}
              </div>
            ) : (
              pages.map((p, i) => (
                <div key={i} className={`flex items-start gap-2 px-4 py-2 hover:bg-slate-50 ${depthStyle(p.depth)}`}>
                  <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-emerald-500" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">{p.title || '(no title)'}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{p.url}</div>
                  </div>
                </div>
              ))
            )}

            {/* Scanning indicator at the bottom */}
            {isScanning && pages.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-blue-500">
                <Loader2 className="size-3 animate-spin" /> Crawling next page…
              </div>
            )}
          </div>

          {/* Footer */}
          {scan.status === 'cancelled' && (
            <div className="px-4 py-3 border-t bg-slate-50 text-xs text-slate-600">
              Scan was stopped.{' '}
              <button
                type="button"
                onClick={() => { setOpen(false); handleTrigger(); }}
                className="font-medium underline hover:no-underline"
              >Re-scan</button>
            </div>
          )}
          {scan.status === 'completed' && (
            <div className="px-4 py-3 border-t bg-emerald-50 text-xs text-emerald-700">
              AI will use this data the next time you generate test cases.
              <button
                type="button"
                onClick={() => { setOpen(false); handleTrigger(); }}
                className="ml-2 font-medium underline hover:no-underline"
              >Re-scan</button>
            </div>
          )}
          {scan.status === 'failed' && (
            <div className="px-4 py-3 border-t bg-red-50 text-xs text-red-700">
              {scan.errorMessage || 'Scan failed.'}{' '}
              <button
                type="button"
                onClick={() => { setOpen(false); handleTrigger(); }}
                className="font-medium underline hover:no-underline"
              >Try again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        <div className="relative flex items-center gap-2">
          <ScanWebsiteButton projectId={project.id} />
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
