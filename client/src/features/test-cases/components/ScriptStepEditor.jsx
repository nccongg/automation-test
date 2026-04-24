import { useState, useEffect, useRef } from "react";
import { Link2, X, ChevronDown, Wand2, Check } from "lucide-react";

const VALID_VAR_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const ACTION_COLORS = {
  navigate:        "border-blue-200 bg-blue-50 text-blue-700",
  fill:            "border-amber-200 bg-amber-50 text-amber-700",
  click:           "border-emerald-200 bg-emerald-50 text-emerald-700",
  select:          "border-violet-200 bg-violet-50 text-violet-700",
  check:           "border-teal-200 bg-teal-50 text-teal-700",
  uncheck:         "border-teal-200 bg-teal-50 text-teal-700",
  wait:            "border-slate-200 bg-slate-100 text-slate-500",
  assert:          "border-purple-200 bg-purple-50 text-purple-700",
  scroll:          "border-sky-200 bg-sky-50 text-sky-700",
  hover:           "border-orange-200 bg-orange-50 text-orange-700",
  press_key:       "border-pink-200 bg-pink-50 text-pink-700",
  extract_content: "border-lime-200 bg-lime-50 text-lime-700",
  screenshot:      "border-indigo-200 bg-indigo-50 text-indigo-700",
};

const USER_INPUT_KEYS = new Set([
  "text", "url", "value", "content", "key", "keys", "query", "option", "file",
]);

function extractTemplateVars(val) {
  if (typeof val !== "string") return [];
  return [...new Set((val.match(/\{\{(\w+)\}\}/g) || []).map((m) => m.slice(2, -2)))];
}

function stepParamKey(stepNo, key) {
  return `_step_${stepNo}_${key}`;
}

function stepDescription(step) {
  return step.notes || step.actionInput?.axName || step.actionInput?.placeholder || step.actionInput?.title || null;
}

// Inline "parameterize" widget: convert hardcoded value to {{varName}}
function ParameterizeInput({ currentText, availableColumns, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [varName, setVarName] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Pre-fill with matching column name if text matches any column value in first row
    if (!varName && availableColumns.length > 0) setVarName(availableColumns[0]);
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isValid = VALID_VAR_RE.test(varName);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-600 hover:bg-amber-100 transition-all"
        title="Replace hardcoded value with {{variable}}"
      >
        <Wand2 className="size-3" />
        param
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-xl border border-amber-200 bg-white shadow-lg p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
            Replace with variable
          </p>
          <p className="text-[10px] text-slate-500">
            Current: <span className="font-mono text-slate-700">"{currentText?.slice(0, 30)}"</span>
          </p>
          <div className="flex gap-1.5">
            {availableColumns.length > 0 ? (
              <select
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-200"
              >
                {availableColumns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
                placeholder="variable_name"
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-200"
              />
            )}
            <button
              type="button"
              disabled={!isValid}
              onClick={() => { onConfirm(varName); setOpen(false); }}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-40 hover:bg-amber-600 transition-colors"
            >
              <Check className="size-3" />
            </button>
          </div>
          {varName && !isValid && (
            <p className="text-[10px] text-red-500">Only letters, digits, underscore. Must start with letter/underscore.</p>
          )}
          <p className="text-[10px] text-slate-400">
            Will become: <span className="font-mono text-amber-700">{`{{${varName || "..."}}} `}</span>
            <span className="text-slate-300">· saved to script</span>
          </p>
        </div>
      )}
    </div>
  );
}

