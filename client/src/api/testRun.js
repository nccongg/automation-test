import { apiClient } from "./client";

function normalizeApiPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

export const testRunApi = {
  async getRecentTestRuns(projectId = null) {
    const response = await apiClient.get("/test-runs", {
      params: projectId ? { projectId } : {},
    });
    return normalizeApiPayload(response);
  },

  async getTestRunDetail(runId) {
    const response = await apiClient.get(`/test-runs/${runId}`);
    return normalizeApiPayload(response);
  },

  async createTestRun({
    testCaseId,
    testCaseVersionId = null,
    runtimeConfigId = null,
    browserProfileId = null,
    datasetId = null,
    datasetAlias = null,
    rowIndex = null,
    rowKey = null,
    paramsOverride = {},
    triggeredBy = null,
  }) {
    const response = await apiClient.post("/test-runs", {
      testCaseId,
      testCaseVersionId,
      runtimeConfigId,
      browserProfileId,
      datasetId,
      datasetAlias,
      rowIndex,
      rowKey,
      paramsOverride,
      triggeredBy,
    });

    return normalizeApiPayload(response);
  },

  async replayTestRun({
    sourceRunId = null,
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

  async analyzeTestRun(runId) {
    const response = await apiClient.post(`/test-runs/${runId}/analyze`);
    return normalizeApiPayload(response);
  },
};

export const getRecentTestRuns = (projectId = null) =>
  testRunApi.getRecentTestRuns(projectId);

export const getTestRunDetail = (runId) =>
  testRunApi.getTestRunDetail(runId);

export const createTestRun = (payload) =>
  testRunApi.createTestRun(payload);

export const replayTestRun = (payload) =>
  testRunApi.replayTestRun(payload);

export const analyzeTestRun = (runId) =>
  testRunApi.analyzeTestRun(runId);