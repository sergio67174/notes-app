import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protected route wrapper that redirects to login if not authenticated
 * - Shows loading state while checking authentication
 * - Redirects to /login if user is not authenticated
 * - Renders children if user is authenticated
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="protected-loading" data-testid="protected-loading">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
