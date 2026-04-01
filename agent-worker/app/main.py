from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

import os

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .runner import execute_run
from .schemas import RunRequest, CrawlRequest
from .crawler import SiteCrawler

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

app = FastAPI(title="Browser Use Agent Worker V2")

# Allow cross-origin image requests from the dev frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# scanId → asyncio.Task  (so we can cancel mid-crawl)
_crawl_tasks: dict[int, asyncio.Task] = {}


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


@app.get("/screenshots")
async def serve_screenshot(path: str):
    """Serve a screenshot file from the filesystem.

    Behavior:
    - If `path` is absolute and the file exists, return it.
    - If `path` is relative, resolve against the configured `SCREENSHOTS_DIR`
      (or `BASE_DIR/screenshots` by default) and return the file if inside.
    - Return proper HTTP errors for not found / unsupported types / invalid paths.
    """
    screenshots_dir_env = os.getenv("SCREENSHOTS_DIR")
    default_dir = BASE_DIR / "screenshots"
    screenshots_dir = Path(screenshots_dir_env) if screenshots_dir_env else default_dir

    try:
        # If client passed an absolute path, use it as-is; otherwise treat as relative
        requested = Path(path)
        if requested.is_absolute():
            file_path = requested
        else:
            file_path = (screenshots_dir / path)

        file_path = file_path.resolve()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    # If we resolved a relative path, ensure it remains inside the screenshots directory
    if not Path(path).is_absolute():
        try:
            screenshots_dir_resolved = screenshots_dir.resolve()
            if screenshots_dir_resolved != file_path and screenshots_dir_resolved not in file_path.parents:
                raise HTTPException(status_code=403, detail="Access denied")
        except Exception:
            # fallback: deny
            raise HTTPException(status_code=403, detail="Access denied")

    suffix = file_path.suffix.lower().lstrip(".")
    if suffix not in {"png", "jpg", "jpeg", "gif", "webp", "bmp"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return FileResponse(str(file_path), media_type=f"image/{suffix}")


@app.get("/screenshots/{file_path:path}")
async def serve_screenshot_by_name(file_path: str):
    """Serve a screenshot by relative path under the screenshots directory.

    Example: GET /screenshots/run_1/step_1.png
    """
    screenshots_dir_env = os.getenv("SCREENSHOTS_DIR")
    default_dir = BASE_DIR / "screenshots"
    screenshots_dir = Path(screenshots_dir_env) if screenshots_dir_env else default_dir

    try:
        requested = (screenshots_dir / file_path).resolve()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        screenshots_dir_resolved = screenshots_dir.resolve()
    except Exception:
        raise HTTPException(status_code=500, detail="Server configuration error")

    # Prevent directory traversal
    if screenshots_dir_resolved != requested and screenshots_dir_resolved not in requested.parents:
        raise HTTPException(status_code=403, detail="Access denied")

    if not requested.exists() or not requested.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    suffix = requested.suffix.lower().lstrip(".")
    if suffix not in {"png", "jpg", "jpeg", "gif", "webp", "bmp"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return FileResponse(str(requested), media_type=f"image/{suffix}")


@app.post("/crawl")
async def crawl_site(crawl_req: CrawlRequest) -> dict:
    """Accept a crawl job and run it in the background."""
    logging.info("Received crawl request: scanId=%s, baseUrl=%s, maxPages=%d, maxDepth=%d",
                 crawl_req.scanId, crawl_req.baseUrl, crawl_req.maxPages, crawl_req.maxDepth)
    task = asyncio.create_task(_run_crawl(crawl_req))
    _crawl_tasks[crawl_req.scanId] = task
    task.add_done_callback(lambda _: _crawl_tasks.pop(crawl_req.scanId, None))
    logging.info("Crawl task started for scanId=%s", crawl_req.scanId)
    return {"accepted": True, "scanId": crawl_req.scanId}


@app.post("/crawl/{scan_id}/cancel")
async def cancel_crawl(scan_id: int) -> dict:
    """Cancel an in-progress crawl."""
    logging.info("Received cancel request for scanId=%s", scan_id)
    task = _crawl_tasks.get(scan_id)
    if task and not task.done():
        task.cancel()
        logging.info("Crawl cancelled for scanId=%s", scan_id)
        return {"cancelled": True, "scanId": scan_id}
    logging.info("Crawl not running for scanId=%s", scan_id)
    return {"cancelled": False, "scanId": scan_id, "reason": "not running"}


async def _run_crawl(crawl_req: CrawlRequest) -> None:
    logging.info("Starting crawl execution for scanId=%s", crawl_req.scanId)
    auth_dict = crawl_req.authConfig.model_dump() if crawl_req.authConfig else None
    logging.debug("Auth config: %s", auth_dict)
    try:
        crawler = SiteCrawler(
            base_url=crawl_req.baseUrl,
            auth_config=auth_dict,
            max_pages=crawl_req.maxPages,
            max_depth=crawl_req.maxDepth,
            progress_callback_url=crawl_req.progressCallbackUrl,
            progress_callback_secret=crawl_req.callbackSecret,
        )
        logging.info("Crawler initialized, starting crawl")
        result = await crawler.crawl()
        logging.info("Crawl completed successfully for scanId=%s", crawl_req.scanId)
        await _post_crawl_callback(crawl_req, status="completed", result=result)
    except asyncio.CancelledError:
        logging.info("Crawl cancelled for scanId=%s", crawl_req.scanId)
        await _post_crawl_callback(crawl_req, status="cancelled")
    except Exception as exc:
        logging.exception("Crawl failed for scanId=%s", crawl_req.scanId)
        await _post_crawl_callback(crawl_req, status="failed", error=str(exc))


async def _post_crawl_callback(
    crawl_req: CrawlRequest,
    *,
    status: str,
    result: dict | None = None,
    error: str | None = None,
) -> None:
    logging.info("Posting crawl callback for scanId=%s, status=%s", crawl_req.scanId, status)
    payload = {
        "scanId": crawl_req.scanId,
        "status": status,
        "sitemap": result.get("sitemap") if result else None,
        "interactionMap": result.get("interaction_map") if result else None,
        "errorMessage": error,
    }
    headers = {"x-callback-secret": crawl_req.callbackSecret}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(crawl_req.callbackUrl, json=payload, headers=headers)
            resp.raise_for_status()
        logging.info("Crawl callback posted successfully for scanId=%s", crawl_req.scanId)
    except Exception as exc:
        logging.error("Failed to post crawl callback for scanId=%s: %s", crawl_req.scanId, exc)