
import { apiClient } from './client';

export const getProjectTestCases = async (projectId) => {
  const { data } = await client.get(`/test-cases/project/${projectId}`);
  return data;
};

export const getTestCaseScripts = async (testCaseId) => {
  const { data } = await client.get(`/test-cases/${testCaseId}/scripts`);
  return data;
};