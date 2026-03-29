from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

from fastapi import FastAPI
from .runner import execute_run
from .schemas import RunRequest

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(title="Browser Use Agent Worker V2")


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post("/run")
async def run_task(run_req: RunRequest) -> dict:
    asyncio.create_task(execute_run(run_req))
    return {
        "accepted": True,
        "testRunId": run_req.testRunId,
        "attemptId": run_req.attemptId,
        "executionMode": run_req.testCase.executionMode,
    }