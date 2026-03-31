"use strict";

const { query } = require("../../config/database");

async function createScan(projectId, rootUrl) {
  const sql = `
    INSERT INTO scans (project_id, root_url, status, started_at)
    VALUES ($1, $2, 'queued', NOW())
    RETURNING id, project_id, status, root_url, started_at
  `;
  const result = await query(sql, [projectId, rootUrl]);
  return result.rows[0];
}

async function updateScan(
  scanId,
  { status, sitemap, interactionMap, errorMessage },
) {
  const sql = `
    UPDATE scans
    SET
      status          = COALESCE($2::text, status),
      sitemap         = COALESCE($3::jsonb, sitemap),
      interaction_map = COALESCE($4::jsonb, interaction_map),
      error_message   = $5::text,
      finished_at     = CASE
        WHEN $2::text IN ('completed', 'failed', 'cancelled')
        THEN NOW()
        ELSE finished_at
      END
    WHERE id = $1
    RETURNING
      id,
      project_id,
      status,
      root_url,
      sitemap,
      interaction_map,
      error_message,
      started_at,
      finished_at;
  `;

  const result = await query(sql, [
    scanId,
    status ?? null,
    sitemap ? JSON.stringify(sitemap) : null,
    interactionMap ? JSON.stringify(interactionMap) : null,
    errorMessage ?? null,
  ]);

  return result.rows[0];
}

async function getScanById(scanId) {
  const sql = `
    SELECT id, project_id, status, root_url, sitemap, interaction_map, error_message, started_at, finished_at
    FROM scans
    WHERE id = $1
  `;
  const result = await query(sql, [scanId]);
  return result.rows[0] ?? null;
}

async function getLatestScanByProject(projectId) {
  const sql = `
    SELECT id, project_id, status, root_url, sitemap, interaction_map, error_message, started_at, finished_at
    FROM scans
    WHERE project_id = $1
    ORDER BY started_at DESC
    LIMIT 1
  `;
  const result = await query(sql, [projectId]);
  return result.rows[0] ?? null;
}

async function getLatestCompletedScanByProject(projectId) {
  const sql = `
    SELECT id, project_id, status, root_url, sitemap, interaction_map, started_at, finished_at
    FROM scans
    WHERE project_id = $1 AND status = 'completed'
    ORDER BY finished_at DESC
    LIMIT 1
  `;
  const result = await query(sql, [projectId]);
  return result.rows[0] ?? null;
}

/**
 * Append a single crawled page to the sitemap array (called per-page during crawl).
 */
async function appendPageToScan(scanId, page) {
  const sql = `
    UPDATE scans
    SET sitemap = COALESCE(sitemap, '[]'::jsonb) || $2::jsonb
    WHERE id = $1
    RETURNING id, sitemap
  `;
  const result = await query(sql, [scanId, JSON.stringify([page])]);
  return result.rows[0] ?? null;
}

module.exports = {
  createScan,
  updateScan,
  getScanById,
  getLatestScanByProject,
  getLatestCompletedScanByProject,
  appendPageToScan,
};
