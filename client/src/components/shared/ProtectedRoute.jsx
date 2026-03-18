import { Navigate, Outlet } from "react-router-dom";

/**
 * Component to protect routes from unauthenticated users.
 * Redirects to /login if no token is found in localStorage.
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render the protected content (Outlet) if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
