from __future__ import annotations

import base64
import json
import os
import logging
import re
import time
import shutil

import httpx
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Iterable
from urllib.parse import urlparse

from .callbacks import post_final_event, post_step_event
from .schemas import ReplayScriptInlinePayload, ReplayStepPayload, RunRequest, StateAnchor

_MARKDOWN_FENCE_RE = re.compile(r'^\s*```(?:json)?\s*\n?(.*?)\n?\s*```\s*$', re.DOTALL)

logger = logging.getLogger(__name__)

try:
    from browser_use import Agent, Browser, ChatGoogle, ChatBrowserUse  # type: ignore
    from browser_use.llm.ollama.chat import ChatOllama as _BrowserUseChatOllama  # type: ignore
    from browser_use.llm.ollama.serializer import OllamaMessageSerializer  # type: ignore
    from browser_use.llm.exceptions import ModelProviderError  # type: ignore
    from browser_use.llm.views import ChatInvokeCompletion  # type: ignore
    from browser_use.llm.openai.chat import ChatOpenAI as BrowserUseChatOpenAI  # type: ignore

    class BrowserUseChatOllama(_BrowserUseChatOllama):
        """Subclass that strips markdown code fences before JSON parsing.

        Some local models (e.g. gemma4) wrap their structured output in ```json ... ```
        even when Ollama's format=schema is set, causing model_validate_json to fail.
        """

        async def ainvoke(self, messages, output_format=None, **kwargs):
            ollama_messages = OllamaMessageSerializer.serialize_messages(messages)
            try:
                if output_format is None:
                    response = await self.get_client().chat(
                        model=self.model,
                        messages=ollama_messages,
                        options=self.ollama_options,
                    )
                    return ChatInvokeCompletion(completion=response.message.content or '', usage=None)
                else:
                    schema = output_format.model_json_schema()
                    response = await self.get_client().chat(
                        model=self.model,
                        messages=ollama_messages,
                        format=schema,
                        options=self.ollama_options,
                    )
                    raw = response.message.content or ''
                    # Strip markdown code fences that some models add despite format=schema
                    m = _MARKDOWN_FENCE_RE.match(raw)
                    if m:
                        raw = m.group(1).strip()
                    completion = output_format.model_validate_json(raw)
                    return ChatInvokeCompletion(completion=completion, usage=None)
            except Exception as e:
                raise ModelProviderError(message=str(e), model=self.name) from e

except Exception as _bu_err:
    logger.warning("browser_use import failed: %s", _bu_err)
    Agent = None
    Browser = None
    ChatGoogle = None
    ChatBrowserUse = None
    BrowserUseChatOllama = None
    BrowserUseChatOpenAI = None

try:
    from playwright.async_api import Browser as PWBrowser
    from playwright.async_api import BrowserContext, Locator, Page, async_playwright
except Exception:
    PWBrowser = None
    BrowserContext = None
    Locator = None
    Page = None
    async_playwright = None


@dataclass
class StepResult:
    status: str
    message: str
    current_url: Optional[str] = None
    extracted_content: Optional[str] = None
    action_output: Optional[Dict[str, Any]] = None
    screenshot_path: Optional[str] = None
    duration_ms: Optional[int] = None
    failure_reason: Optional[str] = None


@dataclass
class AnchorVerifyResult:
    passed: bool
    message: str


ASSERTION_ACTIONS = {
    "assert_text", "assert_text_present", "verify_text",
    "assert_visible", "assert_element_visible", "assert_element_present", "verify_element_visible",
    "assert_value", "assert_input_value", "verify_input_value",
    "assert_url", "assert_url_equals", "verify_url",
    "assert_url_contains",
    "assert_url_changed",
}

# Ordered by priority — first match wins when scanning LLM run text
_LOGOUT_PATTERNS: List[Tuple[str, str]] = [
    ("đăng xuất",  "Đăng xuất"),
    ("thoát",      "Thoát"),
    ("log out",    "Log out"),
    ("logout",     "Logout"),
    ("sign out",   "Sign out"),
    ("sign-out",   "Sign out"),
]


def is_assertion_step(action_name: str) -> bool:
    return action_name.lower().strip() in ASSERTION_ACTIONS


def compute_replay_verdict(has_assertion: bool, assertion_failed: bool, execution_failed: bool) -> str:
    """
    Pure verdict logic — assertion-driven:
      assertion failed               → "fail"   (test proved something wrong)
      no assertion present           → "pass_with_warning"  (can't prove correctness)
      action failed, assertion OK    → "error"  (infra broke, result untrustworthy)
      all assertions passed          → "pass"
    """
    if assertion_failed:
        return "fail"
    if not has_assertion:
        return "pass_with_warning"
    if execution_failed:
        return "error"
    return "pass"


def compute_combined_verdict(
    has_assertion: bool,
    assertion_failed: bool,
    has_anchors: bool,
    required_anchor_failed: bool,
    execution_failed: bool,
) -> str:
    if assertion_failed or required_anchor_failed:
        return "fail"
    if not has_assertion and not has_anchors:
        return "pass_with_warning"
    if execution_failed:
        return "error"
    return "pass"


def _detect_auth_assertion(
    extracted_contents: Iterable,
    model_outputs: Iterable,
    final_result: Optional[str],
) -> Optional[Dict[str, Any]]:
    """
    Scan LLM run artifacts for logout/user-info text to derive a
    assert_visible step that proves the user is authenticated.
    Returns None when no known indicator is found.
    """
    combined = " ".join(
        str(s).lower()
        for s in [*extracted_contents, *model_outputs, final_result or ""]
        if s
    )
    for search, display in _LOGOUT_PATTERNS:
        if search in combined:
            return {
                "actionName": "assert_visible",
                "actionInput": {"text": display},
                "captureScreenshot": True,
                "continueOnError": False,
                "notes": "auto: auth state — visible only when logged in",
            }
    return None


_PASSWORD_RE = re.compile(r"password|mật khẩu|passwd|pwd|secret|pin|otp", re.IGNORECASE)


def _is_login_flow(steps: List["ReplayStepPayload"]) -> bool:
    """Return True if the script contains a password input — indicates a login flow."""
    for step in steps:
        if step.actionName not in {"fill", "type", "input_text", "enter_text", "input"}:
            continue
        inp = step.actionInput or {}
        for hint_key in ("placeholder", "nameAttr", "axName", "id", "label"):
            if _PASSWORD_RE.search(str(inp.get(hint_key) or "")):
                return True
    return False


def _build_auto_assertions(
    steps: List["ReplayStepPayload"],
    history: Any,
) -> List[Dict[str, Any]]:
    """
    Build assertion steps to auto-append after a successful LLM run.
    Priority:
      1. assert_visible (PRIMARY)  — derived from logout/user-info element
      2. assert_url_changed (BACKUP) — URL must differ from the login page
    """
    assertions: List[Dict[str, Any]] = []

    extracted = safe_to_jsonable(getattr(history, "extracted_content", lambda: [])() or [])
    outputs   = safe_to_jsonable(getattr(history, "model_outputs",    lambda: [])() or [])
    final     = history.final_result()

    auth = _detect_auth_assertion(extracted, outputs, final)
    if auth:
        assertions.append(auth)

    # BACKUP — find initial URL from first navigate step
    initial_url: Optional[str] = None
    for step in steps:
        if step.actionName in {"navigate", "goto", "go_to_url", "open_url"}:
            initial_url = step.actionInput.get("url")
            break

    urls = safe_to_jsonable(getattr(history, "urls", lambda: [])() or [])
    final_url = urls[-1] if urls else None
    if initial_url and final_url and final_url.rstrip("/") != initial_url.rstrip("/"):
        backup_input: Dict[str, Any] = {"initialUrl": initial_url}
        if _is_login_flow(steps):
            backup_input["notContains"] = "/login"
        assertions.append({
            "actionName": "assert_url_changed",
            "actionInput": backup_input,
            "captureScreenshot": False,
            "continueOnError": False,
            "notes": "auto: backup — URL must change from login page",
        })

    return assertions


def classify_failure(action_name: str, exc: Exception) -> str:
    """Map an exception to a structured failure reason for taxonomy/analytics."""
    exc_msg = str(exc).lower()
    exc_class = type(exc).__name__.lower()

    # Our own AssertionErrors
    if isinstance(exc, AssertionError):
        if "fill verification" in exc_msg:
            return "value_not_set"
        return "assertion_mismatch"

    # Playwright TimeoutError — locator not found within timeout
    if "timeouterror" in exc_class:
        if "waiting for locator" in exc_msg or "locator" in exc_msg:
            return "element_not_found"
        if action_name in {"goto", "go_to_url", "open_url", "navigate"}:
            return "navigation_failed"
        return "timeout"

    # String-based detection for wrapped exceptions
    if "timeout" in exc_msg:
        if "locator" in exc_msg or "element" in exc_msg or "waiting for" in exc_msg:
            return "element_not_found"
        return "timeout"

    if "not visible" in exc_msg or ("visible" in exc_msg and "false" in exc_msg):
        return "element_not_visible"

    if action_name in {"goto", "go_to_url", "open_url", "navigate"}:
        return "navigation_failed"

    if "invalid selector" in exc_msg or "syntaxerror" in exc_class:
        return "selector_invalid"

    return "unexpected_error"


