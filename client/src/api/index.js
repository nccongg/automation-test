/**
 * api/index.js — Central export for all API modules.
 * Import from '@/api' instead of individual files.
 *
 * Example:
 *   import { authApi } from '@/api';
 */

export { apiClient } from "./client";
export { authApi } from "./auth";
