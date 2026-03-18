import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/components/shared/Layout";

import DashboardPage from "@/pages/DashboardPage";
import TestCasesPage from "@/pages/TestCasesPage";
import TestRunnerPage from "@/pages/TestRunnerPage";
import TestResultsPage from "@/pages/TestResultsPage";
import SettingsPage from "@/pages/SettingsPage";

import LoginPage from "@/pages/auth/login/LoginPage";

import SignupPage from "@/pages/auth/Signup/SignupPage";
import SignupSuccessPage from "@/pages/auth/Signup/SignupSuccessPage";

import ForgotPasswordPage from "@/pages/auth/forgotPassword/ForgotPasswordPage";
import ForgotPasswordVerifyPage from "@/pages/auth/forgotPassword/ForgotPasswordVerifyPage";
import ResetPasswordPage from "@/pages/auth/forgotPassword/ResetPasswordPage";
import ResetPasswordSuccessPage from "@/pages/auth/forgotPassword/ResetPasswordSuccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/success" element={<SignupSuccessPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/forgot-password/verify"
          element={<ForgotPasswordVerifyPage />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/reset-password/success"
          element={<ResetPasswordSuccessPage />}
        />

        {/* Main app */}
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="test-cases" element={<TestCasesPage />} />
          <Route path="test-runner" element={<TestRunnerPage />} />
          <Route path="results" element={<TestResultsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}