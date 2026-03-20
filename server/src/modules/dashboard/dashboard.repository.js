'use strict';

const { query } = require('../../config/database');

/**
 * Get recent projects with metrics
 * @param {number} limit - Number of projects to return
 * @returns {Promise<Array>} Array of project objects with metrics
 */
async function getRecentProjects(userId, limit = 5) {
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
        COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict IN ('pass', 'fail', 'error', 'partial')) AS total_runs
      FROM projects p
      LEFT JOIN test_cases tc ON p.id = tc.project_id AND tc.deleted_at IS NULL
      LEFT JOIN test_runs tr ON tc.id = tr.test_case_id
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

  const result = await query(sql, [userId, limit]);
  return result.rows;
}

/**
 * Get dashboard KPIs
 * @param {number} userId - User ID
 * @returns {Promise<Object>} KPI metrics
 */
async function getDashboardKPIs(userId) {
  const sql = `
    WITH test_stats AS (
      SELECT 
        COUNT(DISTINCT tc.id) AS total_tests,
        COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict = 'pass') AS passed_tests,
        COUNT(DISTINCT tr.id) FILTER (WHERE tr.verdict = 'fail') AS failed_tests,
        AVG(EXTRACT(EPOCH FROM (tr.finished_at - tr.started_at)) / 60) AS avg_duration_minutes
      FROM test_cases tc
      LEFT JOIN test_runs tr ON tc.id = tr.test_case_id
      WHERE tc.project_id IN (SELECT id FROM projects WHERE user_id = $1)
        AND tc.deleted_at IS NULL
    )
    SELECT 
      total_tests,
      passed_tests,
      failed_tests,
      COALESCE(avg_duration_minutes, 0) AS avg_duration_minutes,
      CASE 
        WHEN total_tests = 0 THEN 0
        ELSE ROUND((passed_tests::NUMERIC / NULLIF(total_tests, 0)::NUMERIC) * 100, 1)
      END AS pass_rate_percentage
    FROM test_stats
  `;

  const result = await query(sql, [userId]);
  return result.rows[0];
}

module.exports = {
  getRecentProjects,
  getDashboardKPIs,
};
