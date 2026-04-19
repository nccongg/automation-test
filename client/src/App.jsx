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
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ProjectsPage from "@/pages/projects/ProjectsPage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import ProjectOverviewPage from "@/pages/projects/ProjectOverviewPage";
import TestCasesPage from "@/pages/test-cases/TestCasesPage";
import TestCaseDetailPage from "@/pages/test-cases/TestCaseDetailPage";
import TestResultsPage from "@/pages/test-runs/TestResultsPage";
import TestRunDetailPage from "@/pages/test-runs/TestRunDetailPage";
import TestSuiteRunDetailPage from "@/pages/test-runs/TestSheetRunDetailPage";
import TestSuitesPage from "@/pages/test-suites/TestCollectionPage";
import TestSuiteDetailPage from "@/pages/test-suites/TestSheetDetailPage";
import TestCollectionDetailPage from "@/pages/collections/TestCollectionDetailPage";
import SettingsPage from "@/pages/settings/SettingsPage";

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
              <Route path="test-cases/:testCaseId" element={<TestCaseDetailPage />} />
              <Route path="test-runs" element={<TestResultsPage />} />
              <Route path="test-runs/:runId" element={<TestRunDetailPage />} />
              <Route path="test-runs/sheet/:runId" element={<TestSuiteRunDetailPage />} />
              {/* Test Suites — execution unit with ordering and batch run */}
              <Route path="suites" element={<TestSuitesPage />} />
              <Route path="suites/:sheetId" element={<TestSuiteDetailPage />} />
              {/* Collections — accessible from Test Cases page tabs */}
              <Route path="collections" element={<Navigate to="../test-cases" replace />} />
              <Route path="collections/:collectionId" element={<TestCollectionDetailPage />} />
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
