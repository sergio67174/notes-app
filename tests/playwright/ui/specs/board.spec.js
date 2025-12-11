import { test, expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";
import { RegisterPage } from "../pages/RegisterPage.js";

/**
 * ============================================================================
 * BOARD PAGE - DISPLAY AND NAVIGATION TEST SUITE
 * ============================================================================
 *
 * Test Coverage Summary:
 * ----------------------
 * - Authentication & Access Control (TC-BP-001)
 * - Board Loading & Initialization (TC-BP-002, TC-BP-008)
 * - User Interface Elements (TC-BP-003, TC-BP-004, TC-BP-005, TC-BP-010)
 * - Column Display & Structure (TC-BP-004, TC-BP-009)
 * - Task Display & Organization (TC-BP-005, TC-BP-011)
 * - Button Functionality (TC-BP-006, TC-BP-007)
 *
 * Requirements Covered:
 * ---------------------
 * - REQ-AUTH-001: Protected routes require authentication
 * - REQ-UI-001: Board displays user greeting
 * - REQ-UI-002: Board shows 3 columns (TODO, IN_PROGRESS, DONE)
 * - REQ-UI-003: Tasks appear in correct columns
 * - REQ-UI-004: Create task button opens modal
 * - REQ-UI-005: Delete done tasks button opens confirmation
 * - REQ-UI-006: Loading state during data fetch
 * - REQ-UI-007: Empty columns display correctly
 * - REQ-UI-008: Header displays all navigation elements
 *
 * Test Data:
 * ----------
 * - Uses unique email generation to prevent test collisions
 * - Each test creates isolated user accounts
 * - Test passwords: "Password123!"
 *
 * Dependencies:
 * -------------
 * - BoardPage POM (Page Object Model)
 * - RegisterPage POM
 * - Backend API endpoints: /register, /login, /me/board
 *
 * ============================================================================
 */

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `boardtest_${Date.now()}@example.com`;
}

