/**
 * Unit Tests for TaskCard Component
 * ----------------------------------
 * Tests the task card rendering, inline editing, delete, and drag functionality.
 *
 * Coverage:
 * - Renders task card with title and description
 * - Shows edit button (pencil icon)
 * - Shows delete button (garbage icon)
 * - Enters edit mode on pencil click
 * - Deletes task on delete button click
 * - Saves edited task on save button click
 * - Cancels edit mode on cancel button click
 * - Cancels edit on Escape key
 * - Saves on Ctrl+Enter key combination
 * - Applies correct color class based on task.color
 * - Applies transparency when isDone is true
 * - Disables dragging during edit mode
 * - Validates title is required when saving
 *
 * Test Framework: Vitest + React Testing Library
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";
import TaskCard from "../components/TaskCard";

// Mock the @dnd-kit/core module
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core");
  return {
    ...actual,
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    }),
  };
});

describe("TaskCard", () => {
  let onUpdateTask;
  let onDeleteTask;
  const mockTask = {
    id: "task-1",
    title: "Test Task Title",
    description: "Test task description",
    color: "pastel-yellow",
    column_id: "1",
    position: 1,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    onUpdateTask = vi.fn();
    onDeleteTask = vi.fn();
  });

  function renderTaskCard(props = {}) {
    const defaultProps = {
      task: mockTask,
      onUpdateTask,
      onDeleteTask,
      isDone: false,
      isDragging: false,
    };

    return render(<TaskCard {...defaultProps} {...props} />);
  }

  it("renders the task card container", () => {
    renderTaskCard();
    expect(screen.getByTestId("task-card-task-1")).toBeInTheDocument();
  });

  it("renders task title", () => {
    renderTaskCard();
    const title = screen.getByTestId("task-title-task-1");
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("Test Task Title");
  });

  it("renders task description when present", () => {
    renderTaskCard();
    const description = screen.getByTestId("task-description-task-1");
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent("Test task description");
  });

  it("does not render description when task has no description", () => {
    const taskWithoutDesc = { ...mockTask, description: "" };
    renderTaskCard({ task: taskWithoutDesc });

    expect(
      screen.queryByTestId("task-description-task-1")
    ).not.toBeInTheDocument();
  });

  it("renders edit button", () => {
    renderTaskCard();
    const editButton = screen.getByTestId("task-edit-btn-task-1");
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent("✎");
  });

  it("renders delete button", () => {
    renderTaskCard();
    const deleteButton = screen.getByTestId("task-delete-btn-task-1");
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent("🗑");
  });

  it("calls onDeleteTask when delete button is clicked", () => {
    renderTaskCard();

    const deleteButton = screen.getByTestId("task-delete-btn-task-1");
    fireEvent.click(deleteButton);

    expect(onDeleteTask).toHaveBeenCalledTimes(1);
    expect(onDeleteTask).toHaveBeenCalledWith("task-1");
  });

  it("enters edit mode when pencil button is clicked", () => {
    renderTaskCard();

    const editButton = screen.getByTestId("task-edit-btn-task-1");
    fireEvent.click(editButton);

    expect(screen.getByTestId("task-edit-form-task-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-edit-title-task-1")).toBeInTheDocument();
    expect(
      screen.getByTestId("task-edit-description-task-1")
    ).toBeInTheDocument();
  });

  it("shows title and description inputs in edit mode", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    const descriptionInput = screen.getByTestId(
      "task-edit-description-task-1"
    );

    expect(titleInput).toHaveValue("Test Task Title");
    expect(descriptionInput).toHaveValue("Test task description");
  });

  it("updates title input when typing in edit mode", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    expect(titleInput).toHaveValue("Updated Title");
  });

  it("updates description input when typing in edit mode", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const descriptionInput = screen.getByTestId(
      "task-edit-description-task-1"
    );
    fireEvent.change(descriptionInput, {
      target: { value: "Updated description" },
    });

    expect(descriptionInput).toHaveValue("Updated description");
  });

  it("saves edited task when save button is clicked", async () => {
    onUpdateTask.mockResolvedValue();
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    const descriptionInput = screen.getByTestId(
      "task-edit-description-task-1"
    );

    fireEvent.change(titleInput, { target: { value: "New Title" } });
    fireEvent.change(descriptionInput, {
      target: { value: "New Description" },
    });

    const saveButton = screen.getByTestId("task-edit-save-task-1");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onUpdateTask).toHaveBeenCalledTimes(1);
      expect(onUpdateTask).toHaveBeenCalledWith("task-1", {
        title: "New Title",
        description: "New Description",
      });
    });
  });

  it("trims whitespace when saving", async () => {
    onUpdateTask.mockResolvedValue();
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    const descriptionInput = screen.getByTestId(
      "task-edit-description-task-1"
    );

    fireEvent.change(titleInput, { target: { value: "  Title  " } });
    fireEvent.change(descriptionInput, {
      target: { value: "  Description  " },
    });

    const saveButton = screen.getByTestId("task-edit-save-task-1");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onUpdateTask).toHaveBeenCalledWith("task-1", {
        title: "Title",
        description: "Description",
      });
    });
  });

  it("exits edit mode after successful save", async () => {
    onUpdateTask.mockResolvedValue();
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "Updated" } });

    const saveButton = screen.getByTestId("task-edit-save-task-1");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId("task-edit-form-task-1")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("task-title-task-1")).toBeInTheDocument();
    });
  });

  it("cancels edit mode when cancel button is clicked", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "Changed" } });

    const cancelButton = screen.getByTestId("task-edit-cancel-task-1");
    fireEvent.click(cancelButton);

    expect(
      screen.queryByTestId("task-edit-form-task-1")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("task-title-task-1")).toHaveTextContent(
      "Test Task Title"
    );
  });

  it("resets form when cancel is clicked", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    const cancelButton = screen.getByTestId("task-edit-cancel-task-1");
    fireEvent.click(cancelButton);

    // Re-enter edit mode and verify values are reset
    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const resetTitleInput = screen.getByTestId("task-edit-title-task-1");
    expect(resetTitleInput).toHaveValue("Test Task Title");
  });

  it("does not save when title is empty", async () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "" } });

    const saveButton = screen.getByTestId("task-edit-save-task-1");
    fireEvent.click(saveButton);

    // Should not call onUpdateTask
    expect(onUpdateTask).not.toHaveBeenCalled();

    // Should still be in edit mode
    expect(screen.getByTestId("task-edit-form-task-1")).toBeInTheDocument();
  });

  it("disables save button when title is empty", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "" } });

    const saveButton = screen.getByTestId("task-edit-save-task-1");
    expect(saveButton).toBeDisabled();
  });

  it("shows loading state during save", async () => {
    onUpdateTask.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const saveButton = screen.getByTestId("task-edit-save-task-1");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toHaveTextContent("Saving...");
      expect(saveButton).toBeDisabled();
    });
  });

  it("applies correct color class", () => {
    renderTaskCard({ task: { ...mockTask, color: "pastel-pink" } });

    const card = screen.getByTestId("task-card-task-1");
    expect(card).toHaveClass("task-card-pastel-pink");
  });

  it("applies done class when isDone is true", () => {
    renderTaskCard({ isDone: true });

    const card = screen.getByTestId("task-card-task-1");
    expect(card).toHaveClass("task-card-done");
  });

  it("does not apply done class when isDone is false", () => {
    renderTaskCard({ isDone: false });

    const card = screen.getByTestId("task-card-task-1");
    expect(card).not.toHaveClass("task-card-done");
  });

  it("applies dragging class when isDragging is true", () => {
    renderTaskCard({ isDragging: true });

    const card = screen.getByTestId("task-card-task-1");
    expect(card).toHaveClass("task-card-dragging");
  });

  it("cancels edit on Escape key", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.keyDown(titleInput, { key: "Escape" });

    expect(
      screen.queryByTestId("task-edit-form-task-1")
    ).not.toBeInTheDocument();
  });

  it("saves on Ctrl+Enter key combination", async () => {
    onUpdateTask.mockResolvedValue();
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    const titleInput = screen.getByTestId("task-edit-title-task-1");
    fireEvent.change(titleInput, { target: { value: "Quick Save" } });
    fireEvent.keyDown(titleInput, { key: "Enter", ctrlKey: true });

    await waitFor(() => {
      expect(onUpdateTask).toHaveBeenCalledWith("task-1", {
        title: "Quick Save",
        description: "Test task description",
      });
    });
  });

  it("renders all edit buttons in edit mode", () => {
    renderTaskCard();

    fireEvent.click(screen.getByTestId("task-edit-btn-task-1"));

    expect(screen.getByTestId("task-edit-cancel-task-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-edit-save-task-1")).toBeInTheDocument();
  });
});
