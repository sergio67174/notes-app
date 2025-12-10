import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./AuthPage";
import RegisterPage from "./RegisterPage";
import BoardPage from "./pages/BoardPage";
import "./index.css";

/**
 * Root application component with routing.
 *
 * Routes:
 * - /login - Login page
 * - /register - Registration page
 * - /me/board - Protected Kanban board page
 * - / - Redirects to /login
 *
 * @returns {JSX.Element} The app root component with routes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/me/board"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}