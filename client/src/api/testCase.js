import { apiClient } from "@/api/client";

function normalizeApiPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

export const testCaseApi = {
  async getProjectTestCases(projectId) {
    const response = await apiClient.get("/test-cases", {
      params: { projectId },
    });
    const payload = normalizeApiPayload(response);
    return Array.isArray(payload) ? payload : [];
  },

  async getTestCases(projectId) {
    return this.getProjectTestCases(projectId);
  },

  async getTestCaseScripts(testCaseId) {
    if (!testCaseId) return [];
    const response = await apiClient.get(`/test-cases/${testCaseId}/scripts`);
    const payload = normalizeApiPayload(response);
    return Array.isArray(payload) ? payload : [];
  },
};

export const getProjectTestCases = (projectId) =>
  testCaseApi.getProjectTestCases(projectId);

export const getTestCases = (projectId) =>
  testCaseApi.getTestCases(projectId);

export const getTestCaseScripts = (testCaseId) =>
  testCaseApi.getTestCaseScripts(testCaseId);