/**
 * Unit Tests for CreateTaskModal Component
 * -----------------------------------------
 * Tests the task creation modal rendering, form validation, and submission.
 *
 * Coverage:
 * - Renders modal overlay and content
 * - Renders form with title and description inputs
 * - Closes modal on X button click
 * - Closes modal on overlay click
 * - Does not close modal when clicking modal content
 * - Validates required title field
 * - Creates task with title and description
 * - Shows loading state during creation
 * - Displays error message on failure
 * - Disables buttons during loading
 *
 * Test Framework: Vitest + React Testing Library
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CreateTaskModal from "../components/CreateTaskModal";

describe("CreateTaskModal", () => {
  let onClose;
  let onCreate;

  beforeEach(() => {
    vi.restoreAllMocks();
    onClose = vi.fn();
    onCreate = vi.fn();
  });

  function renderModal(props = {}) {
    return render(
      <CreateTaskModal onClose={onClose} onCreate={onCreate} {...props} />
    );
  }

  it("renders the modal overlay", () => {
    renderModal();
    expect(screen.getByTestId("modal-overlay")).toBeInTheDocument();
  });

  it("renders the modal content", () => {
    renderModal();
    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
  });

  it("renders the modal title", () => {
    renderModal();
    const title = screen.getByTestId("modal-title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Create New Task");
  });

  it("renders the close button", () => {
    renderModal();
    expect(screen.getByTestId("modal-close")).toBeInTheDocument();
  });

  it("renders the title input", () => {
    renderModal();
    const titleInput = screen.getByTestId("input-task-title");
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveAttribute("type", "text");
    expect(titleInput).toHaveAttribute("placeholder", "Task title");
  });

  it("renders the description textarea", () => {
    renderModal();
    const descriptionInput = screen.getByTestId("input-task-description");
    expect(descriptionInput).toBeInTheDocument();
    expect(descriptionInput).toHaveAttribute("placeholder", "Task description (optional)");
  });

  it("renders cancel and create buttons", () => {
    renderModal();
    expect(screen.getByTestId("btn-cancel")).toBeInTheDocument();
    expect(screen.getByTestId("btn-create")).toBeInTheDocument();
  });

  it("closes modal when X button is clicked", () => {
    renderModal();

    const closeButton = screen.getByTestId("modal-close");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes modal when cancel button is clicked", () => {
    renderModal();

    const cancelButton = screen.getByTestId("btn-cancel");
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes modal when clicking overlay", () => {
    renderModal();

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close modal when clicking modal content", () => {
    renderModal();

    const modalContent = screen.getByTestId("create-task-modal");
    fireEvent.click(modalContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("updates title input value when user types", () => {
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "New Task Title" } });

    expect(titleInput).toHaveValue("New Task Title");
  });

  it("updates description input value when user types", () => {
    renderModal();

    const descriptionInput = screen.getByTestId("input-task-description");
    fireEvent.change(descriptionInput, {
      target: { value: "Task description here" },
    });

    expect(descriptionInput).toHaveValue("Task description here");
  });

  it("shows error when submitting empty title", async () => {
    renderModal();

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId("modal-error")).toBeInTheDocument();
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("shows error when title contains only whitespace", async () => {
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "   " } });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId("modal-error")).toBeInTheDocument();
    });

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("creates task with title only", async () => {
    onCreate.mockResolvedValue();
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "My Task" } });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(onCreate).toHaveBeenCalledWith("My Task", "");
    });
  });

  it("creates task with title and description", async () => {
    onCreate.mockResolvedValue();
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    const descriptionInput = screen.getByTestId("input-task-description");

    fireEvent.change(titleInput, { target: { value: "Complete feature" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Implement the new dashboard" },
    });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(onCreate).toHaveBeenCalledWith(
        "Complete feature",
        "Implement the new dashboard"
      );
    });
  });

  it("trims whitespace from title and description", async () => {
    onCreate.mockResolvedValue();
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    const descriptionInput = screen.getByTestId("input-task-description");

    fireEvent.change(titleInput, { target: { value: "  Task Title  " } });
    fireEvent.change(descriptionInput, {
      target: { value: "  Task Description  " },
    });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith("Task Title", "Task Description");
    });
  });

  it("shows loading state during creation", async () => {
    onCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "Test Task" } });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createButton).toHaveTextContent("Creating...");
      expect(createButton).toBeDisabled();
    });
  });

  it("disables cancel button during loading", async () => {
    onCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "Test Task" } });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      const cancelButton = screen.getByTestId("btn-cancel");
      expect(cancelButton).toBeDisabled();
    });
  });

  it("shows error message when creation fails", async () => {
    onCreate.mockRejectedValue(new Error("Failed to create task"));
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "Test Task" } });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId("modal-error")).toBeInTheDocument();
      expect(screen.getByText("Failed to create task")).toBeInTheDocument();
    });
  });

  it("re-enables create button after error", async () => {
    onCreate.mockRejectedValue(new Error("Failed to create task"));
    renderModal();

    const titleInput = screen.getByTestId("input-task-title");
    fireEvent.change(titleInput, { target: { value: "Test Task" } });

    const createButton = screen.getByTestId("btn-create");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByTestId("modal-error")).toBeInTheDocument();
    });

    // Button should be re-enabled after error
    expect(createButton).not.toBeDisabled();
    expect(createButton).toHaveTextContent("Create");
  });

  it("renders form inside modal content", () => {
    renderModal();
    expect(screen.getByTestId("create-task-form")).toBeInTheDocument();
  });
});
