"use strict";

const scanRepository = require("./scan.repository");
const projectsRepository = require("../projects/projects.repository");
const env = require("../../config/env");

const AGENT_WORKER_BASE_URL = env.AGENT_WORKER_BASE_URL;
const CALLBACK_SECRET = env.AGENT_CALLBACK_SECRET;

console.log("[scan] AGENT_WORKER_BASE_URL =", AGENT_WORKER_BASE_URL);
console.log("[scan] CALLBACK_SECRET set =", !!CALLBACK_SECRET);

function assertUser(userId) {
  if (!userId) throw { status: 401, message: "Unauthorized" };
}

/**
 * Trigger a crawl for a project.
 * Creates a scan record, fires the crawl job at the agent-worker (async),
 * and returns the scan immediately (status = 'queued').
 */
async function triggerScan(userId, projectId) {
  assertUser(userId);
  console.log(`[scan:triggerScan] userId=${userId} projectId=${projectId}`);

  const project = await projectsRepository.getProjectById(userId, projectId);
  if (!project) throw { status: 404, message: "Project not found" };

  console.log(
    `[scan:triggerScan] project found: id=${project.id} base_url=${project.base_url}`,
  );

  const scan = await scanRepository.createScan(projectId, project.base_url);
  console.log(
    `[scan:triggerScan] scan created: id=${scan.id} status=${scan.status}`,
  );

  // Fire-and-forget: do not await so the HTTP response returns immediately
  _dispatchCrawl(scan.id, project).catch((err) =>
    console.error("[scan:_dispatchCrawl] fatal error:", err.message, err.stack),
  );

  return _formatScan(scan);
}

