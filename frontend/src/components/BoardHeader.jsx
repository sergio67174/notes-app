import React from "react";
import { useAuth } from "../context/AuthContext";
import "./BoardHeader.css";

/**
 * Board header component with greeting, action buttons, and logout
 * - Displays personalized greeting with user's name
 * - Create New Task button - opens modal to create a task
 * - Delete Done Tasks button - opens confirmation modal
 * - Logout button - logs out and redirects to login
 *
 * @param {Object} props
 * @param {string} props.userName - User's name for greeting
 * @param {Function} props.onCreateTask - Handler for create task button
 * @param {Function} props.onDeleteDone - Handler for delete done tasks button
 * @returns {JSX.Element} Board header component
 */
export default function BoardHeader({ userName, onCreateTask, onDeleteDone }) {
  const { logout } = useAuth();

  return (
    <header className="board-header" data-testid="board-header">
      <div className="board-header-left">
        <h1 className="board-greeting" data-testid="board-greeting">
          Hello {userName}
        </h1>
        <div className="board-actions">
          <button
            className="btn-create-task"
            onClick={onCreateTask}
            data-testid="btn-create-task"
          >
            Create New Task
          </button>
          <button
            className="btn-delete-done"
            onClick={onDeleteDone}
            data-testid="btn-delete-done"
          >
            Delete Done Tasks
          </button>
        </div>
      </div>
      <button className="btn-logout" onClick={logout} data-testid="btn-logout">
        Logout
      </button>
    </header>
  );
}
