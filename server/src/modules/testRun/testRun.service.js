"use strict";

const { query } = require("../../config/database");
const agentService = require("../agent/agent.service");
const agentRepository = require("../agent/agent.repository");
const { generateRunAnalysis } = require("../llm/llm.service");

function toPositiveNumber(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function toNullablePositiveNumber(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = toPositiveNumber(value);
  if (!parsed) {
    throw { status: 400, message: `${fieldName} must be a positive integer` };
  }

  return parsed;
}

function toNullableInteger(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw { status: 400, message: `${fieldName} must be a non-negative integer` };
  }

  return num;
}

async function startTestRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  paramsOverride = {},
  triggeredBy = null,
}) {
  if (!testCaseId || !toPositiveNumber(testCaseId)) {
    throw { status: 400, message: "testCaseId must be a positive integer" };
  }

  return agentService.startAgentRun({
    testCaseId: Number(testCaseId),
    testCaseVersionId: toNullablePositiveNumber(testCaseVersionId, "testCaseVersionId"),
    runtimeConfigId: toNullablePositiveNumber(runtimeConfigId, "runtimeConfigId"),
    browserProfileId: toNullablePositiveNumber(browserProfileId, "browserProfileId"),
    datasetId: toNullablePositiveNumber(datasetId, "datasetId"),
    datasetAlias: datasetAlias ? String(datasetAlias).trim() : null,
    rowIndex: toNullableInteger(rowIndex, "rowIndex"),
    rowKey: rowKey ? String(rowKey).trim() : null,
    paramsOverride:
      paramsOverride && typeof paramsOverride === "object" ? paramsOverride : {},
    triggeredBy,
  });
}

async function replayTestRun({
  sourceRunId = null,
  testCaseId = null,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  executionScriptId = null,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  params = {},
  triggeredBy = null,
}) {
  const normalizedSourceRunId = toNullablePositiveNumber(sourceRunId, "sourceRunId");

  if (!testCaseId || !toPositiveNumber(testCaseId)) {
    throw { status: 400, message: "testCaseId must be a positive integer" };
  }

  if (!executionScriptId || !toPositiveNumber(executionScriptId)) {
    throw { status: 400, message: "executionScriptId must be a positive integer" };
  }

  return agentService.replayAgentRun({
    sourceRunId: normalizedSourceRunId,
    testCaseId: Number(testCaseId),
    testCaseVersionId: toNullablePositiveNumber(testCaseVersionId, "testCaseVersionId"),
    runtimeConfigId: toNullablePositiveNumber(runtimeConfigId, "runtimeConfigId"),
    browserProfileId: toNullablePositiveNumber(browserProfileId, "browserProfileId"),
    executionScriptId: Number(executionScriptId),
    datasetId: toNullablePositiveNumber(datasetId, "datasetId"),
    datasetAlias: datasetAlias ? String(datasetAlias).trim() : null,
    rowIndex: toNullableInteger(rowIndex, "rowIndex"),
    rowKey: rowKey ? String(rowKey).trim() : null,
    params: params && typeof params === "object" ? params : {},
    triggeredBy,
  });
}

async function listRecentTestRuns({ userId, projectId = null, limit = 20 }) {
  const params = [userId];
  let where = "p.user_id = $1";

  if (projectId) {
    params.push(projectId);
    where += ` AND p.id = $${params.length}`;
  }

  params.push(limit);

  const sql = `
    SELECT
      tr.id,
      tr.test_case_id       AS "testCaseId",
      tr.status,
      tr.verdict,
      tr.started_at         AS "startedAt",
      tr.finished_at        AS "finishedAt",
      tr.created_at         AS "createdAt",
      tc.title              AS "testCaseTitle",
      p.id                  AS "projectId",
      p.name                AS "projectName",
      (tsri.id IS NOT NULL) AS "fromSheet"
    FROM public.test_runs tr
    JOIN public.test_cases tc ON tc.id = tr.test_case_id
    JOIN public.projects p ON p.id = tc.project_id
    LEFT JOIN public.test_suite_run_items tsri ON tsri.test_run_id = tr.id
    WHERE ${where}
    ORDER BY COALESCE(tr.started_at, tr.created_at) DESC
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

  const proj = await query(
    `SELECT p.user_id
       FROM public.projects p
       JOIN public.test_cases tc ON tc.project_id = p.id
      WHERE tc.id = $1
      LIMIT 1`,
    [run.test_case_id],
  );

  if (!proj.rows[0] || proj.rows[0].user_id !== userId) {
    return null;
  }

  const attempts = await query(
    `SELECT *
       FROM public.test_run_attempts
      WHERE test_run_id = $1
      ORDER BY attempt_no ASC`,
    [id],
  );

  const steps = await query(
    `SELECT *
       FROM public.run_step_logs
      WHERE test_run_id = $1
      ORDER BY step_no ASC`,
    [id],
  );

  const evidences = await query(
    `SELECT *
       FROM public.evidences
      WHERE test_run_id = $1`,
    [id],
  );

  const datasetBindings = await agentRepository.listTestRunDatasetBindings(id);

  const mappedEvidences = (evidences.rows || []).map((ev) => {
    let imageUrl = null;
    if (ev.evidence_type === "screenshot" && ev.file_path) {
      const filePathStr = String(ev.file_path);
      const marker = "screenshots";
      const parts = filePathStr.split(/[\\/]screenshots[\\/]/);

      if (parts.length > 1) {
        const pathAfter = parts[parts.length - 1];
        imageUrl = `/screenshots/${pathAfter.replace(/\\/g, "/")}`;
      } else if (filePathStr.includes(marker)) {
        const index = filePathStr.indexOf(marker);
        let pathAfter = filePathStr.substring(index + marker.length);
        if (pathAfter.startsWith("/") || pathAfter.startsWith("\\")) {
          pathAfter = pathAfter.substring(1);
        }
        imageUrl = `/screenshots/${pathAfter.replace(/\\/g, "/")}`;
      }

      console.log(`[DEBUG] Mapping evidence ${ev.id}: ${ev.file_path} -> ${imageUrl}`);
    }

    return { ...ev, imageUrl };
  });

  const stepsWithScreenshots = (steps.rows || []).map((step) => ({
    ...step,
    screenshots: mappedEvidences.filter(
      (ev) => String(ev.run_step_log_id) === String(step.id),
    ),
  }));

  const attemptsWithDatasets = (attempts.rows || []).map((attempt) => ({
    ...attempt,
    datasetBindings: (datasetBindings || []).filter(
      (binding) =>
        String(binding.test_run_attempt_id) === String(attempt.id),
    ),
  }));

  return {
    run,
    attempts: attemptsWithDatasets,
    steps: stepsWithScreenshots,
    evidences: mappedEvidences,
    datasetBindings: datasetBindings || [],
  };
}

async function analyzeTestRun(runId, userId) {
  const detail = await getTestRunDetail(runId, userId);
  if (!detail) return null;

  const run = detail.run;
  const steps = detail.steps ?? [];

  const tcResult = await query(
    `SELECT tc.goal, tc.title
       FROM public.test_cases tc
      WHERE tc.id = $1
      LIMIT 1`,
    [run.test_case_id],
  );
  const tc = tcResult.rows[0] || {};

  return generateRunAnalysis({
    goal: tc.goal || tc.title || "Unknown",
    verdict: run.verdict || run.status,
    steps,
  });
}

module.exports = {
  startTestRun,
  listRecentTestRuns,
  getTestRunDetail,
  replayTestRun,
  analyzeTestRun,
};