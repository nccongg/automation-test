"use strict";

const { pool } = require("../../config/database");

const GENERATION_LLM_PROVIDER =
  process.env.GENERATION_LLM_PROVIDER ||
  process.env.LLM_PROVIDER ||
  "ollama";

const GENERATION_LLM_MODEL =
  process.env.GENERATION_LLM_MODEL ||
  process.env.LLM_MODEL ||
  "gemma3:4b";

const EXECUTION_LLM_PROVIDER =
  process.env.EXECUTION_LLM_PROVIDER || "gemini";

const EXECUTION_LLM_MODEL =
  process.env.EXECUTION_LLM_MODEL || "gemini-2.5-flash";

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
    where += ` AND tc.project_id = $${params.length}`;
  }

  const result = await pool.query(
    `
      SELECT
        tc.id AS "testCaseId",
        tc.id,
        tc.project_id AS "projectId",
        tc.title,
        tc.goal,
        tc.status,
        tc.ai_model AS "aiModel",
        p.name AS suite,

        tcv.id AS "currentVersionId",
        tcv.version_no AS "versionNo",
        tcv.prompt_text AS "promptText",
        tcv.execution_mode AS "executionMode",
        tcv.runtime_config_id AS "runtimeConfigId",
        tcv.display_text AS "displayText",

        COALESCE(step_stats.step_count, 0) AS "stepCount",
        tc.created_at AS "createdAt",
        tc.updated_at AS "updatedAt"
      FROM test_cases tc
      JOIN projects p
        ON p.id = tc.project_id
      LEFT JOIN test_case_versions tcv
        ON tcv.id = tc.current_version_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS step_count
        FROM test_steps ts
        WHERE ts.test_case_version_id = tc.current_version_id
      ) step_stats ON TRUE
      WHERE ${where}
        AND tc.deleted_at IS NULL
      ORDER BY tc.updated_at DESC, tc.created_at DESC
    `,
    params
  );

  return result.rows;
}

