import { test, expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";

/**
 * ============================================================================
 * BOARD HEADER UI TEST SUITE
 * ============================================================================
 *
 * Test Coverage Summary:
 * ----------------------
 * - User Display (TC-HDR-001, TC-HDR-002)
 * - Navigation Buttons (TC-HDR-003, TC-HDR-004, TC-HDR-005)
 * - State Persistence (TC-HDR-006 to TC-HDR-009)
 * - Functional Stability (TC-HDR-010)
 * - Visual Stability (TC-HDR-011)
 *
 * Requirements Covered:
 * ---------------------
 * - REQ-HDR-001: Display user's name in header greeting
 * - REQ-HDR-002: Show welcoming message (Hello/Welcome)
 * - REQ-HDR-003: Create task button accessible and functional
 * - REQ-HDR-004: Delete done tasks button accessible and functional
 * - REQ-HDR-005: Logout button functional and redirects to login
 * - REQ-HDR-006 to REQ-HDR-009: Header persists during all board operations
 * - REQ-HDR-010: All buttons remain functional after interactions
 * - REQ-HDR-011: Header layout remains stable
 *
 * Header Components:
 * ------------------
 * 1. **User Greeting** - Displays "Welcome {name}" or similar
 * 2. **Create Task Button** - Opens create task modal
 * 3. **Delete Done Tasks Button** - Opens bulk delete confirmation
 * 4. **Logout Button** - Clears session and redirects to login
 *
 * Test Scenarios:
 * ---------------
 * 1. Header content display
 * 2. Button functionality
 * 3. Header persistence across operations:
 *    - Task creation
 *    - Task editing
 *    - Task deletion
 *    - Task dragging
 * 4. Layout stability
 * 5. Functional stability after multiple interactions
 *
 * Test Data:
 * ----------
 * - Unique email per test to ensure isolation
 * - Password: "Password123!"
 * - Various user names for greeting tests
 *
 * Dependencies:
 * -------------
 * - BoardPage POM
 * - BoardHeader component
 * - Authentication system
 *
 * ============================================================================
 */

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `headertest_${Date.now()}@example.com`;
}

/**
 * Helper function to setup a board with an authenticated user.
 * @param {import('@playwright/test').Page} page
 * @param {string} name - User's name
 * @returns {Promise<BoardPage>}
 */
async function setupBoard(page, name = "Header Test User") {
  const boardPage = new BoardPage(page);
  const email = generateUniqueEmail();

  await boardPage.registerAndGoto({
    name,
    email,
    password: "Password123!",
  });

  await boardPage.expectBoardLoaded();
  return boardPage;
}

/**
 * Board Header UI Tests
 * Tests the header component including greeting, buttons, and persistence.
 */
