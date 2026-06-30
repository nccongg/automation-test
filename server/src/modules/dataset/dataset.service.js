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

async function generateDatasetWithAI({ projectId, prompt, rowCount, scriptSteps, goal, initialRow }) {
  if (!prompt?.trim()) throw { status: 400, message: "prompt is required" };
  if (!projectId) throw { status: 400, message: "projectId is required" };

  const { generateDataset, DEFAULT_PROVIDER, DEFAULT_MODEL } = require("../llm/llm.service");
  const startedAt = new Date();
  let success = true;
  let errorMessage = null;
  let result;

  try {
    result = await generateDataset({
      goal: goal || "",
      scriptSteps: Array.isArray(scriptSteps) ? scriptSteps : [],
      userPrompt: prompt.trim(),
      rowCount: Math.min(Math.max(parseInt(rowCount) || 5, 1), 50),
      initialRow: (initialRow && typeof initialRow === "object" && !Array.isArray(initialRow)) ? initialRow : null,
    });
  } catch (err) {
    success = false;
    errorMessage = err?.message || String(err);
    throw err;
  } finally {
    const finishedAt = new Date();
    const durationMs = finishedAt - startedAt;
    repo.insertGenerationLog({
      projectId,
      prompt: prompt.trim(),
      rowCount: Math.min(Math.max(parseInt(rowCount) || 5, 1), 50),
      llmProvider: DEFAULT_PROVIDER,
      llmModel: DEFAULT_MODEL,
      startedAt,
      finishedAt,
      durationMs,
      success,
      errorMessage,
      inputTokens: result?.inputTokens ?? null,
      outputTokens: result?.outputTokens ?? null,
    }).catch(() => {});
  }

  return result;
}

module.exports = { listDatasets, getDataset, createDataset, updateDataset, deleteDataset, generateDatasetWithAI };
