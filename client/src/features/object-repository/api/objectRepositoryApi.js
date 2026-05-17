import { apiClient } from "@/api/client";

function normalize(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

export async function getTestObjects(projectId) {
  const res = await apiClient.get(`/projects/${projectId}/test-objects`);
  const raw = normalize(res);
  return Array.isArray(raw) ? raw : [];
}

export async function getTestObjectById(projectId, id) {
  const res = await apiClient.get(`/projects/${projectId}/test-objects/${id}`);
  return normalize(res);
}

export async function createTestObject(projectId, payload) {
  const res = await apiClient.post(`/projects/${projectId}/test-objects`, payload);
  return normalize(res);
}

export async function updateTestObject(projectId, id, payload) {
  const res = await apiClient.put(`/projects/${projectId}/test-objects/${id}`, payload);
  return normalize(res);
}

export async function deleteTestObject(projectId, id) {
  await apiClient.delete(`/projects/${projectId}/test-objects/${id}`);
}

export async function confirmTestObject(projectId, id) {
  const res = await apiClient.patch(`/projects/${projectId}/test-objects/${id}/confirm`);
  return normalize(res);
}

export async function getCandidates(projectId, objectId) {
  const res = await apiClient.get(`/projects/${projectId}/test-objects/${objectId}/candidates`);
  const raw = normalize(res);
  return Array.isArray(raw) ? raw : [];
}

export async function acceptCandidate(projectId, objectId, candidateId) {
  const res = await apiClient.post(`/projects/${projectId}/test-objects/${objectId}/candidates/${candidateId}/accept`);
  return normalize(res);
}

export async function dismissCandidate(projectId, objectId, candidateId) {
  await apiClient.delete(`/projects/${projectId}/test-objects/${objectId}/candidates/${candidateId}`);
}
