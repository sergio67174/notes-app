import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BoardHeader from "../components/BoardHeader";
import KanbanBoard from "../components/KanbanBoard";
import CreateTaskModal from "../components/CreateTaskModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { apiFetch } from "../api/client";
import "./BoardPage.css";

/**
 * Main board page component
 * - Fetches board data (columns and tasks) from /me/board endpoint
 * - Manages modal states for task creation and deletion
 * - Coordinates task CRUD operations
 * - Refreshes board data after mutations
 *
 * @returns {JSX.Element} Board page with header, kanban board, and modals
 */
export default function BoardPage() {
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Fetch board data on mount
  useEffect(() => {
    fetchBoard();
  }, []);

  /**
   * Fetches board data from API
   */
  async function fetchBoard() {
    try {
      setLoading(true);
      const data = await apiFetch("/me/board");
      setBoard(data.board);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Creates a new task and refreshes the board
   * @param {string} title - Task title
   * @param {string} description - Task description
   */
  async function handleCreateTask(title, description) {
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      await fetchBoard();
      setShowCreateModal(false);
    } catch (err) {
      throw new Error(err.message || "Failed to create task");
    }
  }

  /**
   * Updates a task's title and/or description
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.title] - New title
   * @param {string} [updates.description] - New description
   */
  async function handleUpdateTask(taskId, updates) {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      await fetchBoard();
    } catch (err) {
      throw new Error(err.message || "Failed to update task");
    }
  }

  /**
   * Moves a task to a different column
   * @param {string} taskId - Task ID
   * @param {string} targetColumnId - Target column ID
   * @param {number} newPosition - New position in column
   */
  async function handleMoveTask(taskId, targetColumnId, newPosition) {
    try {
      await apiFetch(`/tasks/${taskId}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          target_column_id: targetColumnId,
          new_position: newPosition,
        }),
      });
      await fetchBoard();
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  }

  /**
   * Opens confirmation modal for deleting a specific task
   * @param {string} taskId - Task ID to delete
   */
  function handleDeleteTaskClick(taskId) {
    setTaskToDelete(taskId);
    setShowDeleteTaskModal(true);
  }

  /**
   * Deletes a specific task after confirmation
   */
  async function handleDeleteTask() {
    if (!taskToDelete) return;

    try {
      await apiFetch(`/tasks/${taskToDelete}`, { method: "DELETE" });
      await fetchBoard();
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  /**
   * Deletes all tasks in the DONE column
   */
  async function handleDeleteDoneTasks() {
    try {
      await apiFetch("/me/board/remove-done-tasks", { method: "POST" });
      await fetchBoard();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Failed to delete done tasks:", err);
    }
  }

  if (loading) {
    return (
      <div className="board-loading" data-testid="board-loading">
        Loading board...
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-error" data-testid="board-error">
        {error}
      </div>
    );
  }

  return (
    <div className="board-page" data-testid="board-page">
      <BoardHeader
        userName={user?.name}
        onCreateTask={() => setShowCreateModal(true)}
        onDeleteDone={() => setShowDeleteModal(true)}
      />

      <KanbanBoard
        columns={board?.columns || []}
        tasks={board?.tasks || []}
        onMoveTask={handleMoveTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTaskClick}
      />

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Done Tasks"
          message="Are you sure you want to delete all tasks in the DONE column? This action cannot be undone."
          onConfirm={handleDeleteDoneTasks}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showDeleteTaskModal && (
        <ConfirmationModal
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDeleteTask}
          onCancel={() => {
            setShowDeleteTaskModal(false);
            setTaskToDelete(null);
          }}
        />
      )}
    </div>
  );
}
