/**
 * Test Cases API Module
 *
 * Test case management API calls
 */

import { apiClient } from "@/api";

export async function getTestCases(projectId) {
  const params = projectId ? { projectId } : {};
  const response = await apiClient.get("/test-cases", { params });

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;

  return [];
}

export async function getTestCaseById(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}`);
  const raw = response?.data?.data ?? response?.data ?? response ?? null;
  return raw;
}

export async function getTestCaseRuns(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}/runs`);
  const raw = response?.data?.data ?? response?.data ?? response ?? null;
  return Array.isArray(raw) ? raw : [];
}

export async function refineTestCase(testCaseId, prompt) {
  const response = await apiClient.post(`/test-cases/${testCaseId}/refine`, { prompt });
  const raw = response?.data?.data ?? response?.data ?? response ?? null;
  return raw;
}

export async function applyRefinement(testCaseId, { title, goal, steps, expectedResult, promptText }) {
  const response = await apiClient.post(`/test-cases/${testCaseId}/apply-refinement`, {
    title, goal, steps, expectedResult, promptText,
  });
  const raw = response?.data?.data ?? response?.data ?? response ?? null;
  return raw;
}

export async function generateTestCase(promptText, projectId) {
  const response = await apiClient.post("/test-cases/generate", {
    prompt: promptText,
    projectId,
  });

  return response?.data ?? response;
}

export async function updateTestCase(testCaseId, { title, goal, status }) {
  const response = await apiClient.put(`/test-cases/${testCaseId}`, {
    title,
    goal,
    status,
  });
  return response?.data ?? response;
}

export async function saveTestCases({
  projectId,
  batchId,
  candidateIds,
  runtimeConfigId = null,
}) {
  const payload = {
    projectId,
    batchId,
    candidateIds,
    ...(runtimeConfigId ? { runtimeConfigId } : {}),
  };

  const response = await apiClient.post("/test-cases/save", payload);
  return response?.data ?? response;
}