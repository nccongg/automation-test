import { useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  LayoutList, Sheet, CheckCircle2, XCircle, Clock,
  Database, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTestResults } from "@/features/test-results/hooks/useTestResults";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const ms = new Date(finishedAt) - new Date(startedAt);
  if (ms < 0) return null;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

/* ─── Verdict Badge ────────────────────────────────────────────────────── */

function VerdictBadge({ verdict, isLive }) {
  if (isLive) return (
    <span className="flex items-center gap-1 rounded-[6px] border border-blue-400 px-2 py-0.5 text-xs text-blue-500">
      <Clock className="size-3 animate-pulse" /> Running
    </span>
  );
  const map = {
    pass:              { label: "Passed",           cls: "border-success text-success" },
    pass_with_warning: { label: "Pass (no assert)", cls: "border-amber-500 text-amber-500" },
    fail:              { label: "Failed",            cls: "border-destructive text-destructive" },
    error:             { label: "Error",             cls: "border-orange-500 text-orange-500" },
  };
  const v = map[verdict];
  if (!v) return (
    <span className="rounded-[6px] border border-border px-2 py-0.5 text-xs text-muted-foreground">
      Pending
    </span>
  );
  return (
    <span className={`rounded-[6px] border px-2 py-0.5 text-xs font-normal ${v.cls}`}>
      {v.label}
    </span>
  );
}

/* ─── Table Column Header ─────────────────────────────────────────────── */

function TableHeader({ children }) {
  return (
    <div className="flex items-center border-b border-border bg-muted/40 px-8" style={{ height: 46 }}>
      {children}
    </div>
  );
}

function ColHead({ children, className = "" }) {
  return (
    <span className={`text-[13px] font-bold text-foreground ${className}`}>
      {children}
    </span>
  );
}

/* ─── Stat Strip ──────────────────────────────────────────────────────── */

