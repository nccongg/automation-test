import { apiClient } from "./client";

export const getProjectTestCases = async (projectId) => {
  const response = await apiClient.get("/test-cases", {
    params: { projectId },
  });

  return response.data?.data ?? response.data ?? [];
};

export const getTestCaseScripts = async () => {
  throw new Error("getTestCaseScripts is not implemented in backend yet.");
};