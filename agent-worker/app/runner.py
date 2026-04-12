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

    allowed_domains = ", ".join(run_req.runtimeConfig.allowedDomains or [])
    extra_lines: List[str] = []

    if allowed_domains:
        extra_lines.append(f"Only work within these domains: {allowed_domains}.")

    if run_req.project.baseUrl:
        extra_lines.append(f"Project base URL: {run_req.project.baseUrl}")

    if extra_lines:
        return f"{prompt_text}\n\n" + "\n".join(extra_lines)
    return prompt_text


def build_recorded_script(run_req: RunRequest, history: Any) -> Dict[str, Any]:
    action_history = safe_to_jsonable(getattr(history, "action_history", lambda: [])()) or []
    model_actions = safe_to_jsonable(getattr(history, "model_actions", lambda: [])()) or []
    urls = safe_to_jsonable(getattr(history, "urls", lambda: [])()) or []
    actions = safe_to_jsonable(getattr(history, "action_names", lambda: [])()) or []

    steps: List[Dict[str, Any]] = []
    total_steps = max(len(action_history), len(model_actions), len(actions), len(urls))

    for i in range(total_steps):
        action_name = actions[i] if i < len(actions) else None
        raw_history_item = action_history[i] if i < len(action_history) else None
        raw_model_action = model_actions[i] if i < len(model_actions) else None
        expected_url = urls[i] if i < len(urls) else None

        normalized_input = {}
        if raw_history_item is not None:
            normalized_input = normalize_action_item(raw_history_item)
        elif raw_model_action is not None:
            normalized_input = normalize_action_item(raw_model_action)

        steps.append(
            {
                "stepNo": i + 1,
                "actionName": action_name or "unknown",
                "actionInput": normalized_input,
                "expectedUrl": expected_url,
                "continueOnError": False,
            }
        )

    return {
        "formatVersion": 1,
        "scriptType": "browser_use_history",
        "paramsSchema": {},
        "metadata": {
            "source": "browser_use_agent_history",
            "testCaseId": run_req.testCase.id,
            "attemptId": run_req.attemptId,
            "runtimeConfigId": run_req.runtimeConfig.id,
            "llmProvider": run_req.runtimeConfig.llmProvider,
            "llmModel": run_req.runtimeConfig.llmModel,
        },
        "steps": steps,
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


async def resolve_locator(page: Page, action_input: Dict[str, Any]) -> Locator:
    if not action_input:
        raise ValueError("Locator input is empty")

    selector = action_input.get("selector") or action_input.get("css")
    if selector:
        return page.locator(selector)

    xpath = action_input.get("xpath")
    if xpath:
        return page.locator(f"xpath={xpath}")

    test_id = action_input.get("testId")
    if test_id:
        return page.get_by_test_id(test_id)

    label = action_input.get("label")
    if label:
        return page.get_by_label(label)

    placeholder = action_input.get("placeholder")
    if placeholder:
        return page.get_by_placeholder(placeholder)

    role = action_input.get("role")
    name = action_input.get("name")
    if role:
        return page.get_by_role(role, name=name)

    text = action_input.get("text")
    if text:
        return page.get_by_text(text)

    raise ValueError(f"Unable to resolve locator from action input: {action_input}")


async def execute_replay_step(page: Page, step: ReplayStepPayload, params: Dict[str, Any], artifacts_dir: Path, screenshots_dir: Path) -> StepResult:
    started_at = time.perf_counter()
    action_input = render_template(step.actionInput, params)
    action_name = step.actionName.lower().strip()
    timeout_ms = step.timeoutMs or 15000
    screenshot_path: Optional[str] = None

    try:
        if action_name in {"goto", "go_to_url", "open_url", "navigate"}:
            url = action_input.get("url") or action_input.get("value") or action_input.get("href")
            if not url:
                raise ValueError("navigate step requires actionInput.url")
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            message = f"Navigated to {url}"
            output = {"url": page.url}

        elif action_name in {"click", "tap"}:
            locator = await resolve_locator(page, action_input)
            await locator.click(timeout=timeout_ms)
            message = "Click completed"
            output = {"url": page.url}

        elif action_name in {"fill", "type", "input_text", "enter_text"}:
            locator = await resolve_locator(page, action_input)
            text = action_input.get("text")
            if text is None:
                raise ValueError("fill step requires actionInput.text")
            await locator.fill(str(text), timeout=timeout_ms)
            message = "Input completed"
            output = {"filled": True}

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
            url = action_input.get("url")
            if not url:
                raise ValueError("wait_for_url step requires actionInput.url")
            await page.wait_for_url(url, timeout=timeout_ms)
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
            # Save screenshots into a central screenshots directory (per-run subfolder)
            file_path = screenshots_dir / file_name
            file_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info("Saving screenshot to %s", str(file_path.resolve()))
            await page.screenshot(path=str(file_path), full_page=bool(action_input.get("fullPage", False)))
            # Use absolute path so the server/frontend can resolve it reliably
            screenshot_path = str(file_path.resolve())
            message = "Screenshot captured"
            output = {"path": screenshot_path}

        else:
            raise ValueError(f"Unsupported replay actionName: {step.actionName}")

        if step.expectedUrl and step.expectedUrl not in page.url:
            raise AssertionError(f"Expected URL to contain '{step.expectedUrl}', actual '{page.url}'")

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

    # Central screenshots directory configurable via SCREENSHOTS_DIR env var
    screenshots_base = Path(os.getenv("SCREENSHOTS_DIR", "screenshots"))
    screenshots_dir = screenshots_base / f"run_{run_req.testRunId}_attempt_{run_req.attemptId}"
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    try:
        script = parse_inline_script(run_req)
        params = run_req.testCase.replay.params if run_req.testCase.replay else {}

        playwright, browser, context = await create_playwright_context(run_req)
        page = await context.new_page()

        last_extracted: Optional[str] = None

        for step in script.steps:
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
                    "steps": len(script.steps),
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