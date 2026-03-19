/**
 * Protected Route Component
 * 
 * Wrapper for routes that require authentication
 * Redirects to login if user is not authenticated
 */

import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
