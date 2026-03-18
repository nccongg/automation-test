/**
 * hooks/useAuth.js — Custom hooks cho authentication logic.
 *
 * Tách toàn bộ state management và side-effects ra khỏi UI components.
 * Mỗi page chỉ cần gọi hook và render JSX.
 *
 * Hooks exported:
 *   - useLogin()   → dùng trong LoginPage
 *   - useSignup()  → dùng trong SignupPage
 */

import { useState } from "react";
import { authApi } from "@/api";

// ── useLogin ──────────────────────────────────────────────────────────────────

const LOGIN_INITIAL = { email: "", password: "", rememberMe: false };

/**
 * Quản lý toàn bộ login flow: form state, submit, error, loading.
 *
 * @example
 * const { formData, error, isLoading, handleChange, handleSubmit } = useLogin();
 */
export function useLogin() {
  const [formData, setFormData] = useState(LOGIN_INITIAL);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authApi.login(formData.email, formData.password);
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, error, isLoading, handleChange, handleSubmit };
}

// ── useSignup ─────────────────────────────────────────────────────────────────

const SIGNUP_INITIAL = {
  email: "",
  fullName: "",
  password: "",
  confirmPassword: "",
};

/**
 * Quản lý toàn bộ signup flow: form state, validation, submit, error, loading.
 *
 * @example
 * const { formData, error, isLoading, handleChange, handleSubmit } = useSignup();
 */
export function useSignup() {
  const [formData, setFormData] = useState(SIGNUP_INITIAL);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register(formData.email, formData.fullName, formData.password);
      window.location.href = "/signup/success";
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { formData, error, isLoading, handleChange, handleSubmit };
}
