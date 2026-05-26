import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  History,
  Pencil,
  Check,
  X,
  Settings2,
  Database,
  RotateCcw,
  Eye,
  Table,
} from "lucide-react";
import {
  getTestSheet,
  addSheetItems,
  removeSheetItem,
  runTestSheet,
  updateTestSheet,
  getSheetRuns,
  getSuiteRunOptions,
} from "@/features/test-collection/api/testSheetApi";
import {
  getTestCases,
  getTestCaseScripts,
} from "@/features/test-cases/api/testCasesApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_STYLES = {
  pass: "bg-emerald-100 text-emerald-700",
  fail: "bg-red-100 text-red-700",
  error: "bg-orange-100 text-orange-700",
  completed: "bg-blue-100 text-blue-700",
  running: "bg-yellow-100 text-yellow-700",
  queued: "bg-slate-100 text-slate-600",
};

function getVerifyStatus(row, datasetId) {
  if (!datasetId) {
    return {
      label: "Not configured",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      isConfigured: false,
      isCompatible: true,
      message: "No dataset selected.",
    };
  }

  const dataset = row.availableDatasets?.find(
    (d) => String(d.id) === String(datasetId)
  );

  if (!dataset) {
    return {
      label: "Needs review",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      isConfigured: false,
      isCompatible: false,
      message: "Selected dataset was not found in run options.",
    };
  }

  const status = dataset.compatibility?.status;
  const message = dataset.compatibility?.message;

  if (status === "incompatible") {
    return {
      label: "Not compatible",
      className: "bg-red-100 text-red-700 border-red-200",
      isConfigured: true,
      isCompatible: false,
      message,
    };
  }

  if (status === "default") {
    return {
      label: "Default data",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      isConfigured: true,
      isCompatible: true,
      message,
    };
  }

  if (status === "linked") {
    return {
      label: "Linked data",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      isConfigured: true,
      isCompatible: true,
      message,
    };
  }

  if (status === "compatible") {
    return {
      label: "Compatible",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      isConfigured: true,
      isCompatible: true,
      message,
    };
  }

  return {
    label: "Needs review",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    isConfigured: true,
    isCompatible: true,
    message: message || "Compatibility could not be fully verified.",
  };
}

function getSelectedDataset(row, selectedByCase) {
  const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";

  return row.availableDatasets?.find(
    (dataset) => String(dataset.id) === String(selectedDatasetId)
  );
}

function getScriptLabel(script, index) {
  return (
    script.name ||
    script.title ||
    script.scriptName ||
    script.label ||
    `Replay Script #${script.id ?? index + 1}`
  );
}

function getDatasetPreviewRows(dataset) {
  if (!dataset) return [];

  if (Array.isArray(dataset.previewRows)) return dataset.previewRows;
  if (Array.isArray(dataset.sampleRows)) return dataset.sampleRows;
  if (Array.isArray(dataset.rows)) return dataset.rows;

  return [];
}

function getDatasetFields(dataset) {
  if (!dataset) return [];

  if (Array.isArray(dataset.fields)) return dataset.fields;

  const rows = getDatasetPreviewRows(dataset);
  if (rows.length > 0 && typeof rows[0] === "object") {
    return Object.keys(rows[0]);
  }

  return [];
}

