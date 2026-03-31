"use strict";

const scanService = require("./scan.service");

async function triggerScan(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = Number(req.params.projectId);
    console.log(
      `[scan:ctrl:triggerScan] userId=${userId} projectId=${projectId}`,
    );
    const data = await scanService.triggerScan(userId, projectId);
    console.log(`[scan:ctrl:triggerScan] response sent: scanId=${data.id}`);
    res.status(202).json({ status: "ok", data, message: "Scan queued" });
  } catch (err) {
    console.error(`[scan:ctrl:triggerScan] error:`, err.message);
    next(err);
  }
}

async function getScanById(req, res, next) {
  try {
    const userId = req.user?.userId;
    const scanId = Number(req.params.scanId);
    console.log(`[scan:ctrl:getScanById] userId=${userId} scanId=${scanId}`);
    const data = await scanService.getScanById(userId, scanId);
    console.log(
      `[scan:ctrl:getScanById] returning scan status=${data.status} pages=${data.pagesFound}`,
    );
    res.json({ status: "ok", data });
  } catch (err) {
    console.error(`[scan:ctrl:getScanById] error:`, err.message);
    next(err);
  }
}

async function getLatestScan(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = Number(req.params.projectId);
    console.log(
      `[scan:ctrl:getLatestScan] userId=${userId} projectId=${projectId}`,
    );
    const data = await scanService.getLatestScan(userId, projectId);
    console.log(
      `[scan:ctrl:getLatestScan] returning: ${data ? `scanId=${data.id} status=${data.status}` : "null"}`,
    );
    res.json({ status: "ok", data });
  } catch (err) {
    console.error(`[scan:ctrl:getLatestScan] error:`, err.message);
    next(err);
  }
}

async function cancelScan(req, res, next) {
  try {
    const userId = req.user?.userId;
    const scanId = Number(req.params.scanId);
    console.log(`[scan:ctrl:cancelScan] userId=${userId} scanId=${scanId}`);
    const data = await scanService.cancelScan(userId, scanId);
    console.log(`[scan:ctrl:cancelScan] scan cancelled: ${data.id}`);
    res.json({ status: "ok", data });
  } catch (err) {
    console.error(`[scan:ctrl:cancelScan] error:`, err.message);
    next(err);
  }
}

/**
 * Internal per-page progress — called by crawler after each page crawled.
 */
async function pageProgress(req, res, next) {
  try {
    const scanId = Number(req.params.scanId);
    const { url, title, depth, pageIndex } = req.body;
    const secret = req.headers["x-callback-secret"] ?? "";

    console.log(
      `[scan:ctrl:pageProgress] scanId=${scanId} page[${pageIndex}] url=${url}`,
    );
    await scanService.handlePageProgress(scanId, {
      url,
      title,
      depth,
      pageIndex,
      secret,
    });
    console.log(
      `[scan:ctrl:pageProgress] progress handled for scanId=${scanId}`,
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error(`[scan:ctrl:pageProgress] error:`, err.message);
    next(err);
  }
}

/**
 * Internal final callback — called by agent-worker when crawling finishes.
 */
async function crawlCallback(req, res, next) {
  try {
    const scanId = Number(req.params.scanId);
    const { status, sitemap, interactionMap, errorMessage } = req.body;
    const secret = req.headers["x-callback-secret"] ?? "";

    console.log(
      `[scan:ctrl:crawlCallback] scanId=${scanId} status=${status} sitemapLength=${sitemap?.length ?? 0}`,
    );
    const data = await scanService.handleCrawlCallback(scanId, {
      status,
      sitemap,
      interactionMap,
      errorMessage,
      secret,
    });

    console.log(
      `[scan:ctrl:crawlCallback] callback processed for scanId=${scanId}`,
    );
    res.json({ status: "ok", data });
  } catch (err) {
    console.error(`[scan:ctrl:crawlCallback] error:`, err.message);
    next(err);
  }
}

module.exports = {
  triggerScan,
  cancelScan,
  getScanById,
  getLatestScan,
  pageProgress,
  crawlCallback,
};
