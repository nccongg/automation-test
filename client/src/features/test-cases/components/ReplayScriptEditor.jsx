import { useState, useEffect, useRef, useCallback } from "react";
import {
  Code2,
  Eye,
  Sparkles,
  MousePointerClick,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Play,
  ShieldCheck,
  Globe,
  Type,
  MousePointer2,
  List,
  Save,
  Hash,
  MoreHorizontal,
  Pencil,
  CircleAlert,
} from "lucide-react";
import {
  fastForwardInspect,
  suggestStepFix,
} from "@/features/test-results/api/testResultsApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Action display metadata ────────────────────────────────────────────────────

const ACTION_META = {
  navigate: {
    color: "text-blue-700 bg-blue-50 border-blue-200",
    short: "NAV",
    Icon: Globe,
  },
  click: {
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    short: "CLICK",
    Icon: MousePointer2,
  },
  fill: {
    color: "text-amber-700 bg-amber-50 border-amber-200",
    short: "FILL",
    Icon: Type,
  },
  type: {
    color: "text-amber-700 bg-amber-50 border-amber-200",
    short: "TYPE",
    Icon: Type,
  },
  select: {
    color: "text-violet-700 bg-violet-50 border-violet-200",
    short: "SELECT",
    Icon: List,
  },
  select_option: {
    color: "text-violet-700 bg-violet-50 border-violet-200",
    short: "SELECT",
    Icon: List,
  },
  check: {
    color: "text-teal-700 bg-teal-50 border-teal-200",
    short: "CHECK",
    Icon: Check,
  },
  uncheck: {
    color: "text-teal-700 bg-teal-50 border-teal-200",
    short: "UNCHECK",
    Icon: X,
  },
  press: {
    color: "text-pink-700 bg-pink-50 border-pink-200",
    short: "KEY",
    Icon: Hash,
  },
  screenshot: {
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
    short: "SNAP",
    Icon: Eye,
  },
};

function getActionMeta(name) {
  if (!name) {
    return {
      color: "text-slate-600 bg-slate-100 border-slate-200",
      short: "?",
      Icon: Hash,
    };
  }

  if (ACTION_META[name]) return ACTION_META[name];

  if (name.startsWith("assert_") || name.startsWith("verify_")) {
    return {
      color: "text-purple-700 bg-purple-50 border-purple-200",
      short: "ASSERT",
      Icon: ShieldCheck,
    };
  }

  if (name.startsWith("wait_")) {
    return {
      color: "text-slate-600 bg-slate-100 border-slate-200",
      short: "WAIT",
      Icon: Loader2,
    };
  }

  return {
    color: "text-slate-600 bg-slate-100 border-slate-200",
    short: name.slice(0, 6).toUpperCase(),
    Icon: Hash,
  };
}

// ── Assertion explanation metadata ─────────────────────────────────────────────

