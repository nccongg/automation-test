"use strict";

const repo = require("./dataset.repository");

async function listDatasets(projectId) {
  const rows = await repo.listByProject(projectId);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    rowCount: Array.isArray(r.data_json) ? r.data_json.length : 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

async function getDataset(id, projectId) {
  const row = await repo.findById(id);
  if (!row) throw new Error("Dataset not found");
  if (String(row.project_id) !== String(projectId))
    throw new Error("Dataset does not belong to this project");
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    rows: Array.isArray(row.data_json) ? row.data_json : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createDataset({ projectId, name, description, createdBy }) {
  if (!name?.trim()) throw new Error("Dataset name is required");
  const row = await repo.create({ projectId, name: name.trim(), description, createdBy });
  return { id: row.id, name: row.name, description: row.description, rows: [], createdAt: row.created_at };
}

async function updateDataset({ id, projectId, name, description, rows }) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Dataset not found");
  if (String(existing.project_id) !== String(projectId))
    throw new Error("Dataset does not belong to this project");

  const updated = await repo.update({
    id,
    name,
    description,
    dataJson: rows,
  });
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    rows: Array.isArray(updated.data_json) ? updated.data_json : [],
    updatedAt: updated.updated_at,
  };
}

async function deleteDataset(id, projectId) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Dataset not found");
  if (String(existing.project_id) !== String(projectId))
    throw new Error("Dataset does not belong to this project");
  await repo.softDelete(id);
}

module.exports = { listDatasets, getDataset, createDataset, updateDataset, deleteDataset };
