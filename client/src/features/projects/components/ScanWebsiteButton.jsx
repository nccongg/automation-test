import { useState, useEffect, useRef } from 'react';
import { ScanLine, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import { triggerScan, getScanById, getLatestScan, cancelScan } from '@/features/projects/api/scanApi';
import { Button } from '@/components/ui/button';

const SCAN_STATUS_CONFIG = {
  queued:    { label: 'Queued',      icon: Clock,        className: 'text-amber-600   bg-amber-50   border-amber-200' },
  running:   { label: 'Scanning…',   icon: Loader2,      className: 'text-blue-600    bg-blue-50    border-blue-200', spin: true },
  completed: { label: 'Scanned',     icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed:    { label: 'Scan failed', icon: AlertCircle,  className: 'text-red-600     bg-red-50     border-red-200' },
  cancelled: { label: 'Cancelled',   icon: AlertCircle,  className: 'text-slate-600   bg-slate-50   border-slate-200' },
};

const POLL_INTERVAL_MS  = 4000;
const MAX_POLL_ATTEMPTS = 75;

const DEPTH_STYLES = ['', 'pl-3 text-slate-500', 'pl-6 text-slate-400'];
function depthStyle(depth) {
  return DEPTH_STYLES[Math.min(depth, 2)] ?? DEPTH_STYLES[2];
}

/**
 * Scan status badge + trigger button + live progress / results panel.
 *
 * @param {{ projectId: number|string, align?: 'right'|'left' }} props
 *   align controls which side the dropdown panel opens (default 'right')
 */
export default function ScanWebsiteButton({ projectId, align = 'right' }) {
  const [scan, setScan]             = useState(undefined);
  const [triggering, setTriggering] = useState(false);
  const [stopping, setStopping]     = useState(false);
  const [error, setError]           = useState('');
  const [open, setOpen]             = useState(false);
  const pollRef                     = useRef(null);
  const pollCountRef                = useRef(0);
  const listRef                     = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getLatestScan(projectId)
      .then((d) => { if (!cancelled) setScan(d ?? null); })
      .catch(() => { if (!cancelled) setScan(null); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (scan?.status === 'running' || scan?.status === 'queued') setOpen(true);
  }, [scan?.status]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [scan?.pages?.length]);

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
      setStopping(true); setError('');
      setScan(await cancelScan(scan.id));
    } catch (err) {
      setError(err?.message || 'Failed to stop scan.');
    } finally { setStopping(false); }
  };

  const handleTrigger = async () => {
    try {
      setTriggering(true); setError(''); pollCountRef.current = 0;
      setScan(await triggerScan(projectId));
      setOpen(true);
    } catch (err) {
      setError(err?.message || 'Failed to start scan.');
    } finally { setTriggering(false); }
  };

  const isScanning = scan?.status === 'queued' || scan?.status === 'running';
  const cfg = scan ? SCAN_STATUS_CONFIG[scan.status] : null;
  const pages = scan?.pages ?? [];
  const panelSide = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="relative flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
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

        {isScanning && (
          <Button type="button" variant="ds-outlined-destructive" onClick={handleStop} disabled={stopping}>
            {stopping ? <Loader2 className="animate-spin" /> : null}
            {stopping ? 'Stopping…' : 'Stop'}
          </Button>
        )}

        <Button type="button" variant="outline" onClick={handleTrigger}
          disabled={triggering || isScanning}
          title="Crawl the site so AI can use real page structure when generating test cases">
          {triggering || isScanning
            ? <Loader2 className="animate-spin" />
            : <ScanLine />}
          {isScanning ? 'Scanning…' : scan?.status === 'completed' ? 'Re-scan' : 'Scan Website'}
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {open && scan && (
        <div className={`absolute ${panelSide} top-full mt-2 z-50 w-96 rounded-xl border border-border bg-card shadow-xl text-sm overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              {cfg && <cfg.icon className={`size-4 ${cfg.className.split(' ')[0]} ${cfg.spin ? 'animate-spin' : ''}`} />}
              {isScanning ? 'Scanning in progress…'
                : scan.status === 'completed' ? 'Scan complete'
                : scan.status === 'cancelled' ? 'Scan stopped'
                : 'Scan failed'}
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none px-1">×</button>
          </div>

          {(pages.length > 0 || scan.finishedAt) && (
            <div className="flex gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground bg-muted/30">
              <span><strong className="text-foreground">{pages.length}</strong> pages crawled</span>
              {scan.finishedAt && (
                <span>
                  <strong className="text-foreground">
                    {Math.round((new Date(scan.finishedAt) - new Date(scan.startedAt)) / 1000)}s
                  </strong> total
                </span>
              )}
              {isScanning && <span className="ml-auto text-blue-500 animate-pulse">Live</span>}
            </div>
          )}

          <div ref={listRef} className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {pages.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                {isScanning ? 'Waiting for first page…' : 'No pages recorded.'}
              </div>
            ) : pages.map((p, i) => (
              <div key={i} className={`flex items-start gap-2 px-4 py-2 hover:bg-muted/50 ${depthStyle(p.depth)}`}>
                <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-foreground">{p.title || '(no title)'}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{p.url}</div>
                </div>
              </div>
            ))}
            {isScanning && pages.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-blue-500">
                <Loader2 className="size-3 animate-spin" /> Crawling next page…
              </div>
            )}
          </div>

          {scan.status === 'cancelled' && (
            <div className="px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
              Scan was stopped.{' '}
              <button type="button" onClick={() => { setOpen(false); handleTrigger(); }}
                className="font-medium underline hover:no-underline">Re-scan</button>
            </div>
          )}
          {scan.status === 'completed' && (
            <div className="px-4 py-3 border-t border-border bg-emerald-50 text-xs text-emerald-700">
              AI will use this data the next time you generate test cases.
              <button type="button" onClick={() => { setOpen(false); handleTrigger(); }}
                className="ml-2 font-medium underline hover:no-underline">Re-scan</button>
            </div>
          )}
          {scan.status === 'failed' && (
            <div className="px-4 py-3 border-t border-border bg-destructive/5 text-xs text-destructive">
              {scan.errorMessage || 'Scan failed.'}{' '}
              <button type="button" onClick={() => { setOpen(false); handleTrigger(); }}
                className="font-medium underline hover:no-underline">Try again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
