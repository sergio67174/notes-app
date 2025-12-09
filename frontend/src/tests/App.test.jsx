import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

describe("App", () => {
  it("renders the AuthPage (login) at /login route", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
  });

  it("renders the RegisterPage at /register route", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("register-container")).toBeInTheDocument();
  });

  it("redirects from / to /login", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
  });
});
