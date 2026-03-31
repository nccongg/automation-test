"use strict";

const { pool } = require("../../config/database");
const llmService = require("../llm/llm.service");
const scanRepository = require("../scan/scan.repository");

async function findOwnedProjectById(userId, projectId) {
  const result = await pool.query(
    `
      SELECT id, user_id, name
      FROM projects
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [projectId, userId]
  );

  return result.rows[0] || null;
}

async function getTestCases(userId, projectId) {
  const params = [userId];
  let where = "p.user_id = $1";

  if (projectId) {
    params.push(projectId);
    where += " AND tc.project_id = $2";
  }

  const result = await pool.query(
    `
      SELECT
        tc.id,
        tc.title AS name,
        tc.goal AS description,
        tc.status,
        p.name AS suite,
        tc.created_at
      FROM test_cases tc
      JOIN projects p
        ON p.id = tc.project_id
      WHERE ${where}
        AND tc.deleted_at IS NULL
      ORDER BY tc.created_at DESC
    `,
    params
  );

  return result.rows;
}

async function generateTestCases(userId, prompt, projectId = null) {
  let scanContext = null;
  if (projectId) {
    scanContext = await scanRepository.getLatestCompletedScanByProject(projectId);
  }
  return llmService.generateTestCases(userId, prompt, scanContext);
}

async function saveTestCases({
  projectId,
  userId,
  promptText,
  aiModel,
  testCases,
}) {
  const client = await pool.connect();
  const saved = [];

  try {
    await client.query("BEGIN");

    for (const tc of testCases) {
      const title = tc.title;
      const type = tc.type || "custom";
      const steps = Array.isArray(tc.steps) ? tc.steps : [];
      const expectedResult = tc.expectedResult || "";
      const goal = expectedResult || title;

      const tcResult = await client.query(
        `
          INSERT INTO test_cases (
            project_id,
            title,
            goal,
            status,
            ai_model,
            created_by
          )
          VALUES ($1, $2, $3, 'draft', $4, $5)
          RETURNING id
        `,
        [projectId, title, goal, aiModel || "ollama", userId]
      );

      const testCaseId = tcResult.rows[0].id;

      const planSnapshot = {
        title,
        type,
        steps,
        expectedResult,
      };

      // Create a default runtime config for this test case
      const runtimeConfigResult = await client.query(
        `
          INSERT INTO agent_runtime_configs (
            project_id,
            name,
            llm_provider,
            llm_model,
            max_steps,
            timeout_seconds,
            use_vision,
            headless,
            browser_type
          )
          VALUES ($1, $2, 'google', 'gemini-flash-latest', 20, 180, TRUE, TRUE, 'chromium')
          RETURNING id
        `,
        [projectId, `default-${title}`]
      );

      const runtimeConfigId = runtimeConfigResult.rows[0].id;

      const versionResult = await client.query(
        `
          INSERT INTO test_case_versions (
            test_case_id,
            version_no,
            source_type,
            prompt_text,
            plan_snapshot,
            ai_model,
            created_by,
            execution_mode,
            runtime_config_id
          )
          VALUES ($1, 1, 'ai_generated', $2, $3, $4, $5, 'goal_based_agent', $6)
          RETURNING id
        `,
        [
          testCaseId,
          promptText || "",
          JSON.stringify(planSnapshot),
          aiModel || "ollama",
          userId,
          runtimeConfigId,
        ]
      );

      const versionId = versionResult.rows[0].id;

      for (let i = 0; i < steps.length; i++) {
        const isLast = i === steps.length - 1;

        await client.query(
          `
            INSERT INTO test_steps (
              test_case_version_id,
              step_order,
              action_type,
              input_data,
              expected_result
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            versionId,
            i + 1,
            type,
            JSON.stringify({ description: steps[i] }),
            isLast ? expectedResult || null : null,
          ]
        );
      }

      await client.query(
        `
          UPDATE test_cases
          SET current_version_id = $1, updated_at = NOW()
          WHERE id = $2
        `,
        [versionId, testCaseId]
      );

      saved.push({
        id: testCaseId,
        title,
        versionId,
      });
    }

    await client.query("COMMIT");
    return saved;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findOwnedProjectById,
  getTestCases,
  generateTestCases,
  saveTestCases,
};