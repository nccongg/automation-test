"use strict";

const { pool } = require("../../config/database");

// ─── Collections ─────────────────────────────────────────────────────────────

async function createCollection({ projectId, name, description, color, createdBy }) {
  const result = await pool.query(
    `INSERT INTO test_collections (project_id, name, description, color, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, project_id AS "projectId", name, description, color,
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [projectId, name, description || null, color || "indigo", createdBy]
  );
  return result.rows[0];
}

async function findCollectionsByProject(projectId) {
  const result = await pool.query(
    `SELECT
       tc.id,
       tc.project_id AS "projectId",
       tc.name,
       tc.description,
       tc.color,
       tc.created_at AS "createdAt",
       tc.updated_at AS "updatedAt",
       COUNT(tci.id)::int AS "itemCount"
     FROM test_collections tc
     LEFT JOIN test_collection_items tci ON tci.collection_id = tc.id
     WHERE tc.project_id = $1 AND tc.deleted_at IS NULL
     GROUP BY tc.id
     ORDER BY tc.updated_at DESC`,
    [projectId]
  );
  return result.rows;
}

async function findCollectionWithOwner(collectionId, userId) {
  const result = await pool.query(
    `SELECT tc.id, tc.project_id AS "projectId", tc.name, tc.description, tc.color
     FROM test_collections tc
     JOIN projects p ON p.id = tc.project_id
     WHERE tc.id = $1 AND tc.deleted_at IS NULL AND p.user_id = $2
     LIMIT 1`,
    [collectionId, userId]
  );
  return result.rows[0] || null;
}

async function updateCollection(collectionId, { name, description, color }) {
  const result = await pool.query(
    `UPDATE test_collections
     SET name        = COALESCE($2, name),
         description = COALESCE($3, description),
         color       = COALESCE($4, color),
         updated_at  = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, project_id AS "projectId", name, description, color, updated_at AS "updatedAt"`,
    [collectionId, name || null, description !== undefined ? description : null, color || null]
  );
  return result.rows[0] || null;
}

async function softDeleteCollection(collectionId) {
  await pool.query(
    `UPDATE test_collections SET deleted_at = NOW() WHERE id = $1`,
    [collectionId]
  );
}

// ─── Collection Items ─────────────────────────────────────────────────────────

async function findItemsByCollection(collectionId) {
  const result = await pool.query(
    `SELECT
       tci.id,
       tci.collection_id AS "collectionId",
       tci.test_case_id AS "testCaseId",
       tci.added_at AS "addedAt",
       tc.title,
       tc.goal,
       tc.status
     FROM test_collection_items tci
     JOIN test_cases tc ON tc.id = tci.test_case_id
     WHERE tci.collection_id = $1 AND tc.deleted_at IS NULL
     ORDER BY tci.added_at ASC`,
    [collectionId]
  );
  return result.rows;
}

async function addItemsToCollection(collectionId, testCaseIds) {
  const inserted = [];
  for (const tcId of testCaseIds) {
    const r = await pool.query(
      `INSERT INTO test_collection_items (collection_id, test_case_id)
       VALUES ($1, $2)
       ON CONFLICT (collection_id, test_case_id) DO NOTHING
       RETURNING id, test_case_id AS "testCaseId", added_at AS "addedAt"`,
      [collectionId, tcId]
    );
    if (r.rows[0]) inserted.push(r.rows[0]);
  }
  await pool.query(
    `UPDATE test_collections SET updated_at = NOW() WHERE id = $1`,
    [collectionId]
  );
  return inserted;
}

async function removeItemFromCollection(collectionId, itemId) {
  const result = await pool.query(
    `DELETE FROM test_collection_items WHERE id = $1 AND collection_id = $2 RETURNING id`,
    [itemId, collectionId]
  );
  return result.rowCount > 0;
}

// ─── Utility: collections a test case belongs to ─────────────────────────────

async function findCollectionsByTestCase(testCaseId, projectId) {
  const result = await pool.query(
    `SELECT tc.id, tc.name, tc.color
     FROM test_collections tc
     JOIN test_collection_items tci ON tci.collection_id = tc.id
     WHERE tci.test_case_id = $1 AND tc.project_id = $2 AND tc.deleted_at IS NULL
     ORDER BY tc.name ASC`,
    [testCaseId, projectId]
  );
  return result.rows;
}

module.exports = {
  createCollection,
  findCollectionsByProject,
  findCollectionWithOwner,
  updateCollection,
  softDeleteCollection,
  findItemsByCollection,
  addItemsToCollection,
  removeItemFromCollection,
  findCollectionsByTestCase,
};
