import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { getVerifyStatus, getSelectedDataset, getScriptLabel } from "./utils";

/* ─── Single config row ──────────────────────────────────────────────── */

function RunConfigRow({
  row,
  index,
  projectId,
  sheetItem,
  selectedDatasetId,
  selectedScriptId,
  scripts,
  scriptsLoading,
  scriptsError,
  removingId,
  onDatasetChange,
  onScriptChange,
  onPreviewDataset,
  onRemoveItem,
  selectedByCase,
}) {
  const navigate = useNavigate();

  const selectedDataset = getSelectedDataset(row, selectedByCase);
  const verify = getVerifyStatus(row, selectedDatasetId);
  const hasDatasets = (row.availableDatasets ?? []).length > 0;
  const hasScripts = scripts.length > 0;

  const datasetOptions = (row.availableDatasets ?? []).map((dataset) => ({
    value: String(dataset.id),
    label: `${dataset.name}${dataset.isDefault ? " (default)" : ""}${dataset.rowCount ? ` · ${dataset.rowCount} rows` : ""}`,
  }));

  const scriptOptions = scripts.map((script, i) => ({
    value: String(script.id),
    label: getScriptLabel(script, i),
  }));

  return (
    <div
      className={`grid items-center gap-4 px-8 py-3 transition-colors ${index % 2 === 0 ? "bg-card" : "bg-muted/50"}`}
      style={{ gridTemplateColumns: "32px 1fr 200px 200px 148px" }}
    >
      {/* # */}
      <span className="text-center text-[13px] tabular-nums text-muted-foreground">
        {index + 1}
      </span>

      {/* Test case info */}
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/test-cases/${row.testCaseId}`)}
          className="block max-w-full truncate text-left text-[14px] text-foreground transition-colors hover:text-brand-600 hover:underline"
          title="Open test case"
        >
          {row.title}
        </button>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
          {row.goal || "No goal provided"}
        </p>
      </div>

      {/* Test data select */}
      <div className="flex items-center gap-1.5">
        <CustomSelect
          value={selectedDatasetId}
          onValueChange={onDatasetChange}
          options={datasetOptions}
          placeholder={hasDatasets ? "Select data" : "Run without data"}
          disabled={!hasDatasets}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => onPreviewDataset(selectedDataset || null)}
          disabled={!selectedDataset}
          title={selectedDataset ? "Preview dataset" : "Select a dataset to preview"}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Eye className="size-3.5" />
        </button>
      </div>

      {/* Replay script select */}
      <div>
        <CustomSelect
          value={selectedScriptId}
          onValueChange={onScriptChange}
          options={scriptOptions}
          placeholder={scriptsLoading ? "Loading…" : hasScripts ? "No replay script" : "No scripts"}
          disabled={scriptsLoading || !hasScripts}
          className="w-full"
        />
        {scriptsError && (
          <p className="mt-1 text-[11px] leading-snug text-destructive">{scriptsError}</p>
        )}
      </div>

      {/* Status + remove */}
      <div className="flex items-center justify-end gap-1.5">
        <span
          className={`rounded-[6px] border px-2 py-0.5 text-[11px] font-medium ${verify.className}`}
          title={verify.message || undefined}
        >
          {verify.label}
        </span>
        {sheetItem && (
          <button
            type="button"
            onClick={() => onRemoveItem(sheetItem.id)}
            disabled={removingId === sheetItem.id}
            title="Remove from suite"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Config table ───────────────────────────────────────────────────── */

export default function RunConfigTable({
  projectId,
  runOptions,
  items,
  configLoading,
  configError,
  runConfigWarning,
  selectedByCase,
  scriptsByCase,
  selectedScriptByCase,
  scriptsLoadingByCase,
  scriptsErrorByCase,
  removingId,
  onDatasetChange,
  onScriptChange,
  onRemoveItem,
  onPreviewDataset,
}) {
  return (
    <section className="rounded-xl border bg-card">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 border-b border-border px-8 py-5">
        <div className="flex items-start gap-3">
          <Settings2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Suite Run Configuration</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Configure test data and replay scripts before running this suite.
              Cases without available data can still run normally.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 text-muted-foreground">
          {runOptions.length} case{runOptions.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Alerts */}
      {runConfigWarning && (
        <div className="mx-8 mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-[13px] text-yellow-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{runConfigWarning}</span>
        </div>
      )}
      {configError && (
        <div className="mx-8 mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{configError}</span>
        </div>
      )}

      {configLoading ? (
        <div className="px-8 py-8 text-center text-[13px] text-muted-foreground">
          Loading run configuration…
        </div>
      ) : runOptions.length === 0 ? (
        <div className="px-8 py-8 text-center text-[13px] text-muted-foreground">
          No run configuration available.
        </div>
      ) : (
        <>
          {/* Column header */}
          <div
            className="grid items-center gap-4 border-b border-border bg-muted/40 px-8"
            style={{ gridTemplateColumns: "32px 1fr 200px 200px 148px", height: 40 }}
          >
            <span />
            <span className="text-[13px] font-bold text-foreground">Test Case</span>
            <span className="text-[13px] font-bold text-foreground">Test Data</span>
            <span className="text-[13px] font-bold text-foreground">Replay Script</span>
            <span className="text-right text-[13px] font-bold text-foreground">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {runOptions.map((row, index) => {
              const sheetItem = items.find(
                (item) => String(item.testCaseId) === String(row.testCaseId)
              );
              return (
                <RunConfigRow
                  key={row.testCaseId}
                  row={row}
                  index={index}
                  projectId={projectId}
                  sheetItem={sheetItem}
                  selectedDatasetId={selectedByCase[row.testCaseId] ?? ""}
                  selectedScriptId={selectedScriptByCase[row.testCaseId] ?? ""}
                  scripts={scriptsByCase[row.testCaseId] ?? []}
                  scriptsLoading={scriptsLoadingByCase[row.testCaseId] ?? false}
                  scriptsError={scriptsErrorByCase[row.testCaseId] ?? ""}
                  removingId={removingId}
                  selectedByCase={selectedByCase}
                  onDatasetChange={(val) => onDatasetChange(row.testCaseId, val)}
                  onScriptChange={(val) => onScriptChange(row.testCaseId, val)}
                  onPreviewDataset={onPreviewDataset}
                  onRemoveItem={onRemoveItem}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
