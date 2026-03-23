from pathlib import Path
import asyncio
import sys
from fastapi import FastAPI
from dotenv import load_dotenv

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from .schemas import RunRequest
from .runner import execute_run

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="Browser Use Agent Worker")


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/run")
async def run_task(run_req: RunRequest):
    asyncio.create_task(execute_run(run_req))
    return {
        "accepted": True,
        "testRunId": run_req.testRunId,
        "attemptId": run_req.attemptId,
    }