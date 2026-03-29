from __future__ import annotations

import logging
import os
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)


def _base_url() -> str:
    return os.getenv("NODE_CALLBACK_BASE_URL", "http://localhost:5000/api")


def _callback_secret() -> str:
    return os.getenv("AGENT_CALLBACK_SECRET", "")


def _timeout_seconds() -> float:
    return float(os.getenv("AGENT_CALLBACK_TIMEOUT_SECONDS", "30"))


def _headers() -> Dict[str, str]:
    secret = _callback_secret()
    return {"x-agent-callback-secret": secret} if secret else {}


async def _post(path: str, payload: Dict[str, Any]) -> None:
    async with httpx.AsyncClient(timeout=_timeout_seconds()) as client:
        response = await client.post(
            f"{_base_url()}{path}",
            json=payload,
            headers=_headers(),
        )
        response.raise_for_status()


async def post_step_event(payload: Dict[str, Any]) -> None:
    await _post("/agent/callbacks/step", payload)


async def post_final_event(payload: Dict[str, Any]) -> None:
    await _post("/agent/callbacks/final", payload)