async function _dispatchCrawl(scanId, project) {
  console.log(
    `[scan:_dispatchCrawl] scanId=${scanId} workerUrl=${AGENT_WORKER_BASE_URL}`,
  );

  await scanRepository.updateScan(scanId, { status: "running" });
  console.log(`[scan:_dispatchCrawl] scanId=${scanId} marked running`);

  const base = _serverBaseUrl();
  const callbackUrl = `${base}/api/scans/${scanId}/callback`;
  const progressCallbackUrl = `${base}/api/scans/${scanId}/progress`;

  console.log(`[scan:_dispatchCrawl] callbackUrl=${callbackUrl}`);
  console.log(
    `[scan:_dispatchCrawl] progressCallbackUrl=${progressCallbackUrl}`,
  );

  const authConfig = project.config?.auth ?? null;
  console.log(
    `[scan:_dispatchCrawl] authConfig=${authConfig ? JSON.stringify(authConfig) : "none"}`,
  );

  const payload = {
    scanId,
    baseUrl: project.base_url,
    authConfig,
    maxPages: 40,
    maxDepth: 3,
    callbackUrl,
    callbackSecret: CALLBACK_SECRET,
    progressCallbackUrl,
  };

  console.log(
    `[scan:_dispatchCrawl] sending payload to worker: ${JSON.stringify(payload, null, 2)}`,
  );

  let response;
  try {
    console.log(
      `[scan:_dispatchCrawl] making fetch request to ${AGENT_WORKER_BASE_URL}/crawl`,
    );
    response = await fetch(`${AGENT_WORKER_BASE_URL}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(
      `[scan:_dispatchCrawl] worker responded with status ${response.status}`,
    );
  } catch (err) {
    console.error(
      `[scan:_dispatchCrawl] fetch to worker FAILED — is the agent-worker running at ${AGENT_WORKER_BASE_URL}?`,
      err.message,
    );
    await scanRepository.updateScan(scanId, {
      status: "failed",
      errorMessage: `Worker unreachable: ${err.message}`,
    });
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    const msg = `Worker /crawl rejected: ${response.status} ${text}`;
    console.error(`[scan:_dispatchCrawl] ${msg}`);
    await scanRepository.updateScan(scanId, {
      status: "failed",
      errorMessage: msg,
    });
    throw new Error(msg);
  }

  const responseText = await response.text();
  console.log(`[scan:_dispatchCrawl] worker accepted crawl: ${responseText}`);
}

function _serverBaseUrl() {
  return process.env.SERVER_BASE_URL || `http://localhost:${env.PORT}`;
}

/**
 * Handle per-page progress posted by the crawler (called after each page).
 */
async function handlePageProgress(
  scanId,
  { url, title, depth, pageIndex, secret },
) {
  if (secret !== CALLBACK_SECRET) {
    console.warn(
      `[scan:handlePageProgress] invalid secret for scanId=${scanId}`,
    );
    throw { status: 401, message: "Invalid callback secret" };
  }
  console.log(
    `[scan:progress] scanId=${scanId} page[${pageIndex}] depth=${depth} url=${url} title="${title}"`,
  );
  await scanRepository.appendPageToScan(scanId, {
    url,
    title,
    depth,
    pageIndex,
  });
  console.log(`[scan:progress] page appended to scan for scanId=${scanId}`);
}

/**
 * Handle the callback posted by the agent-worker when crawling finishes.
 */
async function handleCrawlCallback(
  scanId,
  { status, sitemap, interactionMap, errorMessage, secret },
) {
  if (secret !== CALLBACK_SECRET) {
    console.warn(
      `[scan:handleCrawlCallback] invalid secret for scanId=${scanId}`,
    );
    throw { status: 401, message: "Invalid callback secret" };
  }

  console.log(
    `[scan:callback] scanId=${scanId} status=${status} pages=${sitemap?.length ?? 0}`,
  );
  if (errorMessage) {
    console.log(`[scan:callback] error: ${errorMessage}`);
  }

  const updated = await scanRepository.updateScan(scanId, {
    status,
    sitemap,
    interactionMap,
    errorMessage,
  });

  console.log(`[scan:callback] scan record updated for scanId=${scanId}`);
  return _formatScan(updated);
}

async function getScanById(userId, scanId) {
  assertUser(userId);

  const scan = await scanRepository.getScanById(scanId);
  if (!scan) throw { status: 404, message: "Scan not found" };

  // Verify project ownership
  const project = await projectsRepository.getProjectById(
    userId,
    scan.project_id,
  );
  if (!project) throw { status: 403, message: "Access denied" };

  return _formatScan(scan);
}

async function cancelScan(userId, scanId) {
  assertUser(userId);
  console.log(`[scan:cancelScan] userId=${userId} scanId=${scanId}`);

  const scan = await scanRepository.getScanById(scanId);
  if (!scan) {
    console.warn(`[scan:cancelScan] scanId=${scanId} not found`);
    throw { status: 404, message: "Scan not found" };
  }

  console.log(
    `[scan:cancelScan] scan found: status=${scan.status} projectId=${scan.project_id}`,
  );

  const project = await projectsRepository.getProjectById(
    userId,
    scan.project_id,
  );
  if (!project) {
    console.warn(
      `[scan:cancelScan] access denied for userId=${userId} on projectId=${scan.project_id}`,
    );
    throw { status: 403, message: "Access denied" };
  }

  if (scan.status !== "queued" && scan.status !== "running") {
    console.warn(
      `[scan:cancelScan] scan ${scanId} already in terminal state: ${scan.status}`,
    );
    throw { status: 409, message: `Scan is already ${scan.status}` };
  }

  // Tell the agent-worker to kill the crawl task (best-effort)
  console.log(
    `[scan:cancelScan] sending cancel to worker at ${AGENT_WORKER_BASE_URL}/crawl/${scanId}/cancel`,
  );
  try {
    const res = await fetch(`${AGENT_WORKER_BASE_URL}/crawl/${scanId}/cancel`, {
      method: "POST",
    });
    console.log(`[scan:cancelScan] worker cancel response: ${res.status}`);
  } catch (err) {
    console.warn(
      `[scan:cancelScan] worker cancel request failed (ignored): ${err.message}`,
    );
  }

  const updated = await scanRepository.updateScan(scanId, {
    status: "cancelled",
  });
  if (!updated) {
    console.error(
      `[scan:cancelScan] updateScan returned nothing for scanId=${scanId}`,
    );
    throw { status: 500, message: "Failed to update scan status" };
  }

  console.log(`[scan:cancelScan] scanId=${scanId} cancelled successfully`);
  return _formatScan(updated);
}

async function getLatestScan(userId, projectId) {
  assertUser(userId);

  const project = await projectsRepository.getProjectById(userId, projectId);
  if (!project) throw { status: 404, message: "Project not found" };

  const scan = await scanRepository.getLatestScanByProject(projectId);
  return scan ? _formatScan(scan) : null;
}

function _formatScan(scan) {
  const sitemap = Array.isArray(scan.sitemap) ? scan.sitemap : [];
  return {
    id: scan.id,
    projectId: scan.project_id,
    status: scan.status,
    rootUrl: scan.root_url,
    pagesFound: sitemap.length,
    // Lightweight list for the live progress UI (no childUrls)
    pages: sitemap.map((p) => ({
      url: p.url,
      title: p.title || "",
      depth: p.depth ?? 0,
    })),
    startedAt: scan.started_at,
    finishedAt: scan.finished_at ?? null,
    errorMessage: scan.error_message ?? null,
  };
}

module.exports = {
  triggerScan,
  cancelScan,
  handlePageProgress,
  handleCrawlCallback,
  getScanById,
  getLatestScan,
};
