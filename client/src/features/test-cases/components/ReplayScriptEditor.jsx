import { useState, useEffect, useRef, useCallback } from "react";
import {
  Code2, Eye, Sparkles, MousePointerClick, ChevronUp, ChevronDown,
  Trash2, Plus, Check, X, AlertTriangle, Loader2, Play, ShieldCheck,
  Globe, Type, MousePointer2, List, Save, Hash, MoreHorizontal, Pencil,
} from "lucide-react";
import { fastForwardInspect, suggestStepFix } from "@/features/test-results/api/testResultsApi";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Action display metadata ────────────────────────────────────────────────────

const ACTION_META = {
  navigate:        { color: "text-blue-700 bg-blue-50 border-blue-200",    short: "NAV",    Icon: Globe },
  click:           { color: "text-emerald-700 bg-emerald-50 border-emerald-200", short: "CLICK", Icon: MousePointer2 },
  fill:            { color: "text-amber-700 bg-amber-50 border-amber-200", short: "FILL",   Icon: Type },
  type:            { color: "text-amber-700 bg-amber-50 border-amber-200", short: "TYPE",   Icon: Type },
  select:          { color: "text-violet-700 bg-violet-50 border-violet-200", short: "SELECT", Icon: List },
  select_option:   { color: "text-violet-700 bg-violet-50 border-violet-200", short: "SELECT", Icon: List },
  check:           { color: "text-teal-700 bg-teal-50 border-teal-200",    short: "CHECK",  Icon: Check },
  uncheck:         { color: "text-teal-700 bg-teal-50 border-teal-200",    short: "UNCHECK", Icon: X },
  press:           { color: "text-pink-700 bg-pink-50 border-pink-200",    short: "KEY",    Icon: Hash },
  screenshot:      { color: "text-indigo-700 bg-indigo-50 border-indigo-200", short: "SNAP", Icon: Eye },
};

function getActionMeta(name) {
  if (!name) return { color: "text-slate-600 bg-slate-100 border-slate-200", short: "?", Icon: Hash };
  if (ACTION_META[name]) return ACTION_META[name];
  if (name.startsWith("assert_") || name.startsWith("verify_"))
    return { color: "text-purple-700 bg-purple-50 border-purple-200", short: "ASSERT", Icon: ShieldCheck };
  if (name.startsWith("wait_"))
    return { color: "text-slate-600 bg-slate-100 border-slate-200", short: "WAIT", Icon: Loader2 };
  return { color: "text-slate-600 bg-slate-100 border-slate-200", short: name.slice(0, 6).toUpperCase(), Icon: Hash };
}

// ── Human-readable label ───────────────────────────────────────────────────────

