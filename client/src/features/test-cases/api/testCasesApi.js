/**
 * Test Cases API Module
 *
 * Test case management API calls
 * Currently uses mock data - replace with real API when ready
 */

import { apiClient } from "@/api";

export async function getTestCases(projectId) {
  const params = projectId ? { projectId } : {};
  const response = await apiClient.get("/test-cases", { params });
  return response.data;
}

export async function getTestCaseById(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}`);
  return response.data;
}

export async function generateTestCase(promptText) {
  const response = await apiClient.post("/test-cases/generate", {
    prompt: promptText,
  });

  return response.data;
}

export async function saveTestCases({ projectId, promptText, testCases }) {
  const response = await apiClient.post("/test-cases/save", {
    projectId,
    promptText,
    testCases,
  });

  return response.data;
}
