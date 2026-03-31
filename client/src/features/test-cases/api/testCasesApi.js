/**
 * Test Cases API Module
 *
 * Test case management API calls
 */

import { apiClient } from "@/api";

export async function getTestCases(projectId) {
  const params = projectId ? { projectId } : {};
  const response = await apiClient.get("/test-cases", { params });

  // Backend trả { status: "ok", data: [...] }
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;

  return [];
}

export async function getTestCaseById(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}`);
  return response.data?.data ?? response.data ?? null;
}

export async function generateTestCase(promptText, projectId = null) {
  const response = await apiClient.post("/test-cases/generate", {
    prompt: promptText,
    ...(projectId ? { projectId } : {}),
  });

  return response.data?.data ?? response.data ?? [];
}

export async function saveTestCases({ projectId, promptText, testCases }) {
  const response = await apiClient.post("/test-cases/save", {
    projectId,
    promptText,
    testCases,
  });

  return response.data?.data ?? response.data ?? [];
}