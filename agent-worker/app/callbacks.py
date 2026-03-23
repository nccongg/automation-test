import os
import httpx

BASE_URL = os.getenv("NODE_CALLBACK_BASE_URL", "http://localhost:5000/api")
CALLBACK_SECRET = os.getenv("AGENT_CALLBACK_SECRET", "")

async def post_step_event(payload: dict):
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(
            f"{BASE_URL}/agent/callbacks/step",
            json=payload,
            headers={"x-agent-callback-secret": CALLBACK_SECRET},
        )

async def post_final_event(payload: dict):
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(
            f"{BASE_URL}/agent/callbacks/final",
            json=payload,
            headers={"x-agent-callback-secret": CALLBACK_SECRET},
        )