async function createGenerationBatchWithCandidates({
  projectId,
  userId,
  prompt,
  llmProvider,
  llmModel,
  candidates,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const batchResult = await client.query(
      `
        INSERT INTO test_case_generation_batches (
          project_id,
          source_prompt,
          status,
          llm_provider,
          llm_model,
          candidate_count,
          created_by
        )
        VALUES ($1, $2, 'generated', $3, $4, $5, $6)
        RETURNING id, project_id, source_prompt, status, llm_provider, llm_model, candidate_count, created_at
      `,
      [
        projectId,
        prompt,
        llmProvider,
        llmModel,
        candidates.length,
        userId,
      ]
    );

    const batch = batchResult.rows[0];
    const insertedCandidates = [];

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];

      const candidateResult = await client.query(
        `
          INSERT INTO test_case_generation_candidates (
            batch_id,
            title,
            goal,
            display_text,
            prompt_text,
            execution_mode,
            plan_snapshot,
            variables_schema,
            candidate_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
          RETURNING
            id,
            title,
            goal,
            display_text AS "displayText",
            prompt_text AS "promptText",
            execution_mode AS "executionMode",
            plan_snapshot AS "planSnapshot",
            variables_schema AS "variablesSchema",
            candidate_order AS "candidateOrder",
            is_selected AS "isSelected",
            selected_test_case_id AS "selectedTestCaseId",
            created_at AS "createdAt"
        `,
        [
          batch.id,
          candidate.title,
          candidate.goal,
          candidate.displayText,
          candidate.promptText || prompt,
          candidate.executionMode,
          JSON.stringify(candidate.planSnapshot),
          JSON.stringify(candidate.variablesSchema || {}),
          index + 1,
        ]
      );

      insertedCandidates.push(candidateResult.rows[0]);
    }

    await client.query("COMMIT");

    return {
      batch: {
        id: batch.id,
        projectId: batch.project_id,
        sourcePrompt: batch.source_prompt,
        status: batch.status,
        llmProvider: batch.llm_provider,
        llmModel: batch.llm_model,
        candidateCount: batch.candidate_count,
        createdAt: batch.created_at,
      },
      candidates: insertedCandidates,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function findRuntimeConfigByIdForProject(
  client,
  projectId,
  runtimeConfigId
) {
  const result = await client.query(
    `
      SELECT id
      FROM agent_runtime_configs
      WHERE id = $1
        AND project_id = $2
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [runtimeConfigId, projectId]
  );

  return result.rows[0] || null;
}

async function ensureReusableRuntimeConfig(client, projectId, userId) {
  const existing = await client.query(
    `
      SELECT id
      FROM agent_runtime_configs
      WHERE project_id = $1
        AND deleted_at IS NULL
      ORDER BY
        CASE WHEN LOWER(name) LIKE 'default%' THEN 0 ELSE 1 END,
        updated_at DESC,
        id DESC
      LIMIT 1
    `,
    [projectId]
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `
      INSERT INTO agent_runtime_configs (
        project_id,
        name,
        description,
        llm_provider,
        llm_model,
        max_steps,
        timeout_seconds,
        use_vision,
        headless,
        browser_type,
        created_by
      )
      VALUES (
        $1,
        'default-runtime',
        'Default reusable runtime for project test cases',
        $2,
        $3,
        30,
        300,
        TRUE,
        TRUE,
        'chromium',
        $4
      )
      RETURNING id
    `,
    [
      projectId,
      EXECUTION_LLM_PROVIDER,
      EXECUTION_LLM_MODEL,
      userId,
    ]
  );

  return created.rows[0].id;
}

async function getSelectableCandidates(
  client,
  userId,
  projectId,
  batchId,
  candidateIds
) {
  const result = await client.query(
    `
      SELECT
        c.id,
        c.title,
        c.goal,
        c.display_text,
        c.prompt_text,
        c.execution_mode,
        c.plan_snapshot,
        c.variables_schema,
        c.candidate_order,
        b.source_prompt,
        b.llm_provider,
        b.llm_model
      FROM test_case_generation_candidates c
      JOIN test_case_generation_batches b
        ON b.id = c.batch_id
      JOIN projects p
        ON p.id = b.project_id
      WHERE p.user_id = $1
        AND b.project_id = $2
        AND b.id = $3
        AND c.id = ANY($4::bigint[])
      ORDER BY c.candidate_order ASC, c.id ASC
    `,
    [userId, projectId, batchId, candidateIds]
  );

  return result.rows;
}

function extractStepsFromPlanSnapshot(planSnapshot) {
  if (!planSnapshot || typeof planSnapshot !== "object") return [];

  if (!Array.isArray(planSnapshot.steps)) return [];

  return planSnapshot.steps
    .map((step, index) => {
      if (typeof step === "string") {
        const text = step.trim();
        if (!text) return null;
        return {
          order: index + 1,
          text,
          action: "custom",
          expectedResult: null,
        };
      }

      if (step && typeof step === "object") {
        const text = String(step.text || step.description || "").trim();
        if (!text) return null;

        return {
          order: Number(step.order) || index + 1,
          text,
          action: String(step.action || "custom").trim() || "custom",
          expectedResult: String(step.expectedResult || "").trim() || null,
        };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

async function saveCandidatesAsTestCases({
  userId,
  projectId,
  batchId,
  candidateIds,
  runtimeConfigId,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const candidates = await getSelectableCandidates(
      client,
      userId,
      projectId,
      batchId,
      candidateIds
    );

    if (candidates.length !== candidateIds.length) {
      throw {
        status: 404,
        message: "One or more candidates were not found or access was denied",
      };
    }

    let resolvedRuntimeConfigId = runtimeConfigId;

    if (resolvedRuntimeConfigId) {
      const runtimeConfig = await findRuntimeConfigByIdForProject(
        client,
        projectId,
        resolvedRuntimeConfigId
      );

      if (!runtimeConfig) {
        throw {
          status: 404,
          message: "runtimeConfigId not found for this project",
        };
      }
    } else {
      resolvedRuntimeConfigId = await ensureReusableRuntimeConfig(
        client,
        projectId,
        userId
      );
    }

    const saved = [];

    for (const candidate of candidates) {
      const planSnapshot = candidate.plan_snapshot || {};
      const steps = extractStepsFromPlanSnapshot(planSnapshot);

      const expectedResult =
        String(planSnapshot.expectedResult || "").trim() || null;

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
        [
          projectId,
          candidate.title,
          candidate.goal,
          candidate.llm_model ||
            GENERATION_LLM_MODEL ||
            GENERATION_LLM_PROVIDER ||
            null,
          userId,
        ]
      );

      const testCaseId = tcResult.rows[0].id;

      const versionResult = await client.query(
        `
          INSERT INTO test_case_versions (
            test_case_id,
            version_no,
            source_type,
            prompt_text,
            plan_snapshot,
            variables_schema,
            ai_model,
            created_by,
            execution_mode,
            runtime_config_id,
            display_text
          )
          VALUES ($1, 1, 'ai_generated', $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9)
          RETURNING id
        `,
        [
          testCaseId,
          candidate.prompt_text || candidate.source_prompt || "",
          JSON.stringify(planSnapshot),
          JSON.stringify(candidate.variables_schema || {}),
          candidate.llm_model ||
            GENERATION_LLM_MODEL ||
            GENERATION_LLM_PROVIDER ||
            null,
          userId,
          candidate.execution_mode || "step_based",
          resolvedRuntimeConfigId,
          candidate.display_text || null,
        ]
      );

      const versionId = versionResult.rows[0].id;

      for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i];
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
            VALUES ($1, $2, $3, $4::jsonb, $5)
          `,
          [
            versionId,
            step.order,
            step.action || "custom",
            JSON.stringify({ description: step.text }),
            step.expectedResult || (isLast ? expectedResult : null),
          ]
        );
      }

      await client.query(
        `
          UPDATE test_cases
          SET current_version_id = $1,
              updated_at = NOW()
          WHERE id = $2
        `,
        [versionId, testCaseId]
      );

      await client.query(
        `
          UPDATE test_case_generation_candidates
          SET is_selected = TRUE,
              selected_test_case_id = $1
          WHERE id = $2
        `,
        [testCaseId, candidate.id]
      );

      saved.push({
        id: testCaseId,
        title: candidate.title,
        goal: candidate.goal,
        versionId,
        runtimeConfigId: resolvedRuntimeConfigId,
        candidateId: candidate.id,
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

async function updateTestCase(userId, testCaseId, { title, goal, status }) {
  const result = await pool.query(
    `
      UPDATE test_cases tc
      SET
        title      = COALESCE($3, title),
        goal       = COALESCE($4, goal),
        status     = COALESCE($5, status),
        updated_at = NOW()
      FROM projects p
      WHERE tc.id = $1
        AND tc.project_id = p.id
        AND p.user_id = $2
        AND tc.deleted_at IS NULL
      RETURNING
        tc.id,
        tc.title,
        tc.goal,
        tc.status,
        tc.updated_at AS "updatedAt"
    `,
    [testCaseId, userId, title ?? null, goal ?? null, status ?? null]
  );

  return result.rows[0] || null;
}

async function getTestCaseById(userId, testCaseId) {
  const result = await pool.query(
    `
      SELECT
        tc.id AS "testCaseId",
        tc.id,
        tc.project_id AS "projectId",
        tc.title,
        tc.goal,
        tc.status,
        tc.ai_model AS "aiModel",
        p.name AS suite,
        tcv.id AS "currentVersionId",
        tcv.version_no AS "versionNo",
        tcv.prompt_text AS "promptText",
        tcv.execution_mode AS "executionMode",
        tcv.display_text AS "displayText",
        tcv.plan_snapshot AS "planSnapshot",
        COALESCE(step_stats.step_count, 0) AS "stepCount",
        tc.created_at AS "createdAt",
        tc.updated_at AS "updatedAt"
      FROM test_cases tc
      JOIN projects p ON p.id = tc.project_id
      LEFT JOIN test_case_versions tcv ON tcv.id = tc.current_version_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS step_count
        FROM test_steps ts
        WHERE ts.test_case_version_id = tc.current_version_id
      ) step_stats ON TRUE
      WHERE tc.id = $1 AND p.user_id = $2 AND tc.deleted_at IS NULL
      LIMIT 1
    `,
    [testCaseId, userId]
  );

  const tc = result.rows[0];
  if (!tc) return null;

  // Fetch steps from test_steps table (saved test cases)
  let steps = [];
  if (tc.currentVersionId) {
    const stepsResult = await pool.query(
      `
        SELECT
          id,
          step_order   AS "stepOrder",
          action_type  AS "actionType",
          input_data   AS "inputData",
          expected_result AS "expectedResult"
        FROM test_steps
        WHERE test_case_version_id = $1
        ORDER BY step_order ASC
      `,
      [tc.currentVersionId]
    );
    steps = stepsResult.rows.map((s) => ({
      id: s.id,
      order: s.stepOrder,
      action: s.actionType,
      description: s.inputData?.description || "",
      expectedResult: s.expectedResult || null,
    }));
  }

  // Fallback to planSnapshot if no rows in test_steps
  if (steps.length === 0 && tc.planSnapshot) {
    steps = extractStepsFromPlanSnapshot(tc.planSnapshot);
  }

  return { ...tc, steps };
}

async function getRunsByTestCaseId(testCaseId, limit = 20) {
  const result = await pool.query(
    `
      SELECT
        tr.id,
        tr.test_case_id       AS "testCaseId",
        tr.status,
        tr.verdict,
        tr.started_at         AS "startedAt",
        tr.finished_at        AS "finishedAt",
        tr.created_at         AS "createdAt"
      FROM public.test_runs tr
      WHERE tr.test_case_id = $1
      ORDER BY COALESCE(tr.started_at, tr.created_at) DESC
      LIMIT $2
    `,
    [testCaseId, limit]
  );
  return result.rows;
}

/**
 * Create a new version for an existing test case with refined content.
 * Updates title/goal on the test case and sets current_version_id to the new version.
 */
async function applyRefinement(userId, testCaseId, { title, goal, steps, expectedResult, promptText }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify ownership and get current version info
    const tcResult = await client.query(
      `SELECT tc.id, tc.current_version_id, tcv.version_no, tcv.execution_mode, tcv.runtime_config_id
       FROM test_cases tc
       JOIN projects p ON p.id = tc.project_id
       LEFT JOIN test_case_versions tcv ON tcv.id = tc.current_version_id
       WHERE tc.id = $1 AND p.user_id = $2 AND tc.deleted_at IS NULL
       LIMIT 1`,
      [testCaseId, userId]
    );

    if (!tcResult.rows[0]) throw { status: 404, message: "Test case not found" };

    const tc = tcResult.rows[0];
    const nextVersionNo = (tc.version_no || 0) + 1;

    const planSnapshot = {
      title,
      goal,
      expectedResult: expectedResult || "",
      steps: steps.map((s, i) => ({ order: s.order ?? i + 1, text: s.text, action: s.action || "custom" })),
    };

    // Insert new version
    const versionResult = await client.query(
      `INSERT INTO test_case_versions (
         test_case_id, version_no, source_type, prompt_text,
         plan_snapshot, variables_schema, execution_mode, runtime_config_id
       )
       VALUES ($1, $2, 'user_edited', $3, $4::jsonb, '{}'::jsonb, $5, $6)
       RETURNING id`,
      [
        testCaseId,
        nextVersionNo,
        promptText || "",
        JSON.stringify(planSnapshot),
        tc.execution_mode || "step_based",
        tc.runtime_config_id || null,
      ]
    );

    const newVersionId = versionResult.rows[0].id;

    // Insert steps for new version
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const isLast = i === steps.length - 1;
      await client.query(
        `INSERT INTO test_steps (test_case_version_id, step_order, action_type, input_data, expected_result)
         VALUES ($1, $2, $3, $4::jsonb, $5)`,
        [
          newVersionId,
          step.order ?? i + 1,
          step.action || "custom",
          JSON.stringify({ description: step.text }),
          step.expectedResult || (isLast ? expectedResult || null : null),
        ]
      );
    }

    // Update test case
    await client.query(
      `UPDATE test_cases SET title = $1, goal = $2, current_version_id = $3, updated_at = NOW() WHERE id = $4`,
      [title, goal, newVersionId, testCaseId]
    );

    await client.query("COMMIT");
    return { versionId: newVersionId, versionNo: nextVersionNo };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getExecutionScriptsByTestCaseId(testCaseId) {
  const result = await pool.query(
    `
      SELECT
        es.id,
        es.test_case_id AS "testCaseId",
        es.test_case_version_id AS "testCaseVersionId",
        es.source_test_run_id AS "sourceTestRunId",
        es.source_attempt_id AS "sourceAttemptId",
        es.script_type AS "scriptType",
        es.status,
        es.script_json AS "scriptJson",
        es.params_schema AS "paramsSchema",
        es.metadata_json AS "metadataJson",
        es.created_at AS "createdAt"
      FROM execution_scripts es
      WHERE es.test_case_id = $1
        AND es.status = 'active'
      ORDER BY es.created_at DESC, es.id DESC
    `,
    [testCaseId]
  );

  return result.rows;
}

module.exports = {
  findOwnedProjectById,
  getTestCases,
  getTestCaseById,
  getRunsByTestCaseId,
  getExecutionScriptsByTestCaseId,
  createGenerationBatchWithCandidates,
  saveCandidatesAsTestCases,
  updateTestCase,
  applyRefinement,
};