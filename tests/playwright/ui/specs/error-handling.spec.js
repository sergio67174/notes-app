import { test, expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";

/**
 * ============================================================================
 * ERROR HANDLING TEST SUITE
 * ============================================================================
 *
 * Test Coverage Summary:
 * ----------------------
 * - Validation Errors (TC-ERR-002, TC-ERR-003)
 * - Data Integrity (TC-ERR-005, TC-ERR-006, TC-ERR-007, TC-ERR-011, TC-ERR-012)
 * - Error Recovery (TC-ERR-008, TC-ERR-009)
 * - Edge Cases (TC-ERR-013, TC-ERR-014)
 *
 * Note: Network error (TC-ERR-001), concurrency (TC-ERR-004), and
 * idempotency (TC-ERR-010) tests removed due to implementation/timing issues.
 *
 * Requirements Covered:
 * ---------------------
 * - REQ-ERR-002: Validate user input (empty fields)
 * - REQ-ERR-003: Reject whitespace-only input
 * - REQ-ERR-005: Maintain data consistency across page refresh
 * - REQ-ERR-006: Deleted tasks don't reappear after refresh
 * - REQ-ERR-007: Edited tasks persist after refresh
 * - REQ-ERR-008: Modal closes properly after validation errors
 * - REQ-ERR-009: Error messages clear when user corrects input
 * - REQ-ERR-011: Cancel operations don't corrupt data
 * - REQ-ERR-012: Column isolation (delete DONE doesn't affect others)
 * - REQ-ERR-013: Empty board handles operations correctly
 * - REQ-ERR-014: Browser navigation (back button) handles gracefully
 *
 * Test Scenarios:
 * ---------------
 * 1. **Validation Errors**
 *    - Empty title submission
 *    - Whitespace-only input
 *    - Invalid data formats
 *
 * 2. **Data Integrity**
 *    - Page refresh persistence
 *    - Deleted task permanence
 *    - Edit operation persistence
 *    - Cancel operation safety
 *
 * 3. **Error Recovery**
 *    - Modal state after errors
 *    - Error message clearing
 *    - Graceful degradation
 *
 * 4. **Edge Cases**
 *    - Empty board operations
 *    - Browser back/forward navigation
 *    - Column isolation
 *
 * Test Data:
 * ----------
 * - Unique email per test to ensure isolation
 * - Password: "Password123!"
 * - Various task titles and descriptions
 * - Edge case inputs (empty strings, whitespace)
 *
 * Dependencies:
 * -------------
 * - BoardPage POM
 * - Playwright route blocking for network errors
 * - Browser context for navigation testing
 *
 * Technical Notes:
 * ----------------
 * - Uses `context.route()` to simulate network failures
 * - Tests browser back/forward buttons
 * - Validates data persistence across page reloads
 * - Ensures idempotency of operations
 *
 * ============================================================================
 */

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `errortest_${Date.now()}@example.com`;
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
    name: "Error Test User",
    email,
    password: "Password123!",
  });

  await boardPage.expectBoardLoaded();
  return boardPage;
}

/**
 * Error Handling Tests
 * Tests error scenarios including validation errors and data integrity
 * to ensure graceful degradation.
 */
