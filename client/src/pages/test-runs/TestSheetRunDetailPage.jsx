import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react";

import { useTestSheetRun } from "@/features/test-collection/hooks/useTestSheetRun";
import {
  getTestRunDetail,
  analyzeSheetRun,
} from "@/features/test-results/api/testResultsApi";

import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import StepResult from "@/shared/components/common/StepResult";
import AiAnalysisSection from "@/shared/components/common/AiAnalysisSection";

import { Badge } from "@/components/ui/badge";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatDuration(start, end) {
  if (!start || !end) return "—";

  const ms = new Date(end) - new Date(start);
  if (ms < 0) return "—";

  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);

  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function getRunTypeLabel(item) {
  const runMode = item.runMode ?? item.run_mode;

  if (runMode === "agent") return "Agent";
  if (runMode === "replay") return "Replay";

  if (
    item.executionScriptId ||
    item.execution_script_id ||
    item.scriptId ||
    item.script_id
  ) {
    return "Replay";
  }

  return "Agent";
}

function getDatasetLabel(item) {
  const datasetId = item.datasetId ?? item.dataset_id;

  return (
    item.datasetName ??
    item.dataset_name ??
    item.testDataName ??
    item.test_data_name ??
    (datasetId ? `Dataset #${datasetId}` : "—")
  );
}

function getScriptLabelForItem(item) {
  const runType = getRunTypeLabel(item);

  if (runType === "Agent") return "—";

  const scriptId =
    item.executionScriptId ??
    item.execution_script_id ??
    item.scriptId ??
    item.script_id;

  return (
    item.scriptName ??
    item.script_name ??
    item.scriptLabel ??
    item.script_label ??
    item.executionScriptName ??
    item.execution_script_name ??
    item.replayScriptName ??
    item.replay_script_name ??
    (scriptId ? `Script #${scriptId}` : "—")
  );
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

function StatCard({ label, value, color }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-4 ${color}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm font-medium opacity-70">{label}</span>
    </div>
  );
}

const VERDICT_ICON = {
  pass: <CheckCircle2 className="size-4 text-emerald-500" />,
  pass_with_warning: <CheckCircle2 className="size-4 text-amber-500" />,
  fail: <XCircle className="size-4 text-red-500" />,
  error: <AlertTriangle className="size-4 text-orange-500" />,
};

const ITEM_STATUS_BADGE = {
  completed: "bg-emerald-500/15 text-emerald-500",
  failed: "bg-red-500/15 text-red-400",
  cancelled: "bg-muted text-muted-foreground",
  running: "bg-yellow-500/15 text-yellow-500",
  queued: "bg-brand-500/10 text-brand-400",
  pending: "bg-muted text-muted-foreground",
};

/* ─── Test Case Item Row ──────────────────────────────────────────────────── */

