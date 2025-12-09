// src/tests/RegisterPage.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../RegisterPage";

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
 * Renders RegisterPage wrapped in MemoryRouter for testing
 */
function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the register form with fields and button", () => {
    renderRegisterPage();

    expect(screen.getByTestId("register-container")).toBeInTheDocument();
    expect(screen.getByTestId("register-title")).toBeInTheDocument();
    expect(screen.getByTestId("register-input-name")).toBeInTheDocument();
    expect(screen.getByTestId("register-input-email")).toBeInTheDocument();
    expect(screen.getByTestId("register-input-password")).toBeInTheDocument();
    expect(screen.getByTestId("register-button")).toBeInTheDocument();
  });

  it("disables the register button when form is invalid", () => {
    renderRegisterPage();

    const button = screen.getByTestId("register-button");
    expect(button).toBeDisabled();
  });

  it("enables the register button when all fields are valid", () => {
    renderRegisterPage();

    typeIntoInputByTestId("register-input-name", "Regina");
    typeIntoInputByTestId("register-input-email", "regina@example.com");
    typeIntoInputByTestId("register-input-password", "Password1!");

    const button = screen.getByTestId("register-button");
    expect(button).toBeEnabled();
  });

  it("shows validation messages when fields are invalid after blur", () => {
    renderRegisterPage();

    // Name: blur without typing
    const nameInput = screen.getByTestId("register-input-name");
    fireEvent.blur(nameInput);

    // Email: invalid value then blur
    typeIntoInputByTestId("register-input-email", "not-an-email");
    const emailInput = screen.getByTestId("register-input-email");
    fireEvent.blur(emailInput);

    // Password: invalid value then blur
    typeIntoInputByTestId("register-input-password", "short");
    const passwordInput = screen.getByTestId("register-input-password");
    fireEvent.blur(passwordInput);

    expect(screen.getByTestId("error-name")).toBeInTheDocument();
    expect(screen.getByTestId("error-email")).toBeInTheDocument();
    expect(screen.getByTestId("error-password")).toBeInTheDocument();
  });

  it("calls the API and shows success message on successful registration", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "user-id" }),
    });
    global.fetch = mockFetch;

    renderRegisterPage();

    typeIntoInputByTestId("register-input-name", "Regina");
    typeIntoInputByTestId("register-input-email", "regina@example.com");
    typeIntoInputByTestId("register-input-password", "Password1!");

    const button = screen.getByTestId("register-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId("success-message")).toBeInTheDocument();
    expect(
      screen.getByText(/account created successfully! you can now log in/i)
    ).toBeInTheDocument();
  });

  it("shows 'email is already registered' when backend returns conflict", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: "Email already exists" }),
    });
    global.fetch = mockFetch;

    renderRegisterPage();

    typeIntoInputByTestId("register-input-name", "Regina");
    typeIntoInputByTestId("register-input-email", "regina@example.com");
    typeIntoInputByTestId("register-input-password", "Password1!");

    const button = screen.getByTestId("register-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const apiError = screen.getByTestId("error-api");
    expect(apiError).toBeInTheDocument();
    expect(apiError).toHaveTextContent(/this email is already registered/i);
  });

  it("shows a generic API error on non-409 failure", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Server error" }),
    });
    global.fetch = mockFetch;

    renderRegisterPage();

    typeIntoInputByTestId("register-input-name", "Regina");
    typeIntoInputByTestId("register-input-email", "regina@example.com");
    typeIntoInputByTestId("register-input-password", "Password1!");

    const button = screen.getByTestId("register-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const apiError = screen.getByTestId("error-api");
    expect(apiError).toBeInTheDocument();
    expect(apiError).toHaveTextContent(/server error/i);
  });

  it("shows network error when fetch throws", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("network down"));
    global.fetch = mockFetch;

    renderRegisterPage();

    typeIntoInputByTestId("register-input-name", "Regina");
    typeIntoInputByTestId("register-input-email", "regina@example.com");
    typeIntoInputByTestId("register-input-password", "Password1!");

    const button = screen.getByTestId("register-button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/network error, please try again/i)
      ).toBeInTheDocument();
    });
  });

  it("has a link to login with the correct href attribute", () => {
    renderRegisterPage();

    const link = screen.getByTestId("login-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });
});
