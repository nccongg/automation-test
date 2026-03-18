import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/components/shared/Layout";

import DashboardPage from "@/pages/DashboardPage";
import TestCasesPage from "@/pages/TestCasesPage";
import TestRunnerPage from "@/pages/TestRunnerPage";
import TestResultsPage from "@/pages/TestResultsPage";
import SettingsPage from "@/pages/SettingsPage";

import {
  LoginPage,
  SignupPage,
  SignupSuccessPage,
  ForgotPasswordPage,
  ForgotPasswordVerifyPage,
  ResetPasswordPage,
  ResetPasswordSuccessPage,
} from "@/pages/auth";

import ProtectedRoute from "@/components/shared/ProtectedRoute";

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

        {/* Protected Main app routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="test-cases" element={<TestCasesPage />} />
            <Route path="test-runner" element={<TestRunnerPage />} />
            <Route path="results" element={<TestResultsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}