/**
 * Authentication Hooks
 * 
 * Custom hooks for authentication business logic
 * Separated from UI components for better testability and reusability
 */

import { useState } from 'react';
import { authApi } from '../api/authApi';

// ── useLogin ──────────────────────────────────────────────────────────────────

const LOGIN_INITIAL = { email: '', password: '', rememberMe: false };

/**
 * Login form hook
 * Manages form state, validation, submission, and error handling
 * 
 * @returns {Object} Login form state and handlers
 * @returns {Object} return.formData - Current form values
 * @returns {string} return.error - Error message if any
 * @returns {boolean} return.isLoading - Loading state
 * @returns {Function} return.handleChange - Field change handler
 * @returns {Function} return.handleSubmit - Form submit handler
 */
export function useLogin() {
  const [formData, setFormData] = useState(LOGIN_INITIAL);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authApi.login(formData.email, formData.password);
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, error, isLoading, handleChange, handleSubmit };
}

// ── useSignup ─────────────────────────────────────────────────────────────────

const SIGNUP_INITIAL = {
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
};

/**
 * Signup form hook
 * Manages form state, validation, submission, and error handling
 * 
 * @returns {Object} Signup form state and handlers
 */
export function useSignup() {
  const [formData, setFormData] = useState(SIGNUP_INITIAL);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register(formData.email, formData.fullName, formData.password);
      window.location.href = '/signup/success';
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, error, isLoading, handleChange, handleSubmit };
}

// ── useAuth ───────────────────────────────────────────────────────────────────

/**
 * General authentication state hook
 * Provides current user info and auth status
 * 
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = !!localStorage.getItem('token');

  const logout = () => {
    authApi.logout();
    setUser(null);
    window.location.href = '/login';
  };

  return {
    user,
    isAuthenticated,
    logout,
  };
}