// A single input field with optional column-binding dropdown
function BoundInput({ pkey, fieldKey, example, isTemplate, value, onChangeValue, readOnly, availableColumns, columnValues, binding, onBind, onUnbind, onParameterize }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const showBind = !readOnly && availableColumns?.length > 0;

  return (
    <div className="flex flex-col gap-1">
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{fieldKey}</span>
        {isTemplate && (
          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-amber-600">
            {`{{${pkey}}}`}
          </span>
        )}
        {binding && (
          <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-700">
            <Link2 className="size-2.5" />
            {binding}
            {!readOnly && (
              <button type="button" onClick={onUnbind} className="ml-0.5 text-violet-400 hover:text-violet-700">
                <X className="size-2.5" />
              </button>
            )}
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-1.5">
        {readOnly ? (
          <span className="text-sm text-slate-700">{value || <span className="text-slate-300">—</span>}</span>
        ) : (
          <>
            <input
              type="text"
              value={value ?? ""}
              onChange={(e) => { onUnbind?.(); onChangeValue(e.target.value); }}
              placeholder={binding ? `bound to ${binding}` : (example || `${fieldKey}…`)}
              disabled={!!binding}
              className={`min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-all focus:ring-2 ${
                binding
                  ? "border-violet-200 bg-violet-50/60 text-violet-800 placeholder:text-violet-400 cursor-default"
                  : value
                    ? "border-sky-300 bg-sky-50/40 text-slate-800 focus:ring-sky-200"
                    : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-300 hover:border-slate-300 focus:border-sky-300 focus:ring-sky-100"
              }`}
            />

            {/* Parameterize button — only for non-template hardcoded fields */}
            {!readOnly && !isTemplate && onParameterize && (
              <ParameterizeInput
                currentText={example}
                availableColumns={availableColumns}
                onConfirm={(varName) => onParameterize(fieldKey, varName)}
              />
            )}

            {/* Bind button */}
            {showBind && !binding && (
              <div className="relative shrink-0" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 transition-all"
                >
                  <Link2 className="size-3" />
                  bind
                  <ChevronDown className="size-2.5" />
                </button>

                {pickerOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Bind to column
                      </p>
                    </div>
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {availableColumns.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => { onBind(col); setPickerOpen(false); }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-violet-50"
                        >
                          <span className="font-semibold text-violet-700">{col}</span>
                          {columnValues?.[col] !== undefined && (
                            <span className="max-w-[90px] truncate text-[11px] text-slate-400 font-mono">
                              {String(columnValues[col]) || "—"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ScriptStepEditor({
  steps = [],
  params = {},
  onChange,
  readOnly = false,
  availableColumns = [],
  columnValues = {},
  // Controlled bindings: { pkey → colName }
  bindings: bindingsProp = null,
  onBindingsChange = null,
  // Called when user parameterizes a step: (stepNo, fieldKey, varName) => void
  onParameterize = null,
  parameterizeDisabled = false,
}) {
  // pkey → column name (controlled if bindingsProp provided, otherwise local)
  const [localBindings, setLocalBindings] = useState({});
  const bindings = bindingsProp !== null ? bindingsProp : localBindings;

  function setBindings(next) {
    if (bindingsProp !== null) {
      onBindingsChange?.(next);
    } else {
      setLocalBindings(next);
    }
  }

  // Reset bindings when the script changes (new steps)
  const stepsKeyRef = useRef(null);
  const stepsKey = steps.map((s) => s.stepNo ?? 0).join(",");
  if (stepsKeyRef.current !== stepsKey) {
    stepsKeyRef.current = stepsKey;
    if (Object.keys(bindings).length > 0) setBindings({});
  }

  // When columnValues changes, re-apply all bindings
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const entries = Object.entries(bindingsRef.current);
    if (!entries.length) return;
    // When the selected row changes, update the column value params so templates resolve correctly.
    // The _step_N_key holds "{{col}}" (a template), so we update "col" → new row value.
    const updates = {};
    entries.forEach(([, col]) => {
      updates[col] = columnValues?.[col] ?? "";
    });
    onChangeRef.current({ ...paramsRef.current, ...updates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnValues]);

  function setParam(pkey, value) {
    if (!readOnly) onChange({ ...params, [pkey]: value });
  }

  function bindParam(pkey, col) {
    const next = { ...bindings, [pkey]: col };
    setBindings(next);
    // Store "{{col}}" as the step override so it resolves via render_template on the worker.
    // Also store the current column value so single-row replay resolves it immediately.
    onChange({ ...params, [pkey]: `{{${col}}}`, [col]: columnValues?.[col] ?? "" });
  }

  function unbindParam(pkey) {
    const next = { ...bindings };
    delete next[pkey];
    setBindings(next);
  }

  if (!steps.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center">
        <p className="text-sm text-slate-400">No steps recorded in this script.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-[52px_1fr] border-b-2 border-slate-200 bg-slate-50">
        <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">#</div>
        <div className="grid grid-cols-[180px_1fr] border-l border-slate-200">
          <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</div>
          <div className="border-l border-slate-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Input
            {availableColumns.length > 0 && (
              <span className="ml-2 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-600 normal-case tracking-normal">
                {availableColumns.length} column{availableColumns.length > 1 ? "s" : ""} available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rows */}
      {steps.map((step, i) => {
        const sno = step.stepNo ?? i + 1;
        const isLast = i === steps.length - 1;
        const isEven = i % 2 === 1;
        const desc = stepDescription(step);

        // Collect editable input fields
        const inputRows = [];
        Object.entries(step.actionInput || {}).forEach(([key, val]) => {
          const vars = extractTemplateVars(String(val));
          if (vars.length > 0) {
            vars.forEach((varName) =>
              inputRows.push({ key, pkey: varName, example: String(val), isTemplate: true }),
            );
          } else if (USER_INPUT_KEYS.has(key)) {
            inputRows.push({ key, pkey: stepParamKey(sno, key), example: String(val), isTemplate: false });
          }
        });

        const hasInput = inputRows.length > 0;

        return (
          <div
            key={i}
            className={`grid grid-cols-[52px_1fr] transition-colors ${!isLast ? "border-b border-slate-100" : ""} ${isEven ? "bg-slate-50/40" : "bg-white"}`}
          >
            {/* Step number */}
            <div className="flex items-start justify-center pt-4 pb-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                {sno}
              </span>
            </div>

            <div className="grid grid-cols-[180px_1fr] border-l border-slate-100">
              {/* Action column */}
              <div className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ACTION_COLORS[step.actionName] ?? "border-slate-200 bg-slate-100 text-slate-600"}`}>
                    {step.actionName}
                  </span>
                </div>
                {desc && (
                  <p className="text-[11px] leading-tight text-slate-400 line-clamp-2">{desc}</p>
                )}
                {step.expectedUrl && (
                  <p className="truncate text-[10px] font-mono text-slate-300" title={step.expectedUrl}>
                    → {step.expectedUrl}
                  </p>
                )}
              </div>

              {/* Input column */}
              <div className="border-l border-slate-100 px-4 py-3">
                {hasInput ? (
                  <div className="space-y-3">
                    {inputRows.map(({ key, pkey, example, isTemplate }) => (
                      <BoundInput
                        key={pkey}
                        pkey={pkey}
                        fieldKey={key}
                        example={example}
                        isTemplate={isTemplate}
                        value={params[pkey] ?? ""}
                        onChangeValue={(v) => setParam(pkey, v)}
                        readOnly={readOnly}
                        availableColumns={availableColumns}
                        columnValues={columnValues}
                        binding={bindings[pkey]}
                        onBind={(col) => bindParam(pkey, col)}
                        onUnbind={() => unbindParam(pkey)}
                        onParameterize={onParameterize && !parameterizeDisabled ? (fieldKey, varName) => onParameterize(sno, fieldKey, varName) : null}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[12px] text-slate-300 italic">no input</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
