import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import "./TaskCard.css";

/**
 * Individual task card with drag and inline editing
 * - Displays task title and description
 * - Pencil icon to enter edit mode
 * - Garbage icon to delete task
 * - Inline editing of title and description
 * - Draggable to move between columns
 * - Transparent appearance when in DONE column
 * - Pastel color based on task.color field
 *
 * @param {Object} props
 * @param {Object} props.task - Task data { id, title, description, color }
 * @param {Function} props.onUpdateTask - Update handler (taskId, updates)
 * @param {Function} props.onDeleteTask - Delete handler (taskId)
 * @param {boolean} [props.isDone=false] - If task is in DONE column (affects transparency)
 * @param {boolean} [props.isDragging=false] - If currently being dragged (for drag overlay)
 * @returns {JSX.Element} Task card component
 */
export default function TaskCard({
  task,
  onUpdateTask,
  onDeleteTask,
  isDone = false,
  isDragging = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: task.id,
    disabled: isEditing, // Disable dragging while editing
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  /**
   * Saves edited task data
   */
  async function handleSave() {
    if (!editTitle.trim()) return;

    try {
      setIsSaving(true);
      await onUpdateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Cancels edit mode and resets form
   */
  function handleCancel() {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setIsEditing(false);
  }

  /**
   * Handles keyboard shortcuts in edit mode
   * - Escape: Cancel
   * - Ctrl+Enter: Save
   * @param {React.KeyboardEvent} e
   */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
  }

  const colorClass = `task-card-${task.color}`;
  const doneClass = isDone ? "task-card-done" : "";
  const draggingClass =
    isDragging || isCurrentlyDragging ? "task-card-dragging" : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${colorClass} ${doneClass} ${draggingClass}`}
      data-testid={`task-card-${task.id}`}
      {...(!isEditing ? attributes : {})}
      {...(!isEditing ? listeners : {})}
    >
      {!isEditing ? (
        <>
          <div className="task-actions">
            <button
              className="task-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              data-testid={`task-edit-btn-${task.id}`}
              aria-label="Edit task"
            >
              ✎
            </button>
            <button
              className="task-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              data-testid={`task-delete-btn-${task.id}`}
              aria-label="Delete task"
            >
              🗑
            </button>
          </div>
          <h3 className="task-title" data-testid={`task-title-${task.id}`}>
            {task.title}
          </h3>
          {task.description && (
            <p
              className="task-description"
              data-testid={`task-description-${task.id}`}
            >
              {task.description}
            </p>
          )}
        </>
      ) : (
        <div className="task-edit-form" data-testid={`task-edit-form-${task.id}`}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Task title"
            data-testid={`task-edit-title-${task.id}`}
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description (optional)"
            rows={3}
            data-testid={`task-edit-description-${task.id}`}
          />
          <div className="task-edit-actions">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              data-testid={`task-edit-cancel-${task.id}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !editTitle.trim()}
              data-testid={`task-edit-save-${task.id}`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
