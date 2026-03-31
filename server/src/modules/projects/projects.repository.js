"use strict";

const { query } = require("../../config/database");

async function createProject(userId, { name, description, baseUrl, config = {} }) {
  const sql = `
    INSERT INTO projects (user_id, name, description, base_url, config)
    VALUES ($1, $2, $3, $4, $5::jsonb)
    RETURNING id, name, description, base_url, config, created_at, updated_at
  `;

  const result = await query(sql, [userId, name, description, baseUrl, JSON.stringify(config)]);
  return result.rows[0];
}

async function getProjects(userId, page = 1, limit = 6) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 6;
  const offset = (pageNum - 1) * limitNum;

  const countSql = `
    SELECT COUNT(DISTINCT p.id) AS total
    FROM projects p
    WHERE p.user_id = $1
  `;
  const countResult = await query(countSql, [userId]);
  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum);

  const sql = `
    WITH project_metrics AS (
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_url,
        u.name AS owner_name,
        COUNT(DISTINCT tc.id) AS total_test_cases,
        MAX(tr.created_at) AS last_run_at,
        COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict = 'pass') AS passed_runs,
        COUNT(DISTINCT tr.id) FILTER (
          WHERE tr.verdict IN ('pass', 'fail', 'error', 'partial')
        ) AS total_runs
      FROM projects p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN test_cases tc
        ON p.id = tc.project_id
       AND tc.deleted_at IS NULL
      LEFT JOIN test_runs tr
        ON tc.id = tr.test_case_id
      WHERE p.user_id = $1
      GROUP BY p.id, u.name
    )
    SELECT
      id,
      name,
      description,
      base_url,
      owner_name,
      total_test_cases,
      last_run_at,
      passed_runs,
      total_runs,
      CASE
        WHEN total_runs = 0 THEN 'pending'
        WHEN passed_runs::NUMERIC / NULLIF(total_runs, 0) >= 0.8 THEN 'passing'
        WHEN passed_runs::NUMERIC / NULLIF(total_runs, 0) >= 0.5 THEN 'partial'
        ELSE 'failing'
      END AS status
    FROM project_metrics
    ORDER BY COALESCE(last_run_at, now()) DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await query(sql, [userId, limitNum, offset]);

  return {
    rows: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  };
}

async function getRecentProjects(userId, limit = 5) {
  const limitNum = parseInt(limit, 10) || 5;

  const sql = `
    WITH project_metrics AS (
      SELECT
        p.id,
        p.name,
        p.description,
        p.base_url,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT tc.id) AS total_test_cases,
        MAX(tr.created_at) AS last_run_at,
        COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict = 'pass') AS passed_runs,
        COUNT(DISTINCT tr.id) FILTER (
          WHERE tr.verdict IN ('pass', 'fail', 'error', 'partial')
        ) AS total_runs
      FROM projects p
      LEFT JOIN test_cases tc
        ON p.id = tc.project_id
       AND tc.deleted_at IS NULL
      LEFT JOIN test_runs tr
        ON tc.id = tr.test_case_id
      WHERE p.user_id = $1
      GROUP BY p.id, p.name, p.description, p.base_url, p.created_at, p.updated_at
    )
    SELECT
      id,
      name,
      description,
      base_url,
      created_at,
      updated_at,
      total_test_cases,
      last_run_at,
      passed_runs,
      total_runs,
      CASE
        WHEN total_runs = 0 THEN 0
        ELSE ROUND((passed_runs::NUMERIC / total_runs::NUMERIC) * 100, 1)
      END AS pass_rate,
      CASE
        WHEN total_runs = 0 THEN 'pending'
        WHEN passed_runs::NUMERIC / NULLIF(total_runs, 0) >= 0.8 THEN 'passing'
        WHEN passed_runs::NUMERIC / NULLIF(total_runs, 0) >= 0.5 THEN 'partial'
        ELSE 'failing'
      END AS status
    FROM project_metrics
    ORDER BY COALESCE(last_run_at, created_at) DESC
    LIMIT $2
  `;

  const result = await query(sql, [userId, limitNum]);
  return result.rows;
}

async function getProjectById(userId, projectId) {
  const projectIdNum = parseInt(projectId, 10);
  if (isNaN(projectIdNum)) {
    throw new Error("Invalid project ID");
  }

  const projectSql = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.base_url,
      p.user_id
    FROM projects p
    WHERE p.id = $1 AND p.user_id = $2
  `;

  const projectResult = await query(projectSql, [projectIdNum, userId]);
  if (!projectResult.rows.length) return null;

  const statsSql = `
    WITH stats AS (
      SELECT
        COUNT(DISTINCT tc.id) AS total_test_cases,
        MAX(tr.created_at) AS last_run_at,
        COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict = 'pass') AS passed_runs,
        COUNT(DISTINCT tr.id) FILTER (
          WHERE tr.verdict IN ('pass', 'fail', 'error', 'partial')
        ) AS total_runs,
        CASE
          WHEN COUNT(DISTINCT tr.id) FILTER (
            WHERE tr.verdict IN ('pass', 'fail', 'error', 'partial')
          ) = 0 THEN NULL
          ELSE ROUND(
            (
              COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict = 'pass')::NUMERIC
              / NULLIF(
                  COUNT(DISTINCT tr.id) FILTER (
                    WHERE tr.verdict IN ('pass', 'fail', 'error', 'partial')
                  ),
                  0
                )::NUMERIC
            ) * 100,
            1
          )
        END AS pass_rate
      FROM test_cases tc
      LEFT JOIN test_runs tr ON tc.id = tr.test_case_id
      WHERE tc.project_id = $1
        AND tc.deleted_at IS NULL
    )
    SELECT
      total_test_cases,
      last_run_at,
      passed_runs,
      total_runs,
      pass_rate,
      CASE
        WHEN total_runs = 0 THEN 'pending'
        WHEN passed_runs::NUMERIC / NULLIF(total_runs, 0) >= 0.8 THEN 'passing'
        WHEN passed_runs::NUMERIC / NULLIF(total_runs, 0) >= 0.5 THEN 'partial'
        ELSE 'failing'
      END AS status,
      (
        SELECT verdict
        FROM test_runs tr2
        JOIN test_cases tc2 ON tr2.test_case_id = tc2.id
        WHERE tc2.project_id = $1
          AND tc2.deleted_at IS NULL
        ORDER BY tr2.created_at DESC
        LIMIT 1
      ) AS latest_verdict
    FROM stats
  `;

  const statsResult = await query(statsSql, [projectIdNum]);
  const stats = statsResult.rows[0] || {};

  const activitySql = `
    SELECT
      tr.id AS run_id,
      tr.verdict,
      tr.created_at AS created_at,
      tc.title AS test_title
    FROM test_runs tr
    JOIN test_cases tc ON tr.test_case_id = tc.id
    WHERE tc.project_id = $1
      AND tc.deleted_at IS NULL
    ORDER BY tr.created_at DESC
    LIMIT $2
  `;

  const activityResult = await query(activitySql, [projectIdNum, 5]);

  return {
    ...projectResult.rows[0],
    total_test_cases: stats.total_test_cases,
    last_run_at: stats.last_run_at,
    passed_runs: stats.passed_runs,
    total_runs: stats.total_runs,
    status: stats.status,
    pass_rate: stats.pass_rate,
    latest_verdict: stats.latest_verdict,
    recent_activity: activityResult.rows,
  };
}

async function updateProject(userId, projectId, { name, description, baseUrl }) {
  const projectIdNum = parseInt(projectId, 10);
  if (isNaN(projectIdNum)) {
    throw new Error("Invalid project ID");
  }

  const sql = `
    UPDATE projects
    SET
      name = COALESCE($3, name),
      description = COALESCE($4, description),
      base_url = COALESCE($5, base_url),
      updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING id, name, description, base_url, created_at, updated_at
  `;

  const result = await query(sql, [
    projectIdNum,
    userId,
    name,
    description,
    baseUrl,
  ]);

  if (!result.rows.length) {
    throw new Error("Project not found or access denied");
  }

  return result.rows[0];
}

async function deleteProject(userId, projectId) {
  const projectIdNum = parseInt(projectId, 10);
  if (isNaN(projectIdNum)) {
    throw new Error("Invalid project ID");
  }

  const sql = `
    DELETE FROM projects
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;

  const result = await query(sql, [projectIdNum, userId]);
  return result.rows.length > 0;
}

module.exports = {
  createProject,
  getProjects,
  getRecentProjects,
  getProjectById,
  updateProject,
  deleteProject,
};