const ASSERT_DEFINITIONS = {
  assert_url_changed: {
    title: "URL changed",
    description:
      "Checks whether the current URL changed after the previous action. This is commonly used after login, submit, or redirect actions.",
    example:
      "Example: before login the URL is https://id.zing.vn/, and after login it redirects to an account, profile, or dashboard page.",
  },
  assert_url_contains: {
    title: "URL contains text",
    description:
      "Checks whether the current URL contains an expected text fragment. This is useful for confirming that the browser navigated to the correct page.",
    example:
      "Example: the URL should contain /dashboard, /profile, /account, or another expected path.",
  },
  assert_url: {
    title: "URL equals expected value",
    description:
      "Checks whether the current URL matches an expected URL value.",
    example:
      "Example: after clicking a button, the URL should be exactly the expected page URL.",
  },
  assert_url_equals: {
    title: "URL equals expected value",
    description:
      "Checks whether the current URL is exactly equal to the expected URL.",
    example:
      "Example: the current URL should equal https://id.zing.vn/account.",
  },
  verify_url: {
    title: "Verify URL",
    description:
      "Verifies that the current URL satisfies the expected URL condition.",
    example:
      "Example: verify that the page is no longer on the login URL after a successful login.",
  },
  assert_text: {
    title: "Text check",
    description:
      "Checks whether a specific text appears on the page. This is useful for validating messages, page titles, or dashboard content.",
    example:
      "Example: after login, the page shows the username, account name, or a success message.",
  },
  assert_text_present: {
    title: "Text is present",
    description:
      "Checks whether the expected text exists somewhere on the page.",
    example:
      "Example: the page should display an error message when the password is wrong.",
  },
  verify_text: {
    title: "Verify text",
    description:
      "Verifies that a specific text is visible or present on the page.",
    example:
      "Example: verify that the dashboard title or account name appears after login.",
  },
  assert_visible: {
    title: "Element is visible",
    description:
      "Checks whether a target element is visible on the screen.",
    example:
      "Example: after login, the avatar, account menu, profile block, or logout button should be visible.",
  },
  assert_element_visible: {
    title: "Element is visible",
    description:
      "Checks whether a specific UI element appears on the page. If the element is visible, the assertion passes.",
    example:
      "Example: check that the user avatar or account menu is visible after login.",
  },
  verify_element_visible: {
    title: "Verify element is visible",
    description:
      "Verifies that a target element is visible on the page.",
    example:
      "Example: verify that a logout button appears after successful authentication.",
  },
  assert_value: {
    title: "Value check",
    description:
      "Checks whether an input or field value matches the expected value.",
    example:
      "Example: the username input should contain the expected username from the dataset.",
  },
  assert_input_value: {
    title: "Input value check",
    description:
      "Checks whether an input value equals the expected value.",
    example:
      "Example: the email field should contain the expected email address.",
  },
  verify_input_value: {
    title: "Verify input value",
    description:
      "Verifies that an input field contains the expected value.",
    example:
      "Example: verify that a search box contains the keyword that was typed.",
  },
};

function normalizeAssertKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isAssertionAction(actionName) {
  const key = normalizeAssertKey(actionName);
  return key.startsWith("assert_") || key.startsWith("verify_");
}

function getAssertDefinition(step) {
  const key = normalizeAssertKey(step?.actionName || "");

  if (ASSERT_DEFINITIONS[key]) return ASSERT_DEFINITIONS[key];

  if (key.includes("url_changed")) return ASSERT_DEFINITIONS.assert_url_changed;
  if (key.includes("url_contains")) return ASSERT_DEFINITIONS.assert_url_contains;
  if (key.includes("url_equals")) return ASSERT_DEFINITIONS.assert_url_equals;
  if (key.includes("url")) return ASSERT_DEFINITIONS.verify_url;
  if (key.includes("text")) return ASSERT_DEFINITIONS.assert_text;
  if (key.includes("visible") || key.includes("element")) {
    return ASSERT_DEFINITIONS.assert_element_visible;
  }
  if (key.includes("value") || key.includes("input")) {
    return ASSERT_DEFINITIONS.assert_value;
  }

  return {
    title: "Assertion step",
    description:
      "This step checks whether the expected condition is true after an action. If the condition is true, the step passes. If it is false, the step fails.",
    example:
      "Example: check that the URL changed, a text appears, an element is visible, or an input value matches the expected value.",
  };
}

