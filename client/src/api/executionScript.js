import { apiClient } from "@/api/client";

function normalizeApiPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

export const executionScriptApi = {
  async getByTestCase(testCaseId) {
    const response = await apiClient.get(`/test-cases/${testCaseId}/scripts`);
    const payload = normalizeApiPayload(response);
    return Array.isArray(payload) ? payload : [];
  },

  async getById(scriptId) {
    const response = await apiClient.get(`/execution-scripts/${scriptId}`);
    return normalizeApiPayload(response);
  },

  async replay({
    testCaseId,
    testCaseVersionId = null,
    runtimeConfigId = null,
    browserProfileId = null,
    executionScriptId,
    datasetId = null,
    datasetAlias = null,
    rowIndex = null,
    rowKey = null,
    params = {},
    triggeredBy = null,
    sourceRunId = null,
  }) {
    const response = await apiClient.post("/test-runs/replay", {
      sourceRunId,
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      executionScriptId,
      datasetId,
      datasetAlias,
      rowIndex,
      rowKey,
      params,
      triggeredBy,
    });

    return normalizeApiPayload(response);
  },
};

export const getExecutionScriptsByTestCase = (testCaseId) =>
  executionScriptApi.getByTestCase(testCaseId);

export const getExecutionScriptById = (scriptId) =>
  executionScriptApi.getById(scriptId);

export const replayExecutionScript = (payload) =>
  executionScriptApi.replay(payload);