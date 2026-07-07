import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ROUTES } from "@/config/routes";
import Layout from "@/shared/components/layout/Layout";
import ProtectedRoute from "@/shared/components/layout/ProtectedRoute";
import ErrorBoundary from "@/shared/components/common/ErrorBoundary";
import RouteFallback from "@/shared/components/common/RouteFallback";
import { Toaster } from "@/components/ui/sonner";

// Pages are code-split: each route loads its own JS chunk on demand, keeping the
// initial bundle small so first paint is fast.

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const SignupSuccessPage = lazy(() => import("@/pages/auth/SignupSuccessPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ForgotPasswordVerifyPage = lazy(() => import("@/pages/auth/ForgotPasswordVerifyPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const ResetPasswordSuccessPage = lazy(() => import("@/pages/auth/ResetPasswordSuccessPage"));

// Main app pages
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const ProjectsPage = lazy(() => import("@/pages/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/projects/ProjectDetailPage"));
const TestCasesPage = lazy(() => import("@/pages/test-cases/TestCasesPage"));
const TestCaseDetailPage = lazy(() => import("@/pages/test-cases/TestCaseDetailPage"));
const TestResultsPage = lazy(() => import("@/pages/test-runs/TestResultsPage"));
const TestRunDetailPage = lazy(() => import("@/pages/test-runs/TestRunDetailPage"));
const TestSuiteRunDetailPage = lazy(() => import("@/pages/test-runs/TestSheetRunDetailPage"));
const DatasetRunDetailPage = lazy(() => import("@/pages/test-runs/DatasetRunDetailPage"));
const TestSuitesPage = lazy(() => import("@/pages/test-suites/TestSuitesPage"));
const TestSuiteDetailPage = lazy(() => import("@/pages/test-suites/TestSuiteDetailPage"));
const TestCollectionDetailPage = lazy(() => import("@/pages/collections/TestCollectionDetailPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const ProjectSettingsPage = lazy(() => import("@/pages/projects/ProjectSettingsPage"));
const DataPage = lazy(() => import("@/pages/data/DataPage"));
const ObjectRepositoryPage = lazy(() => import("@/pages/object-repository/ObjectRepositoryPage"));
const StaticInfoPage = lazy(() => import("@/pages/legal/StaticInfoPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const app = (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
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
                  <Route index element={<Navigate to="test-cases" replace />} />
                  <Route path="overview" element={<Navigate to="../test-cases" replace />} />
                  <Route path="test-cases" element={<TestCasesPage />} />
                  <Route path="test-cases/:testCaseId" element={<TestCaseDetailPage />} />
                  <Route path="test-runs" element={<TestResultsPage />} />
                  <Route path="test-runs/batches/:batchId" element={<DatasetRunDetailPage />} />
                  <Route path="test-runs/:runId" element={<TestRunDetailPage />} />
                  <Route path="test-runs/sheet/:runId" element={<TestSuiteRunDetailPage />} />
                  {/* Test Suites — execution unit with ordering and batch run */}
                  <Route path="suites" element={<TestSuitesPage />} />
                  <Route path="suites/:sheetId" element={<TestSuiteDetailPage />} />
                  {/* Collections — accessible from Test Cases page tabs */}
                  <Route path="collections" element={<Navigate to="../test-cases" replace />} />
                  <Route path="collections/:collectionId" element={<TestCollectionDetailPage />} />
                  <Route path="data" element={<DataPage />} />
                  <Route path="objects" element={<ObjectRepositoryPage />} />
                  <Route path="settings" element={<ProjectSettingsPage />} />
                </Route>
                <Route path="settings" element={<SettingsPage />} />
                <Route path="terms" element={<StaticInfoPage />} />
                <Route path="privacy" element={<StaticInfoPage />} />
                <Route path="security" element={<StaticInfoPage />} />
                <Route path="contact" element={<StaticInfoPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );

  if (!googleClientId) {
    return app;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>;
}
