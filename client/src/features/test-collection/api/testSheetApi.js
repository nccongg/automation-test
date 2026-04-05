import { apiClient } from "@/api";

function normalize(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

// ─── Sheets ───────────────────────────────────────────────────────────────────

export async function getTestSheets(projectId) {
  const response = await apiClient.get("/test-sheets", { params: { projectId } });
  const data = normalize(response);
  return Array.isArray(data) ? data : [];
}

export async function getTestSheet(sheetId) {
  const response = await apiClient.get(`/test-sheets/${sheetId}`);
  return normalize(response);
}

export async function createTestSheet({ projectId, name, description }) {
  const response = await apiClient.post("/test-sheets", { projectId, name, description });
  return normalize(response);
}

export async function updateTestSheet(sheetId, { name, description }) {
  const response = await apiClient.put(`/test-sheets/${sheetId}`, { name, description });
  return normalize(response);
}

export async function deleteTestSheet(sheetId) {
  await apiClient.delete(`/test-sheets/${sheetId}`);
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function addSheetItems(sheetId, testCaseIds) {
  const response = await apiClient.post(`/test-sheets/${sheetId}/items`, { testCaseIds });
  return normalize(response);
}

export async function removeSheetItem(sheetId, itemId) {
  await apiClient.delete(`/test-sheets/${sheetId}/items/${itemId}`);
}

export async function reorderSheetItems(sheetId, orders) {
  await apiClient.put(`/test-sheets/${sheetId}/items/reorder`, { orders });
}

// ─── Run ──────────────────────────────────────────────────────────────────────

export async function runTestSheet(sheetId) {
  const response = await apiClient.post(`/test-sheets/${sheetId}/run`);
  return normalize(response);
}

// ─── Sheet Runs ───────────────────────────────────────────────────────────────

export async function getSheetRuns(projectId) {
  const response = await apiClient.get("/test-sheet-runs", { params: { projectId } });
  const data = normalize(response);
  return Array.isArray(data) ? data : [];
}

export async function getSheetRunDetail(runId) {
  const response = await apiClient.get(`/test-sheet-runs/${runId}`);
  return normalize(response);
}