function StatStrip({ items }) {
  return (
    <div className="flex items-center gap-8 border-b border-border bg-muted/40 px-8" style={{ height: 46 }}>
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-foreground">{value}</span>
          <span className="text-[13px] tracking-[0.5px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Run Row ─────────────────────────────────────────────────────────── */

function RunRow({ run, projectId, rowIndex }) {
  const navigate = useNavigate();
  const isLive = run.status === "running" || run.status === "queued";
  const rowBg = rowIndex % 2 === 0 ? "bg-card" : "bg-muted/50";

  return (
    <button
      onClick={() => navigate(`/projects/${projectId}/test-runs/${run.id}`)}
      className={`group flex w-full items-center px-8 transition-colors hover:bg-muted/60 ${rowBg}`}
      style={{ minHeight: 46 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isLive && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
        )}
        <p className="truncate text-[14px] text-foreground">{run.projectName}</p>
      </div>
      <span className="w-44 shrink-0 text-right text-[13px] text-muted-foreground">{run.executedAt}</span>
      <span className="w-32 shrink-0 flex justify-end">
        <VerdictBadge verdict={run.verdict} isLive={isLive} />
      </span>
      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        View →
      </span>
    </button>
  );
}

/* ─── Sheet Run Row ───────────────────────────────────────────────────── */

function SheetRunRow({ run, onClick, rowIndex }) {
  const isLive = run.status === "queued" || run.status === "running";
  const total = run.totalCases ?? 0;
  const passed = run.passed ?? 0;
  const failed = run.failed ?? 0;
  const duration = formatDuration(run.startedAt, run.completedAt);
  const rowBg = rowIndex % 2 === 0 ? "bg-card" : "bg-muted/50";

  const sheetVerdict = isLive
    ? null
    : failed > 0 && passed === 0 ? "fail"
    : failed > 0 ? "pass_with_warning"
    : "pass";

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center px-8 transition-colors hover:bg-muted/60 ${rowBg}`}
      style={{ minHeight: 46 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isLive && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
        )}
        <p className="truncate text-[14px] text-foreground">{run.sheetName}</p>
        <span className="shrink-0 text-[13px] text-muted-foreground">
          {total} case{total !== 1 ? "s" : ""}{duration ? ` · ${duration}` : ""}
        </span>
      </div>
      <span className="w-44 shrink-0 text-right text-[13px] text-muted-foreground">{formatDateTime(run.createdAt)}</span>
      <span className="w-20 shrink-0 flex items-center justify-end gap-2 text-[13px]">
        <span className="text-success">{passed} ✓</span>
        {failed > 0 && <span className="text-destructive">{failed} ✗</span>}
      </span>
      <span className="w-32 shrink-0 flex justify-end">
        <VerdictBadge verdict={sheetVerdict} isLive={isLive} />
      </span>
      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        View →
      </span>
    </button>
  );
}

/* ─── Dataset Run Row ─────────────────────────────────────────────────── */

function DatasetRunRow({ batch, onClick, rowIndex }) {
  const rowBg = rowIndex % 2 === 0 ? "bg-card" : "bg-muted/50";
  const isCompleted = batch.status === "completed";

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center px-8 transition-colors hover:bg-muted/60 ${rowBg}`}
      style={{ minHeight: 46 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <p className="truncate text-[14px] text-foreground">
          {batch.test_case_title ?? `Test Case #${batch.test_case_id}`}
        </p>
        <span className="shrink-0 text-[13px] text-muted-foreground">
          {batch.dataset_name ?? `Dataset #${batch.dataset_id}`} · Batch #{batch.id}
        </span>
      </div>
      <span className="w-44 shrink-0 text-right text-[13px] text-muted-foreground">
        {batch.created_at ? new Date(batch.created_at).toLocaleString() : ""}
      </span>
      <span className="w-32 shrink-0 flex items-center justify-end gap-2 text-[13px]">
        <span className="text-success">{batch.passed_rows ?? 0} ✓</span>
        <span className="text-destructive">{batch.failed_rows ?? 0} ✗</span>
        <span className="text-muted-foreground">/ {batch.total_rows ?? 0}</span>
      </span>
      <span className="w-24 shrink-0 flex justify-end">
        <span className={`rounded-[6px] border px-2 py-0.5 text-xs font-normal ${
          isCompleted ? "border-success text-success" : "border-blue-400 text-blue-500"
        }`}>
          {batch.status}
        </span>
      </span>
      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        View →
      </span>
    </button>
  );
}

/* ─── Pagination ──────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="flex items-center justify-between border-t border-border px-8 py-3">
      <p className="text-[13px] tracking-[0.5px] text-muted-foreground tabular-nums">
        {from}–{to} of {total} runs
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[6px] bg-surface shadow-[0px_4px_14px_rgba(0,0,0,0.2)] text-muted-foreground hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[13px] text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-[38px] min-w-[38px] rounded-[6px] px-2 text-[13px] font-medium transition-colors ${
                p === page
                  ? "bg-[linear-gradient(180deg,#60a5fa_0%,#2563eb_100%)] text-white shadow-[0px_4px_14px_rgba(0,0,0,0.2)]"
                  : "bg-surface shadow-[0px_4px_14px_rgba(0,0,0,0.2)] text-muted-foreground hover:bg-surface-2"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[6px] bg-surface shadow-[0px_4px_14px_rgba(0,0,0,0.2)] text-muted-foreground hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "cases",    label: "Test Cases",   icon: LayoutList },
  { id: "sheets",   label: "Test Sheets",  icon: Sheet },
  { id: "datasets", label: "Dataset Runs", icon: Database },
];

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function TestResultsPage() {
  const { project, projectId } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cases");

  const {
    individualRuns = [],
    sheetRuns = [],
    datasetBatches = [],
    summary = { totalRuns: 0, passed: 0, failed: 0, passRate: "0%" },
    pagination = { total: 0, page: 1, pageSize: 15, totalPages: 1 },
    setPage,
    loading,
    error,
  } = useTestResults(projectId ?? project?.id);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setPage]);

  const pid = projectId ?? project?.id;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading results…" />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={() => window.location.reload()} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 border-b border-border px-8 py-7">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-[30px] tracking-[0.5px] text-foreground">
            Test Results
          </h1>
          <p className="mt-1.5 text-[14px] tracking-[0.5px] text-muted-foreground">
            All test case and test sheet runs
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          Live
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === "cases" ? pagination.total : id === "sheets" ? sheetRuns.length : datasetBatches.length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex h-[50px] items-center gap-2 px-6 text-[16px] font-bold tracking-[0.5px] transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                isActive ? "bg-muted text-muted-foreground" : "bg-muted/60 text-muted-foreground"
              }`}>
                {count}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Test Cases tab ─────────────────────────────────────────────── */}
      {activeTab === "cases" && (
        <>
          <StatStrip items={[
            { label: "Total Runs", value: summary.totalRuns },
            { label: "Passed",     value: summary.passed },
            { label: "Failed",     value: summary.failed },
            { label: "Pass Rate",  value: summary.passRate },
          ]} />

          <TableHeader>
            <ColHead className="flex-1">Test Case</ColHead>
            <ColHead className="w-44 text-right">Date</ColHead>
            <ColHead className="w-32 text-right">Status</ColHead>
            <ColHead className="w-14" />
          </TableHeader>

          {individualRuns.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-[14px] font-medium text-muted-foreground">No test case runs yet</p>
              <p className="text-[13px] text-muted-foreground/60">Run a test case to see results here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {individualRuns.map((run, index) => (
                <RunRow key={`run-${run.id}`} run={run} projectId={pid} rowIndex={index} />
              ))}
            </div>
          )}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* ── Test Sheets tab ─────────────────────────────────────────────── */}
      {activeTab === "sheets" && (
        <>
          <StatStrip items={[
            { label: "Sheet Runs",   value: sheetRuns.length },
            { label: "Passed",       value: sheetRuns.reduce((s, r) => s + (r.passed ?? 0), 0) },
            { label: "Failed",       value: sheetRuns.reduce((s, r) => s + (r.failed ?? 0), 0) },
            { label: "Total Cases",  value: sheetRuns.reduce((s, r) => s + (r.totalCases ?? 0), 0) },
          ]} />

          <TableHeader>
            <ColHead className="flex-1">Sheet Name</ColHead>
            <ColHead className="w-44 text-right">Date</ColHead>
            <ColHead className="w-20 text-right">Results</ColHead>
            <ColHead className="w-32 text-right">Status</ColHead>
            <ColHead className="w-14" />
          </TableHeader>

          {sheetRuns.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-[14px] font-medium text-muted-foreground">No test sheet runs yet</p>
              <p className="text-[13px] text-muted-foreground/60">Run a test sheet to see results here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[...sheetRuns]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((run, index) => (
                  <SheetRunRow
                    key={`sheet-${run.id}`}
                    run={run}
                    onClick={() => navigate(`/projects/${pid}/test-runs/sheet/${run.id}`)}
                    rowIndex={index}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {/* ── Dataset Runs tab ────────────────────────────────────────────── */}
      {activeTab === "datasets" && (
        <>
          <StatStrip items={[
            { label: "Batches",      value: datasetBatches.length },
            { label: "Passed Rows",  value: datasetBatches.reduce((s, b) => s + (b.passed_rows ?? 0), 0) },
            { label: "Failed Rows",  value: datasetBatches.reduce((s, b) => s + (b.failed_rows ?? 0), 0) },
          ]} />

          <TableHeader>
            <ColHead className="flex-1">Test Case</ColHead>
            <ColHead className="w-44 text-right">Date</ColHead>
            <ColHead className="w-32 text-right">Results</ColHead>
            <ColHead className="w-24 text-right">Status</ColHead>
            <ColHead className="w-14" />
          </TableHeader>

          {datasetBatches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Database className="mx-auto size-8 text-muted-foreground/30" />
              <p className="text-[14px] font-medium text-muted-foreground">No dataset runs yet</p>
              <p className="text-[13px] text-muted-foreground/60">Run a dataset batch from a test case to see results here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {datasetBatches.map((batch, index) => (
                <DatasetRunRow
                  key={batch.id}
                  batch={batch}
                  onClick={() => navigate(`/projects/${pid}/test-runs/batches/${batch.id}`)}
                  rowIndex={index}
                />
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
