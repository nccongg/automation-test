import asyncio
from browser_use import Agent, Browser, ChatGoogle
from .callbacks import post_step_event, post_final_event


def build_browser(run_req):
    viewport = run_req.runtimeConfig.viewport or {"width": 1280, "height": 720}
    profile = run_req.browserProfile

    if profile and profile.profileType == "system_chrome":
        return Browser.from_system_chrome()

    if profile and profile.profileType == "storage_state" and profile.profileRef:
        return Browser(
            headless=run_req.runtimeConfig.headless,
            viewport=viewport,
            storage_state=profile.profileRef,
        )

    return Browser(
        headless=run_req.runtimeConfig.headless,
        viewport=viewport,
    )


def build_task_text(run_req):
    prompt_text = (run_req.testCase.promptText or run_req.testCase.goal or "").strip()

    if not prompt_text:
        raise ValueError("No prompt text or goal provided for this run.")

    base_url = run_req.project.baseUrl
    allowed_domains = ", ".join(run_req.runtimeConfig.allowedDomains or [])

    extra_lines = []

    if allowed_domains:
        extra_lines.append(f"Only work within these domains: {allowed_domains}.")

    if base_url:
        if run_req.testCase.promptText and run_req.testCase.promptText.strip():
            extra_lines.append(f"Project base URL (use if relevant): {base_url}")
        else:
            extra_lines.append(f"Start from this URL: {base_url}")

    if extra_lines:
        return f"{prompt_text}\n\n" + "\n".join(extra_lines)

    return prompt_text


async def replay_history(run_req, history):
    urls = history.urls() or []
    actions = history.action_names() or []
    errors = history.errors() or []
    contents = history.extracted_content() or []
    thoughts = history.model_thoughts() or []
    screenshots = history.screenshot_paths() or []

    total_steps = history.number_of_steps()

    for i in range(total_steps):
        error_value = errors[i] if i < len(errors) else None
        action_name = actions[i] if i < len(actions) else "unknown"
        current_url = urls[i] if i < len(urls) else None
        extracted = contents[i] if i < len(contents) else None
        thought = str(thoughts[i]) if i < len(thoughts) else None
        screenshot_path = screenshots[i] if i < len(screenshots) else None

        await post_step_event({
            "testRunId": run_req.testRunId,
            "attemptId": run_req.attemptId,
            "stepNo": i + 1,
            "stepTitle": action_name,
            "action": action_name,
            "status": "failed" if error_value else "passed",
            "message": str(error_value) if error_value else f"Executed action: {action_name}",
            "currentUrl": current_url,
            "thoughtText": thought,
            "extractedContent": extracted,
            "actionInputJson": None,
            "actionOutputJson": None,
            "modelOutputJson": None,
            "durationMs": None,
            "screenshotPath": screenshot_path,
        })


async def execute_run(run_req):
    browser = None
    try:
        llm = ChatGoogle(model=run_req.runtimeConfig.llmModel)
        browser = build_browser(run_req)
        task_text = build_task_text(run_req)

        agent = Agent(
            task=task_text,
            browser=browser,
            llm=llm,
        )

        history = await agent.run(max_steps=run_req.runtimeConfig.maxSteps)

        await replay_history(run_req, history)

        verdict = "pass" if history.is_successful() else "fail"

        await post_final_event({
            "testRunId": run_req.testRunId,
            "attemptId": run_req.attemptId,
            "status": "completed" if verdict == "pass" else "failed",
            "verdict": verdict,
            "finalResult": history.final_result(),
            "structuredOutput": getattr(history, "structured_output", None),
            "errorMessage": None,
            "executionLog": {
                "steps": history.number_of_steps(),
                "totalDurationSeconds": history.total_duration_seconds(),
                "visitedUrls": history.urls(),
            },
            "evidenceSummary": {
                "screenshots": len(history.screenshot_paths() or []),
            },
        })

    except Exception as e:
        await post_final_event({
            "testRunId": run_req.testRunId,
            "attemptId": run_req.attemptId,
            "status": "failed",
            "verdict": "error",
            "finalResult": None,
            "structuredOutput": None,
            "errorMessage": str(e),
            "executionLog": None,
            "evidenceSummary": None,
        })
    finally:
        try:
            if browser:
                await browser.stop()
        except Exception:
            pass