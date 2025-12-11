import { test, expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";

/**
 * ============================================================================
 * MODAL INTERACTIONS TEST SUITE
 * ============================================================================
 *
 * Test Coverage Summary:
 * ----------------------
 * - Create Task Modal (TC-MOD-001 to TC-MOD-005, TC-MOD-011 to TC-MOD-013)
 * - Delete Confirmation Modal (TC-MOD-006 to TC-MOD-010)
 * - Modal Controls & Behavior (TC-MOD-011 to TC-MOD-013)
 *
 * Requirements Covered:
 * ---------------------
 * - REQ-MOD-001: Create task modal opens on button click
 * - REQ-MOD-002: Modal contains required input fields (title, description)
 * - REQ-MOD-003: Modal validates empty title submission
 * - REQ-MOD-004: Modal closes on cancel action
 * - REQ-MOD-005: Modal closes after successful task creation
 * - REQ-MOD-006: Delete confirmation modal displays on delete click
 * - REQ-MOD-007: Confirmation modal has confirm and cancel buttons
 * - REQ-MOD-008: Cancel button closes confirmation without deleting
 * - REQ-MOD-009: Confirm button executes deletion and closes modal
 * - REQ-MOD-010: Bulk delete confirmation modal works correctly
 * - REQ-MOD-011: Close button (X) dismisses modal
 * - REQ-MOD-012: Clicking outside modal (overlay) closes it
 * - REQ-MOD-013: Form state resets when modal is reopened
 *
 * Modal Types:
 * ------------
 * 1. **Create Task Modal** (`create-task-modal`)
 *    - Inputs: title (required), description (optional)
 *    - Buttons: Cancel, Create
 *    - Validation: Empty title shows error
 *
 * 2. **Confirmation Modal** (`confirmation-modal`)
 *    - Types: Delete single task, Delete all DONE tasks
 *    - Buttons: Cancel, Confirm
 *    - No input fields
 *
 * Test Scenarios:
 * ---------------
 * 1. Modal Opening/Closing
 * 2. Form Input Validation
 * 3. Successful Submissions
 * 4. Modal State Management
 * 5. Overlay Interactions
 * 6. Form Reset Behavior
 *
 * Test Data:
 * ----------
 * - Unique email per test to ensure isolation
 * - Password: "Password123!"
 * - Various task titles for testing
 *
 * Dependencies:
 * -------------
 * - BoardPage POM
 * - CreateTaskModal component
 * - ConfirmationModal component
 * - Modal overlay click detection
 *
 * ============================================================================
 */

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `modaltest_${Date.now()}@example.com`;
}

/**
 * Helper function to setup a board with an authenticated user.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<BoardPage>}
 */
async function setupBoard(page) {
  const boardPage = new BoardPage(page);
  const email = generateUniqueEmail();

  await boardPage.registerAndGoto({
    name: "Modal Test User",
    email,
    password: "Password123!",
  });

  await boardPage.expectBoardLoaded();
  return boardPage;
}

