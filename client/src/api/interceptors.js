/**
 * Request/Response Interceptors
 * 
 * Central place for:
 * - Request transformation (adding headers, logging)
 * - Response error handling (401 redirect, error messages)
 */

import { apiClient } from './client';

/**
 * Handle 401 Unauthorized errors
 * Redirect to login page and clear stored credentials
 */
function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

/**
 * Global error handler for API calls
 * @param {Error} error - The error to handle
 * @throws {Error} Re-throws the error after handling
 */
export function handleApiError(error) {
  console.error('[API Error]', error);
  
  // Handle 401 errors
  if (error.message?.includes('401')) {
    handleUnauthorized();
  }
  
  throw error;
}

/**
 * Enhanced API client with interceptors
 * Use this instead of raw apiClient for production code
 */
export const apiWithInterceptors = {
  get: async (path, options) => {
    try {
      return await apiClient.get(path, options);
    } catch (error) {
      handleApiError(error);
    }
  },
  
  post: async (path, body, options) => {
    try {
      return await apiClient.post(path, body, options);
    } catch (error) {
      handleApiError(error);
    }
  },
  
  put: async (path, body, options) => {
    try {
      return await apiClient.put(path, body, options);
    } catch (error) {
      handleApiError(error);
    }
  },
  
  del: async (path, options) => {
    try {
      return await apiClient.del(path, options);
    } catch (error) {
      handleApiError(error);
    }
  },
};