test.describe("Board Header UI", () => {
  /**
   * Test that header displays user's name in greeting.
   */
  test("header displays user's name in greeting", async ({ page }) => {
    const userName = "Alice Johnson";
    const boardPage = await setupBoard(page, userName);

    // Header should be visible
    await expect(boardPage.boardHeader).toBeVisible();

    // Greeting should contain user's name
    await expect(boardPage.boardGreeting).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText(userName);
  });

  /**
   * Test that greeting shows appropriate message.
   */
  test("greeting shows welcome or hello message", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Greeting should have welcoming text
    const greetingText = await boardPage.boardGreeting.textContent();
    expect(greetingText.toLowerCase()).toMatch(/welcome|hello|hi/i);
  });

  /**
   * Test that create task button is present and clickable.
   */
  test("create task button is present and clickable", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Button should be visible
    await expect(boardPage.createTaskButton).toBeVisible();

    // Button should be enabled
    await expect(boardPage.createTaskButton).toBeEnabled();

    // Click should open modal
    await boardPage.createTaskButton.click();
    await expect(boardPage.createTaskModal).toBeVisible();
  });

  /**
   * Test that delete done tasks button is present and clickable.
   */
  test("delete done tasks button is present and clickable", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Button should be visible
    await expect(boardPage.deleteDoneButton).toBeVisible();

    // Button should be enabled
    await expect(boardPage.deleteDoneButton).toBeEnabled();

    // Click should open confirmation modal
    await boardPage.deleteDoneButton.click();
    await expect(boardPage.confirmationModal).toBeVisible();
  });

  /**
   * Test that logout button is present and clickable.
   */
  test("logout button is present and clickable", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Button should be visible
    await expect(boardPage.logoutButton).toBeVisible();

    // Button should be enabled
    await expect(boardPage.logoutButton).toBeEnabled();

    // Click should redirect to login
    await boardPage.logoutButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * Test that header persists after creating a task.
   */
  test("header persists after creating a task", async ({ page }) => {
    const boardPage = await setupBoard(page, "Bob Smith");

    // Verify header is visible
    await expect(boardPage.boardHeader).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText("Bob Smith");

    // Create a task
    await boardPage.createTask("Test Task");

    // Header should still be visible with same content
    await expect(boardPage.boardHeader).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText("Bob Smith");
    await expect(boardPage.createTaskButton).toBeVisible();
    await expect(boardPage.deleteDoneButton).toBeVisible();
    await expect(boardPage.logoutButton).toBeVisible();
  });

  /**
   * Test that header persists after editing a task.
   */
  test("header persists after editing a task", async ({ page }) => {
    const boardPage = await setupBoard(page, "Charlie Brown");

    // Create a task
    await boardPage.createTask("Original Task");

    // Get task ID and edit it
    const taskCard = await boardPage.getTaskCardByTitle("Original Task");
    const taskId = await boardPage.getTaskIdFromCard(taskCard);
    await boardPage.editTaskInline(taskId, "Edited Task");

    // Header should still be visible
    await expect(boardPage.boardHeader).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText("Charlie Brown");
  });

  /**
   * Test that header persists after deleting a task.
   */
  test("header persists after deleting a task", async ({ page }) => {
    const boardPage = await setupBoard(page, "Diana Prince");

    // Create and delete a task
    await boardPage.createTask("Task to Delete");
    const taskCard = await boardPage.getTaskCardByTitle("Task to Delete");
    const taskId = await boardPage.getTaskIdFromCard(taskCard);
    await boardPage.deleteTask(taskId);

    // Header should still be visible
    await expect(boardPage.boardHeader).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText("Diana Prince");
  });

  /**
   * Test that header persists after dragging a task.
   */
  test("header persists after dragging a task", async ({ page }) => {
    const boardPage = await setupBoard(page, "Eve Anderson");

    // Create and drag a task
    await boardPage.createTask("Draggable Task");
    await boardPage.dragTaskToColumn("Draggable Task", "IN_PROGRESS");

    // Header should still be visible
    await expect(boardPage.boardHeader).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText("Eve Anderson");
  });

  /**
   * Test that all header buttons remain functional after interactions.
   */
  test("all header buttons remain functional after interactions", async ({
    page,
  }) => {
    const boardPage = await setupBoard(page);

    // Perform various interactions
    await boardPage.createTask("Task 1");
    await boardPage.createTask("Task 2");
    const taskCard = await boardPage.getTaskCardByTitle("Task 1");
    const taskId = await boardPage.getTaskIdFromCard(taskCard);
    await boardPage.editTaskInline(taskId, "Edited Task 1");

    // All buttons should still be enabled
    await expect(boardPage.createTaskButton).toBeEnabled();
    await expect(boardPage.deleteDoneButton).toBeEnabled();
    await expect(boardPage.logoutButton).toBeEnabled();

    // Test create button still works
    await boardPage.createTaskButton.click();
    await expect(boardPage.createTaskModal).toBeVisible();
    await boardPage.btnModalCancel.click();

    // Test delete done button still works
    await boardPage.deleteDoneButton.click();
    await expect(boardPage.confirmationModal).toBeVisible();
    await boardPage.btnCancelConfirm.click();
  });

  /**
   * Test that header is visible on page load.
   */
  test("header is visible immediately on page load", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Header should be visible without needing to wait
    await expect(boardPage.boardHeader).toBeVisible();
  });

  /**
   * Test that header maintains layout during board operations.
   */
  test("header maintains layout during board operations", async ({ page }) => {
    const boardPage = await setupBoard(page);

    // Get initial header position
    const initialBox = await boardPage.boardHeader.boundingBox();
    expect(initialBox).not.toBeNull();

    // Perform operations
    await boardPage.createTask("Task 1");
    await boardPage.createTask("Task 2");
    await boardPage.createTask("Task 3");

    // Header position should remain stable
    const afterBox = await boardPage.boardHeader.boundingBox();
    expect(afterBox).not.toBeNull();
    expect(afterBox.y).toBe(initialBox.y); // Same vertical position
  });
});
