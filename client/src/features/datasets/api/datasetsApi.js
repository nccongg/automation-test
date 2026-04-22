import { apiClient } from "@/api/client";

function normalize(res) {
  return res?.data?.data ?? res?.data ?? null;
}

export async function listDatasets(projectId) {
  const res = await apiClient.get("/datasets", { params: { projectId } });
  return normalize(res) ?? [];
}

export async function getDataset(id, projectId) {
  const res = await apiClient.get(`/datasets/${id}`, { params: { projectId } });
  return normalize(res);
}

export async function createDataset({ projectId, name, description = "" }) {
  const res = await apiClient.post("/datasets", { projectId, name, description });
  return normalize(res);
}

export async function updateDataset({ id, projectId, name, description, rows }) {
  const res = await apiClient.put(`/datasets/${id}`, { projectId, name, description, rows });
  return normalize(res);
}

export async function deleteDataset(id, projectId) {
  await apiClient.delete(`/datasets/${id}`, { params: { projectId } });
}
