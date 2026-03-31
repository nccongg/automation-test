/**
 * Base HTTP Client
 * 
 * Wrapper around fetch with:
 * - Automatic base URL configuration
 * - Content-Type: application/json by default
 * - Auto-throws Error on non-ok response with server message
 * - Automatic token auth from localStorage
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Makes an HTTP request with automatic headers and error handling
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 * @throws {Error} On non-ok response
 */
async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const { params, ...fetchOptions } = options;

  let url = `${BASE_URL}${path}`;
  if (params && Object.keys(params).length > 0) {
    url = `${url}?${new URLSearchParams(params).toString()}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  };

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !path.startsWith('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Redirecting to login.');
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (error) {
    // Re-throw with more context
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to reach the server');
    }
    throw error;
  }
}

export const apiClient = {
  /**
   * GET request
   * @param {string} path - Endpoint path
   * @param {Object} options - Additional options
   */
  get: (path, options) => request(path, { method: 'GET', ...options }),

  /**
   * POST request
   * @param {string} path - Endpoint path
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   */
  post: (path, body, options) =>
    request(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  /**
   * PUT request
   * @param {string} path - Endpoint path
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   */
  put: (path, body, options) =>
    request(path, { method: 'PUT', body: JSON.stringify(body), ...options }),

  /**
   * DELETE request
   * @param {string} path - Endpoint path
   * @param {Object} options - Additional options
   */
  del: (path, options) => request(path, { method: 'DELETE', ...options }),
};
