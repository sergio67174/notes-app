import React from "react";
import "./ConfirmationModal.css";

/**
 * Generic confirmation modal
 * - Displays a title and message
 * - Cancel button - closes modal without action
 * - Confirm button - executes action and closes modal
 * - Clicking overlay also closes modal
 *
 * @param {Object} props
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Function} props.onCancel - Cancel handler
 * @returns {JSX.Element} Confirmation modal component
 */
export default function ConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="modal-overlay"
      data-testid="confirmation-overlay"
      onClick={onCancel}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        data-testid="confirmation-modal"
      >
        <h2 data-testid="confirmation-title">{title}</h2>
        <p data-testid="confirmation-message">{message}</p>

        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onCancel}
            data-testid="btn-cancel-confirm"
          >
            Cancel
          </button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            data-testid="btn-confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
