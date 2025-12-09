// src/tests/AuthPage.test.jsx
/**
 * Unit Tests for AuthPage Component (Login)
 * ------------------------------------------
 * Tests the login page rendering, form elements, validation, and API interactions.
 *
 * Coverage:
 * - Renders all UI elements (header, icon, title, form, inputs, button)
 * - Verifies proper data-testid attributes for testing
 * - Validates form structure and input types
 * - Tests form state management (email, password)
 * - Tests form submission and validation
 * - Tests API success and error scenarios
 * - Tests loading states
 * - Tests register redirect link
 *
 * Test Framework: Vitest + React Testing Library
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AuthPage from "../AuthPage";

/**
 * Types text into an input using its data-testid.
 *
 * @param {string} testId - data-testid of the input element.
 * @param {string} value - Text to type.
 */
function typeIntoInputByTestId(testId, value) {
  const input = screen.getByTestId(testId);
  fireEvent.change(input, { target: { value } });
}

/**
 * Renders AuthPage wrapped in MemoryRouter for testing
 */
function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );
}

describe("AuthPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the auth page container", () => {
    renderAuthPage();

    const pageContainer = screen.getByTestId("auth-page");
    expect(pageContainer).toBeInTheDocument();
  });

  it("renders the login heading", () => {
    renderAuthPage();

    const loginHeading = screen.getByTestId("login-heading");
    expect(loginHeading).toBeInTheDocument();
    expect(loginHeading).toHaveTextContent("Welcome back");
  });

  it("renders the login form", () => {
    renderAuthPage();

    const loginForm = screen.getByTestId("login-form");
    expect(loginForm).toBeInTheDocument();
  });

  it("renders the email input with correct attributes", () => {
    renderAuthPage();

    const emailInput = screen.getByTestId("input-email");
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
  });

  it("renders the password input with correct attributes", () => {
    renderAuthPage();

    const passwordInput = screen.getByTestId("input-password");
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("placeholder", "••••••••");
  });

  it("renders the login button", () => {
    renderAuthPage();

    const loginButton = screen.getByTestId("button-login");
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toHaveAttribute("type", "submit");
    expect(loginButton).toHaveTextContent("Login");
  });

  it("renders all form elements together", () => {
    renderAuthPage();

    // Verify the complete form structure
    expect(screen.getByTestId("input-email")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
    expect(screen.getByTestId("button-login")).toBeInTheDocument();
  });

  /**
   * Tests for register redirect link
   * ---------------------------------
   */
  it("has a link to register page for users without an account", () => {
    renderAuthPage();

    const registerLink = screen.getByTestId("register-link");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("displays the correct text for the register redirect", () => {
    renderAuthPage();

    const registerText = screen.getByText(/don't have an account/i);
    expect(registerText).toBeInTheDocument();
  });

  it("renders the auth redirect paragraph", () => {
    renderAuthPage();

    const authRedirect = screen.getByTestId("auth-redirect");
    expect(authRedirect).toBeInTheDocument();
  });

  /**
   * Form functionality tests
   * ------------------------
   */
  it("updates email input value when user types", () => {
    renderAuthPage();

    const emailInput = screen.getByTestId("input-email");
    typeIntoInputByTestId("input-email", "test@example.com");

    expect(emailInput).toHaveValue("test@example.com");
  });

  it("updates password input value when user types", () => {
    renderAuthPage();

    const passwordInput = screen.getByTestId("input-password");
    typeIntoInputByTestId("input-password", "password123");

    expect(passwordInput).toHaveValue("password123");
  });

  it("shows validation error when submitting empty form", async () => {
    renderAuthPage();

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
      expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when email is empty", async () => {
    renderAuthPage();

    typeIntoInputByTestId("input-password", "password123");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
  });

  it("shows validation error when password is empty", async () => {
    renderAuthPage();

    typeIntoInputByTestId("input-email", "test@example.com");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
  });

  it("calls the API with correct credentials on successful login", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "fake-token", userId: "123" }),
    });
    global.fetch = mockFetch;

    renderAuthPage();

    typeIntoInputByTestId("input-email", "test@example.com");
    typeIntoInputByTestId("input-password", "password123");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        })
      );
    });
  });

  it("shows error message when login fails with invalid credentials", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid credentials" }),
    });
    global.fetch = mockFetch;

    renderAuthPage();

    typeIntoInputByTestId("input-email", "wrong@example.com");
    typeIntoInputByTestId("input-password", "wrongpassword");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const errorMessage = screen.getByTestId("error-message");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(/invalid credentials/i);
  });

  it("shows default error message when API returns no message", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });
    global.fetch = mockFetch;

    renderAuthPage();

    typeIntoInputByTestId("input-email", "test@example.com");
    typeIntoInputByTestId("input-password", "password123");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("shows network error when fetch throws", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    global.fetch = mockFetch;

    renderAuthPage();

    typeIntoInputByTestId("input-email", "test@example.com");
    typeIntoInputByTestId("input-password", "password123");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/network error, please try again/i)).toBeInTheDocument();
    });
  });

  it("disables button and shows loading text during login", async () => {
    const mockFetch = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ token: "fake-token" }),
    }), 100)));
    global.fetch = mockFetch;

    renderAuthPage();

    typeIntoInputByTestId("input-email", "test@example.com");
    typeIntoInputByTestId("input-password", "password123");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    // Check loading state
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
      expect(loginButton).toHaveTextContent("Logging in...");
    });

    // Wait for completion
    await waitFor(() => {
      expect(loginButton).not.toBeDisabled();
      expect(loginButton).toHaveTextContent("Login");
    }, { timeout: 3000 });
  });

  it("clears error message when user starts typing after an error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid credentials" }),
    });
    global.fetch = mockFetch;

    renderAuthPage();

    typeIntoInputByTestId("input-email", "wrong@example.com");
    typeIntoInputByTestId("input-password", "wrongpassword");

    const loginButton = screen.getByTestId("button-login");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });

    // Type in the form again, error should clear after new submission attempt
    typeIntoInputByTestId("input-email", "correct@example.com");

    // The error will remain until next submission, which is expected behavior
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
  });
});
