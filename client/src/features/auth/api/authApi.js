/**
 * Authentication API Module
 * 
 * All authentication-related HTTP calls
 * Replace mock implementation with real API when backend is ready
 */

import { apiClient } from '@/api/client';

export const authApi = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data: {token: string, user: object}}>}
   */
  login(email, password) {
    return apiClient.post('/auth/login', { email, password });
  },

  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} name - User full name
   * @param {string} password - User password
   * @returns {Promise<{data: {user: object}}>}
   */
  register(email, name, password) {
    return apiClient.post('/auth/register', { email, name, password });
  },

  /**
   * Request password reset email
   * @param {string} email - User email
   * @returns {Promise<{message: string}>}
   */
  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Verify OTP/verification code
   * @param {string} code - Verification code
   * @returns {Promise<{data: {resetToken: string}}>}
   */
  verifyCode(code) {
    return apiClient.post('/auth/verify-code', { code });
  },

  /**
   * Reset password with token
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<{message: string}>}
   */
  resetPassword(resetToken, newPassword) {
    return apiClient.post('/auth/reset-password', { resetToken, newPassword });
  },

  /**
   * Get current user profile
   * @returns {Promise<{data: {user: object}}>}
   */
  getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  /**
   * Logout user (client-side only for now)
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