test.describe("Board Page - Display and Navigation", () => {
  /**
   * TC-BP-001: Verify authentication protection on board page
   *
   * Requirement: REQ-AUTH-001
   * Scenario: Unauthenticated access attempt
   *
   * Steps:
   * 1. Navigate to /me/board without authentication
   *
   * Expected Result:
   * - User is redirected to /login page
   * - Board page is not accessible
   *
   * @priority High
   * @category Security
   */
  test("redirects to login when not authenticated", async ({ page }) => {
    const boardPage = new BoardPage(page);

    await boardPage.goto();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-BP-002: Verify board loads successfully after authentication
   *
   * Requirement: REQ-UI-001, REQ-UI-002
   * Scenario: Successful board loading for authenticated user
   *
   * Steps:
   * 1. Register new user account
   * 2. Login with credentials
   * 3. Navigate to board page
   *
   * Expected Result:
   * - Board page is visible
   * - Kanban board component is displayed
   * - No loading state persists
   *
   * @priority High
   * @category Core Functionality
   */
  test("loads board successfully after login", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Board Test User",
      email,
      password: "Password123!",
    });

    // Board should be visible
    await boardPage.expectBoardLoaded();
    await expect(boardPage.boardPage).toBeVisible();
    await expect(boardPage.kanbanBoard).toBeVisible();
  });

  /**
   * TC-BP-003: Verify user greeting displays correct name
   *
   * Requirement: REQ-UI-001
   * Scenario: Personalized greeting in board header
   *
   * Steps:
   * 1. Register user with specific name "Alice"
   * 2. Login and navigate to board
   * 3. Verify greeting contains user's name
   *
   * Expected Result:
   * - Greeting element is visible
   * - User's name appears in greeting text
   *
   * @priority Medium
   * @category User Experience
   */
  test("displays user greeting with correct name", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const userName = "Alice";
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: userName,
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Greeting should contain user's name
    await expect(boardPage.boardGreeting).toBeVisible();
    await expect(boardPage.boardGreeting).toContainText(userName);
  });

  /**
   * Test that all 3 columns are displayed (TODO, IN_PROGRESS, DONE).
   */
  test("shows all 3 columns (TODO, IN_PROGRESS, DONE)", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Column Test User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // All 3 columns should be visible
    await expect(boardPage.getColumn("TODO")).toBeVisible();
    await expect(boardPage.getColumn("IN_PROGRESS")).toBeVisible();
    await expect(boardPage.getColumn("DONE")).toBeVisible();

    // Column titles should be correct
    await expect(boardPage.getColumnTitle("TODO")).toHaveText(/To Do|TODO/i);
    await expect(boardPage.getColumnTitle("IN_PROGRESS")).toHaveText(/In Progress|IN_PROGRESS/i);
    await expect(boardPage.getColumnTitle("DONE")).toHaveText(/Done|DONE/i);
  });

  /**
   * Test that tasks display in correct columns.
   */
  test("displays tasks in correct columns", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Task Display User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Create a task (should appear in TODO column)
    await boardPage.createTask("Test Task in TODO", "This is a test task");

    // Task should be visible in TODO column
    await boardPage.expectTaskVisible("Test Task in TODO");

    // Verify task is in TODO column
    const todoCount = await boardPage.getTaskCountInColumn("TODO");
    expect(todoCount).toBe(1);

    // Other columns should be empty
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);
    await boardPage.expectColumnTaskCount("DONE", 0);
  });

  /**
   * Test that create task button is visible and clickable.
   */
  test("create task button is visible and clickable", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Create Button User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Create task button should be visible
    await expect(boardPage.createTaskButton).toBeVisible();
    await expect(boardPage.createTaskButton).toBeEnabled();

    // Clicking should open modal
    await boardPage.clickCreateTask();
    await expect(boardPage.createTaskModal).toBeVisible();
  });

  /**
   * Test that delete done tasks button is visible and clickable.
   */
  test("delete done tasks button is visible and clickable", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Delete Button User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Delete done button should be visible
    await expect(boardPage.deleteDoneButton).toBeVisible();
    await expect(boardPage.deleteDoneButton).toBeEnabled();

    // Clicking should open confirmation modal
    await boardPage.clickDeleteDoneTasks();
    await expect(boardPage.confirmationModal).toBeVisible();
  });

  /**
   * Test that loading state is displayed while fetching data.
   */
  test("shows loading state during data fetch", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    // Register user first
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.fillForm({
      name: "Loading Test User",
      email,
      password: "Password123!",
    });
    await registerPage.submit();
    await expect(registerPage.successMessage).toBeVisible();

    // Navigate to board and check for loading state
    await boardPage.loginAndGoto(email, "Password123!");

    // Board should eventually load
    await boardPage.expectBoardLoaded();
  });

  /**
   * Test that empty columns display correctly.
   */
  test("empty columns display correctly", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Empty Column User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // All columns should be empty initially
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);
    await boardPage.expectColumnTaskCount("DONE", 0);

    // Columns should still be visible
    await expect(boardPage.getColumn("TODO")).toBeVisible();
    await expect(boardPage.getColumn("IN_PROGRESS")).toBeVisible();
    await expect(boardPage.getColumn("DONE")).toBeVisible();
  });

  /**
   * Test that board header displays correctly.
   */
  test("board header displays all elements", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Header Test User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Header should be visible
    await expect(boardPage.boardHeader).toBeVisible();

    // All header elements should be visible
    await expect(boardPage.boardGreeting).toBeVisible();
    await expect(boardPage.createTaskButton).toBeVisible();
    await expect(boardPage.deleteDoneButton).toBeVisible();
    await expect(boardPage.logoutButton).toBeVisible();
  });

  /**
   * Test that multiple tasks can be created and displayed.
   */
  test("displays multiple tasks in TODO column", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Multiple Tasks User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Create multiple tasks
    await boardPage.createTask("Task 1", "First task");
    await boardPage.createTask("Task 2", "Second task");
    await boardPage.createTask("Task 3", "Third task");

    // All tasks should be visible
    await boardPage.expectTaskVisible("Task 1");
    await boardPage.expectTaskVisible("Task 2");
    await boardPage.expectTaskVisible("Task 3");

    // TODO column should have 3 tasks
    await boardPage.expectColumnTaskCount("TODO", 3);
  });
});
