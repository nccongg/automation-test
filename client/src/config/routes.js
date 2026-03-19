/**
 * Application Routes Configuration
 * 
 * Central route definitions for the application
 */

export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  SIGNUP_SUCCESS: '/signup/success',
  FORGOT_PASSWORD: '/forgot-password',
  FORGOT_PASSWORD_VERIFY: '/forgot-password/verify',
  RESET_PASSWORD: '/reset-password',
  RESET_PASSWORD_SUCCESS: '/reset-password/success',
  
  // Protected routes
  DASHBOARD: '/',
  PROJECTS: '/projects',
  TEST_CASES: '/test-cases',
  TEST_RUNNER: '/test-runner',
  TEST_RESULTS: '/results',
  SETTINGS: '/settings',
};
