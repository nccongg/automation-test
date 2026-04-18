import { apiClient } from "@/api/client";

function normalize(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getCollections(projectId) {
  const response = await apiClient.get("/test-collections", { params: { projectId } });
  const data = normalize(response);
  return Array.isArray(data) ? data : [];
}

export async function getCollection(collectionId) {
  const response = await apiClient.get(`/test-collections/${collectionId}`);
  return normalize(response);
}

export async function createCollection({ projectId, name, description, color }) {
  const response = await apiClient.post("/test-collections", { projectId, name, description, color });
  return normalize(response);
}

export async function updateCollection(collectionId, { name, description, color }) {
  const response = await apiClient.put(`/test-collections/${collectionId}`, { name, description, color });
  return normalize(response);
}

export async function deleteCollection(collectionId) {
  await apiClient.delete(`/test-collections/${collectionId}`);
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function addCollectionItems(collectionId, testCaseIds) {
  const response = await apiClient.post(`/test-collections/${collectionId}/items`, { testCaseIds });
  return normalize(response);
}

export async function removeCollectionItem(collectionId, itemId) {
  await apiClient.delete(`/test-collections/${collectionId}/items/${itemId}`);
}
