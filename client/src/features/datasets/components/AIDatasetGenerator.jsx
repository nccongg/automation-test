import { useState } from "react";
import {
  Sparkles, ChevronDown, ChevronRight, AlertTriangle,
  CheckCircle, Save, RotateCcw, Info, ArrowRight,
} from "lucide-react";
import { generateDatasetWithAI, createDataset, updateDataset } from "../api/datasetsApi";
import { FormInput, FormTextarea } from "@/shared/components/ui/FormField";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function extractTemplateVars(steps) {
  const re = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const vars = new Set();
  let m;
  const src = JSON.stringify(steps || []);
  while ((m = re.exec(src)) !== null) vars.add(m[1]);
  return [...vars];
}

/* ── AnalysisPanel ───────────────────────────────────────────────────────── */

function AnalysisPanel({ analysis }) {
  const [open, setOpen] = useState(true);
  if (!analysis?.context) return null;

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <Info className="size-3.5 text-sky-500 shrink-0" />
        <span className="flex-1 text-xs font-semibold text-sky-700">AI Analysis</span>
        {open
          ? <ChevronDown className="size-3.5 text-sky-400" />
          : <ChevronRight className="size-3.5 text-sky-400" />}
      </button>

      {open && (
        <div className="border-t border-sky-100 px-3 pb-3 pt-2 space-y-2.5">
          <p className="text-xs text-sky-800">{analysis.context}</p>

          {analysis.coverageSummary && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-500 mb-0.5">Coverage</p>
              <p className="text-xs text-sky-700">{analysis.coverageSummary}</p>
            </div>
          )}

          {analysis.variableRoles && Object.keys(analysis.variableRoles).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-500 mb-1">Variable roles</p>
              <div className="space-y-0.5">
                {Object.entries(analysis.variableRoles).map(([v, role]) => (
                  <p key={v} className="text-[11px] text-sky-600">
                    <span className="font-mono font-semibold text-sky-700">{`{{${v}}}`}</span> — {role}
                  </p>
                ))}
              </div>
            </div>
          )}

          {analysis.warnings?.length > 0 && (
            <div className="flex items-start gap-1.5 rounded bg-amber-50 border border-amber-200 px-2.5 py-2">
              <AlertTriangle className="size-3 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                {analysis.warnings.map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-700">{w}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── EditableMappingPanel ────────────────────────────────────────────────── */

function EditableMappingPanel({ scriptVars, columns, mapping, onChange }) {
  if (!scriptVars.length) return null;

  const allMapped = scriptVars.every((v) => mapping[v] && columns.includes(mapping[v]));

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-violet-100">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 flex-1">
          Variable → Column Mapping
        </span>
        {allMapped
          ? <span className="flex items-center gap-1 text-[10px] text-emerald-600"><CheckCircle className="size-3" />All mapped</span>
          : <span className="flex items-center gap-1 text-[10px] text-amber-500"><AlertTriangle className="size-3" />Some unmapped</span>
        }
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {scriptVars.map((v) => {
          const col = mapping[v] || "";
          const valid = col && columns.includes(col);
          return (
            <div key={v} className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-violet-700 shrink-0 w-28 truncate" title={`{{${v}}}`}>
                {`{{${v}}}`}
              </span>
              <ArrowRight className="size-3 text-muted-foreground/30 shrink-0" />
              <select
                value={col || "__none__"}
                onChange={(e) => {
                  const val = e.target.value === "__none__" ? "" : e.target.value;
                  onChange({ ...mapping, [v]: val });
                }}
                className={`flex-1 min-w-0 rounded border px-2 py-1 text-xs font-mono outline-none transition-colors ${
                  valid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400"
                    : col
                    ? "border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-400"
                    : "border-input bg-muted/50 text-muted-foreground focus:border-success"
                }`}
              >
                <option value="__none__">— not mapped —</option>
                {columns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="shrink-0 w-4 text-center">
                {valid
                  ? <CheckCircle className="size-3.5 text-emerald-500" />
                  : col
                  ? <AlertTriangle className="size-3.5 text-amber-400" />
                  : <span className="text-[10px] text-muted-foreground/30">—</span>
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── RowsPreview ─────────────────────────────────────────────────────────── */

function RowsPreview({ columns, rows }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border"
      >
        {expanded
          ? <ChevronDown className="size-3.5 text-muted-foreground" />
          : <ChevronRight className="size-3.5 text-muted-foreground" />}
        <span className="text-xs font-semibold text-foreground">
          Preview — {rows.length} rows × {columns.length} columns
        </span>
      </button>

      {expanded && (
        <div className="overflow-x-auto max-h-52">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 w-7">#</th>
                {columns.map((c) => (
                  <th key={c} className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`transition-colors ${i % 2 === 1 ? "bg-muted/50 hover:bg-muted/80" : "bg-card hover:bg-muted/40"}`}>
                  <td className="px-2 py-2.5 text-muted-foreground/30 font-mono tabular-nums">{i + 1}</td>
                  {columns.map((c) => (
                    <td
                      key={c}
                      className="px-2 py-2.5 text-foreground font-mono max-w-[160px] truncate"
                      title={String(row[c] ?? "")}
                    >
                      {String(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

export default function AIDatasetGenerator({
  projectId,
  goal,
  scriptSteps,
  initialRow,
  existingDatasetId,
  existingDatasetName,
  onDatasetSaved,
  alwaysOpen = false,
  sourceTestCaseId = null,
  sourceTestCaseTitle = null,
}) {
  const [_open, setOpen] = useState(false);
  const open = alwaysOpen || _open;
  const [prompt, setPrompt] = useState("");
  const [rowCount, setRowCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [editableMapping, setEditableMapping] = useState({});
  const [error, setError] = useState("");
  const [saveMode, setSaveMode] = useState("new");

  const scriptVars = extractTemplateVars(scriptSteps);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const data = await generateDatasetWithAI({
        projectId,
        prompt: prompt.trim(),
        rowCount,
        scriptSteps,
        goal,
        initialRow: initialRow && Object.keys(initialRow).length > 0 ? initialRow : undefined,
      });
      setResult(data);
      // Auto-map variables whose name exactly matches a generated column
      const autoMapping = {};
      const vars = extractTemplateVars(scriptSteps || []);
      (data.columns || []).forEach((col) => {
        if (vars.includes(col)) autoMapping[col] = col;
      });
      setEditableMapping({ ...autoMapping, ...(data.variableMapping || {}) });
    } catch (e) {
      setError(e?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setError("");
    try {
      let dataset;
      if (saveMode === "update" && existingDatasetId) {
        dataset = await updateDataset({
          id: existingDatasetId,
          projectId,
          name: existingDatasetName || result.datasetName,
          rows: result.rows,
        });
      } else {
        const autoDescription = sourceTestCaseId
          ? `Generated from test case: ${sourceTestCaseTitle || `#${sourceTestCaseId}`} (#${sourceTestCaseId})`
          : "";
        const created = await createDataset({
          projectId,
          name: result.datasetName,
          description: autoDescription,
        });
        dataset = await updateDataset({
          id: created.id,
          projectId,
          name: result.datasetName,
          description: autoDescription,
          rows: result.rows,
        });
      }
      // Pass the user-edited mapping (not the raw AI one)
      onDatasetSaved?.(dataset, editableMapping);
      setResult(null);
      setPrompt("");
      setOpen(false);
    } catch (e) {
      setError(e?.message || "Failed to save dataset.");
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <div className="space-y-3">
      {/* Prompt + row count */}
      <div className="space-y-2">
        <FormTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          placeholder={`Describe data to generate, e.g.\n"5 login scenarios: valid user, wrong password, empty fields, SQL injection, very long email"`}
          rows={3}
          disabled={generating || saving}
          className="disabled:opacity-50"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-muted-foreground shrink-0">Rows</label>
            <FormInput
              type="number"
              min={1}
              max={50}
              value={rowCount}
              onChange={(e) => setRowCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 5)))}
              disabled={generating || saving}
              className="w-16 text-center disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating || saving}
            className="flex items-center gap-1.5 rounded-md bg-[#0048D9] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#002266] disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-8"
          >
            {generating ? (
              <><span className="size-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />Generating…</>
            ) : (
              <><Sparkles className="size-3" />Generate</>
            )}
          </button>
          {result && (
            <button
              type="button"
              onClick={() => { setResult(null); setEditableMapping({}); }}
              className="flex items-center gap-1 rounded-md border border-[#0048D9] bg-background px-3 py-1.5 text-[11px] font-medium text-[#0048D9] hover:bg-[#E7F2FD] transition-colors ml-auto h-8"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded border border-destructive/20 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="size-3.5 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <AnalysisPanel analysis={result.analysis} />

          <EditableMappingPanel
            scriptVars={scriptVars.length > 0 ? scriptVars : Object.keys(result.variableMapping || {})}
            columns={result.columns}
            mapping={editableMapping}
            onChange={setEditableMapping}
          />

          <RowsPreview columns={result.columns} rows={result.rows} />

          {/* Save controls */}
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            {existingDatasetId && (
              <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
                {["new", "update"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSaveMode(mode)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      saveMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "new" ? "New dataset" : `Update "${existingDatasetName}"`}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-[linear-gradient(180deg,#B4F5DC_0%,#7CECC1_100%)] border border-white/80 px-4 py-1.5 text-xs font-medium text-[#017C28] hover:brightness-95 disabled:opacity-50 transition-all h-8"
            >
              {saving ? (
                <><span className="size-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />Saving…</>
              ) : (
                <><Save className="size-3" />Save &amp; apply mapping</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (alwaysOpen) {
    return content;
  }

  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-[0_4px_14px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <Sparkles className="size-3.5 text-violet-500 shrink-0" />
        <span className="text-xs font-semibold text-violet-700">Generate with AI</span>
        {scriptVars.length > 0 && (
          <span className="text-[10px] text-violet-400">
            · {scriptVars.length} var{scriptVars.length > 1 ? "s" : ""} detected
          </span>
        )}
        {_open
          ? <ChevronDown className="size-3.5 text-violet-400 ml-auto" />
          : <ChevronRight className="size-3.5 text-violet-400 ml-auto" />}
      </button>

      {_open && (
        <div className="border-t border-border px-3 pb-3 pt-2.5">
          {content}
        </div>
      )}
    </div>
  );
}