def safe_to_jsonable(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, dict):
        return {str(k): safe_to_jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [safe_to_jsonable(v) for v in value]
    if hasattr(value, "model_dump"):
        return safe_to_jsonable(value.model_dump())
    if hasattr(value, "dict"):
        return safe_to_jsonable(value.dict())
    if hasattr(value, "__dict__"):
        return safe_to_jsonable(vars(value))
    return str(value)


_SCREENSHOT_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def encode_screenshot_file(path: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """Read a screenshot off disk and base64-encode it for the callback payload.

    The agent-worker's disk isn't shared with the backend (separate
    containers/services in production), so the bytes travel with the
    callback instead of a local file path.
    """
    if not path:
        return None, None
    try:
        file_path = Path(path)
        if not file_path.exists():
            return None, None
        data = file_path.read_bytes()
        mime_type = _SCREENSHOT_MIME_TYPES.get(file_path.suffix.lower(), "image/png")
        return base64.b64encode(data).decode("ascii"), mime_type
    except Exception:
        logger.warning("Failed to read screenshot for upload: %s", path, exc_info=True)
        return None, None


def normalize_action_item(item: Any) -> Dict[str, Any]:
    normalized = safe_to_jsonable(item)
    if isinstance(normalized, dict):
        return normalized
    return {"value": normalized}


def build_browser(run_req: RunRequest):
    if Browser is None:
        raise RuntimeError("browser_use is not installed in this environment")

    viewport = run_req.runtimeConfig.viewport or {"width": 1280, "height": 720}
    profile = run_req.browserProfile

    if profile and profile.profileType == "system_chrome":
        profile_directory = profile.profileDirectory or profile.profileData.get("profileDirectory")
        if profile_directory:
            return Browser.from_system_chrome(profile_directory=profile_directory)
        return Browser.from_system_chrome()

    browser_kwargs: Dict[str, Any] = {
        "headless": run_req.runtimeConfig.headless,
        "viewport": viewport,
    }

    if profile and profile.profileType == "storage_state" and profile.profileRef:
        browser_kwargs["storage_state"] = profile.profileRef

    if run_req.runtimeConfig.browserType:
        browser_kwargs["channel"] = run_req.runtimeConfig.browserType

    if run_req.runtimeConfig.locale:
        browser_kwargs["locale"] = run_req.runtimeConfig.locale

    if run_req.runtimeConfig.timezone:
        browser_kwargs["timezone_id"] = run_req.runtimeConfig.timezone

    return Browser(**browser_kwargs)


def build_llm(run_req: RunRequest):
    provider = (run_req.runtimeConfig.llmProvider or "").lower().strip()
    extra = run_req.runtimeConfig.extraConfig or {}

    logger.info(
        "[build_llm] provider=%s model=%s extraConfig=%s",
        provider, run_req.runtimeConfig.llmModel, extra,
    )

    if provider in {"browser_use", "browseruse"}:
        if ChatBrowserUse is None:
            raise RuntimeError("browser_use ChatBrowserUse is not available — check your browser-use installation")
        api_key = os.getenv("BROWSER_USE_API_KEY")
        model = run_req.runtimeConfig.llmModel or "bu-latest"
        llm = ChatBrowserUse(model=model, api_key=api_key)
        logger.info("[build_llm] Using ChatBrowserUse — model=%s class=%s", model, type(llm).__name__)
        return llm

    if provider in {"google", "gemini"}:
        if ChatGoogle is None:
            raise RuntimeError("browser_use ChatGoogle is not installed in this environment")
        # thinking_budget=0: disable Gemini thinking tokens.
        # With thinking enabled (the default -1 for gemini-2.5/flash models), thinking content
        # bleeds into response.text before the JSON block, causing model_validate_json to fail
        # with "expected ident at line 1 column 2" because the text starts with "thought\n```json"
        # instead of a bare JSON object.
        llm = ChatGoogle(model=run_req.runtimeConfig.llmModel, thinking_budget=0)
        logger.info("[build_llm] Using browser_use.ChatGoogle — class=%s", type(llm).__name__)
        return llm

    if provider == "ollama":
        # IMPORTANT: use browser-use's own ChatOllama, NOT langchain_ollama.ChatOllama.
        # browser-use 0.12.x moved away from LangChain — it calls llm.ainvoke() expecting a
        # ChatInvokeCompletion return value and passes browser_use message types, which
        # langchain's ChatOllama does not understand. Using the wrong class causes every
        # step to fail with a Pydantic ValidationError ("items") because response.completion
        # is never populated correctly.
        if BrowserUseChatOllama is None:
            raise RuntimeError(
                "browser_use.llm.ollama.ChatOllama is not available — "
                "check your browser-use installation (pip install browser-use)"
            )
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        # num_ctx: default 32768 — browser-use sends full DOM snapshots per step.
        # Ollama's default context (2048) truncates the input silently, producing
        # malformed JSON that fails schema validation.
        num_ctx = int(extra.get("num_ctx", 32768))
        ollama_options: Dict[str, Any] = {"num_ctx": num_ctx}
        # Allow passing any extra Ollama options (e.g. temperature, top_p) via extraConfig
        for opt_key in ("temperature", "top_p", "top_k", "repeat_penalty", "seed"):
            if opt_key in extra:
                ollama_options[opt_key] = extra[opt_key]

        logger.info(
            "[build_llm] Using browser_use native ChatOllama host=%s model=%s ollama_options=%s",
            ollama_base_url, run_req.runtimeConfig.llmModel, ollama_options,
        )
        llm = BrowserUseChatOllama(
            model=run_req.runtimeConfig.llmModel,
            host=ollama_base_url,
            ollama_options=ollama_options,
        )
        logger.info("[build_llm] ChatOllama created — class=%s provider=%s", type(llm).__name__, llm.provider)
        return llm

    if provider == "openai":
        if BrowserUseChatOpenAI is None:
            raise RuntimeError(
                "browser_use.llm.openai.ChatOpenAI is not available — "
                "check your browser-use installation"
            )
        api_key = os.getenv("OPENAI_API_KEY")
        llm = BrowserUseChatOpenAI(model=run_req.runtimeConfig.llmModel, api_key=api_key)
        logger.info("[build_llm] Using browser_use native ChatOpenAI — class=%s", type(llm).__name__)
        return llm

    raise ValueError(f"Unsupported llmProvider for this worker: {run_req.runtimeConfig.llmProvider}")


def build_task_text(run_req: RunRequest) -> str:
    prompt_text = (run_req.testCase.promptText or run_req.testCase.goal or "").strip()
    if not prompt_text:
        raise ValueError("No promptText or goal provided for LLM run")

    input_params = getattr(run_req.testCase, "inputParams", {}) or {}
    prompt_text = render_template(prompt_text, input_params)

    allowed_domains = ", ".join(run_req.runtimeConfig.allowedDomains or [])
    extra_lines: List[str] = []

    if allowed_domains:
        extra_lines.append(f"Only work within these domains: {allowed_domains}.")

    if run_req.project.baseUrl:
        extra_lines.append(f"Project base URL: {run_req.project.baseUrl}")

    plan_snapshot = getattr(run_req.testCase, "planSnapshot", None) or {}
    plan_steps: List[str] = plan_snapshot.get("steps") if isinstance(plan_snapshot, dict) else []
    if plan_steps:
        rendered_steps = [render_template(s, input_params) if isinstance(s, str) else str(s) for s in plan_steps]
        steps_text = "\n".join(f"{i + 1}. {s}" for i, s in enumerate(rendered_steps))
        extra_lines.append(f"Follow these steps exactly:\n{steps_text}")

    if input_params:
        extra_lines.append(
            "Use these runtime input values for this run: "
            + json.dumps(input_params, ensure_ascii=False)
        )

    if extra_lines:
        return f"{prompt_text}\n\n" + "\n".join(extra_lines)
    return prompt_text

def _placeholder_to_template(text: Any) -> Any:
    if not isinstance(text, str):
        return text
    match = re.fullmatch(r"placeholder_([a-zA-Z0-9_]+)", text.strip())
    if match:
        return "{{" + match.group(1) + "}}"
    return text


def _extract_browser_use_items(raw_history_item: Any) -> List[Dict[str, Any]]:
    normalized = normalize_action_item(raw_history_item)

    if isinstance(normalized, dict) and isinstance(normalized.get("value"), list):
        return [normalize_action_item(v) for v in normalized["value"]]

    if isinstance(normalized, list):
        return [normalize_action_item(v) for v in normalized]

    return [normalized]


# IDs generated by UI frameworks — unstable, deprioritise
_GENERATED_ID_RE = re.compile(
    r"^(mui-|radix-|headlessui-|react-select-|rc-|:r|__BVID|ember\d)",
    re.IGNORECASE,
)

def _is_stable_id(element_id: str) -> bool:
    return bool(element_id) and not _GENERATED_ID_RE.match(element_id)


def _build_locator_input_from_interacted_element(item: Dict[str, Any]) -> Dict[str, Any]:
    interacted = item.get("interacted_element") or {}
    attrs      = interacted.get("attributes") or {}
    node_name  = str(interacted.get("node_name") or "").upper()
    ax_name    = str(interacted.get("ax_name")   or "").strip()
    raw_xpath  = str(interacted.get("x_path")    or "").strip()

    name_attr   = str(attrs.get("name")         or "").strip()
    placeholder = str(attrs.get("placeholder")  or "").strip()
    title       = str(attrs.get("title")        or "").strip()
    element_id  = str(attrs.get("id")           or "").strip()
    testid      = str(attrs.get("data-testid")  or attrs.get("data-test") or attrs.get("data-cy") or "").strip()
    elem_type   = str(attrs.get("type")         or "").strip().lower()
    href        = str(attrs.get("href")         or "").strip()

    out: Dict[str, Any] = {}

    if node_name:
        out["nodeName"] = node_name

    # ── Semantic / stable locators ───────────────────────────────────────────

    if testid:
        out["testId"] = testid

    if name_attr and node_name in {"INPUT", "SELECT", "TEXTAREA"}:
        out["nameAttr"] = name_attr

    if placeholder and node_name in {"INPUT", "TEXTAREA"}:
        out["placeholder"] = placeholder

    if title:
        out["title"] = title

    if ax_name:
        out["axName"] = ax_name

    if element_id and _is_stable_id(element_id):
        out["id"] = element_id

    # ── Generated CSS ────────────────────────────────────────────────────────
    # Build the most specific stable CSS selector we can from available attrs.

    tag = node_name.lower() if node_name else ""
    css: Optional[str] = None

    if testid:
        css = f"[data-testid='{testid}']"
    elif element_id and _is_stable_id(element_id):
        css = f"{tag}#{element_id}" if tag else f"#{element_id}"
    elif name_attr and node_name in {"INPUT", "SELECT", "TEXTAREA"}:
        css = f"{tag}[name='{name_attr}']" if tag else f"[name='{name_attr}']"
        if elem_type and elem_type not in {"text", ""}:
            css = f"{tag}[type='{elem_type}'][name='{name_attr}']"
    elif elem_type and node_name == "INPUT" and elem_type in {"submit", "button", "checkbox", "radio"}:
        css = f"input[type='{elem_type}']"
    elif href and node_name == "A":
        # Only use href for exact short paths, not full URLs (too fragile)
        if href.startswith("/") and len(href) < 60:
            css = f"a[href='{href}']"

    if css:
        out["css"] = css

    # ── Smart / role-based locator ───────────────────────────────────────────
    _ROLE_MAP = {
        "BUTTON": "button", "A": "link",
        "INPUT": "textbox", "SELECT": "combobox", "TEXTAREA": "textbox",
        "CHECKBOX": "checkbox", "RADIO": "radio",
    }
    role_tag = "checkbox" if elem_type == "checkbox" else "radio" if elem_type == "radio" else _ROLE_MAP.get(node_name)
    label = ax_name or title
    if role_tag and label:
        out["smartLocator"] = f"role={role_tag}[name='{label}']"

    # ── XPath — always capture if available ─────────────────────────────────
    if raw_xpath:
        out["xpath"] = raw_xpath

    return out


def _make_replay_step(
    step_no: int,
    action_name: str,
    action_input: Dict[str, Any],
    expected_url: Optional[str] = None,
    continue_on_error: bool = False,
    capture_screenshot: bool = True,
    timeout_ms: Optional[int] = None,
) -> ReplayStepPayload:
    return ReplayStepPayload(
        stepNo=step_no,
        actionName=action_name,
        actionInput=action_input,
        expectedUrl=expected_url,
        continueOnError=continue_on_error,
        captureScreenshot=capture_screenshot,
        timeoutMs=timeout_ms,
    )


def _step_signature(step: ReplayStepPayload) -> str:
    return json.dumps(
        {
            "actionName": step.actionName,
            "actionInput": safe_to_jsonable(step.actionInput),
        },
        ensure_ascii=False,
        sort_keys=True,
    )


def _convert_browser_use_history_to_replay_steps(
    steps: List[Any],
) -> List[ReplayStepPayload]:
    replay_steps: List[ReplayStepPayload] = []
    step_counter = 1
    last_sig: Optional[str] = None

    for raw_step in steps:
        step_no = getattr(raw_step, "stepNo", None)
        action_name = getattr(raw_step, "actionName", None)
        action_input = getattr(raw_step, "actionInput", None)
        expected_url = getattr(raw_step, "expectedUrl", None)
        continue_on_error = bool(getattr(raw_step, "continueOnError", False))

        if isinstance(raw_step, dict):
            step_no = raw_step.get("stepNo", step_no)
            action_name = raw_step.get("actionName", action_name)
            action_input = raw_step.get("actionInput", action_input)
            expected_url = raw_step.get("expectedUrl", expected_url)
            continue_on_error = bool(raw_step.get("continueOnError", continue_on_error))

        items = _extract_browser_use_items(action_input)

        for item in items:
            if "navigate" in item:
                nav = item.get("navigate") or {}
                url = nav.get("url")
                if isinstance(url, str) and url.strip():
                    step_obj = _make_replay_step(
                        step_no=step_counter,
                        action_name="navigate",
                        action_input={"url": url},
                        expected_url=None,  # pre-nav URL is meaningless as post-nav check
                        continue_on_error=continue_on_error,
                    )
                    sig = _step_signature(step_obj)
                    if sig != last_sig:
                        replay_steps.append(step_obj)
                        last_sig = sig
                        step_counter += 1
                continue

            if "input" in item:
                input_payload = item.get("input") or {}
                text = _placeholder_to_template(input_payload.get("text"))
                locator_input = _build_locator_input_from_interacted_element(item)
                if text is not None:
                    locator_input["text"] = text
                if "clear" in input_payload:
                    locator_input["clear"] = bool(input_payload.get("clear"))
                step_obj = _make_replay_step(
                    step_no=step_counter,
                    action_name="fill",
                    action_input=locator_input,
                    expected_url=None,
                    continue_on_error=continue_on_error,
                )
                sig = _step_signature(step_obj)
                if sig != last_sig:
                    replay_steps.append(step_obj)
                    last_sig = sig
                    step_counter += 1
                continue

            if "click" in item:
                locator_input = _build_locator_input_from_interacted_element(item)
                step_obj = _make_replay_step(
                    step_no=step_counter,
                    action_name="click",
                    action_input=locator_input,
                    expected_url=None,  # URL after click depends on data — breaks DDT if hardcoded
                    continue_on_error=continue_on_error,
                )
                sig = _step_signature(step_obj)
                if sig != last_sig:
                    replay_steps.append(step_obj)
                    last_sig = sig
                    step_counter += 1
                continue

            if "done" in item:
                continue

        if not items and action_name and isinstance(action_input, dict):
            # browser_use_history steps with no recorded actions (e.g. validation errors
            # or empty action lists) have nothing to replay — skip them silently.
            if str(action_name).lower() == "browser_use_history":
                continue
            step_obj = _make_replay_step(
                step_no=step_counter,
                action_name=str(action_name),
                action_input=action_input,
                expected_url=expected_url,
                continue_on_error=continue_on_error,
            )
            sig = _step_signature(step_obj)
            if sig != last_sig:
                replay_steps.append(step_obj)
                last_sig = sig
                step_counter += 1

    return replay_steps


def xpath_literal(value: str) -> str:
    if "'" not in value:
        return f"'{value}'"
    if '"' not in value:
        return f'"{value}"'
    parts = value.split("'")
    return "concat(" + ', "\'", '.join(f"'{part}'" for part in parts) + ")"


def _extract_url_from_action_input(action_input: Dict[str, Any]) -> Optional[str]:
    direct_url = action_input.get("url") or action_input.get("href")
    if isinstance(direct_url, str) and direct_url.strip():
        return direct_url

    value = action_input.get("value")
    if isinstance(value, str) and value.strip():
        return value

    navigate = action_input.get("navigate")
    if isinstance(navigate, dict):
        url = navigate.get("url")
        if isinstance(url, str) and url.strip():
            return url

    if isinstance(value, list):
        for item in value:
            normalized = normalize_action_item(item)
            nav = normalized.get("navigate")
            if isinstance(nav, dict):
                url = nav.get("url")
                if isinstance(url, str) and url.strip():
                    return url

    return None

def _url_to_page_key(url: Optional[str]) -> str:
    if not url:
        return "Page_Unknown"
    try:
        path = urlparse(url).path.rstrip("/")
        segment = (path.split("/")[-1] or "home")
        words = re.split(r"[-_\s]+", segment)
        return "Page_" + "".join(w.capitalize() for w in words if w) or "Page_Home"
    except Exception:
        return "Page_Unknown"



def _extract_test_objects(
    steps: List[Dict[str, Any]],
    test_run_id: int,
) -> Tuple[List[Dict[str, Any]], Dict[int, str]]:
    """Extract test objects from clean replay steps.

    Returns:
        (objects, step_object_map) where step_object_map maps step index → object name.
    """
    # Fix 4: include press if it has a locator
    INTERACTABLE = {
        "fill", "type", "input_text", "enter_text", "input",
        "click", "tap",
        "select", "select_option",
        "check", "uncheck",
        "press", "press_key", "keyboard_press",
    }
    LOCATOR_KEY_MAP = {
        "testId":       "testId",
        "nameAttr":     "nameAttr",
        "placeholder":  "placeholder",
        "title":        "title",
        "axName":       "axName",
        "xpath":        "xpath",
        "x_path":       "xpath",
        "id":           "id",
        "elementId":    "id",
        "selector":     "css",
        "css":          "css",
        "smartLocator": "smartLocator",
        # "text" excluded for fill (value, not locator)
    }
    # Fix 3: stable id promoted above placeholder/title/axName
    PRIORITY = ["testId", "id_stable", "nameAttr", "css", "axName", "placeholder", "title", "xpath", "id"]

    objects: List[Dict[str, Any]] = []
    step_object_map: Dict[int, str] = {}
    seen: Set[str] = set()
    current_url: Optional[str] = None

    for step_idx, step in enumerate(steps):
        action_name = (step.get("actionName") or "").lower().strip()
        action_input = step.get("actionInput") or {}

        if action_name in {"navigate", "goto", "go_to_url", "open_url"}:
            current_url = action_input.get("url") or current_url
            continue

        if action_name not in INTERACTABLE:
            continue

        # Fix 4: press without a target element (global keyboard) → skip
        if action_name in {"press", "press_key", "keyboard_press"}:
            has_locator = any(action_input.get(k) for k in LOCATOR_KEY_MAP)
            if not has_locator:
                continue

        # Build selector collection
        selector_collection: Dict[str, str] = {}
        for src_key, col_key in LOCATOR_KEY_MAP.items():
            val = action_input.get(src_key)
            if val and isinstance(val, str) and val.strip() and not val.startswith("{{"):
                selector_collection.setdefault(col_key, val.strip())

        if not selector_collection:
            continue

        # Fix 3: promote stable IDs above unstable ones
        raw_id = selector_collection.get("id") or ""
        if raw_id and _is_stable_id(raw_id):
            selector_collection["id_stable"] = raw_id

        primary = next(
            (p for p in PRIORITY if p in selector_collection),
            list(selector_collection.keys())[0],
        )
        # id_stable is an alias — remove before storing
        stable_id = selector_collection.pop("id_stable", None)
        if primary == "id_stable":
            primary = "id"

        # Element properties
        node = str(action_input.get("nodeName") or "").lower()
        element_properties: Dict[str, str] = {}
        if node:
            element_properties["tag"] = node
        for prop in ("nameAttr", "placeholder", "axName", "title", "id"):
            v = action_input.get(prop)
            if v:
                element_properties[prop] = str(v)

        selected_properties = [k for k in ("tag", "nameAttr", "placeholder", "axName") if k in element_properties][:4]

        # Generate object name
        node_up = str(action_input.get("nodeName") or "").upper()
        if action_name in {"click", "tap"}:
            prefix = "btn" if node_up == "BUTTON" else "link" if node_up == "A" else "el"
        elif action_name in {"select", "select_option"}:
            prefix = "select"
        elif action_name in {"check", "uncheck"}:
            prefix = "chk"
        elif action_name in {"press", "press_key", "keyboard_press"}:
            prefix = "input"
        else:
            prefix = "input" if node_up in {"INPUT", "TEXTAREA"} else "field"

        suffix = None
        for key in ("nameAttr", "id", "placeholder", "axName", "title"):
            v = action_input.get(key)
            if v and isinstance(v, str) and not v.startswith("{{"):
                slug = re.sub(r"[^a-zA-Z0-9]+", "_", v.strip()).strip("_")[:30]
                if slug:
                    suffix = slug
                    break

        page_key = _url_to_page_key(current_url)
        name = f"{prefix}_{suffix}" if suffix else f"{prefix}_{node or 'element'}"
        base = name
        counter = 1
        while name in seen:
            name = f"{base}_{counter}"
            counter += 1
        seen.add(name)

        step_object_map[step_idx] = name
        objects.append({
            "name": name,
            "pageKey": page_key,
            "selectorMethod": primary,
            "selectorCollection": selector_collection,
            "elementProperties": element_properties,
            "selectedProperties": selected_properties,
            "sourceUrl": current_url,
            "createdFromRunId": test_run_id,
            "status": "auto",
        })

    return objects, step_object_map


# Fix 2: rewrite steps — strip locators, add objectRef + _selectorCollection hint
_LOCATOR_KEYS = frozenset([
    "nameAttr", "placeholder", "title", "axName", "xpath", "x_path",
    "id", "elementId", "selector", "css", "testId", "nodeName",
    "role", "label", "testid", "nth",
])
_VALUE_KEYS = frozenset(["text", "clear", "key", "value", "labelValue", "state", "url"])


def _rewrite_steps_with_object_refs(
    steps: List[Dict[str, Any]],
    step_object_map: Dict[int, str],
    objects: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    obj_by_name = {o["name"]: o for o in objects}
    rewritten: List[Dict[str, Any]] = []

    for i, step in enumerate(steps):
        if i not in step_object_map:
            rewritten.append(step)
            continue

        obj_name = step_object_map[i]
        obj = obj_by_name.get(obj_name)
        if not obj:
            rewritten.append(step)
            continue

        action_input = step.get("actionInput") or {}

        # Keep only value fields in actionInput; locators move to object
        new_input: Dict[str, Any] = {
            k: v for k, v in action_input.items() if k in _VALUE_KEYS
        }
        # Embed selectorCollection so replay can do fallback without a DB call
        new_input["_selectorCollection"] = obj["selectorCollection"]
        new_input["_primarySelector"]    = obj["selectorMethod"]

        new_step = {**step, "actionInput": new_input}
        new_step["objectRef"] = {"pageKey": obj["pageKey"], "name": obj_name}
        rewritten.append(new_step)

    return rewritten


def build_recorded_script(run_req: RunRequest, history: Any) -> Dict[str, Any]:
    action_history = safe_to_jsonable(getattr(history, "action_history", lambda: [])()) or []
    urls = safe_to_jsonable(getattr(history, "urls", lambda: [])()) or []

    raw_steps: List[ReplayStepPayload] = []
    total_steps = len(action_history)

    for i in range(total_steps):
        raw_history_item = action_history[i] if i < len(action_history) else None
        expected_url = urls[i] if i < len(urls) else None

        raw_steps.append(
            ReplayStepPayload(
                stepNo=i + 1,
                actionName="browser_use_history",
                actionInput=normalize_action_item(raw_history_item),
                expectedUrl=expected_url,
                continueOnError=False,
                captureScreenshot=True,
                timeoutMs=15000,
            )
        )

    clean_steps = _convert_browser_use_history_to_replay_steps(raw_steps)

    if getattr(history, "is_successful", lambda: False)():
        for assertion in _build_auto_assertions(clean_steps, history):
            max_no = max((s.stepNo for s in clean_steps), default=0)
            assertion.setdefault("stepNo", max_no + 1)
            assertion.setdefault("timeoutMs", 10000)
            clean_steps.append(ReplayStepPayload(**assertion))

    return {
        "formatVersion": 1,
        "scriptType": "strict_replay_json",
        "paramsSchema": {
            "username": {"type": "string", "required": False},
            "password": {"type": "string", "required": False},
        },
        "metadata": {
            "source": "browser_use_agent_history",
            "testCaseId": run_req.testCase.id,
            "attemptId": run_req.attemptId,
            "runtimeConfigId": run_req.runtimeConfig.id,
            "llmProvider": run_req.runtimeConfig.llmProvider,
            "llmModel": run_req.runtimeConfig.llmModel,
        },
        "steps": [safe_to_jsonable(step) for step in clean_steps],
    }


async def publish_llm_steps(run_req: RunRequest, history: Any, screenshots_dir: Path) -> None:
    urls = safe_to_jsonable(history.urls() or [])
    actions = safe_to_jsonable(history.action_names() or [])
    errors = safe_to_jsonable(history.errors() or [])
    contents = safe_to_jsonable(history.extracted_content() or [])
    thoughts = safe_to_jsonable(history.model_thoughts() or [])
    screenshots = safe_to_jsonable(history.screenshot_paths() or [])
    model_actions = safe_to_jsonable(history.model_actions() or [])
    model_outputs = safe_to_jsonable(history.model_outputs() or [])
    action_results = safe_to_jsonable(getattr(history, "action_results", lambda: [])() or [])

    total_steps = history.number_of_steps()

    for i in range(total_steps):
        error_value = errors[i] if i < len(errors) else None
        action_name = actions[i] if i < len(actions) else "unknown"
        current_url = urls[i] if i < len(urls) else None
        extracted = contents[i] if i < len(contents) else None
        thought = thoughts[i] if i < len(thoughts) else None
        screenshot_path = screenshots[i] if i < len(screenshots) else None
        action_input = model_actions[i] if i < len(model_actions) else None
        action_output = action_results[i] if i < len(action_results) else None
        model_output = model_outputs[i] if i < len(model_outputs) else None

        # Logic to move screenshot from browser-use temp folder to persistent screenshots_dir
        if screenshot_path and Path(screenshot_path).exists():
            try:
                # Create a unique filename in our persistent directory
                temp_p = Path(screenshot_path)
                persistent_name = f"llm_step_{i + 1}{temp_p.suffix or '.png'}"
                persistent_path = screenshots_dir / persistent_name
                
                # Copy to persistent location
                shutil.copy2(screenshot_path, str(persistent_path))
                
                # Use the new absolute path for the callback
                screenshot_path = str(persistent_path.resolve())
            except Exception:
                logger.warning("Failed to copy LLM screenshot from %s to %s", screenshot_path, str(screenshots_dir), exc_info=True)

        # Log screenshot path reported by the browser-use history for debugging
        logger.info("LLM step %s screenshotPath=%s", i + 1, str(screenshot_path))
        if screenshot_path:
            try:
                exists = Path(screenshot_path).exists()
            except Exception:
                exists = False
            logger.info("LLM step %s screenshot exists=%s", i + 1, exists)

        screenshot_data, screenshot_mime = encode_screenshot_file(screenshot_path)

        await post_step_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "stepNo": i + 1,
                "stepTitle": action_name,
                "action": action_name,
                "status": "failed" if error_value else "passed",
                "message": str(error_value) if error_value else f"Executed action: {action_name}",
                "currentUrl": current_url,
                "thoughtText": json.dumps(thought, ensure_ascii=False) if isinstance(thought, (dict, list)) else str(thought) if thought is not None else None,
                "extractedContent": extracted if isinstance(extracted, str) else json.dumps(extracted, ensure_ascii=False) if extracted is not None else None,
                "actionInputJson": action_input,
                "actionOutputJson": action_output,
                "modelOutputJson": model_output,
                "durationMs": None,
                "screenshotPath": screenshot_path,
                "screenshotData": screenshot_data,
                "screenshotMimeType": screenshot_mime,
            }
        )


def _build_synthesis_prompt(
    goal: str,
    steps: List[Dict[str, Any]],
    extracted_content: List[Any],
    model_thoughts: List[Any],
    final_result: Optional[str],
) -> str:
    steps_text = json.dumps(
        [{"stepNo": s.get("stepNo"), "actionName": s.get("actionName"), "actionInput": s.get("actionInput")} for s in steps],
        ensure_ascii=False,
        indent=2,
    )
    content_samples = [
        f"Step {i + 1}: {str(c)[:300]}"
        for i, c in enumerate(extracted_content[:10])
        if c
    ]
    thought_samples = [
        f"Step {i + 1}: {str(t)[:200]}"
        for i, t in enumerate(model_thoughts[:10])
        if t
    ]
    evidence_parts: List[str] = []
    if content_samples:
        evidence_parts.append("Extracted page content:\n" + "\n".join(content_samples))
    if thought_samples:
        evidence_parts.append("Agent observations:\n" + "\n".join(thought_samples))
    if final_result:
        evidence_parts.append(f"Final result: {str(final_result)[:500]}")
    evidence_text = "\n\n".join(evidence_parts) or "No evidence captured."

    return f"""You are a QA test architect. Analyze this browser automation session and generate State Anchors for deterministic replay testing.

Goal: {goal}

Recorded steps:
{steps_text}

Session evidence:
{evidence_text}

Task: For each step where you have clear evidence of an expected UI state, generate State Anchors — deterministic conditions Playwright will verify immediately after that step during replay.

Anchor types allowed:
- url_contains: current URL must contain the given substring (e.g. "/dashboard")
- url_changed: URL must differ from the previous page URL
- text_visible: a specific text string must be visible on page
- text_not_visible: a specific text string must NOT be visible
- no_error_message: no error/alert messages visible (set value=null)
- field_value_equals: the input field from this fill step must contain expected value

Rules:
- Only anchor steps where you have clear evidence from the session
- text values must be short stable business phrases — NOT timestamps, random IDs, counters, tokens, session-specific values
- If confidence < 0.7, set required=false
- Generate at most 2 anchors per step
- Prefer text_visible and url_contains — they are the most reliable

Return ONLY a JSON array, no explanation, no markdown:
[
  {{
    "stepIndex": <stepNo integer>,
    "anchors": [
      {{
        "type": "url_contains|url_changed|text_visible|text_not_visible|no_error_message|field_value_equals",
        "value": "<string or null>",
        "required": true,
        "confidence": 0.9,
        "reason": "<brief reason why this proves the goal succeeded>"
      }}
    ]
  }}
]"""


async def synthesize_state_anchors(
    history: Any,
    steps: List[Dict[str, Any]],
    goal: str,
    gemini_api_key: str,
    llm_model: str = "gemini-2.0-flash",
) -> Dict[int, List[Dict[str, Any]]]:
    """Call Gemini once after LLM run to generate per-step State Anchors.

    Returns a mapping of stepNo → list of anchor dicts.
    Raises on network/parse failure — caller must catch and treat as non-fatal.
    """
    extracted = safe_to_jsonable(getattr(history, "extracted_content", lambda: [])() or [])
    thoughts = safe_to_jsonable(getattr(history, "model_thoughts", lambda: [])() or [])
    final_result = None
    if hasattr(history, "final_result") and callable(history.final_result):
        final_result = history.final_result()

    prompt = _build_synthesis_prompt(goal, steps, extracted, thoughts, final_result)

    # Use gemini-2.0-flash for synthesis regardless of which model ran the agent
    # (synthesis is a short structured task; flash is fast and cheap)
    synthesis_model = "gemini-2.0-flash"
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{synthesis_model}:generateContent?key={gemini_api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
        },
    }

    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    fence_match = _MARKDOWN_FENCE_RE.match(raw_text.strip())
    if fence_match:
        raw_text = fence_match.group(1)

    parsed = json.loads(raw_text)
    if not isinstance(parsed, list):
        return {}

    result: Dict[int, List[Dict[str, Any]]] = {}
    for item in parsed:
        if not isinstance(item, dict):
            continue
        step_idx = item.get("stepIndex")
        anchors = item.get("anchors", [])
        if isinstance(step_idx, int) and isinstance(anchors, list) and anchors:
            result[step_idx] = anchors
    return result


