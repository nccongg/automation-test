/**
 * Test Cases API Module
 *
 * Test case management API calls
 */

import { apiClient } from "@/api/client";

function normalizeApiPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

export async function getTestCases(projectId) {
  const params = projectId ? { projectId } : {};
  const response = await apiClient.get("/test-cases", { params });
  const raw = normalizeApiPayload(response);
  return Array.isArray(raw) ? raw : [];
}

export async function getTestCaseById(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}`);
  return normalizeApiPayload(response);
}

export async function getTestCaseRuns(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}/runs`);
  const raw = normalizeApiPayload(response);
  return Array.isArray(raw) ? raw : [];
}

export async function getTestCaseScripts(testCaseId) {
  const response = await apiClient.get(`/test-cases/${testCaseId}/scripts`);
  const raw = normalizeApiPayload(response);
  return Array.isArray(raw) ? raw : [];
}

export async function refineTestCase(testCaseId, prompt) {
  const response = await apiClient.post(`/test-cases/${testCaseId}/refine`, {
    prompt,
  });
  return normalizeApiPayload(response);
}

export async function applyRefinement(
  testCaseId,
  { title, goal, steps, expectedResult, promptText },
) {
  const response = await apiClient.post(
    `/test-cases/${testCaseId}/apply-refinement`,
    {
      title,
      goal,
      steps,
      expectedResult,
      promptText,
    },
  );
  return normalizeApiPayload(response);
}

export async function generateTestCase(promptText, projectId) {
  const response = await apiClient.post("/test-cases/generate", {
    prompt: promptText,
    projectId,
  });

  return normalizeApiPayload(response);
}

export async function updateTestCase(testCaseId, { title, goal, status }) {
  const response = await apiClient.put(`/test-cases/${testCaseId}`, {
    title,
    goal,
    status,
  });
  return normalizeApiPayload(response);
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
  return normalizeApiPayload(response);
}