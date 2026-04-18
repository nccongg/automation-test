import { apiClient } from "@/api/client";

function normalize(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

// ─── Sheets ───────────────────────────────────────────────────────────────────

export async function getTestSheets(projectId) {
  const response = await apiClient.get("/test-suites", { params: { projectId } });
  const data = normalize(response);
  return Array.isArray(data) ? data : [];
}

export async function getTestSheet(sheetId) {
  const response = await apiClient.get(`/test-suites/${sheetId}`);
  return normalize(response);
}

export async function createTestSheet({ projectId, name, description }) {
  const response = await apiClient.post("/test-suites", { projectId, name, description });
  return normalize(response);
}

export async function updateTestSheet(sheetId, { name, description }) {
  const response = await apiClient.put(`/test-suites/${sheetId}`, { name, description });
  return normalize(response);
}

export async function deleteTestSheet(sheetId) {
  await apiClient.delete(`/test-suites/${sheetId}`);
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function addSheetItems(sheetId, testCaseIds) {
  const response = await apiClient.post(`/test-suites/${sheetId}/items`, { testCaseIds });
  return normalize(response);
}

export async function removeSheetItem(sheetId, itemId) {
  await apiClient.delete(`/test-suites/${sheetId}/items/${itemId}`);
}

export async function reorderSheetItems(sheetId, orders) {
  await apiClient.put(`/test-suites/${sheetId}/items/reorder`, { orders });
}

// ─── Run ──────────────────────────────────────────────────────────────────────

export async function runTestSheet(sheetId, testCaseIds) {
  const body = testCaseIds ? { testCaseIds } : {};
  const response = await apiClient.post(`/test-suites/${sheetId}/run`, body);
  return normalize(response);
}

// ─── Suite Runs ───────────────────────────────────────────────────────────────

export async function getSheetRuns(projectId) {
  const response = await apiClient.get("/test-suite-runs", { params: { projectId } });
  const data = normalize(response);
  return Array.isArray(data) ? data : [];
}

export async function getSheetRunDetail(runId) {
  const response = await apiClient.get(`/test-suite-runs/${runId}`);
  return normalize(response);
}