function AddCasesDialog({ open, onClose, onAdded, projectId, existingIds }) {
  const [allCases, setAllCases] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getTestCases(projectId).then(setAllCases).catch(() => {});
    setSelected(new Set());
  }, [open, projectId]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    const ids = [...selected];
    if (ids.length === 0) return;

    try {
      setSaving(true);
      await onAdded(ids);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const available = allCases.filter(
    (tc) => !existingIds.has(tc.id ?? tc.testCaseId)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Test Cases</DialogTitle>
        </DialogHeader>

        <div className="mt-2 max-h-80 overflow-y-auto divide-y rounded-lg border">
          {available.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              All test cases are already in this sheet
            </p>
          ) : (
            available.map((tc) => {
              const id = tc.id ?? tc.testCaseId;

              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => toggle(id)}
                    className="mt-0.5 accent-indigo-600"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tc.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tc.goal}
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button disabled={selected.size === 0 || saving} onClick={handleAdd}>
            {saving
              ? "Adding..."
              : `Add ${selected.size > 0 ? selected.size : ""} Case${
                  selected.size !== 1 ? "s" : ""
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DatasetPreviewDialog({ open, onClose, dataset }) {
  const fields = getDatasetFields(dataset);
  const rows = getDatasetPreviewRows(dataset);
  const previewRows = rows.slice(0, 10);

  const compatibilityStatus = dataset?.compatibility?.status;
  const compatibilityMessage = dataset?.compatibility?.message;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="size-4 text-indigo-600" />
            Dataset Preview
          </DialogTitle>
        </DialogHeader>

        {!dataset ? (
          <div className="rounded-xl border border-dashed bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              No dataset selected
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Please choose a dataset first to preview its data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {dataset.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {dataset.rowCount
                      ? `${dataset.rowCount} row(s)`
                      : "Row count is not available"}
                    {fields.length > 0 ? ` · ${fields.length} field(s)` : ""}
                  </p>
                </div>

                {compatibilityStatus && (
                  <Badge variant="outline" className="capitalize">
                    {compatibilityStatus}
                  </Badge>
                )}
              </div>

              {compatibilityMessage && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {compatibilityMessage}
                </p>
              )}
            </div>

            {fields.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fields
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {fields.map((field) => (
                    <span
                      key={field}
                      className="rounded-full border bg-white px-2 py-1 text-xs text-slate-600"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {previewRows.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No preview rows available
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  This API response currently only provides dataset metadata.
                  To preview real rows, the backend should return previewRows,
                  sampleRows, or rows for each dataset.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Preview rows
                  </p>

                  <p className="text-xs text-slate-400">
                    Showing {previewRows.length} row
                    {previewRows.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="max-h-[420px] overflow-auto rounded-xl border">
                  <table className="min-w-full divide-y text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        {fields.map((field) => (
                          <th
                            key={field}
                            className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y bg-white">
                      {previewRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-slate-50">
                          {fields.map((field) => (
                            <td
                              key={field}
                              className="max-w-[220px] truncate px-3 py-2 text-xs text-slate-600"
                              title={String(row?.[field] ?? "")}
                            >
                              {row?.[field] === null ||
                              row?.[field] === undefined ||
                              row?.[field] === ""
                                ? "—"
                                : String(row[field])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TestSuiteDetailPage() {
  const { projectId, sheetId } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [items, setItems] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [running, setRunning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [runOptions, setRunOptions] = useState([]);
  const [selectedByCase, setSelectedByCase] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const [runConfigWarning, setRunConfigWarning] = useState("");

  const [scriptsByCase, setScriptsByCase] = useState({});
  const [selectedScriptByCase, setSelectedScriptByCase] = useState({});
  const [scriptsLoadingByCase, setScriptsLoadingByCase] = useState({});
  const [scriptsErrorByCase, setScriptsErrorByCase] = useState({});

  const [previewDataset, setPreviewDataset] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef(null);
  const descInputRef = useRef(null);

  const loadScriptsForCases = useCallback(async (optionItems) => {
    const loadingMap = {};
    const errorMap = {};
    const scriptsMap = {};

    optionItems.forEach((item) => {
      loadingMap[item.testCaseId] = true;
      errorMap[item.testCaseId] = "";
      scriptsMap[item.testCaseId] = [];
    });

    setScriptsLoadingByCase(loadingMap);
    setScriptsErrorByCase(errorMap);

    await Promise.all(
      optionItems.map(async (item) => {
        try {
          const scriptsData = await getTestCaseScripts(item.testCaseId);

          scriptsMap[item.testCaseId] = Array.isArray(scriptsData)
            ? scriptsData
            : [];
          errorMap[item.testCaseId] = "";
        } catch (e) {
          scriptsMap[item.testCaseId] = [];
          errorMap[item.testCaseId] =
            e?.message || "Failed to load replay scripts.";
        } finally {
          loadingMap[item.testCaseId] = false;
        }
      })
    );

    setScriptsByCase({ ...scriptsMap });
    setScriptsLoadingByCase({ ...loadingMap });
    setScriptsErrorByCase({ ...errorMap });

    setSelectedScriptByCase((prev) => {
      const next = {};

      optionItems.forEach((item) => {
        const scripts = scriptsMap[item.testCaseId] ?? [];
        const prevSelected = prev[item.testCaseId];

        const prevStillExists =
          prevSelected &&
          scripts.some((script) => String(script.id) === String(prevSelected));

        next[item.testCaseId] = prevStillExists
          ? String(prevSelected)
          : scripts[0]?.id
          ? String(scripts[0].id)
          : "";
      });

      return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setConfigLoading(true);
      setError("");
      setConfigError("");
      setRunConfigWarning("");

      const [sheetData, runsData, runOptionsData] = await Promise.all([
        getTestSheet(sheetId),
        getSheetRuns(projectId),
        getSuiteRunOptions(sheetId),
      ]);

      setSheet(sheetData);
      setItems(sheetData?.items ?? []);

      const optionItems = runOptionsData?.items ?? [];
      setRunOptions(optionItems);

      const initialDatasetSelection = {};
      optionItems.forEach((item) => {
        const defaultDataset = item.availableDatasets?.find(
          (d) => d.isDefault
        );

        initialDatasetSelection[item.testCaseId] = defaultDataset?.id
          ? String(defaultDataset.id)
          : "";
      });

      setSelectedByCase(initialDatasetSelection);

      setRecentRuns(
        (runsData ?? [])
          .filter((r) => String(r.testSheetId) === String(sheetId))
          .slice(0, 5)
      );

      await loadScriptsForCases(optionItems);
    } catch (e) {
      setError(e?.message || "Failed to load sheet.");
      setConfigError(e?.message || "Failed to load run configuration.");
    } finally {
      setLoading(false);
      setConfigLoading(false);
    }
  }, [sheetId, projectId, loadScriptsForCases]);

  useEffect(() => {
    load();
  }, [load]);

  function startEditTitle() {
    setDraftTitle(sheet?.name ?? "");
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function startEditDesc() {
    setDraftDesc(sheet?.description ?? "");
    setEditingDesc(true);
    setTimeout(() => descInputRef.current?.focus(), 0);
  }

  async function saveTitle() {
    if (!draftTitle.trim() || draftTitle === sheet?.name) {
      setEditingTitle(false);
      return;
    }

    try {
      setSaving(true);
      await updateTestSheet(sheetId, {
        name: draftTitle.trim(),
        description: sheet?.description,
      });
      setSheet((prev) => ({ ...prev, name: draftTitle.trim() }));
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveDesc() {
    if (draftDesc === (sheet?.description ?? "")) {
      setEditingDesc(false);
      return;
    }

    try {
      setSaving(true);
      await updateTestSheet(sheetId, {
        name: sheet?.name,
        description: draftDesc.trim() || null,
      });
      setSheet((prev) => ({
        ...prev,
        description: draftDesc.trim() || null,
      }));
    } finally {
      setSaving(false);
      setEditingDesc(false);
    }
  }

  async function handleAddItems(testCaseIds) {
    await addSheetItems(sheetId, testCaseIds);
    load();
  }

  async function handleRemoveItem(itemId) {
    setRemovingId(itemId);

    try {
      await removeSheetItem(sheetId, itemId);
      load();
    } finally {
      setRemovingId(null);
    }
  }

  async function handleRun() {
    try {
      setRunConfigWarning("");

      if (items.length === 0) {
        setRunConfigWarning(
          "This suite has no test cases. Please add test cases before running."
        );
        return;
      }

      if (configLoading) {
        setRunConfigWarning(
          "Run configuration is still loading. Please wait a moment."
        );
        return;
      }

      if (configError) {
        setRunConfigWarning(
          "Run configuration could not be loaded. Please refresh and try again."
        );
        return;
      }

      const missingConfigs = runOptions.filter((row) => {
        const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";
        const hasDatasetOptions =
          Array.isArray(row.availableDatasets) &&
          row.availableDatasets.length > 0;

        if (!hasDatasetOptions) return false;

        return !selectedDatasetId;
      });

      const incompatibleConfigs = runOptions.filter((row) => {
        const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";
        if (!selectedDatasetId) return false;

        const verify = getVerifyStatus(row, selectedDatasetId);
        return !verify.isCompatible;
      });

      if (incompatibleConfigs.length > 0) {
        setRunConfigWarning(
          `Please choose compatible data for ${incompatibleConfigs.length} test case(s) before running the suite.`
        );
        return;
      }

      if (missingConfigs.length > 0) {
        setRunConfigWarning(
          `Please configure test data for ${missingConfigs.length} test case(s) before running the suite.`
        );
        return;
      }

      const runConfig = {
        items: runOptions.map((row) => ({
          testCaseId: row.testCaseId,
          datasetId: selectedByCase[row.testCaseId]
            ? Number(selectedByCase[row.testCaseId])
            : null,
          executionScriptId: selectedScriptByCase[row.testCaseId]
            ? Number(selectedScriptByCase[row.testCaseId])
            : null,
          rowIndex: null,
        })),
      };

      setRunning(true);

      const result = await runTestSheet(sheetId, runConfig);
      const runId = result?.sheetRun?.id;

      if (runId) {
        navigate(`/projects/${projectId}/test-runs/sheet/${runId}`);
      } else {
        setRunConfigWarning("Suite run was started but no run id was returned.");
      }
    } catch (e) {
      setError(e?.message || "Failed to start sheet run.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading sheet..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={load} onRetry={load} />;
  }

  const existingIds = new Set(items.map((i) => i.testCaseId));

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(`/projects/${projectId}/suites`)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All Suites
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  onBlur={saveTitle}
                  className="w-full min-w-0 border-b-2 border-indigo-500 bg-transparent text-2xl font-bold tracking-tight outline-none"
                  disabled={saving}
                />

                <button
                  onClick={saveTitle}
                  className="shrink-0 text-indigo-600 hover:text-indigo-800"
                >
                  <Check className="size-4" />
                </button>

                <button
                  onClick={() => setEditingTitle(false)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                className="group flex cursor-pointer items-center gap-2"
                onClick={startEditTitle}
              >
                <h1 className="truncate text-2xl font-bold tracking-tight">
                  {sheet?.name ?? "Test Suite"}
                </h1>

                <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )}

            {editingDesc ? (
              <div className="flex items-center gap-2">
                <input
                  ref={descInputRef}
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveDesc();
                    if (e.key === "Escape") setEditingDesc(false);
                  }}
                  onBlur={saveDesc}
                  placeholder="Add a description..."
                  className="w-full min-w-0 border-b border-indigo-400 bg-transparent text-sm text-muted-foreground outline-none"
                  disabled={saving}
                />

                <button
                  onClick={saveDesc}
                  className="shrink-0 text-indigo-600 hover:text-indigo-800"
                >
                  <Check className="size-3.5" />
                </button>

                <button
                  onClick={() => setEditingDesc(false)}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div
                className="group flex cursor-pointer items-center gap-1.5"
                onClick={startEditDesc}
              >
                <p className="truncate text-sm text-muted-foreground">
                  {sheet?.description ||
                    `${items.length} test case${items.length !== 1 ? "s" : ""}`}
                </p>

                <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(true)}
              className="gap-2"
            >
              <Plus className="size-4" />
              Add Cases
            </Button>

            <Button
              onClick={handleRun}
              disabled={running || items.length === 0}
              className="gap-2"
            >
              <Play className="size-4" />
              {running ? "Starting..." : "Run Suite"}
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-xl border bg-white">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Settings2 className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Suite Run Configuration
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure test data and replay scripts before running this
                suite. Cases without available data can still run normally.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="shrink-0">
            {runOptions.length} case{runOptions.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {runConfigWarning && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{runConfigWarning}</span>
          </div>
        )}

        {configError && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{configError}</span>
          </div>
        )}

        {configLoading ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            Loading run configuration...
          </div>
        ) : runOptions.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No run configuration available.
          </div>
        ) : (
          <div className="divide-y">
            {runOptions.map((row, index) => {
              const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";
              const selectedDataset = getSelectedDataset(row, selectedByCase);
              const verify = getVerifyStatus(row, selectedDatasetId);
              const hasDatasets = (row.availableDatasets ?? []).length > 0;

              const sheetItem = items.find(
                (item) => String(item.testCaseId) === String(row.testCaseId)
              );

              const scripts = scriptsByCase[row.testCaseId] ?? [];
              const selectedScriptId =
                selectedScriptByCase[row.testCaseId] ?? "";
              const scriptsLoading =
                scriptsLoadingByCase[row.testCaseId] ?? false;
              const scriptsError = scriptsErrorByCase[row.testCaseId] ?? "";
              const hasScripts = scripts.length > 0;

              return (
                <div
                  key={row.testCaseId}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_220px_220px_170px]"
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/projects/${projectId}/test-cases/${row.testCaseId}`
                            )
                          }
                          title="Open test case"
                          className="block max-w-full truncate text-left font-medium text-slate-900 transition-colors hover:text-indigo-600 hover:underline"
                        >
                          {row.title}
                        </button>

                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {row.goal || "No goal provided"}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {selectedDataset && (
                            <span className="inline-flex items-center gap-1.5">
                              <Database className="size-3.5" />
                              Selected data:{" "}
                              <span className="font-medium">
                                {selectedDataset.name}
                              </span>
                            </span>
                          )}

                          {selectedScriptId && (
                            <span className="inline-flex items-center gap-1.5">
                              <RotateCcw className="size-3.5" />
                              Replay script selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Test data
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDataset(selectedDataset || null);
                          setPreviewOpen(true);
                        }}
                        disabled={!selectedDataset}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                        title={
                          selectedDataset
                            ? "Preview selected dataset"
                            : "Select a dataset to preview"
                        }
                      >
                        <Eye className="size-3" />
                        View
                      </button>
                    </div>

                    <select
                      value={selectedDatasetId}
                      onChange={(e) => {
                        setSelectedByCase((prev) => ({
                          ...prev,
                          [row.testCaseId]: e.target.value,
                        }));
                        setRunConfigWarning("");
                      }}
                      disabled={!hasDatasets}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {hasDatasets ? "Select data" : "Run without data"}
                      </option>

                      {(row.availableDatasets ?? []).map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name}
                          {dataset.isDefault ? " (default)" : ""}
                          {dataset.rowCount
                            ? ` - ${dataset.rowCount} row(s)`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Replay script
                    </label>

                    <select
                      value={selectedScriptId}
                      onChange={(e) => {
                        setSelectedScriptByCase((prev) => ({
                          ...prev,
                          [row.testCaseId]: e.target.value,
                        }));
                        setRunConfigWarning("");
                      }}
                      disabled={scriptsLoading || !hasScripts}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {scriptsLoading
                          ? "Loading replay scripts..."
                          : hasScripts
                          ? "Run without replay script"
                          : "No replay scripts"}
                      </option>

                      {scripts.map((script, scriptIndex) => (
                        <option key={script.id} value={script.id}>
                          {getScriptLabel(script, scriptIndex)}
                        </option>
                      ))}
                    </select>

                    {scriptsError && (
                      <p className="mt-1 text-[11px] leading-snug text-red-500">
                        {scriptsError}
                      </p>
                    )}

                    {!scriptsLoading && !scriptsError && hasScripts && (
                      <p className="mt-1 text-[11px] leading-snug text-slate-400">
                        {scripts.length} replay script
                        {scripts.length !== 1 ? "s" : ""} available
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start lg:items-end">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`border px-3 py-1 text-xs font-semibold ${verify.className}`}
                      >
                        {verify.label}
                      </Badge>

                      {sheetItem && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(sheetItem.id)}
                          disabled={removingId === sheetItem.id}
                          title="Remove this test case from suite"
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    {verify.message && (
                      <p className="mt-2 max-w-[220px] text-left text-[11px] leading-snug text-slate-500 lg:text-right">
                        {verify.message}
                      </p>
                    )}

                    {selectedDataset?.fields?.length > 0 && (
                      <p className="mt-1 max-w-[220px] text-left text-[10px] leading-snug text-slate-400 lg:text-right">
                        Fields: {selectedDataset.fields.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {recentRuns.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Runs
            </h2>

            <button
              onClick={() => navigate(`/projects/${projectId}/test-runs`)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              <History className="size-3" />
              View all
            </button>
          </div>

          <div className="divide-y rounded-xl border bg-white">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-slate-50"
                onClick={() =>
                  navigate(`/projects/${projectId}/test-runs/sheet/${run.id}`)
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  {run.status === "completed" ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  ) : run.status === "running" ? (
                    <Clock className="size-4 shrink-0 animate-pulse text-yellow-500" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-medium">Run #{run.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <span className="font-medium text-emerald-600">
                    {run.passed} pass
                  </span>
                  <span className="text-red-500">{run.failed} fail</span>

                  <Badge
                    className={`${
                      STATUS_STYLES[run.status] ??
                      "bg-slate-100 text-slate-600"
                    } capitalize`}
                  >
                    {run.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AddCasesDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={handleAddItems}
        projectId={projectId}
        existingIds={existingIds}
      />

      <DatasetPreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewDataset(null);
        }}
        dataset={previewDataset}
      />
    </div>
  );
}