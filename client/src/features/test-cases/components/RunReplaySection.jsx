import { useState, useEffect, useMemo, useRef } from "react";
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
  AlertTriangle,
  CheckCircle,
  Sparkles,
  X,
  Terminal,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import {
  createTestRun,
  replayTestRun,
  batchReplayTestRun,
  parameterizeScript,
  deleteScript,
} from "@/features/test-results/api/testResultsApi";
import { listDatasets, getDataset } from "@/features/datasets/api/datasetsApi";
import DatasetTable from "@/features/datasets/components/DatasetTable";
import AIDatasetGenerator from "@/features/datasets/components/AIDatasetGenerator";
import {
  getCurrentVersionId,
  getRuntimeConfigId,
  toNullablePositiveInt,
  toNullableNonNegativeInt,
  trimOrNull,
  parseJsonObject,
} from "../utils/testCaseUtils";
import ScriptStepEditor from "./ScriptStepEditor";
import ReplayScriptEditor from "./ReplayScriptEditor";
import { saveScriptSteps } from "@/features/test-results/api/testResultsApi";

const USER_INPUT_KEYS_FOR_WARN = new Set(["text", "url", "value", "contains"]);

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
  return [
    ...new Set((text.match(/\{\{(\w+)\}\}/g) || []).map((m) => m.slice(2, -2))),
  ];
}

function AdvancedDataset({
  datasetId,
  setDatasetId,
  datasetAlias,
  setDatasetAlias,
  rowIndex,
  setRowIndex,
  rowKey,
  setRowKey,
}) {
  const [open, setOpen] = useState(false);
  const hasAny = datasetId || datasetAlias || rowIndex || rowKey;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Settings2 className="size-3" />
        Advanced
        {hasAny && (
          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
            dataset set
          </span>
        )}
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <p className="col-span-2 text-[10px] text-muted-foreground mb-1">
            Dataset binding — link to pre-stored test data
          </p>
          {[
            {
              label: "Dataset ID",
              value: datasetId,
              onChange: setDatasetId,
              placeholder: "e.g. 1",
            },
            {
              label: "Alias",
              value: datasetAlias,
              onChange: setDatasetAlias,
              placeholder: "e.g. users",
            },
            {
              label: "Row Index",
              value: rowIndex,
              onChange: setRowIndex,
              placeholder: "0",
            },
            {
              label: "Row Key",
              value: rowKey,
              onChange: setRowKey,
              placeholder: "e.g. admin",
            },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-[10px] text-muted-foreground">
                {label}
              </label>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900/40"
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
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Goal variables
      </p>
      {vars.map((varName) => (
        <div key={varName}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {varName}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
              {`{{${varName}}}`}
            </span>
          </div>
          <input
            type="text"
            value={params[varName] ?? ""}
            onChange={(e) => setVar(varName, e.target.value)}
            placeholder={`Enter ${varName}…`}
            className="w-full rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50/60 to-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-amber-300 focus:ring-2 focus:ring-amber-200 dark:border-amber-800/40 dark:from-amber-950/25 dark:to-card dark:focus:ring-amber-900/40"
          />
        </div>
      ))}
    </div>
  );
}

function RawJsonToggle({
  label,
  value,
  onChange,
  focusRingClass = "focus:ring-emerald-300",
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Code2 className="size-3" />
        {label}
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
      {open && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className={`mt-2 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono text-foreground outline-none ${focusRingClass} focus:ring-2`}
        />
      )}
    </div>
  );
}

