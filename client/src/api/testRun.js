import { apiClient } from "@/api/client";

export const testCasesApi = {
  async getTestCases(projectId) {
    const res = await apiClient.get(`/test-cases/project/${projectId}`);
    return res?.data || [];
  },

  async getTestCaseScripts(testCaseId) {
    const res = await apiClient.get(`/test-cases/${testCaseId}/scripts`);
    return res?.data || [];
  },
};

export const getTestCases = (projectId) => testCasesApi.getTestCases(projectId);
export const getTestCaseScripts = (testCaseId) =>
  testCasesApi.getTestCaseScripts(testCaseId);