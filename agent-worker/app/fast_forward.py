from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from .runner import execute_replay_step
from .schemas import ReplayStepPayload

logger = logging.getLogger(__name__)

# Used only as a placeholder path; fast-forward never writes screenshots.
_DUMMY_DIR = Path(tempfile.gettempdir())

# Simple-JSON action aliases → internal action vocabulary
_ACTION_ALIASES: Dict[str, str] = {
    "navigate": "navigate",
    "goto": "navigate",
    "open": "navigate",
    "click": "click",
    "tap": "click",
    "type": "fill",
    "fill": "fill",
    "input": "fill",
    "select": "select_option",
    "check": "check",
    "uncheck": "uncheck",
    "press": "press",
    "screenshot": "screenshot",
    "wait": "wait_for_selector",
    "assert_text": "assert_text",
    "assert_visible": "assert_visible",
    "assert_url": "assert_url",
    "assert_url_contains": "assert_url_contains",
}


class FastForwardError(Exception):
    """Raised when a preceding step fails during fast-forward execution."""

    def __init__(
        self,
        step_index: int,
        step_no: int,
        reason: str,
        failure_reason: Optional[str] = None,
    ) -> None:
        super().__init__(
            f"Fast-forward stalled at index {step_index} (stepNo={step_no}): {reason}"
            + (f" [{failure_reason}]" if failure_reason else "")
        )
        self.step_index = step_index
        self.step_no = step_no
        self.reason = reason
        self.failure_reason = failure_reason


class FastForwardEngine:
    """
    Deterministically replay steps[0 : targetStepIndex] to position the browser
    at the exact state required before the target step runs.

    Designed as the pre-flight phase of a Surgical Repair workflow:
    - Silent: no screenshots, no event callbacks.
    - Strict: any step failure raises FastForwardError immediately.
    - Async: each step uses Playwright's built-in explicit waits.

    Usage::

        engine = FastForwardEngine(page, script_steps, params)
        await engine.fast_forward(target_step_index=3)
        # browser is now positioned before step at index 3

    For the simplified JSON script format use the classmethod::

        engine = FastForwardEngine.from_simple_json(page, raw_steps)
        await engine.fast_forward(target_step_index=2)
    """

    def __init__(
        self,
        page: Any,
        steps: List[ReplayStepPayload],
        params: Optional[Dict[str, Any]] = None,
    ) -> None:
        self._page = page
        self._steps = steps
        self._params = params or {}

    @classmethod
    def from_simple_json(
        cls,
        page: Any,
        raw_steps: List[Dict[str, Any]],
        params: Optional[Dict[str, Any]] = None,
    ) -> "FastForwardEngine":
        """
        Build an engine from the simplified JSON script format::

            [
              {"step": 0, "action": "navigate", "value": "https://example.com"},
              {"step": 1, "action": "click",    "selector": "#login-btn"},
              {"step": 2, "action": "type",     "selector": "#username", "value": "admin"}
            ]

        Converts each entry into a ``ReplayStepPayload`` via ``_normalize_simple_step``.
        """
        steps = [_normalize_simple_step(raw, idx) for idx, raw in enumerate(raw_steps)]
        return cls(page, steps, params)

    async def fast_forward(self, target_step_index: int) -> None:
        """
        Execute ``steps[0 : target_step_index]`` in order.

        After this coroutine returns without error the browser is at the state
        where ``steps[target_step_index]`` would next be performed.

        :param target_step_index: 0-based list index of the step to repair.
            Passing 0 is a no-op (nothing precedes the first step).
        :raises ValueError: if target_step_index is outside [0, len(steps)].
        :raises FastForwardError: if any preceding step fails, carrying the
            index, stepNo, human-readable reason, and failure taxonomy key.
        """
        if target_step_index < 0 or target_step_index > len(self._steps):
            raise ValueError(
                f"target_step_index {target_step_index} out of range "
                f"[0, {len(self._steps)}]"
            )

        if target_step_index == 0:
            logger.debug("[fast_forward] target_step_index=0 — nothing to replay")
            return

        logger.info(
            "[fast_forward] Replaying %d step(s) silently before target index %d",
            target_step_index,
            target_step_index,
        )

        for idx in range(target_step_index):
            step = _silent_copy(self._steps[idx])

            logger.debug(
                "[fast_forward] step %d/%d — %s %s",
                idx + 1,
                target_step_index,
                step.actionName,
                step.actionInput,
            )

            result = await execute_replay_step(
                self._page,
                step,
                self._params,
                _DUMMY_DIR,
                _DUMMY_DIR,
            )

            if result.status == "failed":
                raise FastForwardError(
                    step_index=idx,
                    step_no=step.stepNo,
                    reason=result.message,
                    failure_reason=result.failure_reason,
                )

        target_step = self._steps[target_step_index]
        logger.info(
            "[fast_forward] Browser positioned before step index %d "
            "(stepNo=%d, action=%s) — current URL: %s",
            target_step_index,
            target_step.stepNo,
            target_step.actionName,
            self._page.url,
        )


# ── Helpers ───────────────────────────────────────────────────────────────────


def _silent_copy(step: ReplayStepPayload) -> ReplayStepPayload:
    """Return a copy of the step with screenshot capture and continueOnError disabled."""
    data = step.model_dump()
    data["captureScreenshot"] = False
    data["continueOnError"] = False
    return ReplayStepPayload(**data)


def _normalize_simple_step(raw: Dict[str, Any], idx: int) -> ReplayStepPayload:
    """
    Convert one entry from the simplified JSON script format into a
    ``ReplayStepPayload`` that the replay engine understands.

    Mapping rules:
    - ``step``     → stepNo  (falls back to list index)
    - ``action``   → actionName  (normalized via ``_ACTION_ALIASES``)
    - ``selector`` → actionInput.selector  (CSS / XPath string)
    - ``value``    → actionInput.url (navigate) or actionInput.text (fill) or
                     actionInput.value (everything else)
    - ``timeout``  → timeoutMs
    - Any extra recognized keys (``nth``, ``key``, ``exact``) are forwarded.
    """
    step_no = int(raw.get("step", idx))
    raw_action = str(raw.get("action") or "").lower().strip()
    action_name = _ACTION_ALIASES.get(raw_action, raw_action)

    selector: Optional[str] = raw.get("selector")
    value: Any = raw.get("value")

    action_input: Dict[str, Any] = {}

    if action_name in {"navigate", "goto", "go_to_url", "open_url"}:
        action_input["url"] = value or selector or ""
    elif action_name in {"fill", "type", "input_text", "enter_text", "input"}:
        if selector:
            action_input["selector"] = selector
        if value is not None:
            action_input["text"] = value
    else:
        if selector:
            action_input["selector"] = selector
        if value is not None:
            action_input["value"] = value

    for passthrough_key in ("nth", "key", "exact"):
        if passthrough_key in raw:
            action_input[passthrough_key] = raw[passthrough_key]

    return ReplayStepPayload(
        stepNo=step_no,
        actionName=action_name,
        actionInput=action_input,
        captureScreenshot=False,
        continueOnError=False,
        timeoutMs=raw.get("timeout"),
    )
