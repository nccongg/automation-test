"use strict";

const { pool } = require("../../config/database");
const llmService = require("../llm/llm.service");

async function getTestCases(userId, projectId) {
  const params = [userId];
  let where = "tc.created_by = $1";
  if (projectId) {
    params.push(projectId);
    where += ` AND tc.project_id = $2`;
  }
  const result = await pool.query(
    `SELECT
       tc.id,
       tc.title        AS name,
       tc.goal         AS description,
       tc.status,
       p.name          AS suite,
       tc.created_at
     FROM test_cases tc
     LEFT JOIN projects p ON p.id = tc.project_id
     WHERE ${where} AND tc.deleted_at IS NULL
     ORDER BY tc.created_at DESC`,
    params,
  );
  return result.rows;
}

async function generateTestCases(userId, prompt) {
  return llmService.generateTestCases(userId, prompt);
}

/**
 * Save a list of AI-generated test cases to the DB within a transaction.
 * For each test case:
 *   1. Insert test_cases row
 *   2. Insert test_case_versions row (plan_snapshot = full tc object)
 *   3. Insert test_steps rows
 *   4. Update test_cases.current_version_id
 *
 * @param {object} params
 * @param {number} params.projectId
 * @param {number} params.userId
 * @param {string} params.promptText  - original prompt used to generate
 * @param {string} params.aiModel
 * @param {Array}  params.testCases   - [{title, type, steps, expectedResult}]
 * @returns {Array} saved test case rows [{id, title, versionId}]
 */
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
      // 1. Insert test_case
      const tcResult = await client.query(
        `INSERT INTO test_cases (project_id, title, goal, status, ai_model, created_by)
         VALUES ($1, $2, $3, 'draft', $4, $5)
         RETURNING id`,
        [
          projectId,
          tc.title,
          tc.expectedResult || tc.title,
          aiModel || "ollama",
          userId,
        ],
      );
      const testCaseId = tcResult.rows[0].id;

      // 2. Insert test_case_version
      const planSnapshot = {
        title: tc.title,
        type: tc.type,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
      };

      const versionResult = await client.query(
        `INSERT INTO test_case_versions
           (test_case_id, version_no, source_type, prompt_text, plan_snapshot, ai_model, created_by, execution_mode)
         VALUES ($1, 1, 'ai_generated', $2, $3, $4, $5, 'goal_based_agent')
         RETURNING id`,
        [
          testCaseId,
          promptText,
          JSON.stringify(planSnapshot),
          aiModel || "ollama",
          userId,
        ],
      );
      const versionId = versionResult.rows[0].id;

      // 3. Insert test_steps
      for (let i = 0; i < tc.steps.length; i++) {
        const isLast = i === tc.steps.length - 1;
        await client.query(
          `INSERT INTO test_steps (test_case_version_id, step_order, action_type, input_data, expected_result)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            versionId,
            i + 1,
            tc.type || "custom",
            JSON.stringify({ description: tc.steps[i] }),
            isLast ? tc.expectedResult : null,
          ],
        );
      }

      // 4. Update current_version_id
      await client.query(
        `UPDATE test_cases SET current_version_id = $1, updated_at = NOW() WHERE id = $2`,
        [versionId, testCaseId],
      );

      saved.push({ id: testCaseId, title: tc.title, versionId });
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
  getTestCases,
  generateTestCases,
  saveTestCases,
};