def _merge_anchors_into_steps(
    steps: List[Dict[str, Any]],
    anchor_map: Dict[int, List[Dict[str, Any]]],
) -> None:
    for step in steps:
        step_no = step.get("stepNo")
        if step_no in anchor_map:
            step["anchors"] = anchor_map[step_no]


async def verify_anchor(
    page: "Page",
    anchor: StateAnchor,
    step_action_input: Optional[Dict[str, Any]] = None,
    timeout_ms: int = 5000,
) -> AnchorVerifyResult:
    anchor_type = (anchor.type or "").lower().strip()
    try:
        if anchor_type == "url_contains":
            if not anchor.value:
                return AnchorVerifyResult(passed=True, message="url_contains skipped: no value")
            if anchor.value in page.url:
                return AnchorVerifyResult(passed=True, message=f"URL contains '{anchor.value}'")
            return AnchorVerifyResult(passed=False, message=f"URL '{page.url}' does not contain '{anchor.value}'")

        elif anchor_type == "url_changed":
            # url_changed without an initial URL reference cannot be verified here;
            # the existing assert_url_changed step type handles it during replay
            return AnchorVerifyResult(passed=True, message="url_changed: deferred to step logic")

        elif anchor_type == "text_visible":
            if not anchor.value:
                return AnchorVerifyResult(passed=True, message="text_visible skipped: no value")
            locator = page.get_by_text(anchor.value, exact=False)
            try:
                await locator.first.wait_for(state="visible", timeout=timeout_ms)
                return AnchorVerifyResult(passed=True, message=f"Text '{anchor.value}' is visible")
            except Exception:
                return AnchorVerifyResult(passed=False, message=f"Text '{anchor.value}' not visible on page")

        elif anchor_type == "text_not_visible":
            if not anchor.value:
                return AnchorVerifyResult(passed=True, message="text_not_visible skipped: no value")
            locator = page.get_by_text(anchor.value, exact=False)
            try:
                await locator.first.wait_for(state="visible", timeout=2000)
                return AnchorVerifyResult(passed=False, message=f"Text '{anchor.value}' is visible but should not be")
            except Exception:
                return AnchorVerifyResult(passed=True, message=f"Text '{anchor.value}' correctly absent")

        elif anchor_type == "no_error_message":
            error_selectors = [
                page.get_by_role("alert"),
                page.get_by_text("lỗi", exact=False),
                page.get_by_text("thất bại", exact=False),
                page.get_by_text("failed", exact=False),
                page.get_by_text("invalid", exact=False),
            ]
            for loc in error_selectors:
                try:
                    if await loc.first.is_visible():
                        text = await loc.first.inner_text()
                        return AnchorVerifyResult(passed=False, message=f"Error message visible: '{text[:100]}'")
                except Exception:
                    pass
            return AnchorVerifyResult(passed=True, message="No error messages detected")

        elif anchor_type == "field_value_equals":
            if not anchor.value or step_action_input is None:
                return AnchorVerifyResult(passed=True, message="field_value_equals skipped: missing value or locator")
            try:
                locator = await resolve_locator(page, step_action_input)
                actual = await locator.first.input_value(timeout=timeout_ms)
                if actual == anchor.value:
                    return AnchorVerifyResult(passed=True, message=f"Field value equals '{anchor.value}'")
                return AnchorVerifyResult(passed=False, message=f"Field value '{actual}' != '{anchor.value}'")
            except Exception as exc:
                return AnchorVerifyResult(passed=False, message=f"field_value_equals error: {exc}")

        else:
            return AnchorVerifyResult(passed=True, message=f"Unknown anchor type '{anchor_type}' skipped")

    except Exception as exc:
        return AnchorVerifyResult(passed=False, message=f"Anchor verification error: {exc}")


