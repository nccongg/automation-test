import { useState, useEffect, useRef } from "react";
import { Link2, X, ChevronDown, Check, ShieldCheck, Plus, Wand2, Link, Eye, EyeOff, Type, Hash } from "lucide-react";

const ANCHOR_TYPE_META = {
  url_contains:       { icon: Link,       label: "URL contains" },
  url_changed:        { icon: Link,       label: "URL changed" },
  text_visible:       { icon: Eye,        label: "Text visible" },
  text_not_visible:   { icon: EyeOff,     label: "Text hidden" },
  no_error_message:   { icon: ShieldCheck, label: "No errors" },
  field_value_equals: { icon: Type,       label: "Field value" },
};

function StepAnchors({ anchors }) {
  if (!anchors || anchors.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-violet-100 bg-violet-50/60 px-2.5 py-2">
      {anchors.map((anchor, i) => {
        const meta = ANCHOR_TYPE_META[anchor.type] ?? { icon: Hash, label: anchor.type };
        const Icon = meta.icon;
        return (
          <span
            key={i}
            title={anchor.reason || anchor.type}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              anchor.required
                ? "border-violet-200 bg-violet-100 text-violet-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
            }`}
          >
            <Icon size={9} className="shrink-0" />
            <span>{meta.label}</span>
            {anchor.value && (
              <span className="font-mono opacity-75">"{anchor.value}"</span>
            )}
            {!anchor.required && (
              <span className="opacity-50">?</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

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
  "text", "url", "value", "content", "key", "keys", "query", "option", "file", "contains",
]);

const ASSERTION_TYPES = [
  { value: "assert_text",         label: "Text equals",     fields: ["selector", "text"],  needsExpected: true },
  { value: "assert_url_contains", label: "URL contains",    fields: ["contains"],           needsExpected: true },
  { value: "assert_url",          label: "URL equals",      fields: ["url"],                needsExpected: true },
  { value: "assert_visible",      label: "Element visible", fields: ["selector"],           needsExpected: false },
  { value: "assert_value",        label: "Input value",     fields: ["selector", "value"],  needsExpected: true },
];

function actionColorClass(name) {
  if (!name) return "border-slate-200 bg-slate-100 text-slate-600";
  if (ACTION_COLORS[name]) return ACTION_COLORS[name];
  if (name.startsWith("assert_") || name.startsWith("verify_")) return ACTION_COLORS.assert;
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function extractTemplateVars(val) {
  if (typeof val !== "string") return [];
  return [...new Set((val.match(/\{\{(\w+)\}\}/g) || []).map((m) => m.slice(2, -2)))];
}

function stepDescription(step) {
  return step.notes || step.actionInput?.axName || step.actionInput?.placeholder || step.actionInput?.title || null;
}

// Column picker dropdown (shared between template bind and hardcoded parameterize)
function ColDropdown({ icon, label, columns, columnValues, onPick, triggerClass }) {
  const Icon = icon;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-semibold transition-colors ${triggerClass}`}
        title={label}
      >
        <Icon className="size-3" />
        <ChevronDown className="size-2.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-2.5 py-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          </div>
          <div className="max-h-44 overflow-y-auto py-0.5">
            {columns.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => { onPick(col); setOpen(false); }}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-slate-50"
              >
                <span className="text-[11px] font-semibold text-violet-600">{col}</span>
                {columnValues?.[col] !== undefined && (
                  <span className="max-w-[70px] truncate text-[10px] font-mono text-slate-400">
                    {String(columnValues[col]) || "—"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Unified field row: handles both template {{var}} fields and hardcoded value fields
function FieldRow({ fieldKey, pkey, isTemplate, rawValue, paramValue, onChangeValue, readOnly, availableColumns, columnValues, binding, onBind, onUnbind, onParameterize, isRedacted }) {
  const [showValue, setShowValue] = useState(false);
  const hasColumns = availableColumns?.length > 0;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Key label */}
      <span className="w-14 shrink-0 text-right text-[10px] font-bold uppercase tracking-widest text-slate-300">
        {fieldKey}
      </span>

      {/* Value area */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {readOnly ? (
          <span className="text-xs text-slate-600">{rawValue || paramValue || <span className="italic text-slate-300">—</span>}</span>
        ) : isRedacted ? (
          <>
            <span className="shrink-0 rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-500">
              redacted
            </span>
            <input
              type={showValue ? "text" : "password"}
              value={paramValue ?? ""}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder="Enter value for replay…"
              className={`min-w-0 flex-1 rounded border px-2 py-1 text-xs placeholder:text-slate-300 outline-none focus:ring-1 transition-colors ${
                paramValue
                  ? "border-emerald-200 bg-emerald-50/40 text-slate-700 focus:border-emerald-300 focus:ring-emerald-100"
                  : "border-orange-200 bg-orange-50/30 text-slate-700 focus:border-orange-300 focus:ring-orange-100"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowValue((v) => !v)}
              className="shrink-0 rounded p-1 text-slate-300 hover:text-slate-500 transition-colors"
              title={showValue ? "Hide" : "Show"}
            >
              {showValue ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          </>
        ) : binding ? (
          // Bound to a dataset column
          <>
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-violet-200 bg-violet-50 py-0.5 pl-2 pr-1 text-[11px] font-semibold text-violet-700">
              <Link2 className="size-2.5 text-violet-400" />
              {binding}
              <button
                type="button"
                onClick={onUnbind}
                className="ml-0.5 rounded-full p-0.5 text-violet-300 hover:bg-violet-100 hover:text-violet-600 transition-colors"
              >
                <X className="size-2.5" />
              </button>
            </span>
            {columnValues?.[binding] !== undefined && (
              <span className="min-w-0 flex-1 truncate text-[10px] font-mono text-slate-400" title={String(columnValues[binding])}>
                = {String(columnValues[binding]) || "—"}
              </span>
            )}
          </>
        ) : isTemplate ? (
          // Template var — text input with {{var}} placeholder + optional bind dropdown
          <>
            <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-600">
              {`{{${pkey}}}`}
            </span>
            <input
              type="text"
              value={paramValue ?? ""}
              onChange={(e) => onChangeValue(e.target.value)}
              placeholder="override…"
              className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 placeholder:text-slate-300 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100 transition-colors"
            />
            {hasColumns && (
              <ColDropdown
                icon={Link2}
                label="Bind to column"
                columns={availableColumns}
                columnValues={columnValues}
                onPick={onBind}
                triggerClass="border-violet-200 bg-violet-50 text-violet-500 hover:bg-violet-100"
              />
            )}
          </>
        ) : (
          // Hardcoded value — show as read-only badge + optional column picker to parameterize
          <>
            <span
              className="min-w-0 flex-1 truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono text-slate-600"
              title={rawValue}
            >
              {rawValue || <span className="italic text-slate-300">empty</span>}
            </span>
            {hasColumns && onParameterize && (
              <ColDropdown
                icon={Wand2}
                label="Map to column"
                columns={availableColumns}
                columnValues={columnValues}
                onPick={onParameterize}
                triggerClass="border-slate-200 bg-slate-50 text-slate-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AddAssertionPanel({ nextStepNo, availableColumns, onAdd, disabled }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("assert_text");
  const [selector, setSelector] = useState("");
  const [expected, setExpected] = useState("");
  const [continueOnError, setContinueOnError] = useState(false);
  const ref = useRef(null);

  const typeConfig = ASSERTION_TYPES.find((t) => t.value === type);
  const needsSelector = typeConfig?.fields.includes("selector");
  const expectedField = typeConfig?.fields.find((f) => f !== "selector");
  const canAdd = typeConfig?.needsExpected ? expected.trim() !== "" : selector.trim() !== "";

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleAdd() {
    const actionInput = {};
    if (needsSelector && selector.trim()) actionInput.selector = selector.trim();
    if (expectedField && expected.trim()) actionInput[expectedField] = expected.trim();
    onAdd({ actionName: type, actionInput, continueOnError, captureScreenshot: false });
    setOpen(false);
    setSelector("");
    setExpected("");
  }

  return (
    <div ref={ref} className="border-t border-slate-100 px-4 py-3">
      {!open ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded border border-dashed border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-400 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-colors disabled:opacity-40"
        >
          <Plus className="size-3" />
          Add assertion
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-purple-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 shrink-0 text-purple-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
              Assertion — Step {nextStepNo}
            </p>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto text-slate-300 hover:text-slate-500">
              <X className="size-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {ASSERTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                  type === t.value
                    ? "border-purple-300 bg-purple-100 text-purple-700"
                    : "border-slate-200 bg-white text-slate-400 hover:border-purple-200 hover:text-purple-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {needsSelector && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Selector
                </label>
                <input
                  type="text"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="#el, .class, [data-id]"
                  className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs font-mono outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-100"
                />
              </div>
            )}
            {typeConfig?.needsExpected && expectedField && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Expected
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                    placeholder={availableColumns.length > 0 ? "value or {{col}}" : "expected value"}
                    className="min-w-0 flex-1 rounded border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-100"
                  />
                  {availableColumns.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) setExpected(`{{${e.target.value}}}`); }}
                      className="rounded border border-purple-200 bg-purple-50 px-1.5 text-xs text-purple-600 outline-none focus:ring-1 focus:ring-purple-100"
                    >
                      <option value="">col</option>
                      {availableColumns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-400">
              <input
                type="checkbox"
                checked={continueOnError}
                onChange={(e) => setContinueOnError(e.target.checked)}
                className="accent-purple-500"
              />
              Continue on failure
            </label>
            <button
              type="button"
              disabled={!canAdd || disabled}
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              <Check className="size-3" />
              Add to script
            </button>
          </div>
        </div>
      )}
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
  bindings: bindingsProp = null,
  onBindingsChange = null,
  onParameterize = null,
  parameterizeDisabled = false,
  onAddAssertionStep = null,
}) {
  const [localBindings, setLocalBindings] = useState({});
  const bindings = bindingsProp !== null ? bindingsProp : localBindings;

  function setBindings(next) {
    if (bindingsProp !== null) onBindingsChange?.(next);
    else setLocalBindings(next);
  }

  // Reset bindings when steps change
  /* eslint-disable react-hooks/refs */
  const stepsKeyRef = useRef(null);
  const stepsKey = steps.map((s) => s.stepNo ?? 0).join(",");
  if (stepsKeyRef.current !== stepsKey) {
    stepsKeyRef.current = stepsKey;
    if (Object.keys(bindings).length > 0) setBindings({});
  }
  /* eslint-enable react-hooks/refs */

  // Refs keep latest values so the columnValues effect below doesn't re-run on every render
  /* eslint-disable react-hooks/refs */
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const paramsRef = useRef(params);
  paramsRef.current = params;
  /* eslint-enable react-hooks/refs */

  // When selected row changes, update each bound template var with the new column value
  useEffect(() => {
    const entries = Object.entries(bindingsRef.current); // [[pkey, colName], ...]
    if (!entries.length) return;
    const updates = {};
    // Must update params[pkey] (the template var name), NOT params[col] (the column name).
    // The worker resolves {{pkey}} from params[pkey] in a single pass — a nested "{{col}}"
    // string would NOT be resolved further.
    entries.forEach(([pkey, col]) => { updates[pkey] = columnValues?.[col] ?? ""; });
    onChangeRef.current({ ...paramsRef.current, ...updates });
  }, [columnValues]);

  function setParam(pkey, value) {
    if (!readOnly) onChange({ ...params, [pkey]: value });
  }

  function bindParam(pkey, col) {
    setBindings({ ...bindings, [pkey]: col });
    // Store the actual column value so the worker receives params[pkey] = "john@test.com"
    // and can resolve {{pkey}} in a single pass. Storing "{{col}}" would leave it unresolved.
    onChange({ ...params, [pkey]: columnValues?.[col] ?? "" });
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

  const assertionCount = steps.filter(
    (s) => s.actionName?.startsWith("assert_") || s.actionName?.startsWith("verify_"),
  ).length;

  const anchorCount = steps.reduce((n, s) => n + (s.anchors?.length ?? 0), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          {assertionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
              <ShieldCheck className="size-3" />
              {assertionCount} assertion{assertionCount > 1 ? "s" : ""}
            </span>
          )}
          {anchorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
              <ShieldCheck className="size-3" />
              {anchorCount} anchor{anchorCount > 1 ? "s" : ""}
            </span>
          )}
          {availableColumns.length > 0 && (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-600">
              {availableColumns.length} col{availableColumns.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Step list */}
      <div className="divide-y divide-slate-100">
        {steps.map((step, i) => {
          const sno = step.stepNo ?? i + 1;
          const desc = stepDescription(step);

          // Collect fields: template vars, redacted values, and hardcoded user-input fields
          const fields = [];
          Object.entries(step.actionInput || {}).forEach(([key, val]) => {
            const vars = extractTemplateVars(String(val));
            if (vars.length > 0) {
              vars.forEach((varName) =>
                fields.push({ key, pkey: varName, isTemplate: true, rawValue: String(val) }),
              );
            } else if (String(val) === "[REDACTED]" && USER_INPUT_KEYS.has(key)) {
              fields.push({ key, pkey: `__r${sno}_${key}`, isTemplate: false, rawValue: "[REDACTED]", isRedacted: true });
            } else if (USER_INPUT_KEYS.has(key)) {
              fields.push({ key, pkey: key, isTemplate: false, rawValue: String(val) });
            }
          });

          return (
            <div key={i} className="flex hover:bg-slate-50/40 transition-colors">
              {/* Step number */}
              <div className="flex w-10 shrink-0 items-start justify-center pt-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                  {sno}
                </span>
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-2 border-l border-slate-100 py-2.5 pl-3 pr-4">
                {/* Action + description */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${actionColorClass(step.actionName)}`}>
                    {step.actionName}
                  </span>
                  {desc && (
                    <span className="min-w-0 truncate text-[11px] text-slate-400" title={desc}>
                      {desc}
                    </span>
                  )}
                  {step.expectedUrl && (
                    <span className="min-w-0 truncate text-[10px] font-mono text-slate-300" title={step.expectedUrl}>
                      → {step.expectedUrl}
                    </span>
                  )}
                </div>

                {/* Input fields */}
                {fields.length > 0 && (
                  <div className="space-y-1.5 rounded bg-slate-50/70 px-2.5 py-2">
                    {fields.map(({ key, pkey, isTemplate, rawValue, isRedacted }) => (
                      <FieldRow
                        key={`${sno}-${pkey}`}
                        fieldKey={key}
                        pkey={pkey}
                        isTemplate={isTemplate}
                        rawValue={rawValue}
                        paramValue={params[pkey] ?? ""}
                        onChangeValue={(v) => setParam(pkey, v)}
                        readOnly={readOnly}
                        availableColumns={availableColumns}
                        columnValues={columnValues}
                        binding={isTemplate ? bindings[pkey] : null}
                        onBind={(col) => bindParam(pkey, col)}
                        onUnbind={() => unbindParam(pkey)}
                        onParameterize={
                          !readOnly && !isTemplate && !isRedacted && onParameterize && !parameterizeDisabled
                            ? (col) => onParameterize(sno, key, col)
                            : null
                        }
                        isRedacted={isRedacted ?? false}
                      />
                    ))}
                  </div>
                )}

                {/* State Anchors */}
                <StepAnchors anchors={step.anchors} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add assertion */}
      {!readOnly && onAddAssertionStep && (
        <AddAssertionPanel
          nextStepNo={steps.reduce((m, s) => Math.max(m, s.stepNo ?? 0), 0) + 1}
          availableColumns={availableColumns}
          onAdd={onAddAssertionStep}
          disabled={parameterizeDisabled}
        />
      )}
    </div>
  );
}