function TestCaseItem({ item, idx, isExpanded, onToggle, stepData }) {
  const isLive = item.status === "running" || item.status === "queued";
  const hasRun = !!item.testRunId;

  const runType = getRunTypeLabel(item);
  const datasetLabel = getDatasetLabel(item);
  const scriptLabel = getScriptLabelForItem(item);

  return (
    <div className="border-b last:border-b-0">
      <div
        className="grid items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
        style={{
          gridTemplateColumns:
            "32px minmax(220px,1.5fr) 120px 180px 180px 100px 100px 90px",
        }}
      >
        <span className="text-center font-mono text-xs text-muted-foreground">
          {idx + 1}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {VERDICT_ICON[item.verdict] ?? (
              <div className="size-4 shrink-0 rounded-full border-2 border-border" />
            )}

            <p className="truncate font-medium text-foreground">
              {item.title}
            </p>
          </div>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.goal || "No goal provided"}
          </p>
        </div>

        <Badge
          className={
            runType === "Agent"
              ? "w-fit border border-brand-500/20 bg-brand-500/10 text-brand-500"
              : "w-fit border border-violet-500/20 bg-violet-500/10 text-violet-500"
          }
        >
          {runType}
        </Badge>

        <p
          className="truncate text-sm text-muted-foreground"
          title={runType === "Agent" ? "Not required" : datasetLabel}
        >
          {runType === "Agent" ? "Not required" : datasetLabel}
        </p>

        <p
          className="truncate text-sm text-muted-foreground"
          title={scriptLabel}
        >
          {scriptLabel}
        </p>

        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDuration(item.startedAt, item.finishedAt)}
        </span>

        <Badge
          className={`w-fit text-xs capitalize ${
            ITEM_STATUS_BADGE[item.status] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {item.verdict ?? item.status}
        </Badge>

        <div className="flex justify-end">
          {hasRun ? (
            <button
              type="button"
              onClick={() => onToggle(item)}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isExpanded ? "Hide" : "Steps"}
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : isLive ? (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )}
        </div>
      </div>

      {isExpanded && hasRun && (
        <div className="border-t border-border bg-muted/20 px-6 py-5">
          {stepData?.loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" />
              Loading steps…
            </div>
          ) : stepData?.error ? (
            <p className="py-2 text-sm text-red-400">{stepData.error}</p>
          ) : stepData?.steps?.length ? (
            <div>
              <p className="mb-4 text-xs font-medium text-muted-foreground">
                {stepData.steps.length} steps recorded
              </p>

              {stepData.steps.map((step, i) => (
                <StepResult
                  key={step.id}
                  step={step}
                  stepIndex={i}
                  isLast={i === stepData.steps.length - 1}
                />
              ))}
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-2 py-2 text-sm text-blue-400">
              <LoadingSpinner size="sm" />
              Waiting for steps…
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              No steps recorded for this test case.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TestSuiteRunDetailPage() {
  const { projectId, runId } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useTestSheetRun(runId);

  const [expandedItemId, setExpandedItemId] = useState(null);
  const [itemDetails, setItemDetails] = useState({});
  const prevItemStatusRef = useRef({});

  const handleToggleItem = async (item) => {
    if (!item.testRunId) return;

    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      return;
    }

    setExpandedItemId(item.id);

    if (!itemDetails[item.testRunId]) {
      setItemDetails((prev) => ({
        ...prev,
        [item.testRunId]: { loading: true },
      }));
    }

    try {
      const detail = await getTestRunDetail(item.testRunId);

      setItemDetails((prev) => ({
        ...prev,
        [item.testRunId]: {
          steps: detail.steps ?? [],
          loading: false,
        },
      }));
    } catch (e) {
      setItemDetails((prev) => ({
        ...prev,
        [item.testRunId]: {
          error: e?.message || "Failed to load steps",
          loading: false,
        },
      }));
    }
  };

  useEffect(() => {
    if (!expandedItemId || !data?.items) return;

    const item = data.items.find((i) => i.id === expandedItemId);
    if (!item?.testRunId) return;

    const isItemLive = ["running", "queued", "pending"].includes(item.status);
    const prev = prevItemStatusRef.current[item.id];

    const justCompleted =
      prev &&
      ["running", "queued", "pending"].includes(prev) &&
      !isItemLive;

    prevItemStatusRef.current[item.id] = item.status;

    if (!isItemLive && !justCompleted) return;

    getTestRunDetail(item.testRunId)
      .then((detail) => {
        setItemDetails((prevDetails) => ({
          ...prevDetails,
          [item.testRunId]: {
            steps: detail.steps ?? [],
            loading: false,
          },
        }));
      })
      .catch(() => {});
  }, [data, expandedItemId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading run results..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={() => window.history.back()} />;
  }

  const run = data?.run;
  const items = data?.items ?? [];

  if (!run) return null;

  const completedCount = run.passed + run.failed + (run.errored ?? 0);
  const failedCount = (run.failed ?? 0) + (run.errored ?? 0);
  const passRate =
    run.totalCases > 0 ? Math.round((run.passed / run.totalCases) * 100) : 0;

  const isLive = ["queued", "running"].includes(run.status);

  const suiteName = run.sheetName ?? `#${run.id}`;
  const title = (
    <span className="break-words">
      Run TestSuite{" "}
      {run.testSuiteId ? (
        <button
          type="button"
          onClick={() =>
            navigate(`/projects/${projectId}/suites/${run.testSuiteId}`)
          }
          className="text-brand-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
          title="Open test suite"
        >
          {suiteName}
        </button>
      ) : (
        suiteName
      )}
    </span>
  );

  const description = isLive
    ? `Run #${run.id} · Running… results update automatically`
    : `Run #${run.id}${
        run.completedAt
          ? ` · Completed ${new Date(run.completedAt).toLocaleString()}`
          : ""
      }`;

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/test-runs`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Test Runs
        </button>

        <PageHeader
          title={title}
          description={description}
          action={
            isLive ? (
              <div className="flex items-center gap-2 rounded-lg border bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-500">
                <Clock className="size-4 animate-pulse" />
                Live
              </div>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total"
          value={run.totalCases}
          color="bg-card border-border"
        />

        <StatCard
          label="Passed"
          value={run.passed}
          color="bg-emerald-500/10 border-emerald-500/20"
        />

        <StatCard
          label="Failed"
          value={failedCount}
          color="bg-red-500/10 border-red-500/20"
        />

        <StatCard
          label="Pass Rate"
          value={`${passRate}%`}
          color="bg-brand-500/10 border-brand-500/20"
        />
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            {completedCount} / {run.totalCases} completed
          </span>

          <span>
            {formatDuration(
              run.startedAt,
              run.completedAt || new Date().toISOString(),
            )}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      <AiAnalysisSection
        onAnalyze={() => analyzeSheetRun(runId)}
        isLive={isLive}
        initialAnalysis={run.aiAnalysis}
        description={
          isLive
            ? "Analysis will be available once the TestSuite run completes."
            : 'Click "Generate Analysis" to get an AI-powered conclusion and actionable suggestions based on all test case results.'
        }
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          TestSuite Results ({items.length})
        </h2>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div
            className="grid items-center gap-4 border-b border-border bg-muted/40 px-6 py-3"
            style={{
              gridTemplateColumns:
                "32px minmax(220px,1.5fr) 120px 180px 180px 100px 100px 90px",
            }}
          >
            <span />

            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Test Case
            </span>

            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Run Type
            </span>

            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Test Data
            </span>

            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Replay Script
            </span>

            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Duration
            </span>

            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Status
            </span>

            <span className="text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Action
            </span>
          </div>

          <div className="divide-y divide-border">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No test cases found.
              </div>
            ) : (
              items.map((item, idx) => (
                <TestCaseItem
                  key={item.id}
                  item={item}
                  idx={idx}
                  isExpanded={expandedItemId === item.id}
                  onToggle={handleToggleItem}
                  stepData={item.testRunId ? itemDetails[item.testRunId] : null}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}