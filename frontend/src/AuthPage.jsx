/**
 * AuthPage Component (Login)
 * ---------------------------
 * Displays the Notes App title + app icon header,
 * and the Login form with email and password fields.
 *
 * Features:
 *  - Email and password inputs (no name field - that's for registration)
 *  - Client-side validation
 *  - API call to backend for authentication
 *  - Error message display
 *  - Link to register page for new users
 *
 * @returns {JSX.Element}
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const LOGIN_ENDPOINT = "/auth/login";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles login form submission
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        let message = "Invalid email or password.";
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch {
          // Ignore JSON parse errors, use default message
        }
        setError(message);
        return;
      }

      const data = await res.json();
      // TODO: Store token and redirect to dashboard
      console.log("Login successful:", data);

    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container" data-testid="auth-page">
      <h1 data-testid="login-heading">Welcome back</h1>

      <form className="auth-form" onSubmit={handleSubmit} data-testid="login-form">

        {/* EMAIL FIELD */}
        <label className="form-field">
          <span>Email</span>
          <input
            data-testid="input-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {/* PASSWORD FIELD */}
        <label className="form-field">
          <span>Password</span>
          <input
            data-testid="input-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {/* API ERROR */}
        {error && (
          <p className="api-error" data-testid="error-message">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="button-login"
          className="primary-button"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-switch" data-testid="auth-redirect">
          Don't have an account?{" "}
          <Link to="/register" data-testid="register-link">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}