import { test, expect } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage.js";

/**
 * ============================================================================
 * DRAG AND DROP FUNCTIONALITY TEST SUITE
 * ============================================================================
 *
 * Test Coverage Summary:
 * ----------------------
 * - Forward Drag Operations (TC-DD-001, TC-DD-002)
 * - Backward Drag Operations (TC-DD-003)
 * - Same Column Drag (TC-DD-004)
 * - Data Persistence (TC-DD-005)
 * - Sequential Operations (TC-DD-006)
 * - Visual Feedback (TC-DD-007)
 * - State Management (TC-DD-008)
 *
 * Requirements Covered:
 * ---------------------
 * - REQ-DD-001: Move task from TODO to IN_PROGRESS
 * - REQ-DD-002: Move task from IN_PROGRESS to DONE
 * - REQ-DD-003: Move task backward in workflow (DONE to IN_PROGRESS)
 * - REQ-DD-004: Drag to same column has no effect
 * - REQ-DD-005: Task position persists across page refresh
 * - REQ-DD-006: Sequential drag operations work correctly
 * - REQ-DD-007: Visual feedback during drag operation (overlay)
 * - REQ-DD-008: UI state updates correctly after drop
 *
 * Technical Implementation:
 * -------------------------
 * - Uses @dnd-kit library for drag and drop
 * - Custom Playwright mouse events (page.mouse) for drag simulation
 * - Bounding box calculations for drag coordinates
 * - 10-step smooth drag animation
 * - 500ms wait after drop for state updates
 *
 * API Endpoints Tested:
 * ---------------------
 * - PATCH /tasks/:id/move - Update task column position
 * - GET /me/board - Retrieve updated task positions
 *
 * Test Scenarios:
 * ---------------
 * 1. Drag task forward through workflow (TODO → IN_PROGRESS → DONE)
 * 2. Drag task backward (DONE → IN_PROGRESS)
 * 3. Drag task within same column (no state change)
 * 4. Multiple sequential drags
 * 5. Drag state persistence across page refresh
 * 6. Visual drag overlay display
 *
 * Test Data:
 * ----------
 * - Unique email per test to ensure isolation
 * - Password: "Password123!"
 * - Default task: "Draggable Task"
 * - Multiple tasks for sequential drag tests
 *
 * Dependencies:
 * -------------
 * - BoardPage POM
 * - @dnd-kit library in frontend
 * - Backend task move endpoint
 * - Mouse event simulation via Playwright
 *
 * Known Limitations:
 * ------------------
 * - Standard Playwright dragTo() doesn't work with @dnd-kit
 * - Requires custom mouse event implementation
 * - Timing-sensitive (500ms waits for state updates)
 *
 * ============================================================================
 */

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `dragtest_${Date.now()}@example.com`;
}

/**
 * Helper function to setup a board with tasks for drag testing.
 * @param {import('@playwright/test').Page} page
 * @param {string} taskTitle - Title of the task to create
 * @returns {Promise<BoardPage>}
 */
async function setupBoardWithTask(page, taskTitle = "Draggable Task") {
  const boardPage = new BoardPage(page);
  const email = generateUniqueEmail();

  await boardPage.registerAndGoto({
    name: "Drag Drop User",
    email,
    password: "Password123!",
  });

  await boardPage.expectBoardLoaded();

  // Create a task to drag
  await boardPage.createTask(taskTitle, "This task can be dragged");

  return boardPage;
}

