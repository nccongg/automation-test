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
  return response?.data ?? response ?? null;
}

export async function generateTestCase(promptText, projectId) {
  const response = await apiClient.post("/test-cases/generate", {
    prompt: promptText,
    projectId,
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