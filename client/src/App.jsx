import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/shared/Layout'
import DashboardPage from '@/pages/DashboardPage'
import TestCasesPage from '@/pages/TestCasesPage'
import TestRunnerPage from '@/pages/TestRunnerPage'
import TestResultsPage from '@/pages/TestResultsPage'
import SettingsPage from '@/pages/SettingsPage'

import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Main app */}
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="test-cases" element={<TestCasesPage />} />
          <Route path="test-runner" element={<TestRunnerPage />} />
          <Route path="results" element={<TestResultsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}