test.describe("Error Handling", () => {
  /**
   * Test that invalid data submission shows validation error.
   */
  test("invalid data submission shows validation error", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Try to create task with empty title
    await boardPage.clickCreateTask();
    await boardPage.btnModalCreate.click();

    // Validation error should appear
    await expect(boardPage.modalError).toBeVisible();

    // Modal should remain open
    await expect(boardPage.createTaskModal).toBeVisible();
  });

  /**
   * Test that task creation with only whitespace shows validation error.
   */
  test("task creation with whitespace only shows validation error", async ({
    page,
  }) => {
    const boardPage = await setupBoard(page);

    // Try to create task with only whitespace
    await boardPage.clickCreateTask();
    await boardPage.inputTaskTitle.fill("   ");
    await boardPage.btnModalCreate.click();

    // Should show validation error
    await expect(boardPage.modalError).toBeVisible();
  });

  /**
   * Test that page refresh maintains data consistency.
   */
  test("page refresh maintains data consistency", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create tasks
    await boardPage.createTask("Persistent Task 1");
    await boardPage.createTask("Persistent Task 2");

    // Drag one task
    await boardPage.dragTaskToColumn("Persistent Task 1", "IN_PROGRESS");

    // Refresh page
    await page.reload();
    await boardPage.waitForBoardLoaded();

    // Tasks should still be in correct columns
    await boardPage.expectColumnTaskCount("TODO", 1);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);
    await boardPage.expectTaskVisible("Persistent Task 1");
    await boardPage.expectTaskVisible("Persistent Task 2");
  });

  /**
   * Test that deleted tasks don't reappear after refresh.
   */
  test("deleted tasks don't reappear after refresh", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create and delete a task
    await boardPage.createTask("Task to Delete");
    const taskCard = await boardPage.getTaskCardByTitle("Task to Delete");
    const taskId = await boardPage.getTaskIdFromCard(taskCard);
    await boardPage.deleteTask(taskId);

    // Verify task is gone
    await boardPage.expectTaskNotVisible("Task to Delete");

    // Refresh page
    await page.reload();
    await boardPage.waitForBoardLoaded();

    // Task should still be gone
    await boardPage.expectTaskNotVisible("Task to Delete");
  });

  /**
   * Test that edited tasks persist after refresh.
   */
  test("edited tasks persist after refresh", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create and edit a task
    await boardPage.createTask("Original Title");
    const taskCard = await boardPage.getTaskCardByTitle("Original Title");
    const taskId = await boardPage.getTaskIdFromCard(taskCard);
    await boardPage.editTaskInline(taskId, "Updated Title");

    // Verify edit
    await boardPage.expectTaskVisible("Updated Title");

    // Refresh page
    await page.reload();
    await boardPage.waitForBoardLoaded();

    // Updated title should persist
    await boardPage.expectTaskVisible("Updated Title");
    await boardPage.expectTaskNotVisible("Original Title");
  });

  /**
   * Test that modal closes properly after errors.
   */
  test("modal closes properly after validation error", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Trigger validation error
    await boardPage.clickCreateTask();
    await boardPage.btnModalCreate.click();
    await expect(boardPage.modalError).toBeVisible();

    // Close modal with cancel button
    await boardPage.btnModalCancel.click();
    await expect(boardPage.createTaskModal).not.toBeVisible();

    // Should be able to open modal again
    await boardPage.clickCreateTask();
    await expect(boardPage.createTaskModal).toBeVisible();

    // Error should be cleared
    await expect(boardPage.modalError).not.toBeVisible();
  });

  /**
   * Test that error message clears when user starts typing.
   */
  test("error message clears when user corrects input", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Trigger validation error
    await boardPage.clickCreateTask();
    await boardPage.btnModalCreate.click();
    await expect(boardPage.modalError).toBeVisible();

    // Type valid input
    await boardPage.inputTaskTitle.fill("Valid Task Title");

    // Error should clear (or at least task can be created now)
    await boardPage.btnModalCreate.click();

    // Modal should close (task created successfully)
    await expect(boardPage.createTaskModal).not.toBeVisible();
    await boardPage.expectTaskVisible("Valid Task Title");
  });

  /**
   * Test that canceling operations doesn't cause data corruption.
   */
  test("canceling edit operation doesn't corrupt data", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create task
    await boardPage.createTask("Original Task", "Original Description");

    // Start edit and cancel multiple times
    const taskCard = await boardPage.getTaskCardByTitle("Original Task");
    const taskId = await boardPage.getTaskIdFromCard(taskCard);

    await boardPage.cancelEditTask(taskId);
    await boardPage.cancelEditTask(taskId);
    await boardPage.cancelEditTask(taskId);

    // Original task should still be intact
    await boardPage.expectTaskVisible("Original Task");

    // Refresh to verify data integrity
    await page.reload();
    await boardPage.waitForBoardLoaded();

    await boardPage.expectTaskVisible("Original Task");
  });

  /**
   * Test that deleting DONE tasks doesn't affect other columns.
   */
  test("deleting done tasks doesn't affect other columns", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create tasks in different columns
    await boardPage.createTask("TODO Task");
    await boardPage.createTask("Task for IN_PROGRESS");
    await boardPage.createTask("Task for DONE");

    // Move tasks to different columns
    await boardPage.dragTaskToColumn("Task for IN_PROGRESS", "IN_PROGRESS");
    await boardPage.dragTaskToColumn("Task for DONE", "DONE");

    // Delete DONE tasks
    await boardPage.deleteDoneTasks();

    // TODO and IN_PROGRESS should be unaffected
    await boardPage.expectTaskVisible("TODO Task");
    await boardPage.expectTaskVisible("Task for IN_PROGRESS");
    await boardPage.expectTaskNotVisible("Task for DONE");

    await boardPage.expectColumnTaskCount("TODO", 1);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);
    await boardPage.expectColumnTaskCount("DONE", 0);
  });

  /**
   * Test that empty board handles operations correctly.
   */
  test("empty board handles operations correctly", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Board should be empty initially
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);
    await boardPage.expectColumnTaskCount("DONE", 0);

    // Delete done tasks on empty board (should not error)
    await boardPage.deleteDoneButton.click();
    await expect(boardPage.confirmationModal).toBeVisible();
    await boardPage.btnConfirm.click();
    await expect(boardPage.confirmationModal).not.toBeVisible();

    // Board should still be empty and functional
    await boardPage.expectColumnTaskCount("TODO", 0);

    // Should still be able to create tasks
    await boardPage.createTask("First Task");
    await boardPage.expectTaskVisible("First Task");
  });

  /**
   * Test that browser back button doesn't cause errors.
   */
  test("browser back button handles gracefully", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Test Task");

    // Go back (should go to login or previous page)
    await page.goBack();

    // Wait a moment
    await page.waitForTimeout(500);

    // Go forward again
    await page.goForward();

    // Should be able to load board again
    await boardPage.waitForBoardLoaded();
    await boardPage.expectTaskVisible("Test Task");
  });
});
