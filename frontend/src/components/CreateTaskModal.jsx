import React, { useState } from "react";
import "./CreateTaskModal.css";

/**
 * Modal for creating a new task
 * - Title input (required)
 * - Description textarea (optional)
 * - Cancel button (X) - closes modal without saving
 * - Create button - saves task and closes modal
 * - Clicking overlay also closes modal
 *
 * @param {Object} props
 * @param {Function} props.onClose - Close modal handler
 * @param {Function} props.onCreate - Create task handler (title, description) => Promise
 * @returns {JSX.Element} Create task modal component
 */
export default function CreateTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles form submission
   * @param {React.FormEvent} e
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onCreate(title.trim(), description.trim());
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        data-testid="create-task-modal"
      >
        <button
          className="modal-close"
          onClick={onClose}
          data-testid="modal-close"
        >
          ×
        </button>

        <h2 data-testid="modal-title">Create New Task</h2>

        <form onSubmit={handleSubmit} data-testid="create-task-form">
          <div className="modal-field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              data-testid="input-task-title"
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows={4}
              data-testid="input-task-description"
            />
          </div>

          {error && (
            <p className="modal-error" data-testid="modal-error">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
              data-testid="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              data-testid="btn-create"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
