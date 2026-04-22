from __future__ import annotations

import json
import os
import logging
import re
import time
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .callbacks import post_final_event, post_step_event
from .schemas import ReplayScriptInlinePayload, ReplayStepPayload, RunRequest

logger = logging.getLogger(__name__)

try:
    from browser_use import Agent, Browser, ChatGoogle  # type: ignore
    from browser_use.llm.ollama.chat import ChatOllama as BrowserUseChatOllama  # type: ignore
    from browser_use.llm.openai.chat import ChatOpenAI as BrowserUseChatOpenAI  # type: ignore
except Exception as _bu_err:
    logger.warning("browser_use import failed: %s", _bu_err)
    Agent = None
    Browser = None
    ChatGoogle = None
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

    if provider in {"google", "gemini"}:
        if ChatGoogle is None:
            raise RuntimeError("browser_use ChatGoogle is not installed in this environment")
        llm = ChatGoogle(model=run_req.runtimeConfig.llmModel)
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


def _build_locator_input_from_interacted_element(item: Dict[str, Any]) -> Dict[str, Any]:
    interacted = item.get("interacted_element") or {}
    attrs = interacted.get("attributes") or {}
    node_name = str(interacted.get("node_name") or "").upper()
    ax_name = interacted.get("ax_name") or ""
    title = attrs.get("title") or ""
    name_attr = attrs.get("name") or ""
    placeholder = attrs.get("placeholder") or ""
    element_id = attrs.get("id") or ""
    raw_xpath = interacted.get("x_path") or ""

    action_input: Dict[str, Any] = {}

    if node_name:
        action_input["nodeName"] = node_name

    # --- Prefer semantic / stable locators over absolute DOM paths ---

    # Form inputs: name/placeholder are stable across renders
    if name_attr and node_name in {"INPUT", "SELECT", "TEXTAREA"}:
        action_input["nameAttr"] = name_attr
        if placeholder:
            action_input["placeholder"] = placeholder
        if ax_name:
            action_input["axName"] = ax_name
        return action_input

    if placeholder and node_name in {"INPUT", "TEXTAREA"}:
        action_input["placeholder"] = placeholder
        if ax_name:
            action_input["axName"] = ax_name
        return action_input

    # Buttons/links: title or axName uniquely identify the target
    if title:
        action_input["title"] = title
        if ax_name:
            action_input["axName"] = ax_name
        return action_input

    if ax_name:
        action_input["axName"] = ax_name
        return action_input

    # Non-unique IDs (e.g. YouTube reuses id="video-title") — only use when xpath unavailable
    if element_id and not raw_xpath:
        action_input["id"] = element_id
        return action_input

    # Fallback: absolute DOM xpath (fragile but better than nothing)
    if raw_xpath:
        action_input["xpath"] = raw_xpath
        # Keep title/axName as hints for debugging
        if title:
            action_input["title"] = title
        if ax_name:
            action_input["axName"] = ax_name

    return action_input


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
            }
        )


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

async def execute_replay_step(
    page: Page,
    step: ReplayStepPayload,
    params: Dict[str, Any],
    artifacts_dir: Path,
    screenshots_dir: Path,
) -> StepResult:
    started_at = time.perf_counter()
    action_input = render_template(step.actionInput, params)
    # Apply per-step field overrides: params["_step_N_key"] → action_input["key"]
    step_prefix = f"_step_{step.stepNo}_"
    for param_key, param_val in params.items():
        if isinstance(param_key, str) and param_key.startswith(step_prefix):
            field_key = param_key[len(step_prefix):]
            if field_key:
                logger.info("[override] step %s: %s = %r", step.stepNo, field_key, param_val)
                action_input[field_key] = param_val
    # Re-render after overrides so override values containing {{var}} are resolved
    action_input = render_template(action_input, params)
    logger.info("[execute_replay_step] stepNo=%s action=%s action_input=%s params_keys=%s",
                step.stepNo, step.actionName, action_input, list(params.keys()))
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
            locator = await resolve_locator(page, action_input)
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
            locator = await resolve_locator(page, action_input)
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
            locator = await resolve_locator(page, action_input)
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
            locator = await resolve_locator(page, action_input)
            await locator.check(timeout=timeout_ms)
            message = "Checked"
            output = {"checked": True}

        elif action_name in {"uncheck"}:
            locator = await resolve_locator(page, action_input)
            await locator.uncheck(timeout=timeout_ms)
            message = "Unchecked"
            output = {"checked": False}

        elif action_name in {"wait_for_selector"}:
            locator = await resolve_locator(page, action_input)
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
            locator = await resolve_locator(page, action_input)
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

        else:
            raise ValueError(f"Unsupported replay actionName: {step.actionName}")

        # Skip URL check for navigate actions — the pre-navigation URL is stored as
        # expectedUrl during recording, but after navigating the page is at the new URL.
        is_navigate = action_name in {"goto", "go_to_url", "open_url", "navigate"}
        # Render expectedUrl through template so {{param}} placeholders are substituted
        expected_url = render_template(step.expectedUrl, params) if step.expectedUrl else None
        if expected_url and not is_navigate and expected_url not in page.url:
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

        for step in script_steps:
            result = await execute_replay_step(page, step, params, artifacts_dir, screenshots_dir)
            if result.screenshot_path:
                screenshots_count += 1
            if result.extracted_content:
                last_extracted = result.extracted_content

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
                    "actionInputJson": render_template(step.actionInput, params),
                    "actionOutputJson": result.action_output,
                    "modelOutputJson": None,
                    "durationMs": result.duration_ms,
                    "screenshotPath": result.screenshot_path,
                }
            )

            if result.status == "failed" and not step.continueOnError:
                raise RuntimeError(f"Replay failed at step {step.stepNo}: {result.message}")

        await post_final_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "status": "completed",
                "verdict": "pass",
                "finalResult": last_extracted or "Replay completed successfully",
                "structuredOutput": None,
                "errorMessage": None,
                "executionLog": {
                    "mode": "replay_script",
                    "steps": len(script_steps),
                    "scriptType": script.scriptType,
                    "artifactsDir": str(artifacts_dir),
                },
                "evidenceSummary": {
                    "screenshots": screenshots_count,
                },
            }
        )

    except Exception as exc:
        logger.exception("Replay run failed")
        await post_final_event(
            {
                "testRunId": run_req.testRunId,
                "attemptId": run_req.attemptId,
                "status": "failed",
                "verdict": "error",
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

async def execute_run(run_req: RunRequest) -> None:
    if run_req.testCase.executionMode == "replay_script":
        await execute_replay_run(run_req)
        return

    await execute_llm_run(run_req)