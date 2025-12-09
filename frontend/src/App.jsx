import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";
import RegisterPage from "./RegisterPage";
import "./index.css";

/**
 * Root application component with routing.
 *
 * Routes:
 * - /login (default) - Login page
 * - /register - Registration page
 * - / - Redirects to /login
 *
 * @returns {JSX.Element} The app root component with routes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}