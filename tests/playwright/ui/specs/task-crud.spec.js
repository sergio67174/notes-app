import { test, expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";

/**
 * ============================================================================
 * TASK CRUD OPERATIONS TEST SUITE
 * ============================================================================
 *
 * Test Coverage Summary:
 * ----------------------
 * - Task Creation (TC-CRUD-001 to TC-CRUD-005)
 * - Task Editing (TC-CRUD-006 to TC-CRUD-010)
 * - Task Deletion (TC-CRUD-011 to TC-CRUD-013)
 *
 * Requirements Covered:
 * ---------------------
 * - REQ-TASK-001: Create task with title and description
 * - REQ-TASK-002: Create task with title only (optional description)
 * - REQ-TASK-003: Validate task creation (empty title)
 * - REQ-TASK-004: New tasks appear in TODO column by default
 * - REQ-TASK-005: Tasks display with pastel color coding
 * - REQ-TASK-006: Edit task title inline
 * - REQ-TASK-007: Edit task description inline
 * - REQ-TASK-008: Edit both title and description
 * - REQ-TASK-009: Cancel edit operation reverts changes
 * - REQ-TASK-010: Delete task shows confirmation modal
 * - REQ-TASK-011: Confirm delete removes task from board
 * - REQ-TASK-012: Cancel delete preserves task on board
 * - REQ-TASK-013: Multiple tasks can be created
 *
 * API Endpoints Tested:
 * ---------------------
 * - POST /tasks - Create new task
 * - PATCH /tasks/:id - Update existing task
 * - DELETE /tasks/:id - Soft delete task
 * - GET /me/board - Retrieve tasks in board
 *
 * Test Scenarios:
 * ---------------
 * 1. Create operations (valid/invalid inputs)
 * 2. Read operations (verify task display)
 * 3. Update operations (title, description, both)
 * 4. Delete operations (confirm, cancel)
 * 5. Edge cases (whitespace, multiple tasks, color assignment)
 *
 * Test Data:
 * ----------
 * - Unique email per test to ensure isolation
 * - Password: "Password123!"
 * - Various task titles and descriptions
 *
 * Dependencies:
 * -------------
 * - BoardPage POM
 * - Backend CRUD endpoints for tasks
 * - Task soft-delete functionality
 *
 * ============================================================================
 */

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `tasktest_${Date.now()}@example.com`;
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
    name: "Task CRUD User",
    email,
    password: "Password123!",
  });

  await boardPage.expectBoardLoaded();
  return boardPage;
}

