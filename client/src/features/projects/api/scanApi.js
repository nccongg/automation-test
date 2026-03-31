import { apiClient } from "@/api/client";

/**
 * Trigger a new crawl scan for the given project.
 * Returns immediately with the scan (status = 'queued').
 * @param {number} projectId
 * @returns {Promise<{id: number, status: string, rootUrl: string}>}
 */
export async function triggerScan(projectId) {
  const response = await apiClient.post(`/scans/projects/${projectId}/trigger`);
  return response.data?.data || response.data;
}

/**
 * Poll the status of a specific scan.
 * @param {number} scanId
 * @returns {Promise<{id: number, status: string, pagesFound: number, finishedAt: string|null}>}
 */
export async function getScanById(scanId) {
  const response = await apiClient.get(`/scans/${scanId}`);
  return response.data?.data || response.data;
}

/**
 * Cancel an in-progress scan.
 * @param {number} scanId
 * @returns {Promise<object>}
 */
export async function cancelScan(scanId) {
  const response = await apiClient.post(`/scans/${scanId}/cancel`);
  return response.data?.data || response.data;
}

/**
 * Get the latest scan (any status) for a project.
 * @param {number} projectId
 * @returns {Promise<object|null>}
 */
export async function getLatestScan(projectId) {
  const response = await apiClient.get(`/scans/projects/${projectId}/latest`);
  return response.data?.data || response.data;
}
