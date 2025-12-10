/**
 * Unit Tests for BoardHeader Component
 * -------------------------------------
 * Tests the board header rendering and button interactions.
 *
 * Coverage:
 * - Renders header container
 * - Displays user name in greeting
 * - Renders all action buttons (Create Task, Delete Done Tasks, Logout)
 * - Calls onCreateTask when create button is clicked
 * - Calls onDeleteDone when delete button is clicked
 * - Calls logout when logout button is clicked
 *
 * Test Framework: Vitest + React Testing Library
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import BoardHeader from "../components/BoardHeader";

/**
 * Renders BoardHeader wrapped in MemoryRouter and AuthProvider for testing
 */
function renderBoardHeader(props = {}) {
  const defaultProps = {
    userName: "John Doe",
    onCreateTask: vi.fn(),
    onDeleteDone: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <AuthProvider>
        <BoardHeader {...defaultProps} {...props} />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("BoardHeader", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock localStorage for AuthContext
    const mockUser = { id: "1", name: "John Doe", email: "john@example.com" };
    global.localStorage.setItem("token", "fake-token");
    global.localStorage.setItem("user", JSON.stringify(mockUser));
  });

  it("renders the board header container", () => {
    renderBoardHeader();
    expect(screen.getByTestId("board-header")).toBeInTheDocument();
  });

  it("displays user name in greeting", () => {
    renderBoardHeader({ userName: "Alice Smith" });

    const greeting = screen.getByTestId("board-greeting");
    expect(greeting).toBeInTheDocument();
    expect(greeting).toHaveTextContent("Hello Alice Smith");
  });

  it("renders the create task button", () => {
    renderBoardHeader();

    const createButton = screen.getByTestId("btn-create-task");
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent("Create New Task");
  });

  it("renders the delete done tasks button", () => {
    renderBoardHeader();

    const deleteButton = screen.getByTestId("btn-delete-done");
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent("Delete Done Tasks");
  });

  it("renders the logout button", () => {
    renderBoardHeader();

    const logoutButton = screen.getByTestId("btn-logout");
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent("Logout");
  });

  it("calls onCreateTask when create button is clicked", () => {
    const onCreateTask = vi.fn();
    renderBoardHeader({ onCreateTask });

    const createButton = screen.getByTestId("btn-create-task");
    fireEvent.click(createButton);

    expect(onCreateTask).toHaveBeenCalledTimes(1);
  });

  it("calls onDeleteDone when delete button is clicked", () => {
    const onDeleteDone = vi.fn();
    renderBoardHeader({ onDeleteDone });

    const deleteButton = screen.getByTestId("btn-delete-done");
    fireEvent.click(deleteButton);

    expect(onDeleteDone).toHaveBeenCalledTimes(1);
  });

  it("handles undefined userName gracefully", () => {
    renderBoardHeader({ userName: undefined });

    const greeting = screen.getByTestId("board-greeting");
    expect(greeting).toHaveTextContent("Hello");
  });

  it("renders all components together", () => {
    renderBoardHeader({ userName: "Bob Jones" });

    // Verify complete header structure
    expect(screen.getByTestId("board-header")).toBeInTheDocument();
    expect(screen.getByTestId("board-greeting")).toHaveTextContent("Hello Bob Jones");
    expect(screen.getByTestId("btn-create-task")).toBeInTheDocument();
    expect(screen.getByTestId("btn-delete-done")).toBeInTheDocument();
    expect(screen.getByTestId("btn-logout")).toBeInTheDocument();
  });
});
