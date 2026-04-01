"use strict";

const { query } = require("../../config/database");
const agentService = require("../agent/agent.service");
const agentRepository = require("../agent/agent.repository");

function toPositiveNumber(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

async function startTestRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  triggeredBy = null,
}) {
  if (!testCaseId || !toPositiveNumber(testCaseId)) {
    throw { status: 400, message: "testCaseId must be a positive integer" };
  }

  return agentService.startAgentRun({
    testCaseId: Number(testCaseId),
    testCaseVersionId,
    runtimeConfigId,
    browserProfileId,
    triggeredBy,
  });
}

async function replayTestRun({
  sourceRunId,
  testCaseId = null,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  executionScriptId = null,
  params = {},
  triggeredBy = null,
}) {
  if (!sourceRunId || !toPositiveNumber(sourceRunId)) {
    throw { status: 400, message: "sourceRunId must be a positive integer" };
  }

  // If executionScriptId provided, delegate to agent replay
  return agentService.replayAgentRun({
    testCaseId: Number(testCaseId),
    testCaseVersionId,
    runtimeConfigId,
    browserProfileId,
    executionScriptId,
    params,
    triggeredBy,
  });
}

async function listRecentTestRuns({ userId, projectId = null, limit = 20 }) {
  const params = [userId];
  let where = "p.user_id = $1";

  if (projectId) {
    params.push(projectId);
    where += ` AND tr.project_id = $${params.length}`;
  }

  params.push(limit);

  const sql = `
    SELECT
      tr.id,
      tr.test_case_id AS "testCaseId",
      tr.status,
      tr.verdict,
      tr.started_at AS "startedAt",
      tr.finished_at AS "finishedAt",
      tc.title AS "testCaseTitle",
      p.id AS "projectId",
      p.name AS "projectName"
    FROM public.test_runs tr
    JOIN public.test_cases tc ON tc.id = tr.test_case_id
    JOIN public.projects p ON p.id = tc.project_id
    WHERE ${where}
    ORDER BY tr.started_at DESC
    LIMIT $${params.length}
  `;

  const result = await query(sql, params);
  return result.rows || [];
}

async function getTestRunDetail(runId, userId) {
  const id = toPositiveNumber(runId);
  if (!id) return null;

  const run = await agentRepository.findRunById(id);
  if (!run) return null;

  // verify ownership: ensure the run's test case belongs to the user
  const proj = await query(
    `SELECT p.user_id FROM public.projects p JOIN public.test_cases tc ON tc.project_id = p.id WHERE tc.id = $1 LIMIT 1`,
    [run.test_case_id],
  );

  if (!proj.rows[0] || proj.rows[0].user_id !== userId) {
    return null;
  }

  const attempts = await query(
    `SELECT * FROM public.test_run_attempts WHERE test_run_id = $1 ORDER BY attempt_no ASC`,
    [id],
  );

  const steps = await query(
    `SELECT * FROM public.run_step_logs WHERE test_run_id = $1 ORDER BY step_no ASC`,
    [id],
  );

  const evidences = await query(
    `SELECT * FROM public.evidences WHERE test_run_id = $1`,
    [id],
  );

  return {
    run,
    attempts: attempts.rows || [],
    steps: steps.rows || [],
    evidences: evidences.rows || [],
  };
}

module.exports = {
  startTestRun,
  listRecentTestRuns,
  getTestRunDetail,
  replayTestRun,
};