async def execute_llm_run(run_req: RunRequest) -> None:
    browser = None
    # Central screenshots directory configurable via SCREENSHOTS_DIR env var
    screenshots_base = Path(os.getenv("SCREENSHOTS_DIR", "screenshots"))
    screenshots_dir = screenshots_base / f"run_{run_req.testRunId}_attempt_{run_req.attemptId}"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    try:
        llm = build_llm(run_req)
        browser = build_browser(run_req)
        task_text = build_task_text(run_req)

        if Agent is None:
            raise RuntimeError("browser_use Agent is not installed in this environment")

        logger.info(
            "[execute_llm_run] Starting agent — testRunId=%s provider=%s model=%s maxSteps=%s task_len=%d",
            run_req.testRunId,
            run_req.runtimeConfig.llmProvider,
            run_req.runtimeConfig.llmModel,
            run_req.runtimeConfig.maxSteps,
            len(task_text),
        )
        logger.debug("[execute_llm_run] Full task text:\n%s", task_text)

        agent = Agent(task=task_text, browser=browser, llm=llm)
        logger.info("[execute_llm_run] Agent created — llm class=%s", type(llm).__name__)
        history = await agent.run(max_steps=run_req.runtimeConfig.maxSteps)
        logger.info(
            "[execute_llm_run] Agent finished — steps=%s successful=%s final_result=%r",
            history.number_of_steps(),
            history.is_successful(),
            history.final_result(),
        )

        await publish_llm_steps(run_req, history, screenshots_dir)

        verdict = "pass" if history.is_successful() else "fail"
        recorded_script = build_recorded_script(run_req, history)

        # Extract test objects + rewrite steps with objectRef (best-effort, non-fatal)
        test_objects: List[Dict[str, Any]] = []
        try:
            test_objects, step_obj_map = _extract_test_objects(
                recorded_script.get("steps") or [],
                run_req.testRunId,
            )
            if test_objects:
                recorded_script["steps"] = _rewrite_steps_with_object_refs(
                    recorded_script.get("steps") or [],
                    step_obj_map,
                    test_objects,
                )
            logger.info("[execute_llm_run] Extracted %d test objects", len(test_objects))
        except Exception:
            logger.warning("[execute_llm_run] Object extraction failed (non-fatal)", exc_info=True)

        # Phase 1: State Anchor synthesis — LLM called once to generate per-step anchors.
        # Runs regardless of success/failure so even partial runs get anchors.
        # Best-effort: failures are logged and do not block the recording.
        gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        if gemini_api_key and recorded_script.get("steps"):
            try:
                goal = (run_req.testCase.goal or run_req.testCase.promptText or "").strip()
                anchor_map = await synthesize_state_anchors(
                    history=history,
                    steps=recorded_script["steps"],
                    goal=goal,
                    gemini_api_key=gemini_api_key,
                )
                if anchor_map:
                    _merge_anchors_into_steps(recorded_script["steps"], anchor_map)
                    recorded_script["anchorVersion"] = 1
                    recorded_script["generatedBy"] = "llm_state_anchor_synthesis"
                    logger.info(
                        "[execute_llm_run] Anchor synthesis done — anchored %d steps",
                        len(anchor_map),
                    )
                else:
                    logger.info("[execute_llm_run] Anchor synthesis returned no anchors")
            except Exception:
                logger.warning("[execute_llm_run] Anchor synthesis failed (non-fatal)", exc_info=True)
        else:
            logger.info(
                "[execute_llm_run] Skipping anchor synthesis — api_key=%s steps=%d",
                bool(gemini_api_key), len(recorded_script.get("steps") or []),
            )

        await post_final_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "status": "completed" if verdict == "pass" else "failed",
                "verdict": verdict,
                "finalResult": history.final_result(),
                "structuredOutput": safe_to_jsonable(getattr(history, "structured_output", None)),
                "errorMessage": None,
                "executionLog": {
                    "mode": "goal_based_agent",
                    "steps": history.number_of_steps(),
                    "totalDurationSeconds": history.total_duration_seconds(),
                    "visitedUrls": safe_to_jsonable(history.urls()),
                },
                "evidenceSummary": {
                    "screenshots": len(history.screenshot_paths() or []),
                },
                "recordedScript": {
                    "scriptType": recorded_script["scriptType"],
                    "scriptJson": recorded_script,
                    "paramsSchema": recorded_script.get("paramsSchema", {}),
                },
                "testObjects": test_objects,
            }
        )
    except Exception as exc:
        logger.exception(
            "[execute_llm_run] LLM run failed — testRunId=%s provider=%s model=%s error_type=%s error=%s",
            run_req.testRunId,
            run_req.runtimeConfig.llmProvider,
            run_req.runtimeConfig.llmModel,
            type(exc).__name__,
            exc,
        )
        await post_final_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "status": "failed",
                "verdict": "error",
                "finalResult": None,
                "structuredOutput": None,
                "errorMessage": str(exc),
                "executionLog": {"mode": "goal_based_agent"},
                "evidenceSummary": None,
            }
        )
    finally:
        if browser is not None:
            try:
                await browser.stop()
            except Exception:
                logger.warning("Failed to stop browser_use browser cleanly", exc_info=True)