// Dataset tab — pick a project dataset and select a row
function DatasetPicker({
  projectId,
  onSelectRow,
  onDetailLoaded,
  selectedRowIndex,
  autoSelectId,
}) {
  const [datasets, setDatasets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    listDatasets(projectId)
      .then((data) => {
        if (!cancelled) {
          setDatasets(data);
          if (autoSelectId) {
            const found = data.find(
              (d) => String(d.id) === String(autoSelectId),
            );
            if (found) handleSelectDataset(String(found.id));
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center">
        <Database className="size-6 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-medium text-slate-400">
          No datasets in this project
        </p>
        <p className="text-[11px] text-slate-300 mt-1">
          Go to the <span className="font-semibold">Data</span> tab to create
          one
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CustomSelect
        value={selectedDatasetId}
        onValueChange={handleSelectDataset}
        placeholder="Select a dataset…"
        className="w-full mt-4"
        options={datasets.map((ds) => ({
          value: String(ds.id),
          label: ds.name,
          sublabel: `· ${ds.rowCount} ${ds.rowCount === 1 ? "row" : "rows"}`,
        }))}
      />

      {loadingDetail && (
        <div className="flex justify-center py-6">
          <LoadingSpinner size="sm" />
        </div>
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

// ── Human-readable step label for read-only list ──────────────────────────────

function labelFromSelector(selector) {
  if (!selector) return null;
  const m =
    selector.match(/\[aria-label=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(/\[title=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(
      /\[data-(?:testid|qa|cy|test)=["']?([^"'\]]+)["']?\]/i,
    )?.[1] ||
    selector.match(/\[name=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(/^#([a-zA-Z_-][a-zA-Z0-9_-]*)$/)?.[1];
  return m || null;
}

function readonlyStepLabel(step) {
  const { actionName = "", actionInput = {}, notes = "" } = step;
  const a = actionName.toLowerCase();
  const raw = actionInput.selector || "";
  const t =
    actionInput.axName ||
    actionInput.title ||
    actionInput.placeholder ||
    actionInput.nameAttr ||
    labelFromSelector(raw) ||
    raw ||
    "";
  const q = (s, n = 38) =>
    s ? `"${String(s).slice(0, n)}${String(s).length > n ? "…" : ""}"` : null;
  switch (a) {
    case "navigate":
    case "goto":
    case "go_to_url":
    case "open_url":
      return `Open ${q(actionInput.url || actionInput.href) || "page"}`;
    case "click":
    case "tap":
      return `Click ${q(t) || "element"}`;
    case "fill":
    case "type":
    case "input_text":
    case "enter_text":
    case "input": {
      const text = actionInput.text || "";
      if (text && t) return `Enter ${q(text)} into ${q(t)}`;
      if (text) return `Enter ${q(text)}`;
      if (t) return `Fill in ${q(t)}`;
      return "Fill input";
    }
    case "select":
    case "select_option":
      return `Select ${q(actionInput.value || actionInput.labelValue) || "option"}`;
    case "press":
    case "press_key":
    case "keyboard_press":
      return `Press ${actionInput.key || "key"}`;
    case "check":
      return `Check ${q(t) || "element"}`;
    case "uncheck":
      return `Uncheck ${q(t) || "element"}`;
    case "assert_visible":
    case "assert_element_visible":
    case "verify_element_visible": {
      const elem = t || actionInput.text || "";
      return `Check ${q(elem) || "element"} is visible`;
    }
    case "assert_text":
    case "assert_text_present":
    case "verify_text":
      return `Check text ${q(actionInput.text || actionInput.value || "")}`;
    case "assert_url_contains":
      return `Check URL contains ${q(actionInput.contains || actionInput.value || "")}`;
    case "assert_url_changed":
    case "assert_url":
      return "Check page changed";
    case "assert_value":
    case "assert_input_value":
      return `Check input value = ${q(actionInput.value || "")}`;
    case "wait_for_selector":
    case "wait_for_visible":
      return `Wait for ${q(t) || "element"} to appear`;
    default:
      return t ? `${actionName} ${q(t)}` : notes || actionName;
  }
}

function scriptTypeLabel(scriptType) {
  if (scriptType === "strict_replay_json") return "Recorded script";
  if (scriptType === "browser_use_history") return "AI agent recording";
  return scriptType || "Replay script";
}

// ── Read-only step list ───────────────────────────────────────────────────────

function ReadOnlyStepList({ steps }) {
  if (!steps.length)
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-sm text-slate-400">
          No steps recorded in this script.
        </p>
      </div>
    );
  return (
    <ol className="px-5 py-3 space-y-2">
      {steps.map((step, i) => {
        const isAssertion =
          (step.actionName || "").startsWith("assert_") ||
          (step.actionName || "").startsWith("verify_");

        return (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isAssertion
                  ? "bg-purple-100 text-purple-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {step.stepNo ?? i + 1}
            </span>
            <div className="pt-px">
              <span className="text-sm text-slate-600 leading-relaxed">
                {readonlyStepLabel(step)}
              </span>
              {step.notes && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {step.notes}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Simple dataset runner (normal mode) ──────────────────────────────────────

function SimpleDatasetRunner({
  projectId,
  selectedScriptId,
  tc,
  scriptSteps,
  navigate,
}) {
  const [datasets, setDatasets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [genOpen, setGenOpen] = useState(false);

  useEffect(() => {
    listDatasets(projectId)
      .then(setDatasets)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [projectId]);

  async function handleSelect(id) {
    setSelectedId(id);
    setDetail(null);
    setError("");
    if (!id) return;
    setDetailLoading(true);
    try {
      setDetail(await getDataset(id, projectId));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDatasetSaved(dataset) {
    setGenOpen(false);
    const refreshed = await listDatasets(projectId);
    setDatasets(refreshed);
    handleSelect(String(dataset.id));
  }

  async function handleRun() {
    if (!detail || !selectedScriptId) return;
    setRunning(true);
    setError("");
    try {
      const result = await batchReplayTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        executionScriptId: toNullablePositiveInt(selectedScriptId),
        datasetId: detail.id,
      });
      if (result?.batchId) {
        navigate(`/projects/${projectId}/test-runs/batches/${result.batchId}`);
      }
    } catch (e) {
      setError(e?.message || "Failed to start batch run.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="px-5 pb-4 space-y-3 mt-2">
      {/* Pick a dataset or generate one */}
      {loadingList ? (
        <div className="flex justify-center py-2">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <div className="space-y-2">
          {datasets.length > 0 && (
            <CustomSelect
              value={selectedId}
              onValueChange={handleSelect}
              placeholder="Pick a dataset…"
              className="w-full"
              options={datasets.map((ds) => ({
                value: String(ds.id),
                label: ds.name,
                sublabel: `· ${ds.rowCount} rows`,
              }))}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setGenOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[#0048D9]/40 bg-[#0048D9]/5 px-4 py-2 text-xs font-medium text-[#0048D9] hover:bg-[#0048D9]/10 transition-colors"
            >
              <Sparkles className="size-3.5 shrink-0" />
              Generate with AI
            </button>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="flex justify-center py-2">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {detail && !detailLoading && (
        <Button
          onClick={handleRun}
          disabled={running}
          className="w-full bg-sky-600 hover:bg-sky-700"
        >
          {running ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Starting…</span>
            </>
          ) : (
            <>
              <Layers className="mr-2 size-4" />
              Run all {detail.rows?.length ?? 0} rows
            </>
          )}
        </Button>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
          <span className="text-xs text-red-600 flex-1">{error}</span>
        </div>
      )}

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-500" />
              Generate Dataset with AI
            </DialogTitle>
          </DialogHeader>
          <AIDatasetGenerator
            alwaysOpen
            projectId={projectId}
            goal={tc.goal}
            scriptSteps={scriptSteps}
            initialRow={null}
            sourceTestCaseId={tc.id}
            sourceTestCaseTitle={tc.title}
            onDatasetSaved={handleDatasetSaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RunReplaySection({
  tc,
  projectId,
  scripts,
  scriptsLoading,
  scriptsError,
  onRunCreated,
  onScriptStepsUpdated,
  // New props for simplified UX
  editStepsOpen = false,
  onEditStepsOpenChange = null,
  developerMode = false,
  onDeveloperModeChange = null,
}) {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState("");
  const [datasetAlias, setDatasetAlias] = useState("");
  const [rowIndex, setRowIndex] = useState("");
  const [rowKey, setRowKey] = useState("");
  const [paramsOverrideText, setParamsOverrideText] = useState("{}");
  const [replayParamsText, setReplayParamsText] = useState("{}");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [scriptEditorSteps, setScriptEditorSteps] = useState(null); // null = unmodified
  const [busyAction, setBusyAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [activeReplayTab, setActiveReplayTab] = useState("steps"); // "steps" | "dataset"
  const [selectedDatasetRowIndex, setSelectedDatasetRowIndex] = useState(null);
  const [selectedDatasetRow, setSelectedDatasetRow] = useState(null); // the actual row object
  const [datasetDetail, setDatasetDetail] = useState(null); // full dataset detail
  // pkey → column name bindings (lifted from ScriptStepEditor)
  const [stepBindings, setStepBindings] = useState({});
  // scriptVar → datasetColumn explicit mapping (for name mismatches)
  const [variableMapping, setVariableMapping] = useState({});
  // "stepNo_fieldKey" → colName: quick-parameterize assignments from Dataset tab
  const [quickParamMap, setQuickParamMap] = useState({});
  const [paramSaving, setParamSaving] = useState(false);
  const [datasetPickerKey, setDatasetPickerKey] = useState(0);
  const [autoSelectDatasetId, setAutoSelectDatasetId] = useState(null);
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [showNormalDataset, setShowNormalDataset] = useState(false);
  const [confirmDeleteScriptId, setConfirmDeleteScriptId] = useState(null);
  const [deletingScript, setDeletingScript] = useState(false);
  const statusTimerRef = useRef(null);
  const pendingMappingRef = useRef(null);

  // Auto-dismiss status messages after 5s
  useEffect(() => {
    if (actionSuccess || actionError) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => {
        setActionSuccess("");
        setActionError("");
      }, 5000);
    }
    return () => clearTimeout(statusTimerRef.current);
  }, [actionSuccess, actionError]);

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
    datasetDetail.rows.forEach((row) =>
      Object.keys(row).forEach((k) => seen.add(k)),
    );
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

  // Template variables already in the script
  const scriptTemplateVars = useMemo(() => {
    const re = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const vars = new Set();
    let m;
    const src = JSON.stringify(scriptSteps);
    while ((m = re.exec(src)) !== null) vars.add(m[1]);
    return [...vars];
  }, [scriptSteps]);

  // Template vars that appear inside assertion steps (assert_*, verify_*)
  const assertionTemplateVars = useMemo(() => {
    const re = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const vars = new Set();
    const assertSteps = scriptSteps.filter(
      (s) =>
        s.actionName?.startsWith("assert_") ||
        s.actionName?.startsWith("verify_"),
    );
    const src = JSON.stringify(assertSteps);
    let m;
    while ((m = re.exec(src)) !== null) vars.add(m[1]);
    return [...vars];
  }, [scriptSteps]);

  // Input fields still hardcoded (not yet replaced with {{var}} templates).
  // Batch replay relies on render_template() substituting {{var}} per row —
  // if steps have literal values, every row will replay with the same original data.
  // navigate steps are excluded — their URL is the same for all rows (constant).
  const hardcodedInputFields = useMemo(() => {
    const fields = [];
    scriptSteps.forEach((step) => {
      const sno = step.stepNo ?? 0;
      if (!["fill", "select"].includes(step.actionName)) return;
      Object.entries(step.actionInput || {}).forEach(([fieldKey, val]) => {
        if (
          USER_INPUT_KEYS_FOR_WARN.has(fieldKey) &&
          !/\{\{[^}]+\}\}/.test(String(val))
        ) {
          fields.push({ sno, fieldKey, value: String(val) });
        }
      });
    });
    return fields;
  }, [scriptSteps]);

  // Build an initial example row for dataset generation:
  // - template vars ({{varName}}) → value from replayParams if user filled it in
  // - hardcoded literal values → extracted with a column name derived from the selector
  const initialRow = useMemo(() => {
    const row = {};
    scriptSteps.forEach((step) => {
      if (!["fill", "select"].includes(step.actionName)) return;
      const input = step.actionInput || {};
      const rawVal = input.value ?? input.text ?? "";
      const strVal = String(rawVal);
      const tmplMatch = strVal.match(/^\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}$/);
      if (tmplMatch) {
        const varName = tmplMatch[1];
        const paramVal = replayParams[varName];
        if (paramVal !== undefined && paramVal !== "") row[varName] = paramVal;
      } else if (strVal && !strVal.includes("{{")) {
        const selector = String(input.selector || input.css || "");
        const nameM = selector.match(
          /\bname=["']?([a-zA-Z_][a-zA-Z0-9_-]*)["']?/,
        );
        const idM = selector.match(/\bid=["']?([a-zA-Z_][a-zA-Z0-9_-]*)["']?/);
        const colName =
          nameM?.[1] ||
          idM?.[1] ||
          `field_${step.stepNo ?? Object.keys(row).length + 1}`;
        row[colName] = strVal;
      }
    });
    return Object.keys(row).length > 0 ? row : null;
  }, [scriptSteps, replayParams]);

  // Re-apply mapping when it changes and a row is already selected
  const prevMappingRef = useRef(variableMapping);
  useEffect(() => {
    if (prevMappingRef.current === variableMapping) return;
    prevMappingRef.current = variableMapping;
    if (selectedDatasetRow) {
      const mapped = applyMapping(selectedDatasetRow, variableMapping);
      setReplayParamsText(JSON.stringify(mapped, null, 2));
    }
  }, [variableMapping]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyMapping(row, mapping) {
    if (!row) return row;
    const result = { ...row };
    for (const [scriptVar, colName] of Object.entries(mapping)) {
      if (colName && Object.prototype.hasOwnProperty.call(row, colName)) {
        result[scriptVar] = row[colName];
        if (colName !== scriptVar) delete result[colName];
      }
    }
    return result;
  }

  function handleScriptChange(v) {
    setSelectedScriptId(v);
    setReplayParamsText("{}");
    setSelectedDatasetRowIndex(null);
    setSelectedDatasetRow(null);
    setStepBindings({});
    setVariableMapping({});
    setQuickParamMap({});
    setActiveReplayTab("steps");
    setScriptEditorSteps(null);
  }

  async function handleDeleteScript(scriptId) {
    setDeletingScript(true);
    setActionError("");
    try {
      await deleteScript({ scriptId });
      setConfirmDeleteScriptId(null);
      const remaining = scripts.filter((s) => s.id !== scriptId);
      onScriptStepsUpdated?.(scriptId, null); // signal parent to remove this script
      if (remaining.length > 0) {
        handleScriptChange(String(remaining[0].id));
      } else {
        setSelectedScriptId("");
      }
      setActionSuccess("Script deleted.");
    } catch (e) {
      setActionError(e?.message || "Failed to delete script.");
    } finally {
      setDeletingScript(false);
    }
  }

  // Sync editor steps when script changes externally
  useEffect(() => {
    setScriptEditorSteps(null);
  }, [selectedScriptId]);

  // The effective steps: use editor's local edits if any, otherwise the script's stored steps
  const editorSteps = scriptEditorSteps ?? scriptSteps;

  async function handleSaveEditorSteps() {
    if (!selectedScript || !scriptEditorSteps) return;
    setParamSaving(true);
    setActionError("");
    try {
      const result = await saveScriptSteps({
        scriptId: selectedScript.id,
        steps: scriptEditorSteps,
      });
      if (result?.steps) {
        onScriptStepsUpdated?.(selectedScript.id, result.steps);
        setScriptEditorSteps(null);
        setActionSuccess("Script saved.");
      }
    } catch (e) {
      setActionError(e?.message || "Failed to save script.");
    } finally {
      setParamSaving(false);
    }
  }

  function handleSelectDatasetRow(row, idx) {
    setSelectedDatasetRowIndex(idx);
    setSelectedDatasetRow(row);
    const mapped = row === null ? null : applyMapping(row, variableMapping);
    setReplayParamsText(
      mapped === null ? "{}" : JSON.stringify(mapped, null, 2),
    );
  }

  function handleDetailLoaded(detail) {
    setDatasetDetail(detail);
    setStepBindings({});
    setQuickParamMap({});
    if (!detail) return; // called with null while loading starts — skip mapping logic
    // Preserve AI mapping if one was queued; otherwise reset
    if (pendingMappingRef.current) {
      setVariableMapping(pendingMappingRef.current);
      pendingMappingRef.current = null;
    } else {
      setVariableMapping({});
    }
    const firstRow = detail.rows?.[0] ?? null;
    setSelectedDatasetRowIndex(firstRow ? 0 : null);
    setSelectedDatasetRow(firstRow);
    setReplayParamsText(firstRow ? JSON.stringify(firstRow, null, 2) : "{}");
  }

  function handleDatasetSaved(dataset, aiVariableMapping) {
    if (aiVariableMapping && Object.keys(aiVariableMapping).length > 0) {
      pendingMappingRef.current = aiVariableMapping;
    }
    setAutoSelectDatasetId(dataset?.id ?? null);
    setDatasetPickerKey((k) => k + 1);
    setActionSuccess(`Dataset "${dataset?.name}" saved and mapping applied.`);
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
        paramsOverride: parseJsonObject(
          paramsOverrideText,
          "Run paramsOverride",
        ),
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
      if (!executionScriptId)
        throw new Error("Please select an execution script before replay.");
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

  function requestBatchReplay() {
    if (hardcodedInputFields.length > 0) {
      setActionError(
        `Script has ${hardcodedInputFields.length} hardcoded field${hardcodedInputFields.length > 1 ? "s" : ""} — each row would replay with the same data. ` +
          `Use the "Apply" button in the Dataset tab to convert them to {{variables}} first.`,
      );
      return;
    }
    setConfirmBatch(true);
  }

  async function handleBatchReplay() {
    setConfirmBatch(false);
    setBusyAction("batch");
    setActionError("");
    setActionSuccess("");
    try {
      const executionScriptId = toNullablePositiveInt(selectedScriptId);
      if (!executionScriptId)
        throw new Error(
          "Please select an execution script before batch replay.",
        );
      if (!datasetDetail) throw new Error("Please select a dataset first.");
      const result = await batchReplayTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        executionScriptId,
        datasetId: datasetDetail.id,
        variableMapping:
          Object.keys(variableMapping).length > 0 ? variableMapping : null,
      });
      if (result?.batchId) {
        navigate(`/projects/${projectId}/test-runs/batches/${result.batchId}`);
      }
    } catch (e) {
      setActionError(e?.message || "Failed to start batch replay.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleQuickParameterize() {
    if (!selectedScript || Object.keys(quickParamMap).length === 0) return;
    const updatedSteps = (selectedScript.scriptJson?.steps ?? []).map(
      (step) => {
        const sno = step.stepNo ?? 0;
        const updatedInput = { ...step.actionInput };
        let changed = false;
        for (const [stateKey, colName] of Object.entries(quickParamMap)) {
          const [stepNoStr, ...fieldParts] = stateKey.split("_");
          const fieldKey = fieldParts.join("_");
          if (Number(stepNoStr) === sno && colName) {
            updatedInput[fieldKey] = `{{${colName}}}`;
            changed = true;
          }
        }
        return changed ? { ...step, actionInput: updatedInput } : step;
      },
    );
    setParamSaving(true);
    setActionError("");
    try {
      const result = await parameterizeScript({
        scriptId: selectedScript.id,
        steps: updatedSteps,
      });
      if (result?.steps) {
        onScriptStepsUpdated?.(selectedScript.id, result.steps);
        setQuickParamMap({});
        setActionSuccess(
          "Steps parameterized. Variable mapping is now active.",
        );
      }
    } catch (e) {
      setActionError(e?.message || "Failed to parameterize steps.");
    } finally {
      setParamSaving(false);
    }
  }

  async function handleAddAssertionStep(assertionStep) {
    if (!selectedScript) return;
    const currentSteps = selectedScript.scriptJson?.steps ?? [];
    const maxStepNo = currentSteps.reduce(
      (m, s) => Math.max(m, s.stepNo ?? 0),
      0,
    );
    const newStep = { ...assertionStep, stepNo: maxStepNo + 1 };
    const updatedSteps = [...currentSteps, newStep];
    setParamSaving(true);
    setActionError("");
    try {
      const result = await parameterizeScript({
        scriptId: selectedScript.id,
        steps: updatedSteps,
      });
      if (result?.steps) {
        onScriptStepsUpdated?.(selectedScript.id, result.steps);
        setActionSuccess(`Assertion step added (step ${maxStepNo + 1}).`);
      }
    } catch (e) {
      setActionError(e?.message || "Failed to add assertion step.");
    } finally {
      setParamSaving(false);
    }
  }

  async function handleParameterize(stepNo, fieldKey, varName) {
    if (!selectedScript) return;
    const updatedSteps = (selectedScript.scriptJson?.steps ?? []).map(
      (step) => {
        if ((step.stepNo ?? step.step_no) !== stepNo) return step;
        return {
          ...step,
          actionInput: { ...step.actionInput, [fieldKey]: `{{${varName}}}` },
        };
      },
    );
    setParamSaving(true);
    setActionError("");
    try {
      const result = await parameterizeScript({
        scriptId: selectedScript.id,
        steps: updatedSteps,
      });
      if (result?.steps) {
        onScriptStepsUpdated?.(selectedScript.id, result.steps);
        setActionSuccess(`Step ${stepNo}.${fieldKey} → {{${varName}}} saved.`);
      }
    } catch (e) {
      setActionError(e?.message || "Failed to save parameterized script.");
    } finally {
      setParamSaving(false);
    }
  }

  const defaultRuntimeConfigId = getRuntimeConfigId(tc);
  const assertionCount = editorSteps.filter(
    (s) =>
      (s.actionName || "").startsWith("assert_") ||
      (s.actionName || "").startsWith("verify_"),
  ).length;

  // ── Non-developer mode: clean, focused view ──────────────────────────────────
  if (!developerMode) {
    if (!scripts.length && !scriptsLoading) {
      return (
        <section className="overflow-hidden rounded-xl bg-card border-dashed border-2 border-border px-8 py-10 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            No recorded script yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Run the test once with AI Agent to generate a replay script.
          </p>
          <button
            type="button"
            onClick={() => onDeveloperModeChange?.(true)}
            className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-amber-500 transition-colors"
          >
            <Terminal className="size-3.5" />
            Enable developer mode for more options
          </button>
        </section>
      );
    }

    return (
      <section className="overflow-hidden rounded-xl bg-card">
        {/* Script metadata header */}
        <div className="flex items-center gap-3 border-b border-border px-8 py-4">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-primary/10">
              <RotateCcw className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              {scriptsLoading ? (
                <span className="text-sm text-muted-foreground">
                  Loading script…
                </span>
              ) : selectedScript ? (
                <>
                  <span className="text-sm font-medium text-foreground">
                    {scriptTypeLabel(
                      selectedScript.scriptType || selectedScript.script_type,
                    )}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {editorSteps.length} step
                    {editorSteps.length !== 1 ? "s" : ""}
                    {assertionCount > 0 &&
                      ` · ${assertionCount} check${assertionCount !== 1 ? "s" : ""}`}
                    {scriptEditorSteps && " · unsaved changes"}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No script selected
                </span>
              )}
            </div>
          </div>
          {/* Right controls: selector + delete */}
          <div className="flex shrink-0 items-center gap-2">
            {scripts.length > 1 && (
              <CustomSelect
                value={selectedScriptId}
                onValueChange={handleScriptChange}
                placeholder="Select script"
                className="w-44"
                options={scripts.map((s) => ({
                  value: String(s.id),
                  label: `#${s.id} · ${scriptTypeLabel(s.scriptType || s.script_type)}`,
                }))}
              />
            )}
            {selectedScript && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDeleteScriptId(
                      confirmDeleteScriptId === selectedScript.id
                        ? null
                        : selectedScript.id,
                    )
                  }
                  className={`rounded-[6px] p-1.5 transition-colors ${
                    confirmDeleteScriptId === selectedScript.id
                      ? "bg-destructive/10 text-destructive"
                      : "text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive"
                  }`}
                  title="Delete this script"
                >
                  <Trash2 className="size-3.5" />
                </button>
                {confirmDeleteScriptId === selectedScript.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setConfirmDeleteScriptId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-[6px] border border-destructive/20 bg-surface shadow-[0px_4px_14px_rgba(0,0,0,0.2)] p-3 space-y-2.5">
                      <p className="text-xs font-medium text-foreground">
                        Delete this script?
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteScript(selectedScript.id)}
                          disabled={deletingScript}
                          className="flex-1 rounded-[6px] bg-destructive px-2 py-1.5 text-xs font-bold text-white hover:brightness-105 disabled:opacity-50 transition-all"
                        >
                          {deletingScript ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteScriptId(null)}
                          className="flex-1 rounded-[6px] border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unsaved changes warning */}
        {scriptEditorSteps && (
          <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-8 py-2">
            <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
            <span className="flex-1 text-xs text-amber-500">
              Unsaved changes — save before replaying.
            </span>
          </div>
        )}

        {/* Steps: read-only list OR editor */}
        {editStepsOpen && selectedScript ? (
          <div className="px-8 py-5">
            <ReplayScriptEditor
              scriptId={selectedScript.id}
              steps={editorSteps}
              onStepsChange={setScriptEditorSteps}
              onSave={scriptEditorSteps ? handleSaveEditorSteps : undefined}
              saving={paramSaving}
              params={replayParams}
              developerMode={false}
            />
          </div>
        ) : (
          <ReadOnlyStepList steps={editorSteps} />
        )}

        {/* Run with dataset */}
        {selectedScript && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowNormalDataset((o) => !o)}
              className={`flex w-full items-center gap-2 px-8 py-3 text-left text-xs font-medium transition-colors ${
                showNormalDataset
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Database
                className={`size-3.5 ${showNormalDataset ? "text-sky-400" : "text-muted-foreground"}`}
              />
              Run with dataset
              {showNormalDataset ? (
                <ChevronDown className="size-3 ml-auto text-sky-400" />
              ) : (
                <ChevronRight className="size-3 ml-auto text-muted-foreground/40" />
              )}
            </button>
            {showNormalDataset && (
              <SimpleDatasetRunner
                projectId={projectId}
                selectedScriptId={selectedScriptId}
                tc={tc}
                scriptSteps={scriptSteps}
                navigate={navigate}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-8 py-3">
          {editStepsOpen ? (
            <button
              type="button"
              onClick={() => onEditStepsOpenChange?.(false)}
              className="flex items-center gap-1.5 rounded-[6px] bg-[linear-gradient(180deg,#60a5fa_0%,#2563eb_100%)] px-3 py-1.5 text-xs font-bold text-white shadow-[0px_4px_14px_rgba(0,0,0,0.2)] hover:brightness-105 transition-all"
            >
              <Check className="size-3.5" />
              Done editing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEditStepsOpenChange?.(true)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors"
            >
              <ShieldCheck className="size-3.5" />
              Add check
            </button>
          )}

          <button
            type="button"
            onClick={() => onDeveloperModeChange?.(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 transition-colors"
          >
            <Terminal className="size-3.5" />
            Developer mode
          </button>
        </div>

        {/* Status messages */}
        {(actionError || actionSuccess) && (
          <div className="px-8 pb-4 space-y-1.5">
            {actionError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5">
                <AlertTriangle className="size-3.5 text-red-400 shrink-0" />
                <span className="text-sm text-red-400 flex-1">
                  {actionError}
                </span>
                <button
                  onClick={() => setActionError("")}
                  className="text-red-400/50 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            )}
            {actionSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
                <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                <span className="text-sm text-emerald-500 flex-1">
                  {actionSuccess}
                </span>
                <button
                  onClick={() => setActionSuccess("")}
                  className="text-emerald-500/50 hover:text-emerald-500 text-sm"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── Developer mode: full existing UI ─────────────────────────────────────────
  return (
    <section className="overflow-hidden rounded-[6px] bg-surface shadow-[0px_4px_24px_rgba(0,0,0,0.15)] border border-amber-200 dark:border-amber-800/40">
      <div className="flex items-center justify-between gap-2 px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Developer Mode
          </h2>
          <span className="text-[10px] text-amber-500 dark:text-amber-400/70">
            Advanced replay controls are visible
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDeveloperModeChange?.(false)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
        >
          <X className="size-3.5" />
          Exit
        </button>
      </div>

      <div className="divide-y divide-border">
        {/* ── Run with AI Agent ────────────────────────────────── */}
        <div className="px-8 py-5">
          <div className="flex items-center gap-2 mb-3">
            <Play className="size-3.5 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Run with AI Agent
            </h3>
          </div>

          {goalVars.length > 0 && (
            <>
              <GoalVarInputs
                vars={goalVars}
                paramsText={paramsOverrideText}
                onParamsChange={setParamsOverrideText}
              />
              <RawJsonToggle
                label="Raw JSON"
                value={paramsOverrideText}
                onChange={setParamsOverrideText}
              />
            </>
          )}

          <AdvancedDataset
            datasetId={datasetId}
            setDatasetId={setDatasetId}
            datasetAlias={datasetAlias}
            setDatasetAlias={setDatasetAlias}
            rowIndex={rowIndex}
            setRowIndex={setRowIndex}
            rowKey={rowKey}
            setRowKey={setRowKey}
          />

          <div className="mt-4">
            <Button
              onClick={handleCreateRun}
              disabled={busyAction === "run" || busyAction === "replay"}
              className=""
            >
              {busyAction === "run" ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Starting…</span>
                </>
              ) : (
                <>
                  <Play className="mr-2 size-4" />
                  Start Run
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Replay Script ───────────────────────────────────── */}
        <div className="px-8 py-5">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="size-3.5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Replay Script
            </h3>
          </div>

          {/* Script selector */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <CustomSelect
                value={selectedScriptId}
                onValueChange={handleScriptChange}
                placeholder={
                  scriptsLoading
                    ? "Loading scripts…"
                    : scripts.length > 0
                      ? "Select a script"
                      : "No scripts available"
                }
                className="w-full"
                options={scripts.map((script) => ({
                  value: String(script.id),
                  label: `#${script.id} · ${script.scriptType || script.script_type || "script"}${script.scriptJson?.steps?.length ? ` · ${script.scriptJson.steps.length} steps` : ""}`,
                }))}
              />
              {scriptsError && (
                <p className="mt-1 text-xs text-red-500">{scriptsError}</p>
              )}
              {!scriptsError && scripts.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No replay script yet — run the test case first.
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-[4px] bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                  config: {defaultRuntimeConfigId ?? "default"}
                </span>
                <span className="rounded-[4px] bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                  version: {getCurrentVersionId(tc) ?? "current"}
                </span>
              </div>
            </div>

            {selectedScript && (
              <button
                type="button"
                onClick={() => onEditStepsOpenChange?.(!editStepsOpen)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  editStepsOpen
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-2"
                }`}
              >
                {editStepsOpen ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                {editStepsOpen ? "Hide editor" : "Edit script"}
                {scriptEditorSteps && (
                  <span
                    className="rounded-full bg-amber-400 size-1.5 shrink-0"
                    title="Unsaved changes"
                  />
                )}
              </button>
            )}
          </div>

          {/* Script editor — shown when "Edit script" is toggled (dev mode) */}
          {editStepsOpen && selectedScript && (
            <div className="mb-4">
              {scriptEditorSteps && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                  <AlertTriangle className="size-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                  <span className="flex-1 text-xs text-amber-700 dark:text-amber-300">
                    Unsaved changes — click Save inside the editor or they will
                    be lost.
                  </span>
                </div>
              )}
              <ReplayScriptEditor
                scriptId={selectedScript.id}
                steps={editorSteps}
                onStepsChange={setScriptEditorSteps}
                onSave={scriptEditorSteps ? handleSaveEditorSteps : undefined}
                saving={paramSaving}
                params={replayParams}
                developerMode={developerMode}
              />
            </div>
          )}

          {/* Tabs: Steps | Dataset */}
          {scriptSteps.length > 0 ? (
            <>
              <div className="mb-4 flex items-center gap-1 rounded-[6px] border border-border bg-surface-2 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveReplayTab("steps")}
                  className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeReplayTab === "steps"
                      ? "bg-surface text-foreground shadow-[0px_2px_8px_rgba(0,0,0,0.2)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="size-3" />
                  Steps
                  {availableColumns.length > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        activeReplayTab === "steps"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-3 text-muted-foreground"
                      }`}
                    >
                      bind
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReplayTab("dataset")}
                  className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeReplayTab === "dataset"
                      ? "bg-surface text-foreground shadow-[0px_2px_8px_rgba(0,0,0,0.2)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Database className="size-3" />
                  Dataset
                  {selectedDatasetRowIndex !== null && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        activeReplayTab === "dataset"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-3 text-muted-foreground"
                      }`}
                    >
                      row {selectedDatasetRowIndex + 1}
                    </span>
                  )}
                </button>
              </div>

              {/* Steps tab */}
              {activeReplayTab === "steps" && (
                <>
                  {availableColumns.length > 0 && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-700/40 bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-amber-900/20 dark:to-orange-900/10 px-3 py-2.5">
                      <Database className="size-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      {selectedDatasetRowIndex !== null ? (
                        <>
                          <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500 dark:bg-amber-600 text-[9px] font-bold text-white">
                            {selectedDatasetRowIndex + 1}
                          </div>
                          <span className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                            Previewing row {selectedDatasetRowIndex + 1} —
                            template fields show column values
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectDatasetRow(null, null)}
                            className="ml-auto text-[10px] text-amber-400 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                          >
                            Clear
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          Dataset loaded — pick a column for each hardcoded
                          field below, then click <strong>Use</strong>
                        </span>
                      )}
                    </div>
                  )}
                  <ScriptStepEditor
                    steps={scriptSteps}
                    params={replayParams}
                    onChange={(obj) => {
                      setReplayParamsText(JSON.stringify(obj, null, 2));
                    }}
                    availableColumns={availableColumns}
                    columnValues={
                      selectedDatasetRow ?? datasetDetail?.rows?.[0] ?? {}
                    }
                    bindings={stepBindings}
                    onBindingsChange={setStepBindings}
                    onParameterize={handleParameterize}
                    parameterizeDisabled={paramSaving}
                    onAddAssertionStep={handleAddAssertionStep}
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
                    key={datasetPickerKey}
                    projectId={projectId}
                    autoSelectId={autoSelectDatasetId}
                    onSelectRow={handleSelectDatasetRow}
                    onDetailLoaded={handleDetailLoaded}
                    selectedRowIndex={selectedDatasetRowIndex}
                  />

                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setGenDialogOpen(true)}
                      className="flex items-center gap-2 rounded-lg border border-[#0048D9]/40 bg-[#0048D9]/5 px-4 py-2 text-xs font-medium text-[#0048D9] hover:bg-[#0048D9]/10 transition-colors"
                    >
                      <Sparkles className="size-3.5 shrink-0" />
                      Generate with AI
                    </button>
                  </div>

                  <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="size-4 text-violet-500" />
                          Generate Dataset with AI
                        </DialogTitle>
                      </DialogHeader>
                      <AIDatasetGenerator
                        alwaysOpen
                        projectId={projectId}
                        goal={tc.goal}
                        scriptSteps={scriptSteps}
                        initialRow={initialRow}
                        existingDatasetId={datasetDetail?.id}
                        existingDatasetName={datasetDetail?.name}
                        onDatasetSaved={(dataset, mapping) => {
                          handleDatasetSaved(dataset, mapping);
                          setGenDialogOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  {datasetDetail && (
                    <div className="mt-4 space-y-3">

                      {/* Variable → Column mapping */}
                      {scriptTemplateVars.length > 0 && (
                        <div className="rounded-lg border border-border bg-card px-3 py-2 space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Variable mapping
                          </p>
                          {scriptTemplateVars.map((v) => {
                            const autoMatch = availableColumns.includes(v);
                            const explicitCol = variableMapping[v] || "";
                            const resolved =
                              explicitCol || (autoMatch ? v : "");
                            const isMapped = !!resolved;
                            return (
                              <div key={v} className="flex items-center gap-2">
                                <span
                                  className="font-mono text-[11px] text-slate-600 w-28 shrink-0 truncate"
                                  title={`{{${v}}}`}
                                >
                                  {`{{${v}}}`}
                                </span>
                                <span className="text-slate-300 text-[10px]">
                                  →
                                </span>
                                {autoMatch &&
                                (!explicitCol || explicitCol === v) ? (
                                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                    <span className="font-mono">{v}</span>
                                    <span className="text-emerald-400 dark:text-emerald-500 text-[9px]">
                                      auto
                                    </span>
                                  </span>
                                ) : (
                                  <select
                                    value={explicitCol || "__none__"}
                                    onChange={(e) => {
                                      const col =
                                        e.target.value === "__none__"
                                          ? ""
                                          : e.target.value;
                                      setVariableMapping((prev) => {
                                        const next = { ...prev };
                                        if (!col) delete next[v];
                                        else next[v] = col;
                                        return next;
                                      });
                                    }}
                                    className={`flex-1 min-w-0 rounded-lg border px-2 py-1 text-xs outline-none focus:ring-2 ${
                                      isMapped
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-100 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                                        : "border-amber-200 bg-amber-50 text-amber-700 focus:ring-amber-100 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
                                    }`}
                                  >
                                    <option value="__none__">
                                      — pick column —
                                    </option>
                                    {availableColumns.map((col) => (
                                      <option key={col} value={col}>
                                        {col}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                {autoMatch && !explicitCol ? null : isMapped ? (
                                  <span className="text-[10px] text-emerald-500 dark:text-emerald-400 shrink-0">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-400 dark:text-amber-500 shrink-0">
                                    ⚠
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Assertion columns indicator */}
                      {assertionTemplateVars.length > 0 && (
                        <div className="rounded-lg border border-purple-100 dark:border-purple-800/30 bg-purple-50/60 dark:bg-purple-900/15 px-3 py-2 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500 dark:text-purple-400">
                            Assertion columns
                          </p>
                          <p className="text-[10px] text-purple-400 dark:text-purple-400/80">
                            These columns will be used as expected values in
                            assertion steps
                          </p>
                          {assertionTemplateVars.map((v) => {
                            const ok = availableColumns.includes(v);
                            return (
                              <div
                                key={v}
                                className="flex items-center gap-2 text-[11px]"
                              >
                                <span
                                  className={`font-mono ${ok ? "text-purple-700 dark:text-purple-300" : "text-amber-600 dark:text-amber-400"}`}
                                >
                                  {`{{${v}}}`}
                                </span>
                                <span
                                  className={
                                    ok
                                      ? "text-purple-500 dark:text-purple-400"
                                      : "text-amber-400 dark:text-amber-500"
                                  }
                                >
                                  {ok
                                    ? "✓ in dataset"
                                    : "⚠ add this column to dataset"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Parameterize — map hardcoded steps to dataset columns inline */}
                      {(() => {
                        if (hardcodedInputFields.length === 0) return null;
                        const hasSomeAssigned = hardcodedInputFields.some(
                          ({ sno, fieldKey }) =>
                            !!quickParamMap[`${sno}_${fieldKey}`],
                        );
                        return (
                          <div className="rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50/80 dark:bg-amber-900/20 px-3 py-2.5 space-y-2.5">
                            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                              {hardcodedInputFields.length} field
                              {hardcodedInputFields.length > 1 ? "s" : ""} still
                              hardcoded — fields without a column mapping will
                              stay the same for every row
                            </p>
                            <div className="space-y-1.5">
                              {hardcodedInputFields.map(
                                ({ sno, fieldKey, value }) => {
                                  const stateKey = `${sno}_${fieldKey}`;
                                  const picked = quickParamMap[stateKey] || "";
                                  return (
                                    <div
                                      key={stateKey}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-[10px] text-slate-500 w-10 shrink-0">
                                        Step {sno}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-400 w-8 shrink-0">
                                        {fieldKey}
                                      </span>
                                      <span
                                        className="flex-1 truncate text-[10px] font-mono text-slate-400 max-w-[80px]"
                                        title={value}
                                      >
                                        "{value.slice(0, 12)}
                                        {value.length > 12 ? "…" : ""}"
                                      </span>
                                      <span className="text-slate-300 text-[10px]">
                                        →
                                      </span>
                                      <select
                                        value={picked || "__none__"}
                                        onChange={(e) => {
                                          const col =
                                            e.target.value === "__none__"
                                              ? ""
                                              : e.target.value;
                                          setQuickParamMap((prev) => {
                                            const next = { ...prev };
                                            if (!col) delete next[stateKey];
                                            else next[stateKey] = col;
                                            return next;
                                          });
                                        }}
                                        className={`flex-1 min-w-0 rounded-lg border px-2 py-1 text-xs outline-none focus:ring-2 ${
                                          picked
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-100 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                                            : "border-amber-200 bg-card text-foreground focus:ring-amber-100 dark:border-amber-700/40 dark:focus:ring-amber-900/40"
                                        }`}
                                      >
                                        <option value="__none__">
                                          — column —
                                        </option>
                                        {availableColumns.map((col) => (
                                          <option key={col} value={col}>
                                            {col}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={!hasSomeAssigned || paramSaving}
                              onClick={handleQuickParameterize}
                              className="w-full rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
                            >
                              {paramSaving
                                ? "Saving…"
                                : `Apply — convert mapped field${Object.keys(quickParamMap).length > 1 ? "s" : ""} to {{var}}`}
                            </button>
                          </div>
                        );
                      })()}

                      {/* Warn about vars with no auto-match AND no explicit mapping */}
                      {scriptTemplateVars.filter(
                        (v) =>
                          !availableColumns.includes(v) && !variableMapping[v],
                      ).length > 0 && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          ⚠{" "}
                          {scriptTemplateVars
                            .filter(
                              (v) =>
                                !availableColumns.includes(v) &&
                                !variableMapping[v],
                            )
                            .map((v) => `{{${v}}}`)
                            .join(", ")}{" "}
                          — pick a column above before running.
                        </p>
                      )}

                      {confirmBatch ? (
                        <div className="flex items-center gap-3 rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 animate-in fade-in duration-200">
                          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
                            This will queue{" "}
                            <strong>
                              {datasetDetail.rows?.length ?? 0} test runs
                            </strong>
                            . Continue?
                          </p>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setConfirmBatch(false)}
                              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                            >
                              Cancel
                            </button>
                            <Button
                              onClick={handleBatchReplay}
                              disabled={busyAction === "batch"}
                              className="bg-sky-600 hover:bg-sky-700"
                              size="sm"
                            >
                              {busyAction === "batch" ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  <span className="ml-2">Queuing…</span>
                                </>
                              ) : (
                                "Confirm & Run"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={requestBatchReplay}
                          disabled={
                            busyAction === "run" ||
                            busyAction === "replay" ||
                            busyAction === "batch" ||
                            hardcodedInputFields.length > 0
                          }
                          className="w-full bg-sky-600 hover:bg-sky-700 h-10 disabled:opacity-50"
                          title={
                            hardcodedInputFields.length > 0
                              ? "Apply parameterization above before running batch"
                              : undefined
                          }
                        >
                          <Layers className="mr-2 size-4" />
                          Run all {datasetDetail.rows?.length ?? 0} rows
                          {hardcodedInputFields.length > 0 && (
                            <span className="ml-2 rounded bg-amber-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100">
                              parameterize first
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Replay button */}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  onClick={handleReplayRun}
                  disabled={
                    busyAction === "run" ||
                    busyAction === "replay" ||
                    busyAction === "batch"
                  }
                  className={
                    hasReplayInputs
                      ? "bg-violet-600 hover:bg-violet-700"
                      : "bg-slate-600 hover:bg-slate-700"
                  }
                >
                  {busyAction === "replay" ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Starting replay…</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 size-4" />
                      Replay
                      {selectedDatasetRowIndex !== null && (
                        <span className="ml-1.5 rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                          row {selectedDatasetRowIndex + 1}
                        </span>
                      )}
                      {selectedDatasetRowIndex === null && hasReplayInputs && (
                        <span className="ml-1.5 rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                          {filledCount} input{filledCount > 1 ? "s" : ""}
                        </span>
                      )}
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
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-900/40"
                />
                <Button
                  onClick={handleReplayRun}
                  disabled={busyAction === "run" || busyAction === "replay"}
                  variant="outline"
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800/40 dark:text-violet-300 dark:hover:bg-violet-950/30"
                >
                  {busyAction === "replay" ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Starting…</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 size-4" />
                      Replay Script
                    </>
                  )}
                </Button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Status messages — auto-dismiss after 5s */}
      {(actionError || actionSuccess) && (
        <div className="px-5 pb-4 animate-in fade-in slide-in-from-top-1 duration-300">
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/20">
              <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
              <span className="text-sm text-red-600 flex-1 dark:text-red-300">{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError("")}
                className="text-red-300 hover:text-red-500 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          )}
          {actionSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-700 flex-1 dark:text-emerald-300">
                {actionSuccess}
              </span>
              <button
                type="button"
                onClick={() => setActionSuccess("")}
                className="text-emerald-300 hover:text-emerald-500 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