test.describe("Task CRUD Operations", () => {
  /**
   * TC-CRUD-001: Verify task creation with complete information
   *
   * Requirement: REQ-TASK-001
   * Scenario: Create task with both title and description
   *
   * Steps:
   * 1. Authenticate and navigate to board
   * 2. Click create task button
   * 3. Fill title: "Buy groceries"
   * 4. Fill description: "Milk, bread, and eggs"
   * 5. Submit form
   *
   * Expected Result:
   * - Task appears in TODO column
   * - Task displays with correct title
   * - Task count in TODO column is 1
   *
   * @priority High
   * @category Task Creation
   */
  test("create task with title and description", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.createTask("Buy groceries", "Milk, bread, and eggs");

    // Task should be visible
    await boardPage.expectTaskVisible("Buy groceries");

    // Task should be in TODO column
    await boardPage.expectColumnTaskCount("TODO", 1);
  });

  /**
   * Test creating a task with title only (no description).
   */
  test("create task with title only", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.createTask("Simple task");

    // Task should be visible
    await boardPage.expectTaskVisible("Simple task");
  });

  /**
   * Test that empty title shows validation error.
   */
  test("create task validation - empty title shows error", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Open modal
    await boardPage.clickCreateTask();

    // Try to submit with empty title
    await boardPage.btnModalCreate.click();

    // Modal should still be visible (validation failed)
    await expect(boardPage.createTaskModal).toBeVisible();

    // Error message should show
    await expect(boardPage.modalError).toBeVisible();
  });

  /**
   * Test that created task appears in TODO column by default.
   */
  test("created task appears in TODO column", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("New Task");

    // Should be in TODO column
    const todoCount = await boardPage.getTaskCountInColumn("TODO");
    expect(todoCount).toBe(1);

    // Should not be in other columns
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);
    await boardPage.expectColumnTaskCount("DONE", 0);
  });

  /**
   * Test that task displays with a color (pastel color).
   */
  test("task displays with pastel color", async ({ page }) => {
    const boardPage = await setupBoard(page);

    await boardPage.createTask("Colored Task");

    // Find the task card
    const taskCard = await boardPage.getTaskCardByTitle("Colored Task");

    // Task card should have a class with color
    const className = await taskCard.getAttribute("class");
    expect(className).toMatch(/pastel-(yellow|pink|green|blue)/);
  });

  /**
   * Test editing task title via inline edit.
   */
  test("edit task title inline", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task first
    await boardPage.createTask("Original Title", "Original Description");

    // Get task card to find ID
    const taskCard = await boardPage.getTaskCardByTitle("Original Title");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Edit the title
    await boardPage.editTaskInline(id, "Updated Title");

    // New title should be visible
    await boardPage.expectTaskVisible("Updated Title");

    // Old title should not be visible
    await boardPage.expectTaskNotVisible("Original Title");
  });

  /**
   * Test editing task description via inline edit.
   */
  test("edit task description inline", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task Title", "Original description");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task Title");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Edit description only
    await boardPage.editTaskInline(id, "Task Title", "Updated description");

    // Title should remain the same
    await boardPage.expectTaskVisible("Task Title");

    // Description should be updated (check in task card)
    const description = boardPage.getTaskDescription(id);
    await expect(description).toHaveText("Updated description");
  });

  /**
   * Test editing both title and description.
   */
  test("edit both title and description", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create task
    await boardPage.createTask("Old Title", "Old description");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Old Title");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Edit both fields
    await boardPage.editTaskInline(id, "New Title", "New description");

    // New title should be visible
    await boardPage.expectTaskVisible("New Title");

    // Old title should not be visible
    await boardPage.expectTaskNotVisible("Old Title");

    // Description should be updated
    const description = boardPage.getTaskDescription(id);
    await expect(description).toHaveText("New description");
  });

  /**
   * Test that canceling edit reverts changes.
   */
  test("cancel edit reverts changes", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create task
    await boardPage.createTask("Original Task", "Original description");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Original Task");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Open edit mode but cancel
    await boardPage.cancelEditTask(id);

    // Original task should still be visible
    await boardPage.expectTaskVisible("Original Task");
  });

  /**
   * Test that delete task shows confirmation modal.
   */
  test("delete task shows confirmation modal", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task to Delete");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task to Delete");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Click delete button
    await boardPage.getTaskDeleteBtn(id).click();

    // Confirmation modal should appear
    await expect(boardPage.confirmationModal).toBeVisible();
    await expect(boardPage.confirmationTitle).toHaveText(/delete/i);
  });

  /**
   * Test that confirming delete removes task from board.
   */
  test("confirm delete removes task from board", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task to Remove");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task to Remove");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Delete the task
    await boardPage.deleteTask(id);

    // Task should no longer be visible
    await boardPage.expectTaskNotVisible("Task to Remove");

    // TODO column should be empty
    await boardPage.expectColumnTaskCount("TODO", 0);
  });

  /**
   * Test that canceling delete keeps task on board.
   */
  test("cancel delete keeps task on board", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create a task
    await boardPage.createTask("Task to Keep");

    // Get task ID
    const taskCard = await boardPage.getTaskCardByTitle("Task to Keep");
    const id = await boardPage.getTaskIdFromCard(taskCard);

    // Cancel delete
    await boardPage.cancelDeleteTask(id);

    // Task should still be visible
    await boardPage.expectTaskVisible("Task to Keep");

    // Column should still have 1 task
    await boardPage.expectColumnTaskCount("TODO", 1);
  });

  /**
   * Test creating multiple tasks.
   */
  test("multiple tasks can be created", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Create multiple tasks
    await boardPage.createTask("Task 1");
    await boardPage.createTask("Task 2");
    await boardPage.createTask("Task 3");

    // All should be visible
    await boardPage.expectTaskVisible("Task 1");
    await boardPage.expectTaskVisible("Task 2");
    await boardPage.expectTaskVisible("Task 3");

    // Count should be 3
    await boardPage.expectColumnTaskCount("TODO", 3);
  });
});