def render_template(value: Any, params: Dict[str, Any]) -> Any:
    if isinstance(value, str):
        stripped = value.strip()

        placeholder_match = re.fullmatch(r"placeholder_([a-zA-Z0-9_]+)", stripped)
        if placeholder_match:
            key = placeholder_match.group(1)
            if key in params:
                return str(params[key])

        def replacer(match: re.Match[str]) -> str:
            key = match.group(1).strip()
            return str(params.get(key, match.group(0)))

        return re.sub(r"\{\{\s*([^{}]+?)\s*\}\}", replacer, value)

    if isinstance(value, list):
        return [render_template(v, params) for v in value]

    if isinstance(value, dict):
        return {k: render_template(v, params) for k, v in value.items()}

    return value

async def create_playwright_context(run_req: RunRequest) -> Tuple[Any, PWBrowser, BrowserContext]:
    if async_playwright is None:
        raise RuntimeError("playwright is not installed in this environment")

    playwright = await async_playwright().start()
    browser_type_name = (run_req.runtimeConfig.browserType or "chromium").lower()
    launcher = getattr(playwright, browser_type_name, None)
    if launcher is None:
        await playwright.stop()
        raise ValueError(f"Unsupported browserType for replay: {run_req.runtimeConfig.browserType}")

    launch_kwargs: Dict[str, Any] = {
        "headless": run_req.runtimeConfig.headless,
    }

    browser = await launcher.launch(**launch_kwargs)

    viewport = run_req.runtimeConfig.viewport or {"width": 1280, "height": 720}
    context_kwargs: Dict[str, Any] = {
        "viewport": viewport,
    }

    if run_req.runtimeConfig.locale:
        context_kwargs["locale"] = run_req.runtimeConfig.locale
    if run_req.runtimeConfig.timezone:
        context_kwargs["timezone_id"] = run_req.runtimeConfig.timezone

    profile = run_req.browserProfile
    if profile and profile.profileType == "storage_state" and profile.profileRef:
        context_kwargs["storage_state"] = profile.profileRef

    context = await browser.new_context(**context_kwargs)
    return playwright, browser, context


