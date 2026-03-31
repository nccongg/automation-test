/**
 * Main Application Component
 *
 * Root component with routing configuration
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import Layout from "@/shared/components/layout/Layout";
import ProtectedRoute from "@/shared/components/layout/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import SignupSuccessPage from "@/pages/auth/SignupSuccessPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ForgotPasswordVerifyPage from "@/pages/auth/ForgotPasswordVerifyPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ResetPasswordSuccessPage from "@/pages/auth/ResetPasswordSuccessPage";

// Main app pages
import DashboardPage from "@/pages/main/DashboardPage";
import ProjectsPage from "@/pages/main/ProjectsPage";
import ProjectDetailPage from "@/pages/main/ProjectDetailPage";
import ProjectOverviewPage from "@/pages/main/ProjectOverviewPage";
import TestCasesPage from "@/pages/main/TestCasesPage";
import TestResultsPage from "@/pages/main/TestResultsPage";
import SettingsPage from "@/pages/main/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route path={ROUTES.SIGNUP_SUCCESS} element={<SignupSuccessPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route
          path={ROUTES.FORGOT_PASSWORD_VERIFY}
          element={<ForgotPasswordVerifyPage />}
        />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route
          path={ROUTES.RESET_PASSWORD_SUCCESS}
          element={<ResetPasswordSuccessPage />}
        />

        {/* Protected Main routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<ProjectOverviewPage />} />
              <Route path="test-cases" element={<TestCasesPage />} />
              <Route path="test-runs" element={<TestResultsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