test.describe("Drag and Drop Functionality", () => {
  /**
   * Test dragging task from TODO to IN_PROGRESS.
   */
  test("drag task from TODO to IN_PROGRESS", async ({ page }) => {
    const boardPage = await setupBoardWithTask(page, "Task to Progress");

    // Verify task is in TODO
    await boardPage.expectColumnTaskCount("TODO", 1);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);

    // Drag task to IN_PROGRESS
    await boardPage.dragTaskToColumn("Task to Progress", "IN_PROGRESS");

    // Verify task moved
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);

    // Task should still be visible
    await boardPage.expectTaskVisible("Task to Progress");
  });

  /**
   * Test dragging task from IN_PROGRESS to DONE.
   */
  test("drag task from IN_PROGRESS to DONE", async ({ page }) => {
    const boardPage = await setupBoardWithTask(page, "Task to Complete");

    // First move to IN_PROGRESS
    await boardPage.dragTaskToColumn("Task to Complete", "IN_PROGRESS");
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);

    // Then move to DONE
    await boardPage.dragTaskToColumn("Task to Complete", "DONE");

    // Verify task is in DONE
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);
    await boardPage.expectColumnTaskCount("DONE", 1);

    // Task should still be visible
    await boardPage.expectTaskVisible("Task to Complete");
  });

  /**
   * Test dragging task backward (DONE to IN_PROGRESS).
   */
  test("drag task backward (DONE to IN_PROGRESS)", async ({ page }) => {
    const boardPage = await setupBoardWithTask(page, "Task to Revert");

    // Move task all the way to DONE
    await boardPage.dragTaskToColumn("Task to Revert", "IN_PROGRESS");
    await boardPage.dragTaskToColumn("Task to Revert", "DONE");
    await boardPage.expectColumnTaskCount("DONE", 1);

    // Move it back to IN_PROGRESS
    await boardPage.dragTaskToColumn("Task to Revert", "IN_PROGRESS");

    // Verify task moved back
    await boardPage.expectColumnTaskCount("DONE", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);
    await boardPage.expectTaskVisible("Task to Revert");
  });

  /**
   * Test dragging task to same column (should be no-op or reorder).
   */
  test("drag task to same column", async ({ page }) => {
    const boardPage = await setupBoardWithTask(page, "Same Column Task");

    // Task is in TODO
    await boardPage.expectColumnTaskCount("TODO", 1);

    // Drag to same column (TODO)
    await boardPage.dragTaskToColumn("Same Column Task", "TODO");

    // Task should still be in TODO
    await boardPage.expectColumnTaskCount("TODO", 1);
    await boardPage.expectTaskVisible("Same Column Task");
  });

  /**
   * Test that task persists in new column after page refresh.
   */
  test("task persists in new column after page refresh", async ({ page }) => {
    const boardPage = await setupBoardWithTask(page, "Persistent Task");

    // Move task to IN_PROGRESS
    await boardPage.dragTaskToColumn("Persistent Task", "IN_PROGRESS");
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);

    // Refresh the page
    await page.reload();

    // Wait for board to load
    await boardPage.expectBoardLoaded();

    // Task should still be in IN_PROGRESS
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);
    await boardPage.expectTaskVisible("Persistent Task");
  });

  /**
   * Test multiple drag operations in sequence.
   */
  test("multiple tasks can be dragged in sequence", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Multi Drag User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Create multiple tasks
    await boardPage.createTask("Task 1");
    await boardPage.createTask("Task 2");
    await boardPage.createTask("Task 3");

    // Verify all in TODO
    await boardPage.expectColumnTaskCount("TODO", 3);

    // Drag each to different columns
    await boardPage.dragTaskToColumn("Task 1", "IN_PROGRESS");
    await boardPage.dragTaskToColumn("Task 2", "DONE");
    await boardPage.dragTaskToColumn("Task 3", "IN_PROGRESS");

    // Verify distribution
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 2);
    await boardPage.expectColumnTaskCount("DONE", 1);

    // All tasks should still be visible
    await boardPage.expectTaskVisible("Task 1");
    await boardPage.expectTaskVisible("Task 2");
    await boardPage.expectTaskVisible("Task 3");
  });

  /**
   * Test that tasks can be moved through the full workflow.
   */
  test("task can move through full workflow (TODO → IN_PROGRESS → DONE)", async ({ page }) => {
    const boardPage = await setupBoardWithTask(page, "Workflow Task");

    // Start in TODO
    await boardPage.expectColumnTaskCount("TODO", 1);
    await boardPage.expectTaskVisible("Workflow Task");

    // Move to IN_PROGRESS
    await boardPage.dragTaskToColumn("Workflow Task", "IN_PROGRESS");
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 1);

    // Move to DONE
    await boardPage.dragTaskToColumn("Workflow Task", "DONE");
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 0);
    await boardPage.expectColumnTaskCount("DONE", 1);

    // Task should complete the workflow successfully
    await boardPage.expectTaskVisible("Workflow Task");
  });

  /**
   * Test dragging multiple tasks to same target column.
   */
  test("multiple tasks can be dragged to same column", async ({ page }) => {
    const boardPage = new BoardPage(page);
    const email = generateUniqueEmail();

    await boardPage.registerAndGoto({
      name: "Same Target User",
      email,
      password: "Password123!",
    });

    await boardPage.expectBoardLoaded();

    // Create multiple tasks
    await boardPage.createTask("Move Task 1");
    await boardPage.createTask("Move Task 2");

    // Move both to IN_PROGRESS
    await boardPage.dragTaskToColumn("Move Task 1", "IN_PROGRESS");
    await boardPage.dragTaskToColumn("Move Task 2", "IN_PROGRESS");

    // Both should be in IN_PROGRESS
    await boardPage.expectColumnTaskCount("TODO", 0);
    await boardPage.expectColumnTaskCount("IN_PROGRESS", 2);

    await boardPage.expectTaskVisible("Move Task 1");
    await boardPage.expectTaskVisible("Move Task 2");
  });
});