def _apply_nth(locator: "Locator", action_input: Dict[str, Any]) -> "Locator":
    nth = action_input.get("nth")
    if nth is not None:
        return locator.nth(int(nth))
    return locator


async def resolve_locator(page: Page, action_input: Dict[str, Any]) -> Locator:
    if not action_input:
        raise ValueError("Locator input is empty")

    selector = action_input.get("selector") or action_input.get("css")
    if isinstance(selector, str) and selector.strip():
        return _apply_nth(page.locator(selector), action_input)

    # Semantic locators first — stable across DOM changes
    name_attr = action_input.get("nameAttr")
    if isinstance(name_attr, str) and name_attr.strip():
        return page.locator(f"xpath=//*[@name={xpath_literal(name_attr)}]")

    placeholder = action_input.get("placeholder")
    if isinstance(placeholder, str) and placeholder.strip():
        return page.get_by_placeholder(placeholder)

    node_name = str(action_input.get("nodeName") or "").upper()

    title = action_input.get("title")
    if isinstance(title, str) and title.strip():
        if node_name == "BUTTON":
            # exact=True: avoid matching longer button names (e.g. "Search with your voice")
            return page.get_by_role("button", name=title, exact=True)
        if node_name == "A":
            # exact=False: link accessible names often include extra metadata (duration, etc.)
            return page.get_by_role("link", name=title, exact=False)
        return page.get_by_title(title, exact=True)

    label = action_input.get("label")
    if isinstance(label, str) and label.strip():
        return page.get_by_label(label, exact=True)

    test_id = action_input.get("testId")
    if isinstance(test_id, str) and test_id.strip():
        return page.get_by_test_id(test_id)

    ax_name = action_input.get("axName")
    if isinstance(ax_name, str) and ax_name.strip():
        if node_name == "BUTTON":
            return page.get_by_role("button", name=ax_name, exact=True)
        if node_name == "A":
            return page.get_by_role("link", name=ax_name, exact=False)
        if node_name == "INPUT":
            return page.get_by_placeholder(ax_name)
        return page.get_by_text(ax_name, exact=False)

    # Absolute xpath — fragile but explicit
    xpath = action_input.get("xpath") or action_input.get("x_path")
    if isinstance(xpath, str) and xpath.strip():
        raw = xpath.strip()
        if not raw.startswith("/") and not raw.startswith("("):
            raw = "/" + raw
        return page.locator(f"xpath={raw}")

    # id — last resort (may not be unique)
    element_id = action_input.get("id") or action_input.get("elementId")
    if isinstance(element_id, str) and element_id.strip():
        return page.locator(f"xpath=//*[@id={xpath_literal(element_id)}]")

    role = action_input.get("role")
    name = action_input.get("name")
    if role:
        return page.get_by_role(role, name=name)

    text = action_input.get("text")
    if isinstance(text, str) and text.strip():
        return page.get_by_text(text, exact=False)

    raise ValueError(f"Unable to resolve locator from action input: {action_input}")

async def resolve_locator_with_fallback(page: Page, action_input: Dict[str, Any]) -> Locator:
    """Try primary selector, then each fallback in selectorCollection (self-healing)."""
    sel_col: Dict[str, str] = action_input.get("_selectorCollection") or {}
    primary: str = action_input.get("_primarySelector") or ""

    if not sel_col:
        return await resolve_locator(page, action_input)

    PRIORITY = ["testId", "id", "nameAttr", "css", "axName", "placeholder", "title", "xpath"]

    ordered = (
        [primary] + [k for k in PRIORITY if k != primary and k in sel_col]
        if primary and primary in sel_col
        else [k for k in PRIORITY if k in sel_col]
    )

    _SEL_INPUT = {
        "testId":      lambda v: page.get_by_test_id(v),
        "id":          lambda v: page.locator(f"xpath=//*[@id={xpath_literal(v)}]"),
        "nameAttr":    lambda v: page.locator(f"xpath=//*[@name={xpath_literal(v)}]"),
        "css":         lambda v: page.locator(v),
        "axName":      lambda v: page.get_by_role("button", name=v, exact=True),
        "placeholder": lambda v: page.get_by_placeholder(v),
        "title":       lambda v: page.get_by_title(v, exact=True),
        "xpath":       lambda v: page.locator(f"xpath={v}" if not v.startswith("xpath=") else v),
        "text":        lambda v: page.get_by_text(v, exact=False),
        "smartLocator":lambda v: page.locator(f"internal:{v}" if not v.startswith("internal:") else v),
    }

    last_exc: Optional[Exception] = None
    for locator_type in ordered:
        value = sel_col.get(locator_type)
        if not value:
            continue
        builder = _SEL_INPUT.get(locator_type)
        if not builder:
            continue
        try:
            loc = builder(value)
            await loc.first.wait_for(state="attached", timeout=2000)
            if locator_type != primary:
                logger.info("[replay] self-heal: primary=%s failed, using %s", primary, locator_type)
            return loc
        except Exception as exc:
            last_exc = exc
            continue

    # Final fallback: legacy resolve_locator logic
    try:
        return await resolve_locator(page, action_input)
    except Exception:
        raise last_exc or ValueError("No locator resolved")


