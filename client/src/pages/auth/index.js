/**
 * pages/auth/index.js — Barrel export cho tất cả auth pages.
 *
 * Dùng trong App.jsx:
 *   import { LoginPage, SignupPage } from '@/pages/auth';
 */

export { default as LoginPage } from "./login/LoginPage";
export { default as SignupPage } from "./Signup/SignupPage";
export { default as SignupSuccessPage } from "./Signup/SignupSuccessPage";
export { default as ForgotPasswordPage } from "./forgotPassword/ForgotPasswordPage";
export { default as ForgotPasswordVerifyPage } from "./forgotPassword/ForgotPasswordVerifyPage";
export { default as ResetPasswordPage } from "./forgotPassword/ResetPasswordPage";
export { default as ResetPasswordSuccessPage } from "./forgotPassword/ResetPasswordSuccessPage";
