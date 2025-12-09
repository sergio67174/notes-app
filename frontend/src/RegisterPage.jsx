import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const REGISTER_ENDPOINT = "/auth/register";

/**
 * Registration page component that handles:
 * - Name, email, password inputs
 * - Client-side validation
 * - Calling the backend to register a new user
 * - Rendering validation and server error messages
 *
 * @returns {JSX.Element} The registration form UI.
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ======== VALIDATIONS =========
  const isValidName = name.trim().length > 0;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const isValidPassword = passwordRegex.test(password);

  const isFormValid = isValidName && isValidEmail && isValidPassword;

  /**
   * Marks a field as "touched" to show validation warnings.
   * @param {"name" | "email" | "password"} field
   */
  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  /**
   * Submits registration form with validation and backend call.
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!isFormValid) {
      setTouched({ name: true, email: true, password: true });
      return;
    }

    setLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}${REGISTER_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        let message = "Something went wrong. Please try again.";
        try {
          const data = await res.json();
          if (data?.message) message = data.message;
        } catch {}

        if (res.status === 409 || message.toLowerCase().includes("email")) {
          setApiError("This email is already registered.");
        } else {
          setApiError(message);
        }
        return;
      }

      setSuccessMessage("Account created successfully! You can now log in.");
      setName("");
      setEmail("");
      setPassword("");
      setTouched({ name: false, email: false, password: false });
    } catch {
      setApiError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container" data-testid="register-container">
      <h1 data-testid="register-title">Create your account</h1>

      <form className="auth-form" onSubmit={handleSubmit} data-testid="register-form">

        {/* NAME FIELD */}
        <label className="form-field">
          <span>Name</span>
          <input
            data-testid="register-input-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
          />
          {touched.name && !isValidName && (
            <p className="field-error" data-testid="error-name">
              Name cannot be empty.
            </p>
          )}
        </label>

        {/* EMAIL FIELD */}
        <label className="form-field">
          <span>Email</span>
          <input
            data-testid="register-input-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
          />
          {touched.email && !isValidEmail && (
            <p className="field-error" data-testid="error-email">
              Please enter a valid email address.
            </p>
          )}
        </label>

        {/* PASSWORD FIELD */}
        <label className="form-field">
          <span>Password</span>
          <input
            data-testid="register-input-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
          />
          {touched.password && !isValidPassword && (
            <p className="field-error" data-testid="error-password">
              Password must be at least 8 characters long and include:
              <br />- 1 lowercase, 1 uppercase, 1 number, and 1 special character.
            </p>
          )}
        </label>

        {/* API ERROR */}
        {apiError && (
          <p className="api-error" data-testid="error-api">
            {apiError}
          </p>
        )}

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <p className="api-success" data-testid="success-message">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!isFormValid || loading}
          data-testid="register-button"
          className="primary-button"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="auth-switch">
          Already have an account?{" "}
          <a href="/login" data-testid="login-link">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}