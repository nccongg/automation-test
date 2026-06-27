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

// ── Password reset flow ─────────────────────────────────────────────────────────

// sessionStorage keys used to carry state across the 3 reset steps.
const RESET_EMAIL_KEY = 'resetEmail';
const RESET_TOKEN_KEY = 'resetToken';

/**
 * Step 1 — request an OTP for the given email.
 * Persists the email so the verify step can reuse it.
 */
export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      sessionStorage.setItem(RESET_EMAIL_KEY, email);
      window.location.href = '/forgot-password/verify';
    } catch (err) {
      setError(err.message || 'Could not send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { email, setEmail, error, isLoading, handleSubmit };
}

/**
 * Step 2 — verify the OTP and store the returned reset token.
 */
export function useVerifyOtp() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const email = sessionStorage.getItem(RESET_EMAIL_KEY) || '';

  const verify = async (otp) => {
    setError('');

    if (!email) {
      setError('Your session expired. Please start over.');
      return;
    }
    if (otp.length < 5) {
      setError('Please enter the full code.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.verifyOtp(email, otp);
      sessionStorage.setItem(RESET_TOKEN_KEY, result.data.resetToken);
      window.location.href = '/reset-password';
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    if (!email) {
      setError('Your session expired. Please start over.');
      return;
    }
    try {
      await authApi.forgotPassword(email);
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    }
  };

  return { email, error, isLoading, verify, resend };
}

/**
 * Step 3 — set a new password using the stored reset token.
 */
export function useResetPassword() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const resetToken = sessionStorage.getItem(RESET_TOKEN_KEY);
    if (!resetToken) {
      setError('Your session expired. Please start over.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(resetToken, formData.password);
      sessionStorage.removeItem(RESET_EMAIL_KEY);
      sessionStorage.removeItem(RESET_TOKEN_KEY);
      window.location.href = '/reset-password/success';
    } catch (err) {
      setError(err.message || 'Could not reset password. Please try again.');
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