async def execute_replay_step(
    page: Page,
    step: ReplayStepPayload,
    params: Dict[str, Any],
    artifacts_dir: Path,
    screenshots_dir: Path,
) -> StepResult:
    started_at = time.perf_counter()
    action_input = render_template(step.actionInput, params)
    action_name = step.actionName.lower().strip()
    timeout_ms = step.timeoutMs or 30000
    screenshot_path: Optional[str] = None

    try:
        if action_name in {"goto", "go_to_url", "open_url", "navigate"}:
            url = _extract_url_from_action_input(action_input)
            if not url:
                raise ValueError("navigate step requires actionInput.url")
            await page.goto(str(url), wait_until="domcontentloaded", timeout=timeout_ms)
            # Best-effort wait for full load; networkidle is unreliable on SPAs
            try:
                await page.wait_for_load_state("load", timeout=8000)
            except Exception:
                pass
            await page.wait_for_timeout(400)
            message = f"Navigated to {url}"
            output = {"url": page.url}

        elif action_name in {"click", "tap"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            nth = action_input.get("nth")
            target = locator.nth(int(nth)) if nth is not None else locator.first
            try:
                await target.scroll_into_view_if_needed(timeout=5000)
            except Exception:
                pass
            url_before = page.url
            try:
                await target.click(timeout=timeout_ms)
            except Exception as click_err:
                try:
                    await target.click(timeout=5000, force=True)
                except Exception:
                    raise click_err
            # Wait for JS-driven navigation (pushState) to start before checking URL.
            # Checking page.url immediately after click may see the old URL because
            # SPA navigation is asynchronous.
            try:
                await page.wait_for_url(lambda url: url != url_before, timeout=3000)
            except Exception:
                pass
            # Fallback: if click did not trigger navigation (e.g. autocomplete overlay
            # intercepted the click or the form needs keyboard submission), press Enter.
            if page.url == url_before:
                try:
                    await page.keyboard.press("Enter")
                    await page.wait_for_url(lambda url: url != url_before, timeout=3000)
                except Exception:
                    pass
            if page.url != url_before:
                try:
                    await page.wait_for_load_state("domcontentloaded", timeout=10000)
                except Exception:
                    pass
                try:
                    await page.wait_for_load_state("load", timeout=10000)
                except Exception:
                    pass
                # Brief buffer for SPA visual rendering after load event
                await page.wait_for_timeout(600)
            message = "Click completed"
            output = {"url": page.url}

        elif action_name in {"fill", "type", "input_text", "enter_text", "input"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            nth = action_input.get("nth")
            target = locator.nth(int(nth)) if nth is not None else locator.first
            text = str(action_input.get("text") or "").strip()
            if not text and action_input.get("text") is None:
                raise ValueError("fill step requires actionInput.text")
            try:
                await target.scroll_into_view_if_needed(timeout=5000)
            except Exception:
                pass
            # fill() atomically clears existing value and sets the new one,
            # dispatching the built-in input event. We also fire change explicitly
            # so React/Vue/Angular controlled inputs pick up the new state.
            await target.fill(str(text), timeout=timeout_ms)
            try:
                await target.evaluate(
                    "el => {"
                    "  el.dispatchEvent(new Event('input',  {bubbles: true, cancelable: true}));"
                    "  el.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));"
                    "}"
                )
            except Exception:
                pass
            # Verify value was actually set — critical for React/Vue controlled inputs
            # where fill() may not reflect in .value until the event is processed.
            try:
                actual_value = await target.input_value(timeout=2000)
                if actual_value != str(text):
                    raise AssertionError(
                        f"Fill verification failed: expected '{text}', got '{actual_value}'"
                    )
            except AssertionError:
                raise
            except Exception:
                # input_value() unsupported on non-input elements (contenteditable etc.) — skip
                pass
            message = "Input completed"
            output = {"filled": True, "text": str(text)}

        elif action_name in {"press", "press_key", "keyboard_press"}:
            key = action_input.get("key")
            if not key:
                raise ValueError("press step requires actionInput.key")
            await page.keyboard.press(str(key))
            message = f"Pressed key {key}"
            output = {"pressed": key}

        elif action_name in {"select", "select_option"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            value = action_input.get("value")
            label = action_input.get("labelValue")
            if value is None and label is None:
                raise ValueError("select step requires actionInput.value or actionInput.labelValue")
            if value is not None:
                await locator.select_option(value=str(value), timeout=timeout_ms)
            else:
                await locator.select_option(label=str(label), timeout=timeout_ms)
            message = "Select completed"
            output = {"selected": value or label}

        elif action_name in {"check", "set_checked"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            await locator.check(timeout=timeout_ms)
            message = "Checked"
            output = {"checked": True}

        elif action_name in {"uncheck"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            await locator.uncheck(timeout=timeout_ms)
            message = "Unchecked"
            output = {"checked": False}

        elif action_name in {"wait_for_selector"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            state = action_input.get("state", "visible")
            await locator.wait_for(timeout=timeout_ms, state=state)
            message = f"Selector ready with state={state}"
            output = {"state": state}

        elif action_name in {"wait_for_url"}:
            url = _extract_url_from_action_input(action_input)
            if not url:
                raise ValueError("wait_for_url step requires actionInput.url")
            await page.wait_for_url(str(url), timeout=timeout_ms)
            message = f"URL matched {url}"
            output = {"url": page.url}

        elif action_name in {"assert_url_contains"}:
            expected = str(action_input.get("value") or action_input.get("contains") or "")
            if not expected:
                raise ValueError("assert_url_contains requires actionInput.contains/value")
            if expected not in page.url:
                raise AssertionError(f"Current URL '{page.url}' does not contain '{expected}'")
            message = f"URL contains {expected}"
            output = {"url": page.url}

        elif action_name in {"extract_text"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            text = await locator.inner_text(timeout=timeout_ms)
            message = "Text extracted"
            output = {"text": text}
            duration_ms = int((time.perf_counter() - started_at) * 1000)
            return StepResult(
                status="passed",
                message=message,
                current_url=page.url,
                extracted_content=text,
                action_output=output,
                duration_ms=duration_ms,
            )

        elif action_name in {"screenshot"}:
            file_name = action_input.get("fileName") or f"replay_step_{step.stepNo}.png"
            file_path = screenshots_dir / file_name
            file_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info("Saving screenshot to %s", str(file_path.resolve()))
            await page.screenshot(path=str(file_path), full_page=bool(action_input.get("fullPage", False)))
            screenshot_path = str(file_path.resolve())
            message = "Screenshot captured"
            output = {"path": screenshot_path}

        # ── Assertion actions ──────────────────────────────────────────────────

        elif action_name in {"assert_text", "assert_text_present", "verify_text"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            expected = str(action_input.get("text") or action_input.get("value") or "")
            exact = bool(action_input.get("exact", False))
            actual = await locator.first.inner_text(timeout=timeout_ms)
            if exact:
                if actual.strip() != expected:
                    raise AssertionError(
                        f"Text assertion failed: expected '{expected}', got '{actual.strip()}'"
                    )
            else:
                if expected not in actual:
                    raise AssertionError(
                        f"Text assertion failed: '{expected}' not found in '{actual}'"
                    )
            message = f"Text assertion passed: '{expected}'"
            output = {"text": actual, "expected": expected}

        elif action_name in {"assert_visible", "assert_element_visible", "assert_element_present", "verify_element_visible"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            await locator.first.wait_for(state="visible", timeout=timeout_ms)
            message = "Element is visible"
            output = {"visible": True}

        elif action_name in {"assert_value", "assert_input_value", "verify_input_value"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            expected = str(action_input.get("value") or action_input.get("text") or "")
            actual = await locator.first.input_value(timeout=timeout_ms)
            if actual != expected:
                raise AssertionError(
                    f"Value assertion failed: expected '{expected}', got '{actual}'"
                )
            message = f"Value assertion passed: '{expected}'"
            output = {"value": actual, "expected": expected}

        elif action_name in {"assert_url_changed"}:
            initial_url = str(action_input.get("initialUrl") or "")
            if not initial_url:
                raise ValueError("assert_url_changed requires actionInput.initialUrl")
            if page.url.rstrip("/") == initial_url.rstrip("/"):
                raise AssertionError(f"URL did not change: still at '{page.url}'")
            not_contains = action_input.get("notContains")
            if not_contains and not_contains in page.url:
                raise AssertionError(
                    f"URL changed but still contains login path '{not_contains}': '{page.url}'"
                )
            message = f"URL changed: '{initial_url}' → '{page.url}'"
            output = {"from": initial_url, "to": page.url}

        elif action_name in {"assert_url", "assert_url_equals", "verify_url"}:
            expected = str(action_input.get("url") or action_input.get("value") or "")
            if not expected:
                raise ValueError("assert_url requires actionInput.url or actionInput.value")
            exact = bool(action_input.get("exact", False))
            if exact:
                if page.url != expected:
                    raise AssertionError(
                        f"URL assertion failed: expected '{expected}', got '{page.url}'"
                    )
            else:
                if expected not in page.url:
                    raise AssertionError(
                        f"URL assertion failed: '{expected}' not in '{page.url}'"
                    )
            message = "URL assertion passed"
            output = {"url": page.url, "expected": expected}

        # ── Wait actions ───────────────────────────────────────────────────────

        elif action_name in {"wait_for_visible", "wait_element_visible", "wait_for_element"}:
            locator = await resolve_locator_with_fallback(page, action_input)
            await locator.first.wait_for(state="visible", timeout=timeout_ms)
            message = "Element is visible"
            output = {"visible": True}

        elif action_name in {"wait_for_text", "wait_text_present"}:
            text_expected = str(action_input.get("text") or "")
            if not text_expected:
                raise ValueError("wait_for_text requires actionInput.text")
            locator = page.get_by_text(text_expected, exact=False)
            await locator.first.wait_for(state="visible", timeout=timeout_ms)
            message = f"Text '{text_expected}' is visible"
            output = {"text": text_expected}

        else:
            raise ValueError(f"Unsupported replay actionName: {step.actionName}")

        # expectedUrl check: skip for actions that don't cause navigation.
        # - navigate/click: already handled or URL depends on data (DDT)
        # - fill/select/press/scroll/hover: don't navigate, recorded expectedUrl is the
        #   same page and adds no value; checking it would cause false failures in DDT
        #   when the URL contains query params that differ per dataset row.
        _skip_url_check = action_name in {
            "goto", "go_to_url", "open_url", "navigate",
            "click", "tap",
            "fill", "type", "input_text", "enter_text", "input",
            "select", "check", "uncheck",
            "press", "press_key", "keyboard_press",
            "scroll", "hover",
        }
        expected_url = render_template(step.expectedUrl, params) if step.expectedUrl else None
        if expected_url and not _skip_url_check and expected_url not in page.url:
            raise AssertionError(f"Expected URL to contain '{expected_url}', actual '{page.url}'")

        if step.captureScreenshot and screenshot_path is None:
            file_name = f"replay_step_{step.stepNo}.png"
            file_path = screenshots_dir / file_name
            file_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info("Saving screenshot to %s", str(file_path.resolve()))
            await page.screenshot(path=str(file_path), full_page=False)
            screenshot_path = str(file_path.resolve())

        duration_ms = int((time.perf_counter() - started_at) * 1000)
        return StepResult(
            status="passed",
            message=message,
            current_url=page.url,
            action_output=output,
            screenshot_path=screenshot_path,
            duration_ms=duration_ms,
        )

    except Exception as exc:
        duration_ms = int((time.perf_counter() - started_at) * 1000)
        if step.captureScreenshot:
            try:
                file_name = f"replay_step_{step.stepNo}_error.png"
                file_path = screenshots_dir / file_name
                file_path.parent.mkdir(parents=True, exist_ok=True)
                logger.info("Saving screenshot to %s", str(file_path.resolve()))
                await page.screenshot(path=str(file_path), full_page=False)
                screenshot_path = str(file_path.resolve())
            except Exception:
                screenshot_path = None
        return StepResult(
            status="failed",
            message=str(exc),
            current_url=page.url,
            screenshot_path=screenshot_path,
            duration_ms=duration_ms,
            failure_reason=classify_failure(action_name, exc),
        )


def parse_inline_script(run_req: RunRequest) -> ReplayScriptInlinePayload:
    replay = run_req.testCase.replay
    if replay is None:
        raise ValueError("Replay payload is missing")

    if replay.scriptJson is not None:
        return replay.scriptJson

    raise NotImplementedError(
        "This worker currently supports inline replay scriptJson. "
        "If you want scriptId lookup, load the script in Node and pass scriptJson down to the worker."
    )


async def execute_replay_run(run_req: RunRequest) -> None:
    playwright = None
    browser = None
    context = None
    screenshots_count = 0
    artifacts_dir = Path("artifacts") / f"run_{run_req.testRunId}_attempt_{run_req.attemptId}"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    screenshots_base = Path(os.getenv("SCREENSHOTS_DIR", "screenshots"))
    screenshots_dir = screenshots_base / f"run_{run_req.testRunId}_attempt_{run_req.attemptId}"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    try:
        script = parse_inline_script(run_req)
        params = run_req.testCase.replay.params if run_req.testCase.replay else {}

        script_steps = script.steps
        if getattr(script, "scriptType", None) == "browser_use_history":
            script_steps = _convert_browser_use_history_to_replay_steps(script.steps)

        if not script_steps:
            raise RuntimeError("Replay script contains no executable steps")

        playwright, browser, context = await create_playwright_context(run_req)
        page = await context.new_page()

        last_extracted: Optional[str] = None
        has_assertion = False
        assertion_failed = False
        execution_failed = False
        has_anchors = False
        required_anchor_failed = False

        for step in script_steps:
            step_is_assertion = is_assertion_step(step.actionName)
            result = await execute_replay_step(page, step, params, artifacts_dir, screenshots_dir)

            if result.screenshot_path:
                screenshots_count += 1
            if result.extracted_content:
                last_extracted = result.extracted_content

            if step_is_assertion:
                has_assertion = True
                if result.status == "failed":
                    assertion_failed = True
            else:
                if result.status == "failed":
                    execution_failed = True

            # Phase 2: verify State Anchors attached to this step (no LLM — pure Playwright)
            rendered_action_input = render_template(step.actionInput, params)
            anchor_results: List[Dict[str, Any]] = []
            for anchor in (step.anchors or []):
                has_anchors = True
                ar = await verify_anchor(page, anchor, rendered_action_input)
                anchor_results.append({
                    "type": anchor.type,
                    "value": anchor.value,
                    "required": anchor.required,
                    "confidence": anchor.confidence,
                    "passed": ar.passed,
                    "message": ar.message,
                })
                if anchor.required and not ar.passed:
                    required_anchor_failed = True
                    logger.warning(
                        "[replay] Required anchor FAILED — step=%d type=%s value=%s reason=%s",
                        step.stepNo, anchor.type, anchor.value, ar.message,
                    )
                elif not ar.passed:
                    logger.info(
                        "[replay] Optional anchor failed — step=%d type=%s value=%s reason=%s",
                        step.stepNo, anchor.type, anchor.value, ar.message,
                    )

            screenshot_data, screenshot_mime = encode_screenshot_file(result.screenshot_path)

            await post_step_event(
                {
                    "testRunId": run_req.testRunId,
                    "attemptId": run_req.attemptId,
                    "stepNo": step.stepNo,
                    "stepTitle": step.actionName,
                    "action": step.actionName,
                    "status": result.status,
                    "message": result.message,
                    "currentUrl": result.current_url,
                    "thoughtText": "Deterministic replay step",
                    "extractedContent": result.extracted_content,
                    "actionInputJson": rendered_action_input,
                    "actionOutputJson": result.action_output,
                    "modelOutputJson": None,
                    "durationMs": result.duration_ms,
                    "screenshotPath": result.screenshot_path,
                    "screenshotData": screenshot_data,
                    "screenshotMimeType": screenshot_mime,
                    "failureReason": result.failure_reason,
                    "anchorResults": anchor_results if anchor_results else None,
                }
            )

            # Assertion steps always continue — collect all failures before deciding verdict.
            # Action steps respect continueOnError: False stops execution immediately.
            if result.status == "failed" and not step_is_assertion and not step.continueOnError:
                raise RuntimeError(f"Step {step.stepNo} failed: {result.message}")

        verdict = compute_combined_verdict(
            has_assertion, assertion_failed, has_anchors, required_anchor_failed, execution_failed
        )

        await post_final_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "status": "completed",
                "verdict": verdict,
                "finalResult": last_extracted or "Replay completed successfully",
                "structuredOutput": None,
                "errorMessage": None,
                "executionLog": {
                    "mode": "replay_script",
                    "steps": len(script_steps),
                    "scriptType": script.scriptType,
                    "artifactsDir": str(artifacts_dir),
                    "hasAssertion": has_assertion,
                    "hasAnchors": has_anchors,
                    "requiredAnchorFailed": required_anchor_failed,
                },
                "evidenceSummary": {
                    "screenshots": screenshots_count,
                },
            }
        )

    except Exception as exc:
        logger.exception("Replay run failed")
        verdict = "fail" if assertion_failed else "error"
        await post_final_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "status": "failed",
                "verdict": verdict,
                "finalResult": None,
                "structuredOutput": None,
                "errorMessage": str(exc),
                "executionLog": {"mode": "replay_script"},
                "evidenceSummary": {"screenshots": screenshots_count},
            }
        )
    finally:
        try:
            if context is not None:
                await context.close()
        finally:
            try:
                if browser is not None:
                    await browser.close()
            finally:
                if playwright is not None:
                    await playwright.stop()

async def create_simple_playwright_context(
    headless: bool = True,
    browser_type: str = "chromium",
    viewport: Optional[Dict[str, int]] = None,
) -> Tuple[Any, Any, Any]:
    """Minimal Playwright context for fast-forward-inspect; no RunRequest needed."""
    if async_playwright is None:
        raise RuntimeError("playwright is not installed in this environment")
    playwright = await async_playwright().start()
    launcher = getattr(playwright, browser_type.lower(), None)
    if launcher is None:
        await playwright.stop()
        raise ValueError(f"Unsupported browserType: {browser_type}")
    browser = await launcher.launch(headless=headless)
    vp = viewport or {"width": 1280, "height": 720}
    context = await browser.new_context(viewport=vp)
    return playwright, browser, context


async def execute_run(run_req: RunRequest) -> None:
    if run_req.testCase.executionMode == "replay_script":
        await execute_replay_run(run_req)
        return

    await execute_llm_run(run_req)