function labelFromSelector(selector) {
  if (!selector) return null;
  return (
    selector.match(/\[aria-label=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(/\[title=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(/\[data-(?:testid|qa|cy|test)=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(/\[name=["']?([^"'\]]+)["']?\]/i)?.[1] ||
    selector.match(/^#([a-zA-Z_-][a-zA-Z0-9_-]*)$/)?.[1] ||
    null
  );
}

function stepLabel(step) {
  const { actionName = "", actionInput = {}, description = "" } = step;
  if (description) return description;
  const action = actionName.toLowerCase();
  const raw = actionInput.selector || "";
  const t = actionInput.axName || actionInput.title || actionInput.placeholder ||
            actionInput.nameAttr || labelFromSelector(raw) || raw || "";
  const trunc = (s, n = 36) => s && s.length > n ? s.slice(0, n) + "…" : (s || "");
  const q = (s) => s ? `"${trunc(s)}"` : null;

  switch (action) {
    case "navigate": case "goto": case "go_to_url": case "open_url": {
      const url = actionInput.url || actionInput.href || "";
      return `Go to ${q(url) || "URL"}`;
    }
    case "click": case "tap":
      return t ? `Click ${q(t)}` : "Click element";
    case "fill": case "type": case "input_text": case "enter_text": case "input": {
      const text = actionInput.text || "";
      if (text && t) return `Type ${q(text)} into ${q(t)}`;
      if (text) return `Type ${q(text)}`;
      if (t) return `Fill ${q(t)}`;
      return "Fill input";
    }
    case "select": case "select_option": {
      const val = actionInput.value || actionInput.labelValue || "";
      return `Select ${q(val)}${t ? ` in ${q(t)}` : ""}`;
    }
    case "press": case "press_key": case "keyboard_press":
      return `Press ${actionInput.key || "key"}`;
    case "check":   return t ? `Check ${q(t)}` : "Check element";
    case "uncheck": return t ? `Uncheck ${q(t)}` : "Uncheck element";
    case "screenshot": return "Take screenshot";
    case "assert_text": case "assert_text_present": case "verify_text":
      return `Assert text ${q(actionInput.text || actionInput.value || "")}`;
    case "assert_url_contains":
      return `Assert URL contains ${q(actionInput.contains || actionInput.value || "")}`;
    case "assert_url": case "assert_url_equals": case "verify_url":
      return `Assert URL = ${q(actionInput.url || actionInput.value || "")}`;
    case "assert_visible": case "assert_element_visible": case "verify_element_visible":
      return `Assert ${q(t) || "element"} is visible`;
    case "assert_value": case "assert_input_value": case "verify_input_value":
      return `Assert value = ${q(actionInput.value || "")}`;
    case "wait_for_selector": case "wait_for_visible": case "wait_element_visible":
      return `Wait for ${q(t) || "element"}`;
    case "wait_for_text": case "wait_text_present":
      return `Wait for text ${q(actionInput.text || "")}`;
    default:
      return t ? `${actionName} ${q(t)}` : actionName || "Step";
  }
}

// ── Pick from Page panel ───────────────────────────────────────────────────────

const LOCATOR_TYPES = [
  { value: "selector",  label: "CSS selector" },
  { value: "axName",    label: "Accessible name" },
  { value: "placeholder", label: "Placeholder" },
  { value: "title",     label: "Title attr" },
  { value: "nameAttr",  label: "name= attr" },
  { value: "xpath",     label: "XPath" },
  { value: "id",        label: "Element ID" },
  { value: "text",      label: "Text content" },
];

function PickPanel({ scriptId, stepIndex, params, onApply, onClose }) {
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [screenshotB64, setScreenshotB64] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [error, setError] = useState(null);
  const [locType, setLocType] = useState("selector");
  const [locValue, setLocValue] = useState("");

  const paramsRefPick = useRef(params);
  useEffect(() => { let cancelled = false;
    fastForwardInspect({ scriptId, targetStepIndex: stepIndex, params: paramsRefPick.current })
      .then((data) => {
        if (cancelled) return;
        setScreenshotB64(data.screenshotBase64);
        setCurrentUrl(data.currentUrl);
        setPhase(data.ok ? "ready" : "error");
        if (!data.ok) setError(data.errorMessage || "Fast-forward failed");
      })
      .catch((e) => { if (!cancelled) { setPhase("error"); setError(e.message); } });
    return () => { cancelled = true; };
   
  }, [scriptId, stepIndex]);

  function handleApply() {
    if (!locValue.trim()) return;
    onApply({ [locType]: locValue.trim() });
  }

  return (
    <div className="mt-2 rounded-lg border border-sky-200 bg-gradient-to-b from-sky-50/60 to-white p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MousePointerClick className="size-3.5 text-sky-600" />
          <span className="text-[11px] font-bold text-sky-700 tracking-wide">Pick from Page</span>
          {currentUrl && (
            <span className="max-w-[200px] truncate text-[10px] text-sky-400 font-mono" title={currentUrl}>
              {currentUrl}
            </span>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-slate-300 hover:text-slate-600 transition-colors">
          <X className="size-3.5" />
        </button>
      </div>

      {phase === "loading" && (
        <div className="flex items-center gap-2 py-3 text-xs text-sky-600">
          <Loader2 className="size-3.5 animate-spin" />
          Replaying steps to reach this state…
        </div>
      )}

      {phase === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {phase === "ready" && screenshotB64 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-500">
            Page state before this step
          </p>
          <div className="overflow-hidden rounded-md border border-sky-200 shadow-sm max-h-52 cursor-zoom-in">
            <img
              src={`data:image/png;base64,${screenshotB64}`}
              alt="Page state"
              className="w-full object-cover object-top"
            />
          </div>
        </div>
      )}

      {(phase === "ready" || phase === "error") && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold text-sky-700">
            Inspect the screenshot and enter the locator for the element:
          </p>
          <div className="flex gap-2">
            <select
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              className="shrink-0 rounded-md border border-sky-200 bg-white px-2 py-1.5 text-xs text-sky-700 outline-none focus:ring-2 focus:ring-sky-100 transition-colors"
            >
              {LOCATOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={locValue}
              onChange={(e) => setLocValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
              placeholder="Enter value…"
              autoFocus
              className="min-w-0 flex-1 rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleApply} disabled={!locValue.trim()}
              className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-40 transition-colors">
              <Check className="size-3" />
              Apply locator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fix with AI panel ──────────────────────────────────────────────────────────

function FixPanel({ scriptId, stepIndex, params, currentStep, onApply, onClose }) {
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const paramsRefFix = useRef(params);
  useEffect(() => { let cancelled = false;
    suggestStepFix({ scriptId, targetStepIndex: stepIndex, params: paramsRefFix.current })
      .then((data) => {
        if (!cancelled) { setResult(data); setPhase("ready"); }
      })
      .catch((e) => { if (!cancelled) { setPhase("error"); setError(e.message); } });
    return () => { cancelled = true; };
   
  }, [scriptId, stepIndex]);

  const suggestion = result?.suggestion;
  const hasValidSuggestion = suggestion?.actionInput && Object.keys(suggestion.actionInput).length > 0;
  const confidence = suggestion?.confidence ?? 0;

  return (
    <div className="mt-2 rounded-lg border border-violet-200 bg-gradient-to-b from-violet-50/50 to-white p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-violet-600" />
          <span className="text-[11px] font-bold text-violet-700 tracking-wide">Fix with AI</span>
          {result?.currentUrl && (
            <span className="max-w-[180px] truncate text-[10px] text-violet-400 font-mono">{result.currentUrl}</span>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-slate-300 hover:text-slate-600 transition-colors">
          <X className="size-3.5" />
        </button>
      </div>

      {phase === "loading" && (
        <div className="flex items-center gap-2 py-3 text-xs text-violet-600">
          <Loader2 className="size-3.5 animate-spin" />
          Fast-forwarding and inspecting DOM…
        </div>
      )}

      {phase === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {phase === "ready" && (
        <>
          {result?.screenshotBase64 && (
            <div className="overflow-hidden rounded-md border border-violet-200 shadow-sm max-h-36">
              <img
                src={`data:image/png;base64,${result.screenshotBase64}`}
                alt="Page state"
                className="w-full object-cover object-top"
              />
            </div>
          )}

          {!result?.inspectOk && result?.inspectError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠ Fast-forward stopped early: {result.inspectError} — suggestion based on partial context
            </div>
          )}

          {hasValidSuggestion ? (
            <div className="space-y-2">
              {/* Diff view */}
              <div className="grid gap-1.5 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-red-400">Before</p>
                  <pre className="overflow-auto rounded-md border border-red-100 bg-red-50 px-2.5 py-2 text-[11px] leading-relaxed text-red-700 max-h-32">
                    {JSON.stringify(currentStep.actionInput, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">After</p>
                    <span className={`rounded-full px-1.5 py-px text-[9px] font-bold ${
                      confidence >= 0.8 ? "bg-emerald-100 text-emerald-700" :
                      confidence >= 0.5 ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                  <pre className="overflow-auto rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-700 max-h-32">
                    {JSON.stringify(suggestion.actionInput, null, 2)}
                  </pre>
                </div>
              </div>

              {suggestion.reasoning && (
                <p className="text-[10px] leading-relaxed text-slate-400 italic">{suggestion.reasoning}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Dismiss
                </button>
                <button type="button" onClick={() => onApply(suggestion.actionInput)}
                  className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors">
                  <Check className="size-3" />
                  Apply fix
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {suggestion?.reasoning || "No suggestion available — the target element may not be visible."}
              </p>
              <div className="flex justify-end">
                <button type="button" onClick={onClose}
                  className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── ActionInput inline editor ──────────────────────────────────────────────────

const KEY_LABELS = {
  url: "url", href: "url", text: "text", value: "value", key: "key",
  selector: "selector", css: "css", axName: "axName", title: "title",
  placeholder: "placeholder", nameAttr: "name", id: "id", xpath: "XPath",
  contains: "contains", labelValue: "label", nth: "nth",
};

function ActionInputEditor({ actionInput, onChange }) {
  const entries = Object.entries(actionInput || {});

  function set(k, v) { onChange({ ...actionInput, [k]: v }); }
  function del(k) { const n = { ...actionInput }; delete n[k]; onChange(n); }
  function addField() {
    const k = window.prompt("New field name:");
    if (k && !Object.prototype.hasOwnProperty.call(actionInput, k)) {
      onChange({ ...actionInput, [k]: "" });
    }
  }

  if (!entries.length) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <span className="text-[11px] italic text-slate-300">no fields</span>
        <button type="button" onClick={addField} className="text-[10px] text-slate-400 hover:text-sky-600 transition-colors">
          + add field
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2 group/field">
          <span className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-300">
            {KEY_LABELS[k] || k}
          </span>
          <input
            type="text"
            value={String(v ?? "")}
            onChange={(e) => set(k, e.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100 transition-colors"
          />
          <button type="button" onClick={() => del(k)}
            className="shrink-0 rounded p-0.5 text-slate-200 opacity-0 group-hover/field:opacity-100 hover:text-red-400 transition-all">
            <X className="size-3" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addField}
        className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-slate-500 transition-colors">
        <Plus className="size-3" />add field
      </button>
    </div>
  );
}

// ── Single step row in Guided mode ─────────────────────────────────────────────

function GuidedStepRow({ step, index, totalSteps, scriptId, params, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(false);
  const [pickOpen, setPickOpen]= useState(false);
  const [fixOpen, setFixOpen]  = useState(false);
  const sno = step.stepNo ?? index + 1;
  const label = stepLabel(step);
  const { color, Icon } = getActionMeta(step.actionName);
  const isAssertion = (step.actionName || "").startsWith("assert_") || (step.actionName || "").startsWith("verify_");

  function openPick() { setPickOpen(true); setFixOpen(false); setExpanded(true); }
  function openFix()  { setFixOpen(true);  setPickOpen(false); setExpanded(true); }

  function applyPick(patch) {
    const locatorKeys = new Set(["selector","css","axName","title","placeholder","nameAttr","id","xpath","text","role","ariaLabel"]);
    const stripped = Object.fromEntries(Object.entries(step.actionInput || {}).filter(([k]) => !locatorKeys.has(k)));
    onUpdate({ ...step, actionInput: { ...stripped, ...patch } });
    setPickOpen(false);
  }

  function applyFix(newInput) {
    onUpdate({ ...step, actionInput: newInput });
    setFixOpen(false);
  }

  return (
    <div className={`border-b border-slate-100 last:border-b-0 transition-colors ${
      expanded ? "bg-slate-50/70" : "hover:bg-slate-50/40"
    }`}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Step number */}
        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isAssertion ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
        }`}>
          {sno}
        </div>

        {/* Action badge */}
        <span className={`shrink-0 rounded border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ${color}`}>
          <span className="flex items-center gap-0.5">
            <Icon className="size-2.5" />
            {step.actionName || "?"}
          </span>
        </span>

        {/* Human-readable label — click to expand */}
        <button type="button" onClick={() => setExpanded(e => !e)}
          className="flex min-w-0 flex-1 items-center gap-1 text-left">
          <span className="min-w-0 flex-1 truncate text-xs text-slate-600 group-hover:text-slate-900" title={label}>
            {label}
          </span>
          <span className={`shrink-0 text-slate-300 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}>›</span>
        </button>

        {/* Step actions: Fix with AI visible; rest behind ⋯ */}
        <div className="flex shrink-0 items-center gap-0.5">
          {scriptId && (
            <button type="button" onClick={openFix}
              className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                fixOpen
                  ? "border-violet-300 bg-violet-100 text-violet-700"
                  : "border-transparent text-slate-400 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              }`}>
              <Sparkles className="size-2.5" />Fix
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button"
                className="rounded p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setExpanded(true)}>
                <Pencil className="size-3.5 mr-2" />Edit step
              </DropdownMenuItem>
              {scriptId && !isAssertion && (
                <DropdownMenuItem onClick={openPick}>
                  <MousePointerClick className="size-3.5 mr-2" />Pick element from page
                </DropdownMenuItem>
              )}
              {scriptId && (
                <DropdownMenuItem onClick={openFix}>
                  <Sparkles className="size-3.5 mr-2" />Fix selector with AI
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onMoveUp} disabled={index === 0}>
                <ChevronUp className="size-3.5 mr-2" />Move up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMoveDown} disabled={index === totalSteps - 1}>
                <ChevronDown className="size-3.5 mr-2" />Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete}
                className="text-red-600 focus:bg-red-50 focus:text-red-600">
                <Trash2 className="size-3.5 mr-2" />Delete step
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-100 py-3 pl-10 pr-4 space-y-3">
          {/* actionName editor */}
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-300">
              action
            </span>
            <input
              type="text"
              value={step.actionName || ""}
              onChange={(e) => onUpdate({ ...step, actionName: e.target.value })}
              className="w-44 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100 transition-colors"
            />
          </div>

          {/* actionInput key/value editor */}
          <ActionInputEditor
            actionInput={step.actionInput || {}}
            onChange={(ai) => onUpdate({ ...step, actionInput: ai })}
          />

          {/* Panels */}
          {pickOpen && (
            <PickPanel
              scriptId={scriptId}
              stepIndex={index}
              params={params}
              onApply={applyPick}
              onClose={() => setPickOpen(false)}
            />
          )}
          {fixOpen && (
            <FixPanel
              scriptId={scriptId}
              stepIndex={index}
              params={params}
              currentStep={step}
              onApply={applyFix}
              onClose={() => setFixOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Add step panel ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { actionName: "click",    label: "Click",    defaultInput: { selector: "" } },
  { actionName: "fill",     label: "Fill",     defaultInput: { selector: "", text: "" } },
  { actionName: "navigate", label: "Navigate", defaultInput: { url: "" } },
  { actionName: "press",    label: "Press key",defaultInput: { key: "Enter" } },
  { actionName: "assert_visible", label: "Assert visible", defaultInput: { selector: "" } },
  { actionName: "assert_text",    label: "Assert text",    defaultInput: { selector: "", text: "" } },
];

function AddStepPanel({ nextStepNo, onAdd, onClose }) {
  const [chosen, setChosen] = useState(null);
  const [actionName, setActionName] = useState("");
  const [fields, setFields] = useState({});

  function handleQuickPick(q) {
    setChosen(q);
    setActionName(q.actionName);
    setFields({ ...q.defaultInput });
  }

  function handleAdd() {
    const name = actionName.trim() || (chosen?.actionName ?? "click");
    onAdd({ stepNo: nextStepNo, actionName: name, actionInput: fields, captureScreenshot: false, continueOnError: false });
    onClose();
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add step {nextStepNo}</span>
        <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-500"><X className="size-3.5" /></button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((q) => (
          <button key={q.actionName} type="button" onClick={() => handleQuickPick(q)}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
              chosen?.actionName === q.actionName
                ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
            }`}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Custom action */}
      <div className="flex items-center gap-2">
        <span className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-300">action</span>
        <input type="text" value={actionName} onChange={(e) => setActionName(e.target.value)}
          placeholder="e.g. click, fill, navigate…"
          className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-mono outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-colors" />
      </div>

      {/* Field editor */}
      <ActionInputEditor actionInput={fields} onChange={setFields} />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        <button type="button" onClick={handleAdd} disabled={!(actionName.trim() || chosen)}
          className="flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          <Plus className="size-3" />Add step
        </button>
      </div>
    </div>
  );
}

// ── Guided Mode view ───────────────────────────────────────────────────────────

function GuidedMode({ steps, scriptId, params, onUpdate, onDelete, onMove, onAddStep }) {
  const [addOpen, setAddOpen] = useState(false);
  const nextStepNo = (steps.reduce((m, s) => Math.max(m, s.stepNo ?? 0), 0) + 1);

  if (!steps.length) {
    return (
      <div className="space-y-0">
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400">No steps yet.</p>
          <button type="button" onClick={() => setAddOpen(true)}
            className="mt-2 flex items-center gap-1.5 mx-auto text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
            <Plus className="size-3.5" />Add first step
          </button>
        </div>
        {addOpen && (
          <AddStepPanel nextStepNo={1} onAdd={(s) => { onAddStep(s); setAddOpen(false); }} onClose={() => setAddOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-slate-100">
        {steps.map((step, i) => (
          <GuidedStepRow
            key={`${i}-${step.stepNo ?? i}`}
            step={step}
            index={i}
            totalSteps={steps.length}
            scriptId={scriptId}
            params={params}
            onUpdate={(s) => onUpdate(i, s)}
            onDelete={() => onDelete(i)}
            onMoveUp={() => onMove(i, -1)}
            onMoveDown={() => onMove(i, 1)}
          />
        ))}
      </div>

      {/* Add step footer */}
      {addOpen ? (
        <AddStepPanel
          nextStepNo={nextStepNo}
          onAdd={(s) => { onAddStep(s); setAddOpen(false); }}
          onClose={() => setAddOpen(false)}
        />
      ) : (
        <div className="border-t border-slate-100 px-3 py-2.5">
          <button type="button" onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded border border-dashed border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            <Plus className="size-3.5" />Add step
          </button>
        </div>
      )}
    </div>
  );
}

// ── Advanced Mode view ─────────────────────────────────────────────────────────

function AdvancedMode({ steps, rawJson, jsonError, onJsonChange, scriptId, params }) {
  const [runResult, setRunResult] = useState({}); // stepIndex → { loading, ok, message, screenshotB64 }
  const textareaRef = useRef(null);

  function handleRunStep(index) {
    if (!scriptId) return;
    setRunResult((prev) => ({ ...prev, [index]: { loading: true } }));
    fastForwardInspect({ scriptId, targetStepIndex: index, params, executeTargetStep: true })
      .then((data) => {
        setRunResult((prev) => ({
          ...prev,
          [index]: {
            loading: false,
            ok: data.stepResult?.status === "passed",
            message: data.stepResult?.message || (data.ok ? "OK" : data.errorMessage),
            screenshotB64: data.screenshotBase64,
          },
        }));
      })
      .catch((e) => {
        setRunResult((prev) => ({ ...prev, [index]: { loading: false, ok: false, message: e.message } }));
      });
  }

  return (
    <div className="flex min-h-0 gap-0">
      {/* Step sidebar */}
      <div className="w-44 shrink-0 border-r border-slate-100 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {steps.map((step, i) => {
            const { color } = getActionMeta(step.actionName);
            const res = runResult[i];
            return (
              <div key={i} className="group flex items-center gap-1.5 px-2 py-2 hover:bg-slate-50 transition-colors">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">
                  {step.stepNo ?? i + 1}
                </span>
                <span className={`shrink-0 rounded border px-1 py-px text-[9px] font-bold ${color}`}>
                  {step.actionName?.slice(0, 7) || "?"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400"
                  title={stepLabel(step)}>
                  {stepLabel(step).slice(0, 18)}
                </span>
                {scriptId ? (
                  res?.loading ? (
                    <Loader2 className="size-3 shrink-0 animate-spin text-slate-300" />
                  ) : res ? (
                    <span title={res.message}
                      className={`size-3 shrink-0 rounded-full ${res.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                  ) : (
                    <button type="button" onClick={() => handleRunStep(i)}
                      className="shrink-0 rounded p-0.5 text-slate-200 opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-all"
                      title="Run this step">
                      <Play className="size-3" />
                    </button>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* JSON textarea */}
      <div className="flex min-w-0 flex-1 flex-col">
        {jsonError && (
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-1.5">
            <AlertTriangle className="size-3 shrink-0 text-red-500" />
            <p className="min-w-0 flex-1 truncate text-[11px] text-red-600" title={jsonError}>{jsonError}</p>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={rawJson}
          onChange={(e) => onJsonChange(e.target.value)}
          spellCheck={false}
          className={`flex-1 resize-none bg-white px-4 py-3 font-mono text-xs text-slate-700 outline-none focus:ring-inset focus:ring-1 transition-colors ${
            jsonError ? "focus:ring-red-200" : "focus:ring-sky-200"
          }`}
          style={{ minHeight: 320, tabSize: 2 }}
        />
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function ReplayScriptEditor({
  scriptId = null,
  steps: stepsProp = [],
  onStepsChange,
  onSave,
  saving = false,
  params = {},
  developerMode = false,
}) {
  const [mode, setMode] = useState("guided"); // "guided" | "advanced"
  const [advJson, setAdvJson] = useState(() => JSON.stringify(stepsProp, null, 2));
  const [jsonError, setJsonError] = useState(null);

  // Keep a ref to know whether the latest steps update came from the Advanced editor
  // (so we don't bounce the JSON back unnecessarily).
  const fromAdvRef = useRef(false);

  // Sync Advanced-mode JSON when the parent pushes an external steps update.
  // fromAdvRef prevents bouncing: if WE caused the steps change by editing JSON,
  // we skip the re-serialize to preserve cursor position.
  const prevExternalSig = useRef(JSON.stringify(stepsProp));
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const sig = JSON.stringify(stepsProp);
    if (fromAdvRef.current) { fromAdvRef.current = false; prevExternalSig.current = sig; return; }
    if (sig === prevExternalSig.current) return;
    prevExternalSig.current = sig;
    setAdvJson(JSON.stringify(stepsProp, null, 2));
    setJsonError(null);
  }, [stepsProp]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // When mode switches TO advanced, serialize current steps
  function switchToAdvanced() {
    setAdvJson(JSON.stringify(stepsProp, null, 2));
    setJsonError(null);
    setMode("advanced");
  }

  // When mode switches TO guided, try to parse current JSON first
  function switchToGuided() {
    if (jsonError) {
      // JSON is invalid — don't switch, let user fix it
      return;
    }
    setMode("guided");
  }

  // Advanced: user edits JSON
  function handleJsonChange(text) {
    setAdvJson(text);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setJsonError("Root value must be a JSON array of steps");
        return;
      }
      setJsonError(null);
      fromAdvRef.current = true;
      onStepsChange?.(parsed);
    } catch (e) {
      setJsonError(e.message);
    }
  }

  // Guided: step CRUD
  const updateStep = useCallback((index, updated) => {
    const next = [...stepsProp];
    next[index] = updated;
    onStepsChange?.(next);
  }, [stepsProp, onStepsChange]);

  const deleteStep = useCallback((index) => {
    onStepsChange?.(stepsProp.filter((_, i) => i !== index));
  }, [stepsProp, onStepsChange]);

  const moveStep = useCallback((index, dir) => {
    const next = [...stepsProp];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onStepsChange?.(next);
  }, [stepsProp, onStepsChange]);

  const addStep = useCallback((step) => {
    onStepsChange?.([...stepsProp, step]);
  }, [stepsProp, onStepsChange]);

  const assertionCount = stepsProp.filter(
    (s) => (s.actionName || "").startsWith("assert_") || (s.actionName || "").startsWith("verify_")
  ).length;

  const anchorCount = stepsProp.reduce((n, s) => n + (s.anchors?.length ?? 0), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2">
        {/* Mode toggle — only shown in developer mode */}
        {developerMode && (
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button type="button" onClick={switchToGuided}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                mode === "guided"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}>
              <Eye className="size-3" />Guided
            </button>
            <button type="button" onClick={switchToAdvanced}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                mode === "advanced"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}>
              <Code2 className="size-3" />Advanced JSON
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {stepsProp.length} step{stepsProp.length !== 1 ? "s" : ""}
          </span>
          {assertionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
              <ShieldCheck className="size-2.5" />{assertionCount}
            </span>
          )}
          {anchorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
              {anchorCount} anchor{anchorCount !== 1 ? "s" : ""}
            </span>
          )}
          {mode === "advanced" && jsonError && (
            <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              <AlertTriangle className="size-2.5" />JSON error
            </span>
          )}
          {mode === "advanced" && !jsonError && stepsProp.length > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <Check className="size-2.5" />valid
            </span>
          )}
          {mode === "advanced" && (
            <span className="text-[10px] text-amber-500 italic">Editing raw JSON may break replay execution</span>
          )}
          {mode === "guided" && !scriptId && (
            <span className="text-[10px] text-slate-300 italic">(Fix &amp; Pick unavailable — save script first)</span>
          )}
        </div>

        {/* Save */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !!jsonError}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {/* ── Mode content ── */}
      {mode === "guided" ? (
        <GuidedMode
          steps={stepsProp}
          scriptId={scriptId}
          params={params}
          onUpdate={updateStep}
          onDelete={deleteStep}
          onMove={moveStep}
          onAddStep={addStep}
        />
      ) : (
        <AdvancedMode
          steps={stepsProp}
          rawJson={advJson}
          jsonError={jsonError}
          onJsonChange={handleJsonChange}
          scriptId={scriptId}
          params={params}
        />
      )}
    </div>
  );
}
