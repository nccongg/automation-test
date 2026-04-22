"use strict";

const { query } = require("../../config/database");

async function listByProject(projectId) {
  const sql = `
    SELECT id, name, description, data_mode, data_json, created_at, updated_at
    FROM public.test_datasets
    WHERE project_id = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC
  `;
  const result = await query(sql, [projectId]);
  return result.rows;
}

async function findById(id) {
  const sql = `
    SELECT id, project_id, name, description, data_mode, data_json, created_at, updated_at
    FROM public.test_datasets
    WHERE id = $1 AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

async function create({ projectId, name, description = "", createdBy }) {
  const sql = `
    INSERT INTO public.test_datasets
      (project_id, name, description, data_mode, data_json, created_by)
    VALUES ($1, $2, $3, 'static_json', '[]'::jsonb, $4)
    RETURNING id, name, description, data_mode, data_json, created_at
  `;
  const result = await query(sql, [projectId, name, description, createdBy]);
  return result.rows[0];
}

async function update({ id, name, description, dataJson }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined)        { fields.push(`name = $${idx++}`);        values.push(name); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
  if (dataJson !== undefined)    { fields.push(`data_json = $${idx++}`);   values.push(JSON.stringify(dataJson)); }

  if (!fields.length) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const sql = `
    UPDATE public.test_datasets
    SET ${fields.join(", ")}
    WHERE id = $${idx} AND deleted_at IS NULL
    RETURNING id, name, description, data_mode, data_json, created_at, updated_at
  `;
  const result = await query(sql, values);
  return result.rows[0] || null;
}

async function softDelete(id) {
  const sql = `
    UPDATE public.test_datasets
    SET deleted_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
  `;
  await query(sql, [id]);
}

module.exports = { listByProject, findById, create, update, softDelete };