function AssertInfoButton({ step }) {
  const [open, setOpen] = useState(false);
  const info = getAssertDefinition(step);

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex size-5 items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-amber-300 bg-amber-100 text-amber-700"
            : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
        }`}
        title="View assertion definition"
        aria-label="View assertion definition"
      >
        <CircleAlert className="size-3.5" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close assertion definition"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />

          <span className="absolute left-1/2 top-7 z-50 w-80 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl">
            <span className="mb-1 block text-xs font-semibold text-slate-800">
              {info.title}
            </span>

            <span className="block text-[11px] leading-relaxed text-slate-600">
              {info.description}
            </span>

            {info.example && (
              <span className="mt-2 block rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] leading-relaxed text-slate-500">
                {info.example}
              </span>
            )}
          </span>
        </>
      )}
    </span>
  );
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
  const t =
    actionInput.axName ||
    actionInput.title ||
    actionInput.placeholder ||
    actionInput.nameAttr ||
    labelFromSelector(raw) ||
    raw ||
    "";

  const trunc = (s, n = 36) =>
    s && s.length > n ? s.slice(0, n) + "…" : s || "";

  const q = (s) => (s ? `"${trunc(s)}"` : null);

  switch (action) {
    case "navigate":
    case "goto":
    case "go_to_url":
    case "open_url": {
      const url = actionInput.url || actionInput.href || "";
      return `Go to ${q(url) || "URL"}`;
    }

    case "click":
    case "tap":
      return t ? `Click ${q(t)}` : "Click element";

    case "fill":
    case "type":
    case "input_text":
    case "enter_text":
    case "input": {
      const text = actionInput.text || "";

      if (text && t) return `Type ${q(text)} into ${q(t)}`;
      if (text) return `Type ${q(text)}`;
      if (t) return `Fill ${q(t)}`;

      return "Fill input";
    }

    case "select":
    case "select_option": {
      const val = actionInput.value || actionInput.labelValue || "";
      return `Select ${q(val)}${t ? ` in ${q(t)}` : ""}`;
    }

    case "press":
    case "press_key":
    case "keyboard_press":
      return `Press ${actionInput.key || "key"}`;

    case "check":
      return t ? `Check ${q(t)}` : "Check element";

    case "uncheck":
      return t ? `Uncheck ${q(t)}` : "Uncheck element";

    case "screenshot":
      return "Take screenshot";

    case "assert_text":
    case "assert_text_present":
    case "verify_text":
      return `Assert text ${q(actionInput.text || actionInput.value || "")}`;

    case "assert_url_contains":
      return `Assert URL contains ${q(actionInput.contains || actionInput.value || "")}`;

    case "assert_url":
    case "assert_url_equals":
    case "verify_url":
      return `Assert URL = ${q(actionInput.url || actionInput.value || "")}`;

    case "assert_url_changed":
      return "Assert URL changed";

    case "assert_visible":
    case "assert_element_visible":
    case "verify_element_visible":
      return `Assert ${q(t) || "element"} is visible`;

    case "assert_value":
    case "assert_input_value":
    case "verify_input_value":
      return `Assert value = ${q(actionInput.value || "")}`;

    case "wait_for_selector":
    case "wait_for_visible":
    case "wait_element_visible":
      return `Wait for ${q(t) || "element"}`;

    case "wait_for_text":
    case "wait_text_present":
      return `Wait for text ${q(actionInput.text || "")}`;

    default:
      return t ? `${actionName} ${q(t)}` : actionName || "Step";
  }
}

// ── Pick from Page panel ───────────────────────────────────────────────────────

const LOCATOR_TYPES = [
  { value: "selector", label: "CSS selector" },
  { value: "axName", label: "Accessible name" },
  { value: "placeholder", label: "Placeholder" },
  { value: "title", label: "Title attr" },
  { value: "nameAttr", label: "name= attr" },
  { value: "xpath", label: "XPath" },
  { value: "id", label: "Element ID" },
  { value: "text", label: "Text content" },
];

function PickPanel({ scriptId, stepIndex, params, onApply, onClose }) {
  const [phase, setPhase] = useState("loading");
  const [screenshotB64, setScreenshotB64] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [error, setError] = useState(null);
  const [locType, setLocType] = useState("selector");
  const [locValue, setLocValue] = useState("");

  const paramsRefPick = useRef(params);

  useEffect(() => {
    let cancelled = false;

    fastForwardInspect({
      scriptId,
      targetStepIndex: stepIndex,
      params: paramsRefPick.current,
    })
      .then((data) => {
        if (cancelled) return;

        setScreenshotB64(data.screenshotBase64);
        setCurrentUrl(data.currentUrl);
        setPhase(data.ok ? "ready" : "error");

        if (!data.ok) {
          setError(data.errorMessage || "Fast-forward failed");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPhase("error");
          setError(e.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scriptId, stepIndex]);

  function handleApply() {
    if (!locValue.trim()) return;
    onApply({ [locType]: locValue.trim() });
  }

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-sky-200 bg-gradient-to-b from-sky-50/60 to-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MousePointerClick className="size-3.5 text-sky-600" />
          <span className="text-[11px] font-bold tracking-wide text-sky-700">
            Pick from Page
          </span>

          {currentUrl && (
            <span
              className="max-w-[200px] truncate font-mono text-[10px] text-sky-400"
              title={currentUrl}
            >
              {currentUrl}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-slate-300 transition-colors hover:text-slate-600"
        >
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

          <div className="max-h-52 cursor-zoom-in overflow-hidden rounded-md border border-sky-200 shadow-sm">
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
              className="shrink-0 rounded-md border border-sky-200 bg-white px-2 py-1.5 text-xs text-sky-700 outline-none transition-colors focus:ring-2 focus:ring-sky-100"
            >
              {LOCATOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={locValue}
              onChange={(e) => setLocValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
              placeholder="Enter value…"
              autoFocus
              className="min-w-0 flex-1 rounded-md border border-sky-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!locValue.trim()}
              className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-40"
            >
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
  const [phase, setPhase] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const paramsRefFix = useRef(params);

  useEffect(() => {
    let cancelled = false;

    suggestStepFix({
      scriptId,
      targetStepIndex: stepIndex,
      params: paramsRefFix.current,
    })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setPhase("ready");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPhase("error");
          setError(e.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scriptId, stepIndex]);

  const suggestion = result?.suggestion;
  const hasValidSuggestion =
    suggestion?.actionInput && Object.keys(suggestion.actionInput).length > 0;
  const confidence = suggestion?.confidence ?? 0;

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-violet-200 bg-gradient-to-b from-violet-50/50 to-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-violet-600" />
          <span className="text-[11px] font-bold tracking-wide text-violet-700">
            Fix with AI
          </span>

          {result?.currentUrl && (
            <span className="max-w-[180px] truncate font-mono text-[10px] text-violet-400">
              {result.currentUrl}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-slate-300 transition-colors hover:text-slate-600"
        >
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
            <div className="max-h-36 overflow-hidden rounded-md border border-violet-200 shadow-sm">
              <img
                src={`data:image/png;base64,${result.screenshotBase64}`}
                alt="Page state"
                className="w-full object-cover object-top"
              />
            </div>
          )}

          {!result?.inspectOk && result?.inspectError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠ Fast-forward stopped early: {result.inspectError} — suggestion
              based on partial context
            </div>
          )}

          {hasValidSuggestion ? (
            <div className="space-y-2">
              <div className="grid gap-1.5 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-red-400">
                    Before
                  </p>
                  <pre className="max-h-32 overflow-auto rounded-md border border-red-100 bg-red-50 px-2.5 py-2 text-[11px] leading-relaxed text-red-700">
                    {JSON.stringify(currentStep.actionInput, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
                      After
                    </p>

                    <span
                      className={`rounded-full px-1.5 py-px text-[9px] font-bold ${
                        confidence >= 0.8
                          ? "bg-emerald-100 text-emerald-700"
                          : confidence >= 0.5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>

                  <pre className="max-h-32 overflow-auto rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-700">
                    {JSON.stringify(suggestion.actionInput, null, 2)}
                  </pre>
                </div>
              </div>

              {suggestion.reasoning && (
                <p className="text-[10px] italic leading-relaxed text-slate-400">
                  {suggestion.reasoning}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  onClick={() => onApply(suggestion.actionInput)}
                  className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
                >
                  <Check className="size-3" />
                  Apply fix
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {suggestion?.reasoning ||
                  "No suggestion available — the target element may not be visible."}
              </p>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
                >
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
  url: "url",
  href: "url",
  text: "text",
  value: "value",
  key: "key",
  selector: "selector",
  css: "css",
  axName: "axName",
  title: "title",
  placeholder: "placeholder",
  nameAttr: "name",
  id: "id",
  xpath: "XPath",
  contains: "contains",
  labelValue: "label",
  nth: "nth",
};

function ActionInputEditor({ actionInput, onChange }) {
  const entries = Object.entries(actionInput || {});

  function set(k, v) {
    onChange({ ...actionInput, [k]: v });
  }

  function del(k) {
    const n = { ...actionInput };
    delete n[k];
    onChange(n);
  }

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

        <button
          type="button"
          onClick={addField}
          className="text-[10px] text-slate-400 transition-colors hover:text-sky-600"
        >
          + add field
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="group/field flex items-center gap-2">
          <span className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-300">
            {KEY_LABELS[k] || k}
          </span>

          <input
            type="text"
            value={String(v ?? "")}
            onChange={(e) => set(k, e.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-700 outline-none transition-colors focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
          />

          <button
            type="button"
            onClick={() => del(k)}
            className="shrink-0 rounded p-0.5 text-slate-200 opacity-0 transition-all hover:text-red-400 group-hover/field:opacity-100"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1 text-[10px] text-slate-300 transition-colors hover:text-slate-500"
      >
        <Plus className="size-3" />
        add field
      </button>
    </div>
  );
}

// ── Single step row in Guided mode ─────────────────────────────────────────────

function GuidedStepRow({
  step,
  index,
  totalSteps,
  scriptId,
  params,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const [expanded, setExpanded] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);

  const sno = step.stepNo ?? index + 1;
  const label = stepLabel(step);
  const { color, Icon } = getActionMeta(step.actionName);
  const isAssertion = isAssertionAction(step.actionName);

  function openPick() {
    setPickOpen(true);
    setFixOpen(false);
    setExpanded(true);
  }

  function openFix() {
    setFixOpen(true);
    setPickOpen(false);
    setExpanded(true);
  }

  function applyPick(patch) {
    const locatorKeys = new Set([
      "selector",
      "css",
      "axName",
      "title",
      "placeholder",
      "nameAttr",
      "id",
      "xpath",
      "text",
      "role",
      "ariaLabel",
    ]);

    const stripped = Object.fromEntries(
      Object.entries(step.actionInput || {}).filter(([k]) => !locatorKeys.has(k)),
    );

    onUpdate({ ...step, actionInput: { ...stripped, ...patch } });
    setPickOpen(false);
  }

  function applyFix(newInput) {
    onUpdate({ ...step, actionInput: newInput });
    setFixOpen(false);
  }

  return (
    <div
      className={`border-b border-slate-100 transition-colors last:border-b-0 ${
        expanded ? "bg-slate-50/70" : "hover:bg-slate-50/40"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            isAssertion
              ? "bg-purple-100 text-purple-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {sno}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`rounded border px-1.5 py-px text-[10px] font-bold uppercase tracking-wide ${color}`}
          >
            <span className="flex items-center gap-0.5">
              <Icon className="size-2.5" />
              {step.actionName || "?"}
            </span>
          </span>

          {isAssertion && <AssertInfoButton step={step} />}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
        >
          <span
            className="min-w-0 flex-1 truncate text-xs text-slate-600 group-hover:text-slate-900"
            title={label}
          >
            {label}
          </span>

          <span
            className={`shrink-0 text-slate-300 transition-transform duration-150 ${
              expanded ? "rotate-90" : ""
            }`}
          >
            ›
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {scriptId && (
            <button
              type="button"
              onClick={openFix}
              className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                fixOpen
                  ? "border-violet-300 bg-violet-100 text-violet-700"
                  : "border-transparent text-slate-400 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              <Sparkles className="size-2.5" />
              Fix
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setExpanded(true)}>
                <Pencil className="mr-2 size-3.5" />
                Edit step
              </DropdownMenuItem>

              {scriptId && !isAssertion && (
                <DropdownMenuItem onClick={openPick}>
                  <MousePointerClick className="mr-2 size-3.5" />
                  Pick element from page
                </DropdownMenuItem>
              )}

              {scriptId && (
                <DropdownMenuItem onClick={openFix}>
                  <Sparkles className="mr-2 size-3.5" />
                  Fix selector with AI
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onMoveUp} disabled={index === 0}>
                <ChevronUp className="mr-2 size-3.5" />
                Move up
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onMoveDown}
                disabled={index === totalSteps - 1}
              >
                <ChevronDown className="mr-2 size-3.5" />
                Move down
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <Trash2 className="mr-2 size-3.5" />
                Delete step
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-slate-100 py-3 pl-10 pr-4">
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-300">
              action
            </span>

            <input
              type="text"
              value={step.actionName || ""}
              onChange={(e) =>
                onUpdate({ ...step, actionName: e.target.value })
              }
              className="w-44 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-700 outline-none transition-colors focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
            />

            {isAssertion && (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                Assertion
              </span>
            )}
          </div>

          <ActionInputEditor
            actionInput={step.actionInput || {}}
            onChange={(ai) => onUpdate({ ...step, actionInput: ai })}
          />

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
  {
    actionName: "click",
    label: "Click",
    description:
      "Click a button, link, checkbox, or another clickable element on the page.",
    note: "Example: click the Login button, Submit button, or a navigation link.",
    defaultInput: { selector: "" },
  },
  {
    actionName: "fill",
    label: "Fill",
    description:
      "Enter text into an input field, such as username, password, email, or search box.",
    note: "Example: fill the username field with a test account.",
    defaultInput: { selector: "", text: "" },
  },
  {
    actionName: "navigate",
    label: "Navigate",
    description:
      "Open a specific URL before continuing the test flow.",
    note: "Example: navigate to the login page before entering credentials.",
    defaultInput: { url: "" },
  },
  {
    actionName: "press",
    label: "Press key",
    description:
      "Press a keyboard key during the test flow.",
    note: "Example: press Enter after typing a search keyword.",
    defaultInput: { key: "Enter" },
  },
  {
    actionName: "assert_visible",
    label: "Assert visible",
    description:
      "Check whether a selected element is visible on the page. The test passes only if that element appears.",
    note: "Example: after login, the avatar, account menu, or logout button should be visible.",
    defaultInput: { selector: "" },
  },
  {
    actionName: "assert_text",
    label: "Assert text",
    description:
      "Check whether expected text appears on the page. This is useful for success messages, error messages, or page titles.",
    note: "Example: after entering a wrong password, the page should show an error message.",
    defaultInput: { selector: "", text: "" },
  },
  {
    actionName: "assert_url_contains",
    label: "Assert URL contains",
    description:
      "Check whether the current URL contains an expected text fragment.",
    note: "Example: after login, the URL should contain /account, /profile, or another expected path.",
    defaultInput: { contains: "" },
  },
  {
    actionName: "assert_url_changed",
    label: "Assert URL changed",
    description:
      "Check whether the URL changed after the previous action. This is useful after login, submit, or redirect actions.",
    note: "Example: after clicking Login, the browser should leave the original login page.",
    defaultInput: {},
  },
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
    const name = actionName.trim() || chosen?.actionName || "click";

    onAdd({
      stepNo: nextStepNo,
      actionName: name,
      actionInput: fields,
      captureScreenshot: false,
      continueOnError: false,
    });

    onClose();
  }

  const chosenIsAssertion = chosen ? isAssertionAction(chosen.actionName) : false;

  return (
    <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Add step {nextStepNo}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-300 hover:text-slate-500"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((q) => {
          const isAssert = isAssertionAction(q.actionName);
          const isChosen = chosen?.actionName === q.actionName;

          return (
            <button
              key={q.actionName}
              type="button"
              onClick={() => handleQuickPick(q)}
              title={q.description}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                isChosen
                  ? isAssert
                    ? "border-purple-300 bg-purple-100 text-purple-700"
                    : "border-indigo-300 bg-indigo-100 text-indigo-700"
                  : isAssert
                    ? "border-purple-200 bg-purple-50 text-purple-600 hover:border-purple-300 hover:bg-purple-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      {chosen?.description && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
            chosenIsAssertion
              ? "border-purple-200 bg-purple-50 text-purple-700"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          <div className="flex items-start gap-2">
            {chosenIsAssertion ? (
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-purple-500" />
            ) : (
              <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
            )}

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {chosen.label}
              </p>

              <p className="mt-0.5">
                {chosen.description}
              </p>

              {chosen.note && (
                <p
                  className={`mt-1 text-[11px] ${
                    chosenIsAssertion ? "text-purple-500" : "text-slate-400"
                  }`}
                >
                  {chosen.note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="w-24 shrink-0 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-300">
          action
        </span>

        <input
          type="text"
          value={actionName}
          onChange={(e) => {
            const nextActionName = e.target.value;

            setActionName(nextActionName);

            const matchedQuickAction = QUICK_ACTIONS.find(
              (q) => q.actionName === nextActionName.trim(),
            );

            setChosen(matchedQuickAction || null);
          }}
          placeholder="e.g. click, fill, navigate…"
          className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs outline-none transition-colors focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
        />
      </div>

      {actionName && isAssertionAction(actionName) && !chosen && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs leading-relaxed text-purple-700">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-purple-500" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Custom assertion step
              </p>

              <p className="mt-0.5">
                This assertion checks whether an expected condition is true during replay.
                If the condition is false, the test step fails.
              </p>

              <p className="mt-1 text-[11px] text-purple-500">
                Example: check that a URL changed, a text appears, an element is visible,
                or an input value matches the expected value.
              </p>
            </div>
          </div>
        </div>
      )}

      <ActionInputEditor actionInput={fields} onChange={setFields} />

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!(actionName.trim() || chosen)}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-40 ${
            isAssertionAction(actionName)
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          <Plus className="size-3" />
          Add step
        </button>
      </div>
    </div>
  );
}

// ── Guided Mode view ───────────────────────────────────────────────────────────

function GuidedMode({ steps, scriptId, params, onUpdate, onDelete, onMove, onAddStep }) {
  const [addOpen, setAddOpen] = useState(false);
  const nextStepNo =
    steps.reduce((m, s) => Math.max(m, s.stepNo ?? 0), 0) + 1;

  if (!steps.length) {
    return (
      <div className="space-y-0">
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400">No steps yet.</p>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mx-auto mt-2 flex items-center gap-1.5 text-xs text-indigo-500 transition-colors hover:text-indigo-700"
          >
            <Plus className="size-3.5" />
            Add first step
          </button>
        </div>

        {addOpen && (
          <AddStepPanel
            nextStepNo={1}
            onAdd={(s) => {
              onAddStep(s);
              setAddOpen(false);
            }}
            onClose={() => setAddOpen(false)}
          />
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

      {addOpen ? (
        <AddStepPanel
          nextStepNo={nextStepNo}
          onAdd={(s) => {
            onAddStep(s);
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      ) : (
        <div className="border-t border-slate-100 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded border border-dashed border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            <Plus className="size-3.5" />
            Add step
          </button>
        </div>
      )}
    </div>
  );
}

// ── Advanced Mode view ─────────────────────────────────────────────────────────

function AdvancedMode({ steps, rawJson, jsonError, onJsonChange, scriptId, params }) {
  const [runResult, setRunResult] = useState({});
  const textareaRef = useRef(null);

  function handleRunStep(index) {
    if (!scriptId) return;

    setRunResult((prev) => ({ ...prev, [index]: { loading: true } }));

    fastForwardInspect({
      scriptId,
      targetStepIndex: index,
      params,
      executeTargetStep: true,
    })
      .then((data) => {
        setRunResult((prev) => ({
          ...prev,
          [index]: {
            loading: false,
            ok: data.stepResult?.status === "passed",
            message:
              data.stepResult?.message || (data.ok ? "OK" : data.errorMessage),
            screenshotB64: data.screenshotBase64,
          },
        }));
      })
      .catch((e) => {
        setRunResult((prev) => ({
          ...prev,
          [index]: {
            loading: false,
            ok: false,
            message: e.message,
          },
        }));
      });
  }

  return (
    <div className="flex min-h-0 gap-0">
      <div className="w-44 shrink-0 overflow-y-auto border-r border-slate-100">
        <div className="divide-y divide-slate-100">
          {steps.map((step, i) => {
            const { color } = getActionMeta(step.actionName);
            const res = runResult[i];
            const isAssertion = isAssertionAction(step.actionName);

            return (
              <div
                key={i}
                className="group flex items-center gap-1.5 px-2 py-2 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    isAssertion
                      ? "bg-purple-100 text-purple-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.stepNo ?? i + 1}
                </span>

                <span className={`shrink-0 rounded border px-1 py-px text-[9px] font-bold ${color}`}>
                  {step.actionName?.slice(0, 7) || "?"}
                </span>

                {isAssertion && <AssertInfoButton step={step} />}

                <span
                  className="min-w-0 flex-1 truncate text-[10px] text-slate-400"
                  title={stepLabel(step)}
                >
                  {stepLabel(step).slice(0, 18)}
                </span>

                {scriptId ? (
                  res?.loading ? (
                    <Loader2 className="size-3 shrink-0 animate-spin text-slate-300" />
                  ) : res ? (
                    <span
                      title={res.message}
                      className={`size-3 shrink-0 rounded-full ${
                        res.ok ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRunStep(i)}
                      className="shrink-0 rounded p-0.5 text-slate-200 opacity-0 transition-all hover:text-emerald-600 group-hover:opacity-100"
                      title="Run this step"
                    >
                      <Play className="size-3" />
                    </button>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {jsonError && (
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-1.5">
            <AlertTriangle className="size-3 shrink-0 text-red-500" />
            <p
              className="min-w-0 flex-1 truncate text-[11px] text-red-600"
              title={jsonError}
            >
              {jsonError}
            </p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={rawJson}
          onChange={(e) => onJsonChange(e.target.value)}
          spellCheck={false}
          className={`flex-1 resize-none bg-white px-4 py-3 font-mono text-xs text-slate-700 outline-none transition-colors focus:ring-1 focus:ring-inset ${
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
  const [mode, setMode] = useState("guided");
  const [advJson, setAdvJson] = useState(() =>
    JSON.stringify(stepsProp, null, 2),
  );
  const [jsonError, setJsonError] = useState(null);

  const fromAdvRef = useRef(false);
  const prevExternalSig = useRef(JSON.stringify(stepsProp));

  useEffect(() => {
    const sig = JSON.stringify(stepsProp);

    if (fromAdvRef.current) {
      fromAdvRef.current = false;
      prevExternalSig.current = sig;
      return;
    }

    if (sig === prevExternalSig.current) return;

    prevExternalSig.current = sig;
    setAdvJson(JSON.stringify(stepsProp, null, 2));
    setJsonError(null);
  }, [stepsProp]);

  function switchToAdvanced() {
    setAdvJson(JSON.stringify(stepsProp, null, 2));
    setJsonError(null);
    setMode("advanced");
  }

  function switchToGuided() {
    if (jsonError) return;
    setMode("guided");
  }

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

  const updateStep = useCallback(
    (index, updated) => {
      const next = [...stepsProp];
      next[index] = updated;
      onStepsChange?.(next);
    },
    [stepsProp, onStepsChange],
  );

  const deleteStep = useCallback(
    (index) => {
      onStepsChange?.(stepsProp.filter((_, i) => i !== index));
    },
    [stepsProp, onStepsChange],
  );

  const moveStep = useCallback(
    (index, dir) => {
      const next = [...stepsProp];
      const target = index + dir;

      if (target < 0 || target >= next.length) return;

      [next[index], next[target]] = [next[target], next[index]];
      onStepsChange?.(next);
    },
    [stepsProp, onStepsChange],
  );

  const addStep = useCallback(
    (step) => {
      onStepsChange?.([...stepsProp, step]);
    },
    [stepsProp, onStepsChange],
  );

  const assertionCount = stepsProp.filter((s) =>
    isAssertionAction(s.actionName),
  ).length;

  const anchorCount = stepsProp.reduce(
    (n, s) => n + (s.anchors?.length ?? 0),
    0,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2">
        {developerMode && (
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={switchToGuided}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                mode === "guided"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Eye className="size-3" />
              Guided
            </button>

            <button
              type="button"
              onClick={switchToAdvanced}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                mode === "advanced"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Code2 className="size-3" />
              Advanced JSON
            </button>
          </div>
        )}

        <div className="flex flex-1 items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {stepsProp.length} step{stepsProp.length !== 1 ? "s" : ""}
          </span>

          {assertionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
              <ShieldCheck className="size-2.5" />
              {assertionCount}
            </span>
          )}

          {anchorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
              {anchorCount} anchor{anchorCount !== 1 ? "s" : ""}
            </span>
          )}

          {mode === "advanced" && jsonError && (
            <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
              <AlertTriangle className="size-2.5" />
              JSON error
            </span>
          )}

          {mode === "advanced" && !jsonError && stepsProp.length > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <Check className="size-2.5" />
              valid
            </span>
          )}

          {mode === "advanced" && (
            <span className="text-[10px] italic text-amber-500">
              Editing raw JSON may break replay execution
            </span>
          )}

          {mode === "guided" && !scriptId && (
            <span className="text-[10px] italic text-slate-300">
              (Fix &amp; Pick unavailable — save script first)
            </span>
          )}
        </div>

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !!jsonError}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Save className="size-3" />
            )}
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

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