test.describe("Modal Interactions", () => {
  /**
   * Test that create task modal opens on button click.
   */
  test("create task modal opens on button click", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Modal should not be visible initially
    await expect(boardPage.createTaskModal).not.toBeVisible();

    // Click create task button
    await boardPage.createTaskButton.click();

    // Modal should be visible
    await expect(boardPage.createTaskModal).toBeVisible();
    await expect(boardPage.modalOverlay).toBeVisible();
  });

  /**
   * Test that create task modal has title and description inputs.
   */
  test("create task modal has title and description inputs", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.clickCreateTask();

    // Modal should have title
    await expect(boardPage.modalTitle).toBeVisible();
    await expect(boardPage.modalTitle).toHaveText(/create/i);

    // Modal should have input fields
    await expect(boardPage.inputTaskTitle).toBeVisible();
    await expect(boardPage.inputTaskDescription).toBeVisible();

    // Modal should have buttons
    await expect(boardPage.btnModalCancel).toBeVisible();
    await expect(boardPage.btnModalCreate).toBeVisible();
  });

  /**
   * Test that submitting with empty title shows validation error.
   */
  test("create task modal shows error with empty title", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.clickCreateTask();

    // Button is always enabled, but submitting with empty title should show error
    await expect(boardPage.btnModalCreate).toBeEnabled();

    // Try to submit with empty title
    await boardPage.btnModalCreate.click();

    // Modal should still be visible (submission failed)
    await expect(boardPage.createTaskModal).toBeVisible();

    // Error message should appear
    await expect(boardPage.modalError).toBeVisible();
  });

  /**
   * Test that create task modal closes on cancel.
   */
  test("create task modal closes on cancel", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.clickCreateTask();
    await expect(boardPage.createTaskModal).toBeVisible();

    // Click cancel
    await boardPage.btnModalCancel.click();

    // Modal should close
    await expect(boardPage.createTaskModal).not.toBeVisible();
    await expect(boardPage.modalOverlay).not.toBeVisible();
  });

  /**
   * Test that create task modal closes after successful submit.
   */
  test("create task modal closes after successful submit", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.clickCreateTask();

    // Fill in task details
    await boardPage.inputTaskTitle.fill("Test Task");
    await boardPage.inputTaskDescription.fill("Test Description");

    // Submit
    await boardPage.btnModalCreate.click();

    // Modal should close
    await expect(boardPage.createTaskModal).not.toBeVisible();

    // Task should be created
    await boardPage.expectTaskVisible("Test Task");
  });

  /**
   * Test that delete task confirmation modal opens on delete click.
   */
  test("delete task confirmation modal opens on delete click", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task to delete
    await boardPage.createTask("Task to Delete");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task to Delete");
    const taskId = await taskCard.getAttribute("data-testid");
    const id = taskId.replace("task-card-", "");

    // Click delete button
    await boardPage.getTaskDeleteBtn(id).click();

    // Confirmation modal should appear
    await expect(boardPage.confirmationModal).toBeVisible();
    await expect(boardPage.confirmationOverlay).toBeVisible();
  });

  /**
   * Test that delete confirmation modal has confirm and cancel buttons.
   */
  test("delete task confirmation has confirm and cancel buttons", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task for Modal Test");

    // Get task ID and click delete
    const taskCard = await boardPage.getTaskCardByTitle("Task for Modal Test");
    const taskId = await taskCard.getAttribute("data-testid");
    const id = taskId.replace("task-card-", "");

    await boardPage.getTaskDeleteBtn(id).click();

    // Modal should have title, message, and buttons
    await expect(boardPage.confirmationTitle).toBeVisible();
    await expect(boardPage.confirmationMessage).toBeVisible();
    await expect(boardPage.btnCancelConfirm).toBeVisible();
    await expect(boardPage.btnConfirm).toBeVisible();

    // Title should indicate deletion
    await expect(boardPage.confirmationTitle).toHaveText(/delete/i);
  });

  /**
   * Test that delete confirmation modal closes on cancel.
   */
  test("delete task confirmation closes on cancel", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task to Keep");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task to Keep");
    const taskId = await taskCard.getAttribute("data-testid");
    const id = taskId.replace("task-card-", "");

    // Open delete confirmation
    await boardPage.getTaskDeleteBtn(id).click();
    await expect(boardPage.confirmationModal).toBeVisible();

    // Cancel
    await boardPage.btnCancelConfirm.click();

    // Modal should close
    await expect(boardPage.confirmationModal).not.toBeVisible();

    // Task should still exist
    await boardPage.expectTaskVisible("Task to Keep");
  });

  /**
   * Test that delete confirmation completes on confirm.
   */
  test("delete task confirmation completes on confirm", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task to Remove");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task to Remove");
    const taskId = await taskCard.getAttribute("data-testid");
    const id = taskId.replace("task-card-", "");

    // Open delete confirmation
    await boardPage.getTaskDeleteBtn(id).click();
    await expect(boardPage.confirmationModal).toBeVisible();

    // Confirm deletion
    await boardPage.btnConfirm.click();

    // Modal should close
    await expect(boardPage.confirmationModal).not.toBeVisible();

    // Task should be removed
    await boardPage.expectTaskNotVisible("Task to Remove");
  });

  /**
   * Test that delete done tasks confirmation modal works correctly.
   */
  test("delete done tasks confirmation modal works correctly", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task and move it to DONE
    await boardPage.createTask("Done Task");
    await boardPage.dragTaskToColumn("Done Task", "DONE");
    await boardPage.expectColumnTaskCount("DONE", 1);

    // Click delete done button
    await boardPage.deleteDoneButton.click();

    // Confirmation modal should appear
    await expect(boardPage.confirmationModal).toBeVisible();
    await expect(boardPage.confirmationTitle).toHaveText(/delete/i);
    await expect(boardPage.confirmationMessage).toContainText(/done/i);

    // Confirm deletion
    await boardPage.btnConfirm.click();

    // Modal should close
    await expect(boardPage.confirmationModal).not.toBeVisible();

    // DONE column should be empty
    await boardPage.expectColumnTaskCount("DONE", 0);
  });

  /**
   * Test that modal close button (X) closes the modal.
   */
  test("modal close button (X) closes create task modal", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.clickCreateTask();
    await expect(boardPage.createTaskModal).toBeVisible();

    // Click the X button
    await boardPage.modalClose.click();

    // Modal should close
    await expect(boardPage.createTaskModal).not.toBeVisible();
  });

  /**
   * Test that clicking overlay closes the create task modal.
   */
  test("clicking overlay closes create task modal", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.clickCreateTask();
    await expect(boardPage.createTaskModal).toBeVisible();

    // Click on the overlay (outside modal)
    await boardPage.modalOverlay.click({ position: { x: 10, y: 10 } });

    // Modal should close
    await expect(boardPage.createTaskModal).not.toBeVisible();
  });

  /**
   * Test that form resets when modal is reopened.
   */
  test("create task form resets when modal is reopened", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Open modal and fill in data
    await boardPage.clickCreateTask();
    await boardPage.inputTaskTitle.fill("Test Title");
    await boardPage.inputTaskDescription.fill("Test Description");

    // Close modal
    await boardPage.btnModalCancel.click();

    // Reopen modal
    await boardPage.clickCreateTask();

    // Fields should be empty
    await expect(boardPage.inputTaskTitle).toHaveValue("");
    await expect(boardPage.inputTaskDescription).toHaveValue("");
  });
});
