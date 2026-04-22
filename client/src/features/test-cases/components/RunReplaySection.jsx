import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  RotateCcw,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Database,
  Settings2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { createTestRun, replayTestRun, batchReplayTestRun, parameterizeScript } from "@/features/test-results/api/testResultsApi";
import { listDatasets, getDataset } from "@/features/datasets/api/datasetsApi";
import DatasetTable from "@/features/datasets/components/DatasetTable";
import {
  getCurrentVersionId,
  getRuntimeConfigId,
  toNullablePositiveInt,
  toNullableNonNegativeInt,
  trimOrNull,
  parseJsonObject,
} from "../utils/testCaseUtils";
import ScriptStepEditor from "./ScriptStepEditor";

function safeParseJson(text) {
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function extractTemplateVars(text) {
  if (!text) return [];
  return [...new Set((text.match(/\{\{(\w+)\}\}/g) || []).map((m) => m.slice(2, -2)))];
}

function AdvancedDataset({
  datasetId, setDatasetId,
  datasetAlias, setDatasetAlias,
  rowIndex, setRowIndex,
  rowKey, setRowKey,
}) {
  const [open, setOpen] = useState(false);
  const hasAny = datasetId || datasetAlias || rowIndex || rowKey;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Settings2 className="size-3" />
        Advanced
        {hasAny && (
          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-600">
            dataset set
          </span>
        )}
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <p className="col-span-2 text-[10px] text-slate-400 mb-1">
            Dataset binding — link to pre-stored test data
          </p>
          {[
            { label: "Dataset ID", value: datasetId, onChange: setDatasetId, placeholder: "e.g. 1" },
            { label: "Alias", value: datasetAlias, onChange: setDatasetAlias, placeholder: "e.g. users" },
            { label: "Row Index", value: rowIndex, onChange: setRowIndex, placeholder: "0" },
            { label: "Row Key", value: rowKey, onChange: setRowKey, placeholder: "e.g. admin" },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-[10px] text-slate-400">{label}</label>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalVarInputs({ vars, paramsText, onParamsChange }) {
  if (!vars.length) return null;
  const params = safeParseJson(paramsText);
  function setVar(key, value) {
    onParamsChange(JSON.stringify({ ...params, [key]: value }, null, 2));
  }
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Goal variables</p>
      {vars.map((varName) => (
        <div key={varName}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{varName}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-700">
              {`{{${varName}}}`}
            </span>
          </div>
          <input
            type="text"
            value={params[varName] ?? ""}
            onChange={(e) => setVar(varName, e.target.value)}
            placeholder={`Enter ${varName}…`}
            className="w-full rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50/60 to-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all"
          />
        </div>
      ))}
    </div>
  );
}

function RawJsonToggle({ label, value, onChange, focusRingClass = "focus:ring-emerald-300" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Code2 className="size-3" />
        {label}
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
      {open && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={`mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono outline-none ${focusRingClass} focus:ring-2`}
        />
      )}
    </div>
  );
}

// Dataset tab — pick a project dataset and select a row
function DatasetPicker({ projectId, onSelectRow, onDetailLoaded, selectedRowIndex }) {
  const [datasets, setDatasets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    listDatasets(projectId)
      .then((data) => { if (!cancelled) setDatasets(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingList(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  async function handleSelectDataset(id) {
    setSelectedDatasetId(id);
    setDetail(null);
    onDetailLoaded(null);
    onSelectRow(null, null);
    if (!id) return;
    setLoadingDetail(true);
    try {
      const d = await getDataset(id, projectId);
      setDetail(d);
      onDetailLoaded(d);
    } finally {
      setLoadingDetail(false);
    }
  }

  if (loadingList) {
    return <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>;
  }

  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
        <Database className="size-6 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-medium text-slate-400">No datasets in this project</p>
        <p className="text-[11px] text-slate-300 mt-1">
          Go to the <span className="font-semibold">Data</span> tab to create one
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Select value={selectedDatasetId} onValueChange={handleSelectDataset}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select a dataset…" />
        </SelectTrigger>
        <SelectContent>
          {datasets.map((ds) => (
            <SelectItem key={ds.id} value={String(ds.id)}>
              {ds.name}
              <span className="ml-2 text-slate-400 text-[11px]">
                · {ds.rowCount} {ds.rowCount === 1 ? "row" : "rows"}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loadingDetail && (
        <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
      )}

      {detail && (
        <DatasetTable
          rows={detail.rows}
          readOnly
          selectable
          selectedRowIndex={selectedRowIndex}
          onSelectRow={onSelectRow}
        />
      )}
    </div>
  );
}

export default function RunReplaySection({ tc, projectId, scripts, scriptsLoading, scriptsError, onRunCreated }) {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState("");
  const [datasetAlias, setDatasetAlias] = useState("");
  const [rowIndex, setRowIndex] = useState("");
  const [rowKey, setRowKey] = useState("");
  const [paramsOverrideText, setParamsOverrideText] = useState("{}");
  const [replayParamsText, setReplayParamsText] = useState("{}");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [showScript, setShowScript] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [activeReplayTab, setActiveReplayTab] = useState("steps"); // "steps" | "dataset"
  const [selectedDatasetRowIndex, setSelectedDatasetRowIndex] = useState(null);
  const [selectedDatasetRow, setSelectedDatasetRow] = useState(null); // the actual row object
  const [datasetDetail, setDatasetDetail] = useState(null); // full dataset detail
  // pkey → column name bindings (lifted from ScriptStepEditor)
  const [stepBindings, setStepBindings] = useState({});
  // Inline batch column mapping: "_step_N_text" → "column_name"
  const [batchBindings, setBatchBindings] = useState({});
  // Parameterize: tracks saving state
  const [paramSaving, setParamSaving] = useState(false);

  useEffect(() => {
    if (!selectedScriptId && scripts?.length > 0) {
      setSelectedScriptId(String(scripts[0].id));
    }
  }, [scripts, selectedScriptId]);

  const selectedScript = useMemo(
    () => scripts.find((s) => String(s.id) === selectedScriptId),
    [scripts, selectedScriptId],
  );
  const scriptSteps = useMemo(
    () => selectedScript?.scriptJson?.steps ?? [],
    [selectedScript],
  );

  const goalVars = useMemo(() => extractTemplateVars(tc.goal), [tc.goal]);

  // Columns from the loaded dataset
  const availableColumns = useMemo(() => {
    if (!datasetDetail?.rows?.length) return [];
    const seen = new Set();
    datasetDetail.rows.forEach((row) => Object.keys(row).forEach((k) => seen.add(k)));
    return [...seen];
  }, [datasetDetail]);

  const replayParams = safeParseJson(replayParamsText);
  const hasReplayInputs = useMemo(
    () => Object.keys(replayParams).some((k) => replayParams[k] !== ""),
    [replayParams],
  );
  const filledCount = useMemo(
    () => Object.values(replayParams).filter((v) => v !== "").length,
    [replayParams],
  );

  // Fill steps that still have hardcoded (non-template) text — need legacy column mapping
  const hardcodedFillSteps = useMemo(
    () => scriptSteps.filter(
      (s) => s.actionName === "fill" &&
        s.actionInput?.text !== undefined &&
        !/\{\{[^}]+\}\}/.test(String(s.actionInput.text)),
    ),
    [scriptSteps],
  );

  // Template variables already in the script
  const scriptTemplateVars = useMemo(() => {
    const re = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const vars = new Set();
    let m;
    const src = JSON.stringify(scriptSteps);
    while ((m = re.exec(src)) !== null) vars.add(m[1]);
    return [...vars];
  }, [scriptSteps]);

  // Which template vars are NOT in the selected dataset columns
  const unresolvedVars = useMemo(
    () => scriptTemplateVars.filter((v) => !availableColumns.includes(v)),
    [scriptTemplateVars, availableColumns],
  );

  function handleScriptChange(v) {
    setSelectedScriptId(v);
    setReplayParamsText("{}");
    setSelectedDatasetRowIndex(null);
    setSelectedDatasetRow(null);
    setStepBindings({});
    setBatchBindings({});
    setActiveReplayTab("steps");
  }

  function handleSelectDatasetRow(row, idx) {
    setSelectedDatasetRowIndex(idx);
    setSelectedDatasetRow(row);
    if (row === null) {
      // Keep _step_N_key template bindings, clear column values
      setReplayParamsText((prev) => {
        const existing = safeParseJson(prev);
        const stepEntries = Object.fromEntries(
          Object.entries(existing).filter(([k]) => k.startsWith("_step_")),
        );
        return JSON.stringify(stepEntries, null, 2);
      });
    } else {
      // Merge new row columns with existing _step_N_key template refs
      setReplayParamsText((prev) => {
        const existing = safeParseJson(prev);
        const stepEntries = Object.fromEntries(
          Object.entries(existing).filter(([k]) => k.startsWith("_step_")),
        );
        return JSON.stringify({ ...row, ...stepEntries }, null, 2);
      });
    }
  }

  function handleDetailLoaded(detail) {
    setDatasetDetail(detail);
    setSelectedDatasetRowIndex(null);
    setSelectedDatasetRow(null);
    setReplayParamsText("{}");
    setStepBindings({});
    setBatchBindings({});
    // Reset _step_N_key entries too since column names may differ across datasets
  }

  async function handleCreateRun() {
    setBusyAction("run");
    setActionError("");
    setActionSuccess("");
    try {
      const result = await createTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        datasetId: toNullablePositiveInt(datasetId),
        datasetAlias: trimOrNull(datasetAlias),
        rowIndex: toNullableNonNegativeInt(rowIndex),
        rowKey: trimOrNull(rowKey),
        paramsOverride: parseJsonObject(paramsOverrideText, "Run paramsOverride"),
      });
      setActionSuccess("Run started successfully.");
      await onRunCreated(result?.testRunId || result?.id || null);
    } catch (e) {
      setActionError(e?.message || "Failed to start test run.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleReplayRun() {
    setBusyAction("replay");
    setActionError("");
    setActionSuccess("");
    try {
      const executionScriptId = toNullablePositiveInt(selectedScriptId);
      if (!executionScriptId) throw new Error("Please select an execution script before replay.");
      const result = await replayTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        executionScriptId,
        datasetId: toNullablePositiveInt(datasetId),
        datasetAlias: trimOrNull(datasetAlias),
        rowIndex: toNullableNonNegativeInt(rowIndex),
        rowKey: trimOrNull(rowKey),
        params: parseJsonObject(replayParamsText, "Replay params"),
      });
      setActionSuccess("Replay started successfully.");
      await onRunCreated(result?.testRunId || result?.id || null);
    } catch (e) {
      setActionError(e?.message || "Failed to replay execution script.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleBatchReplay() {
    setBusyAction("batch");
    setActionError("");
    setActionSuccess("");
    try {
      const executionScriptId = toNullablePositiveInt(selectedScriptId);
      if (!executionScriptId) throw new Error("Please select an execution script before batch replay.");
      if (!datasetDetail) throw new Error("Please select a dataset first.");
      const columnBindings = Object.keys(batchBindings).length > 0 ? batchBindings : null;
      const result = await batchReplayTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        executionScriptId,
        datasetId: datasetDetail.id,
        columnBindings,
      });
      setActionSuccess(
        `Batch started: ${result?.totalRows ?? "?"} rows queued (batch #${result?.batchId ?? "?"}).`,
      );
      // Chuyển sang trang test-runs sau 800ms để user thấy message rồi mới redirect
      setTimeout(() => {
        navigate(`/projects/${projectId}/test-runs`);
      }, 800);
    } catch (e) {
      setActionError(e?.message || "Failed to start batch replay.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleParameterize(stepNo, fieldKey, varName) {
    if (!selectedScript) return;
    const updatedSteps = (selectedScript.scriptJson?.steps ?? []).map((step) => {
      if ((step.stepNo ?? step.step_no) !== stepNo) return step;
      return {
        ...step,
        actionInput: { ...step.actionInput, [fieldKey]: `{{${varName}}}` },
      };
    });
    setParamSaving(true);
    setActionError("");
    try {
      const result = await parameterizeScript({ scriptId: selectedScript.id, steps: updatedSteps });
      // Patch the local scripts list so UI reflects {{var}} immediately without refetch
      if (result?.steps) {
        selectedScript.scriptJson = { ...selectedScript.scriptJson, steps: result.steps };
        setActionSuccess(`Step ${stepNo}.${fieldKey} → {{${varName}}} saved.`);
      }
    } catch (e) {
      setActionError(e?.message || "Failed to save parameterized script.");
    } finally {
      setParamSaving(false);
    }
  }

  const defaultRuntimeConfigId = getRuntimeConfigId(tc);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <PlayCircle className="size-4 text-sky-600" />
        <h2 className="text-sm font-semibold text-slate-700">Run / Replay</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {/* ── New Run ─────────────────────────────────────────── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Play className="size-3.5 text-emerald-600" />
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">New Run</h3>
          </div>

          {goalVars.length > 0 && (
            <>
              <GoalVarInputs
                vars={goalVars}
                paramsText={paramsOverrideText}
                onParamsChange={setParamsOverrideText}
              />
              <RawJsonToggle label="Raw JSON" value={paramsOverrideText} onChange={setParamsOverrideText} />
            </>
          )}

          <AdvancedDataset
            datasetId={datasetId} setDatasetId={setDatasetId}
            datasetAlias={datasetAlias} setDatasetAlias={setDatasetAlias}
            rowIndex={rowIndex} setRowIndex={setRowIndex}
            rowKey={rowKey} setRowKey={setRowKey}
          />

          <div className="mt-4">
            <Button
              onClick={handleCreateRun}
              disabled={busyAction === "run" || busyAction === "replay"}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {busyAction === "run" ? (
                <><LoadingSpinner size="sm" /><span className="ml-2">Starting…</span></>
              ) : (
                <><Play className="mr-2 size-4" />Start Run</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Replay ──────────────────────────────────────────── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="size-3.5 text-violet-600" />
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Replay Script</h3>
          </div>

          {/* Script selector */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <Select value={selectedScriptId} onValueChange={handleScriptChange}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue
                    placeholder={
                      scriptsLoading ? "Loading scripts…" :
                      scripts.length > 0 ? "Select a script" : "No scripts available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {scripts.map((script) => (
                    <SelectItem key={script.id} value={String(script.id)}>
                      #{script.id} · {script.scriptType || script.script_type || "script"}
                      {script.scriptJson?.steps?.length ? ` · ${script.scriptJson.steps.length} steps` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {scriptsError && <p className="mt-1 text-xs text-red-500">{scriptsError}</p>}
              {!scriptsError && scripts.length === 0 && (
                <p className="mt-1 text-xs text-slate-400">No replay script yet — run the test case first.</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  config: {defaultRuntimeConfigId ?? "default"}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  version: {getCurrentVersionId(tc) ?? "current"}
                </span>
              </div>
            </div>

            {selectedScript && (
              <button
                type="button"
                onClick={() => setShowScript((s) => !s)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  showScript
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {showScript ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {showScript ? "Hide script" : "View script"}
              </button>
            )}
          </div>

          {/* Script JSON viewer */}
          {showScript && selectedScript && (
            <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/40 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-violet-100">
                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">
                  Script JSON — #{selectedScript.id}
                </span>
                <span className="text-[10px] text-violet-400">
                  {selectedScript.scriptType || selectedScript.script_type} · {scriptSteps.length} steps
                </span>
              </div>
              <pre className="overflow-auto px-4 py-3 text-[11px] text-slate-600 font-mono max-h-72 leading-relaxed">
                {JSON.stringify(selectedScript.scriptJson, null, 2)}
              </pre>
            </div>
          )}

          {/* Tabs: Steps | Dataset */}
          {scriptSteps.length > 0 ? (
            <>
              <div className="mb-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveReplayTab("steps")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeReplayTab === "steps"
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <SlidersHorizontal className="size-3" />
                  Steps
                  {availableColumns.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                      activeReplayTab === "steps" ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"
                    }`}>
                      bind
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReplayTab("dataset")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeReplayTab === "dataset"
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Database className="size-3" />
                  Dataset
                  {selectedDatasetRowIndex !== null && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeReplayTab === "dataset"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-200 text-slate-500"
                    }`}>
                      row {selectedDatasetRowIndex + 1}
                    </span>
                  )}
                </button>
              </div>

              {/* Steps tab */}
              {activeReplayTab === "steps" && (
                <>
                  {selectedDatasetRowIndex !== null && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                      <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                        {selectedDatasetRowIndex + 1}
                      </div>
                      <span className="text-xs text-violet-700">
                        Dataset row {selectedDatasetRowIndex + 1} active — use <strong>bind</strong> on each step to map columns
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectDatasetRow(null, null)}
                        className="ml-auto text-[10px] text-violet-400 hover:text-violet-700 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {availableColumns.length > 0 && selectedDatasetRowIndex === null && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <Database className="size-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        Dataset loaded — go to <strong>Dataset</strong> tab to select a row, then bind columns to steps
                      </span>
                    </div>
                  )}

                  {availableColumns.length > 0 && !selectedDatasetRow && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <Database className="size-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs text-amber-700">
                        Go to <strong>Dataset</strong> tab and select a row to preview bind values
                      </span>
                    </div>
                  )}
                  <ScriptStepEditor
                    steps={scriptSteps}
                    params={replayParams}
                    onChange={(obj) => {
                      setReplayParamsText(JSON.stringify(obj, null, 2));
                    }}
                    availableColumns={availableColumns}
                    columnValues={selectedDatasetRow ?? datasetDetail?.rows?.[0] ?? {}}
                    bindings={stepBindings}
                    onBindingsChange={setStepBindings}
                    onParameterize={handleParameterize}
                  />

                  <RawJsonToggle
                    label="Raw params JSON"
                    value={replayParamsText}
                    onChange={setReplayParamsText}
                    focusRingClass="focus:ring-violet-300"
                  />
                </>
              )}

              {/* Dataset tab */}
              {activeReplayTab === "dataset" && (
                <>
                  <DatasetPicker
                    projectId={projectId}
                    onSelectRow={handleSelectDatasetRow}
                    onDetailLoaded={handleDetailLoaded}
                    selectedRowIndex={selectedDatasetRowIndex}
                  />
                  {datasetDetail && (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/40 px-4 py-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-sky-700">
                          Run all rows — {datasetDetail.rows?.length ?? 0} rows
                        </p>
                        <span className="text-[10px] text-sky-500">one run per row</span>
                      </div>

                      {/* Template vars resolved status */}
                      {scriptTemplateVars.length > 0 && (
                        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Variables in script
                          </p>
                          {scriptTemplateVars.map((v) => {
                            const ok = availableColumns.includes(v);
                            return (
                              <div key={v} className="flex items-center gap-2 text-[11px]">
                                <span className={`font-mono ${ok ? "text-emerald-700" : "text-amber-600"}`}>
                                  {`{{${v}}}`}
                                </span>
                                <span className={ok ? "text-emerald-500" : "text-amber-400"}>
                                  {ok ? "✓ mapped" : "⚠ not in dataset"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Legacy column mapping for hardcoded fill steps */}
                      {hardcodedFillSteps.length > 0 && availableColumns.length > 0 && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                            Hardcoded steps — map to column
                          </p>
                          <p className="text-[10px] text-amber-500">
                            Or use <strong>Steps tab → param</strong> to convert to <code className="font-mono">{"{{var}}"}</code> permanently.
                          </p>
                          {hardcodedFillSteps.map((step) => {
                            const pkey = `_step_${step.stepNo}_text`;
                            const boundCol = batchBindings[pkey] || "";
                            return (
                              <div key={step.stepNo} className="flex items-center gap-2">
                                <span className="shrink-0 text-[10px] text-slate-500 w-12">Step {step.stepNo}</span>
                                <span className="shrink-0 text-[10px] font-mono text-slate-400 truncate max-w-[80px]" title={String(step.actionInput.text)}>
                                  "{String(step.actionInput.text).slice(0, 14)}{String(step.actionInput.text).length > 14 ? "…" : ""}"
                                </span>
                                <span className="text-[10px] text-slate-300">→</span>
                                <Select
                                  value={boundCol || "__none__"}
                                  onValueChange={(col) =>
                                    setBatchBindings((prev) => {
                                      const next = { ...prev };
                                      if (col === "__none__") delete next[pkey];
                                      else next[pkey] = col;
                                      return next;
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-7 flex-1 text-xs bg-white">
                                    <SelectValue placeholder="column…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">— none —</SelectItem>
                                    {availableColumns.map((col) => (
                                      <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {boundCol && (
                                  <span className="text-[10px] text-emerald-600 font-mono shrink-0">✓</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {unresolvedVars.length > 0 && (
                        <p className="text-[11px] text-amber-600">
                          ⚠ {unresolvedVars.map((v) => `{{${v}}}`).join(", ")} not found in dataset columns — those steps may fail.
                        </p>
                      )}

                      <Button
                        onClick={handleBatchReplay}
                        disabled={busyAction === "run" || busyAction === "replay" || busyAction === "batch"}
                        className="bg-sky-600 hover:bg-sky-700"
                        size="sm"
                      >
                        {busyAction === "batch" ? (
                          <><LoadingSpinner size="sm" /><span className="ml-2">Queuing…</span></>
                        ) : (
                          <><Layers className="mr-2 size-3.5" />Run all {datasetDetail.rows?.length ?? 0} rows</>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Replay button */}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  onClick={handleReplayRun}
                  disabled={busyAction === "run" || busyAction === "replay" || busyAction === "batch"}
                  className={
                    hasReplayInputs
                      ? "bg-violet-600 hover:bg-violet-700"
                      : "bg-slate-600 hover:bg-slate-700"
                  }
                >
                  {busyAction === "replay" ? (
                    <><LoadingSpinner size="sm" /><span className="ml-2">Starting replay…</span></>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 size-4" />
                      {selectedDatasetRowIndex !== null
                        ? `Replay with dataset row ${selectedDatasetRowIndex + 1}`
                        : hasReplayInputs
                          ? `Replay with ${filledCount} input${filledCount > 1 ? "s" : ""}`
                          : "Replay script"}
                    </>
                  )}
                </Button>
                {hasReplayInputs && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplayParamsText("{}");
                      setSelectedDatasetRowIndex(null);
                      setSelectedDatasetRow(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear inputs
                  </button>
                )}
              </div>
            </>
          ) : (
            scripts.length > 0 && (
              <div className="space-y-3">
                <textarea
                  value={replayParamsText}
                  onChange={(e) => setReplayParamsText(e.target.value)}
                  rows={5}
                  placeholder='{"username":"user1"}'
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-violet-300"
                />
                <Button
                  onClick={handleReplayRun}
                  disabled={busyAction === "run" || busyAction === "replay"}
                  variant="outline"
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  {busyAction === "replay" ? (
                    <><LoadingSpinner size="sm" /><span className="ml-2">Starting…</span></>
                  ) : (
                    <><RotateCcw className="mr-2 size-4" />Replay Script</>
                  )}
                </Button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Status messages */}
      {(actionError || actionSuccess) && (
        <div className="px-5 pb-4">
          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionSuccess}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
