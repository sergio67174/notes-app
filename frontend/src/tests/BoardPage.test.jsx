/**
 * Unit Tests for BoardPage Component
 * ------------------------------------
 * Tests the main board page rendering, data fetching, modals, and CRUD operations.
 *
 * Coverage:
 * - Renders loading state
 * - Fetches and displays board data (columns and tasks)
 * - Renders BoardHeader with user name
 * - Renders KanbanBoard with columns and tasks
 * - Opens create task modal on button click
 * - Creates new task successfully
 * - Opens delete confirmation modal on button click
 * - Deletes done tasks successfully
 * - Deletes individual task with confirmation
 * - Cancels individual task deletion
 * - Handles API errors gracefully
 *
 * Test Framework: Vitest + React Testing Library
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import BoardPage from "../pages/BoardPage";
import * as apiClient from "../api/client";

/**
 * Renders BoardPage wrapped in MemoryRouter and AuthProvider for testing
 */
function renderBoardPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <BoardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("BoardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock localStorage for AuthContext
    const mockUser = { id: "1", name: "John Doe", email: "john@example.com" };
    global.localStorage.setItem("token", "fake-token");
    global.localStorage.setItem("user", JSON.stringify(mockUser));
  });

  it("renders loading state initially", () => {
    vi.spyOn(apiClient, "apiFetch").mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderBoardPage();
    expect(screen.getByTestId("board-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading board...")).toBeInTheDocument();
  });

  it("fetches and displays board data", async () => {
    const mockBoardData = {
      board: {
        columns: [
          { id: "1", slug: "TODO", name: "To Do" },
          { id: "2", slug: "IN_PROGRESS", name: "In Progress" },
          { id: "3", slug: "DONE", name: "Done" },
        ],
        tasks: [
          {
            id: "task-1",
            title: "Test Task",
            description: "Test Description",
            column_id: "1",
            position: 1,
            color: "pastel-yellow",
          },
        ],
      },
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("board-page")).toBeInTheDocument();
    });

    // Verify board header is rendered
    expect(screen.getByTestId("board-header")).toBeInTheDocument();
    expect(screen.getByTestId("board-greeting")).toHaveTextContent(
      "Hello John Doe"
    );

    // Verify kanban board is rendered
    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();

    // Verify columns are rendered
    expect(screen.getByTestId("kanban-column-TODO")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-IN_PROGRESS")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-DONE")).toBeInTheDocument();

    // Verify task is rendered
    expect(screen.getByTestId("task-card-task-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-title-task-1")).toHaveTextContent(
      "Test Task"
    );
  });

  it("displays user name in header greeting", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("board-greeting")).toHaveTextContent(
        "Hello John Doe"
      );
    });
  });

  it("renders action buttons in header", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-create-task")).toBeInTheDocument();
      expect(screen.getByTestId("btn-delete-done")).toBeInTheDocument();
      expect(screen.getByTestId("btn-logout")).toBeInTheDocument();
    });
  });

  it("opens create task modal when create button is clicked", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-create-task")).toBeInTheDocument();
    });

    const createButton = screen.getByTestId("btn-create-task");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-title")).toHaveTextContent(
        "Create New Task"
      );
    });
  });

  it("closes create task modal when cancel is clicked", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-create-task")).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByTestId("btn-create-task"));

    await waitFor(() => {
      expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByTestId("btn-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("create-task-modal")).not.toBeInTheDocument();
    });
  });

  it("creates a new task and refreshes board", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    const mockBoardDataAfterCreate = {
      board: {
        columns: [{ id: "1", slug: "TODO", name: "To Do" }],
        tasks: [
          {
            id: "new-task",
            title: "New Task",
            description: "New Description",
            column_id: "1",
            position: 1,
            color: "pastel-blue",
          },
        ],
      },
    };

    const apiFetchSpy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(mockBoardData) // Initial fetch
      .mockResolvedValueOnce({}) // POST /tasks
      .mockResolvedValueOnce(mockBoardDataAfterCreate); // Refresh after create

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-create-task")).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByTestId("btn-create-task"));

    await waitFor(() => {
      expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
    });

    // Fill in form
    const titleInput = screen.getByTestId("input-task-title");
    const descriptionInput = screen.getByTestId("input-task-description");

    fireEvent.change(titleInput, { target: { value: "New Task" } });
    fireEvent.change(descriptionInput, {
      target: { value: "New Description" },
    });

    // Submit form
    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "New Task",
          description: "New Description",
        }),
      });
    });

    // Verify modal closes and board refreshes
    await waitFor(() => {
      expect(screen.queryByTestId("create-task-modal")).not.toBeInTheDocument();
      expect(screen.getByTestId("task-card-new-task")).toBeInTheDocument();
    });
  });

  it("opens delete confirmation modal when delete button is clicked", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-delete-done")).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId("btn-delete-done");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      expect(screen.getByTestId("confirmation-title")).toHaveTextContent(
        "Delete Done Tasks"
      );
      expect(screen.getByTestId("confirmation-message")).toHaveTextContent(
        /are you sure/i
      );
    });
  });

  it("deletes done tasks when confirmed", async () => {
    const mockBoardData = {
      board: { columns: [], tasks: [] },
    };

    const apiFetchSpy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(mockBoardData) // Initial fetch
      .mockResolvedValueOnce({}) // POST /me/board/remove-done-tasks
      .mockResolvedValueOnce(mockBoardData); // Refresh after delete

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-delete-done")).toBeInTheDocument();
    });

    // Open confirmation modal
    fireEvent.click(screen.getByTestId("btn-delete-done"));

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
    });

    // Confirm deletion
    fireEvent.click(screen.getByTestId("btn-confirm"));

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith("/me/board/remove-done-tasks", {
        method: "POST",
      });
    });

    // Verify modal closes
    await waitFor(() => {
      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
    });
  });

  it("deletes individual task when delete button is clicked and confirmed", async () => {
    const mockBoardData = {
      board: {
        columns: [{ id: "1", slug: "TODO", name: "To Do" }],
        tasks: [
          {
            id: "task-1",
            title: "Task to Delete",
            description: "This will be deleted",
            column_id: "1",
            position: 1,
            color: "pastel-yellow",
          },
        ],
      },
    };

    const mockBoardDataAfterDelete = {
      board: {
        columns: [{ id: "1", slug: "TODO", name: "To Do" }],
        tasks: [],
      },
    };

    const apiFetchSpy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(mockBoardData) // Initial fetch
      .mockResolvedValueOnce({}) // DELETE /tasks/:id
      .mockResolvedValueOnce(mockBoardDataAfterDelete); // Refresh after delete

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("task-card-task-1")).toBeInTheDocument();
    });

    // Click delete button on task
    const deleteButton = screen.getByTestId("task-delete-btn-task-1");
    fireEvent.click(deleteButton);

    // Verify confirmation modal opens
    await waitFor(() => {
      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      expect(screen.getByTestId("confirmation-title")).toHaveTextContent(
        "Delete Task"
      );
      expect(screen.getByTestId("confirmation-message")).toHaveTextContent(
        /are you sure you want to delete this task/i
      );
    });

    // Confirm deletion
    fireEvent.click(screen.getByTestId("btn-confirm"));

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith("/tasks/task-1", {
        method: "DELETE",
      });
    });

    // Verify modal closes and task is removed
    await waitFor(() => {
      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("task-card-task-1")).not.toBeInTheDocument();
    });
  });

  it("cancels individual task deletion when cancel is clicked", async () => {
    const mockBoardData = {
      board: {
        columns: [{ id: "1", slug: "TODO", name: "To Do" }],
        tasks: [
          {
            id: "task-1",
            title: "Task to Keep",
            description: "This will not be deleted",
            column_id: "1",
            position: 1,
            color: "pastel-blue",
          },
        ],
      },
    };

    const apiFetchSpy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValue(mockBoardData);

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("task-card-task-1")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTestId("task-delete-btn-task-1");
    fireEvent.click(deleteButton);

    // Verify confirmation modal opens
    await waitFor(() => {
      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
    });

    // Cancel deletion
    fireEvent.click(screen.getByTestId("btn-cancel-confirm"));

    // Verify modal closes and task remains
    await waitFor(() => {
      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("task-card-task-1")).toBeInTheDocument();

    // Verify DELETE was not called (only initial fetch)
    expect(apiFetchSpy).toHaveBeenCalledTimes(1);
  });

  it("handles API error when fetching board", async () => {
    vi.spyOn(apiClient, "apiFetch").mockRejectedValue(
      new Error("Failed to load board")
    );

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("board-error")).toBeInTheDocument();
      expect(screen.getByText("Failed to load board")).toBeInTheDocument();
    });
  });

  it("handles network error gracefully", async () => {
    vi.spyOn(apiClient, "apiFetch").mockRejectedValue(
      new Error("Network error")
    );

    renderBoardPage();

    await waitFor(() => {
      expect(screen.getByTestId("board-error")).toBeInTheDocument();
    });
  });
});
