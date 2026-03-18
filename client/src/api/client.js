/**
 * api/client.js — Base HTTP client
 *
 * Wrapper mỏng quanh fetch với:
 *   - Base URL tự động
 *   - Content-Type: application/json mặc định
 *   - Tự throw Error khi response không ok (kèm message từ server)
 *   - Token auth header tự động nếu có trong localStorage
 */

const BASE_URL = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

export const apiClient = {
  get: (path, options) => request(path, { method: "GET", ...options }),
  post: (path, body, options) =>
    request(path, { method: "POST", body: JSON.stringify(body), ...options }),
  put: (path, body, options) =>
    request(path, { method: "PUT", body: JSON.stringify(body), ...options }),
  del: (path, options) => request(path, { method: "DELETE", ...options }),
};
