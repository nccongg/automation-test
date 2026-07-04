"use strict";

const { pool } = require("../../config/database");

const SELECT_COLS = `
  id,
  project_id          AS "projectId",
  name,
  page_key            AS "pageKey",
  description,
  selector_method     AS "selectorMethod",
  selector_collection AS "selectorCollection",
  element_properties  AS "elementProperties",
  selected_properties AS "selectedProperties",
  parent_frame_object_id AS "parentFrameObjectId",
  source_url          AS "sourceUrl",
  status,
  created_from_run_id AS "createdFromRunId",
  created_at          AS "createdAt",
  updated_at          AS "updatedAt"
`;

async function findOwnedProject(userId, projectId) {
  const res = await pool.query(
    `SELECT id FROM projects WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [projectId, userId],
  );
  return res.rows[0] || null;
}

async function listObjects(projectId) {
  const res = await pool.query(
    `SELECT ${SELECT_COLS}
     FROM test_objects
     WHERE project_id = $1
     ORDER BY page_key NULLS LAST, name`,
    [projectId],
  );
  return res.rows;
}

async function getObjectById(projectId, id) {
  const res = await pool.query(
    `SELECT ${SELECT_COLS}
     FROM test_objects
     WHERE project_id = $1 AND id = $2
     LIMIT 1`,
    [projectId, id],
  );
  return res.rows[0] || null;
}

async function createObject(projectId, {
  name, pageKey, description,
  selectorMethod, selectorCollection,
  elementProperties, selectedProperties,
  parentFrameObjectId, sourceUrl,
  createdFromRunId, status,
}) {
  const res = await pool.query(
    `INSERT INTO test_objects (
       project_id, name, page_key, description,
       selector_method, selector_collection,
       element_properties, selected_properties,
       parent_frame_object_id, source_url,
       created_from_run_id, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING ${SELECT_COLS}`,
    [
      projectId,
      name,
      pageKey || null,
      description || null,
      selectorMethod || "xpath",
      JSON.stringify(selectorCollection ?? {}),
      JSON.stringify(elementProperties ?? {}),
      JSON.stringify(selectedProperties ?? []),
      parentFrameObjectId || null,
      sourceUrl || null,
      createdFromRunId || null,
      status || "confirmed",
    ],
  );
  return res.rows[0];
}

async function updateObject(projectId, id, {
  name, pageKey, description,
  selectorMethod, selectorCollection,
  elementProperties, selectedProperties,
  status,
}) {
  const res = await pool.query(
    `UPDATE test_objects
     SET
       name                = COALESCE($3, name),
       page_key            = COALESCE($4, page_key),
       description         = COALESCE($5, description),
       selector_method     = COALESCE($6, selector_method),
       selector_collection = COALESCE($7, selector_collection),
       element_properties  = COALESCE($8, element_properties),
       selected_properties = COALESCE($9, selected_properties),
       status              = COALESCE($10, status),
       updated_at          = NOW()
     WHERE project_id = $1 AND id = $2
     RETURNING ${SELECT_COLS}`,
    [
      projectId, id,
      name ?? null,
      pageKey ?? null,
      description ?? null,
      selectorMethod ?? null,
      selectorCollection !== undefined ? JSON.stringify(selectorCollection) : null,
      elementProperties  !== undefined ? JSON.stringify(elementProperties)  : null,
      selectedProperties !== undefined ? JSON.stringify(selectedProperties) : null,
      status ?? null,
    ],
  );
  return res.rows[0] || null;
}

async function deleteObject(projectId, id) {
  const res = await pool.query(
    `DELETE FROM test_objects WHERE project_id = $1 AND id = $2 RETURNING id`,
    [projectId, id],
  );
  return res.rowCount > 0;
}

// Bulk upsert from agent callback — auto-detected objects
async function upsertObjects(projectId, objects) {
  if (!objects || !objects.length) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const obj of objects) {
      const pageKey = obj.pageKey || null;
      const selectorCollection = JSON.stringify(obj.selectorCollection ?? {});
      const runId = obj.createdFromRunId || null;

      // Fix 1: unique index is on (project_id, COALESCE(page_key,''), name)
      // Use the index via a WHERE predicate that matches it exactly
      const existing = await client.query(
        `SELECT id, status FROM test_objects
         WHERE project_id = $1
           AND COALESCE(page_key, '') = COALESCE($2, '')
           AND name = $3
         LIMIT 1`,
        [projectId, pageKey, obj.name],
      );

      let row = existing.rows[0];

      // Same element already stored under another name (e.g. a legacy `_1`
      // duplicate, or naming drift between runs)? Match by selector
      // fingerprint on the same page instead of inserting a duplicate.
      if (!row) {
        const byFingerprint = await client.query(
          `SELECT id, status FROM test_objects
           WHERE project_id = $1
             AND COALESCE(page_key, '') = COALESCE($2, '')
             AND selector_collection = $3::jsonb
           ORDER BY (status = 'confirmed') DESC, id ASC
           LIMIT 1`,
          [projectId, pageKey, selectorCollection],
        );
        row = byFingerprint.rows[0];
      }

      if (!row) {
        // New object — insert as auto
        await client.query(
          `INSERT INTO test_objects (
             project_id, name, page_key,
             selector_method, selector_collection,
             element_properties, selected_properties,
             source_url, created_from_run_id,
             last_seen_run_id, last_seen_at,
             status, created_by, updated_by
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,NOW(),'auto','agent','agent')`,
          [
            projectId, obj.name, pageKey,
            obj.selectorMethod || "xpath",
            selectorCollection,
            JSON.stringify(obj.elementProperties  ?? {}),
            JSON.stringify(obj.selectedProperties ?? []),
            obj.sourceUrl || null,
            runId,
          ],
        );
      } else {
        if (row.status === "auto") {
          // Auto object → update locators freely
          await client.query(
            `UPDATE test_objects SET
               selector_method     = $3,
               selector_collection = $4,
               element_properties  = $5,
               selected_properties = $6,
               source_url          = $7,
               last_seen_run_id    = $8,
               last_seen_at        = NOW(),
               updated_by          = 'agent',
               updated_at          = NOW()
             WHERE id = $1 AND project_id = $2`,
            [
              row.id, projectId,
              obj.selectorMethod || "xpath",
              selectorCollection,
              JSON.stringify(obj.elementProperties  ?? {}),
              JSON.stringify(obj.selectedProperties ?? []),
              obj.sourceUrl || null,
              runId,
            ],
          );
        } else {
          // Fix 5: confirmed → don't overwrite, save as candidate for user review
          await client.query(
            `UPDATE test_objects
             SET last_seen_run_id = $2, last_seen_at = NOW()
             WHERE id = $1`,
            [row.id, runId],
          );
          await client.query(
            `INSERT INTO test_object_candidates
               (object_id, test_run_id, selector_collection)
             VALUES ($1, $2, $3)`,
            [row.id, runId, selectorCollection],
          );
        }
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function confirmObject(projectId, id) {
  const res = await pool.query(
    `UPDATE test_objects
     SET status = 'confirmed', updated_by = 'user', updated_at = NOW()
     WHERE project_id = $1 AND id = $2
     RETURNING ${SELECT_COLS}`,
    [projectId, id],
  );
  return res.rows[0] || null;
}

async function listCandidates(projectId, objectId) {
  const res = await pool.query(
    `SELECT c.id, c.object_id AS "objectId", c.test_run_id AS "testRunId",
            c.selector_collection AS "selectorCollection", c.detected_at AS "detectedAt"
     FROM test_object_candidates c
     JOIN test_objects o ON o.id = c.object_id
     WHERE o.project_id = $1 AND c.object_id = $2
     ORDER BY c.detected_at DESC`,
    [projectId, objectId],
  );
  return res.rows;
}

async function acceptCandidate(projectId, objectId, candidateId) {
  const cRes = await pool.query(
    `SELECT c.selector_collection FROM test_object_candidates c
     JOIN test_objects o ON o.id = c.object_id
     WHERE o.project_id = $1 AND c.object_id = $2 AND c.id = $3 LIMIT 1`,
    [projectId, objectId, candidateId],
  );
  if (!cRes.rows[0]) return null;

  const col = cRes.rows[0].selector_collection;
  // Pick primary: first key in the candidate collection
  const newPrimary = Object.keys(col)[0] || "xpath";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const objRes = await client.query(
      `UPDATE test_objects
       SET selector_collection = $3,
           selector_method     = $4,
           updated_by          = 'user',
           updated_at          = NOW()
       WHERE project_id = $1 AND id = $2
       RETURNING ${SELECT_COLS}`,
      [projectId, objectId, JSON.stringify(col), newPrimary],
    );
    await client.query(
      `DELETE FROM test_object_candidates WHERE id = $1`,
      [candidateId],
    );
    await client.query("COMMIT");
    return objRes.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function dismissCandidate(projectId, objectId, candidateId) {
  const res = await pool.query(
    `DELETE FROM test_object_candidates c
     USING test_objects o
     WHERE o.id = c.object_id
       AND o.project_id = $1
       AND c.object_id  = $2
       AND c.id         = $3
     RETURNING c.id`,
    [projectId, objectId, candidateId],
  );
  return res.rowCount > 0;
}

// Batch fetch objects by (pageKey, name) refs — used to resolve objectRefs before replay
async function findObjectsByRefs(projectId, refs) {
  if (!refs || !refs.length) return {};

  // Build a map keyed by "pageKey||name" for O(1) lookup
  const rows = await pool.query(
    `SELECT name, page_key AS "pageKey",
            selector_method AS "selectorMethod",
            selector_collection AS "selectorCollection"
     FROM test_objects
     WHERE project_id = $1
       AND (COALESCE(page_key, ''), name) IN (
         SELECT * FROM unnest($2::text[], $3::text[])
       )`,
    [
      projectId,
      refs.map((r) => r.pageKey || ""),
      refs.map((r) => r.name),
    ],
  );

  const map = {};
  for (const row of rows.rows) {
    map[`${row.pageKey || ""}||${row.name}`] = row;
  }
  return map;
}

module.exports = {
  findOwnedProject, listObjects, getObjectById,
  createObject, updateObject, deleteObject,
  confirmObject, listCandidates, acceptCandidate, dismissCandidate,
  upsertObjects, findObjectsByRefs,
};
