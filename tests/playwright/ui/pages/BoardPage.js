import { expect } from "@playwright/test";
import { LoginPage } from "./LoginPage.js";
import { RegisterPage } from "./RegisterPage.js";

/**
 * Page Object Model for the Board page (Kanban board).
 *
 * Encapsulates selectors and user actions related to the board UI,
 * including task management, drag-and-drop, and modal interactions.
 */
export class BoardPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright Page instance.
   */
  constructor(page) {
    this.page = page;

    // Container and states
    this.boardPage = page.getByTestId("board-page");
    this.boardLoading = page.getByTestId("board-loading");
    this.boardError = page.getByTestId("board-error");

    // Header
    this.boardHeader = page.getByTestId("board-header");
    this.boardGreeting = page.getByTestId("board-greeting");
    this.createTaskButton = page.getByTestId("btn-create-task");
    this.deleteDoneButton = page.getByTestId("btn-delete-done");
    this.logoutButton = page.getByTestId("btn-logout");

    // Kanban Board
    this.kanbanBoard = page.getByTestId("kanban-board");

    // Create Task Modal
    this.createTaskModal = page.getByTestId("create-task-modal");
    this.modalOverlay = page.getByTestId("modal-overlay");
    this.modalClose = page.getByTestId("modal-close");
    this.modalTitle = page.getByTestId("modal-title");
    this.createTaskForm = page.getByTestId("create-task-form");
    this.inputTaskTitle = page.getByTestId("input-task-title");
    this.inputTaskDescription = page.getByTestId("input-task-description");
    this.modalError = page.getByTestId("modal-error");
    this.btnModalCancel = page.getByTestId("btn-cancel");
    this.btnModalCreate = page.getByTestId("btn-create");

    // Confirmation Modal
    this.confirmationModal = page.getByTestId("confirmation-modal");
    this.confirmationOverlay = page.getByTestId("confirmation-overlay");
    this.confirmationTitle = page.getByTestId("confirmation-title");
    this.confirmationMessage = page.getByTestId("confirmation-message");
    this.btnCancelConfirm = page.getByTestId("btn-cancel-confirm");
    this.btnConfirm = page.getByTestId("btn-confirm");
  }

  /**
   * Get column element by slug
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} slug - Column slug
   */
  getColumn(slug) {
    return this.page.getByTestId(`kanban-column-${slug}`);
  }

  /**
   * Get column title element by slug
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} slug - Column slug
   */
  getColumnTitle(slug) {
    return this.page.getByTestId(`column-title-${slug}`);
  }

  /**
   * Get column tasks container by slug
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} slug - Column slug
   */
  getColumnTasks(slug) {
    return this.page.getByTestId(`column-tasks-${slug}`);
  }

  /**
   * Get task card element by task ID
   * @param {string} taskId - Task ID
   */
  getTaskCard(taskId) {
    return this.page.getByTestId(`task-card-${taskId}`);
  }

  /**
   * Get task title element by task ID
   * @param {string} taskId - Task ID
   */
  getTaskTitle(taskId) {
    return this.page.getByTestId(`task-title-${taskId}`);
  }

  /**
   * Get task description element by task ID
   * @param {string} taskId - Task ID
   */
  getTaskDescription(taskId) {
    return this.page.getByTestId(`task-description-${taskId}`);
  }

  /**
   * Get task edit button by task ID
   * @param {string} taskId - Task ID
   */
  getTaskEditBtn(taskId) {
    return this.page.getByTestId(`task-edit-btn-${taskId}`);
  }

  /**
   * Get task delete button by task ID
   * @param {string} taskId - Task ID
   */
  getTaskDeleteBtn(taskId) {
    return this.page.getByTestId(`task-delete-btn-${taskId}`);
  }

  /**
   * Get task edit form by task ID
   * @param {string} taskId - Task ID
   */
  getTaskEditForm(taskId) {
    return this.page.getByTestId(`task-edit-form-${taskId}`);
  }

  /**
   * Get task edit title input by task ID
   * @param {string} taskId - Task ID
   */
  getTaskEditTitleInput(taskId) {
    return this.page.getByTestId(`task-edit-title-${taskId}`);
  }

  /**
   * Get task edit description input by task ID
   * @param {string} taskId - Task ID
   */
  getTaskEditDescriptionInput(taskId) {
    return this.page.getByTestId(`task-edit-description-${taskId}`);
  }

  /**
   * Get task edit cancel button by task ID
   * @param {string} taskId - Task ID
   */
  getTaskEditCancelBtn(taskId) {
    return this.page.getByTestId(`task-edit-cancel-${taskId}`);
  }

  /**
   * Get task edit save button by task ID
   * @param {string} taskId - Task ID
   */
  getTaskEditSaveBtn(taskId) {
    return this.page.getByTestId(`task-edit-save-${taskId}`);
  }

  /**
   * Navigate to the board page (requires authentication).
   * This will fail if user is not authenticated.
   */
  async goto() {
    await this.page.goto("/me/board");
    // Don't wait for board to be visible here - let tests handle that
  }

  /**
   * Register a new user and navigate to the board.
   * @param {Object} userData - User data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   */
  async registerAndGoto(userData) {
    const registerPage = new RegisterPage(this.page);
    await registerPage.goto();
    await registerPage.fillForm(userData);
    await registerPage.submit();
    await expect(registerPage.successMessage).toBeVisible();

    const loginPage = new LoginPage(this.page);
    await loginPage.goto();
    await loginPage.login(userData.email, userData.password);

    // Wait for redirect to board
    await expect(this.page).toHaveURL(/\/me\/board/);
  }

  /**
   * Login and navigate to the board.
   * @param {string} email - User's email
   * @param {string} password - User's password
   */
  async loginAndGoto(email, password) {
    const loginPage = new LoginPage(this.page);
    await loginPage.goto();
    await loginPage.login(email, password);

    // Wait for redirect to board
    await expect(this.page).toHaveURL(/\/me\/board/);
  }

  /**
   * Wait for the board to finish loading.
   */
  async waitForBoardLoaded() {
    await expect(this.boardPage).toBeVisible();
    await expect(this.boardLoading).not.toBeVisible();
  }

  /**
   * Assert that the board has loaded successfully.
   */
  async expectBoardLoaded() {
    await expect(this.boardPage).toBeVisible();
    await expect(this.kanbanBoard).toBeVisible();
  }

  /**
   * Find a task card by its title text.
   * @param {string} title - Task title to search for
   * @returns {Promise<import('@playwright/test').Locator|null>}
   */
  async getTaskCardByTitle(title) {
    // Find task by title text within task cards
    return this.page.locator(`[data-testid^="task-card-"]`).filter({ hasText: title }).first();
  }

  /**
   * Extract task ID from a task card element.
   * @param {import('@playwright/test').Locator} taskCard - Task card locator
   * @returns {Promise<string>} Task ID
   */
  async getTaskIdFromCard(taskCard) {
    const testId = await taskCard.getAttribute("data-testid");
    return testId.replace("task-card-", "");
  }

  /**
   * Get all task cards in a specific column.
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} columnSlug - Column slug
   * @returns {Promise<Array>}
   */
  async getTasksInColumn(columnSlug) {
    const columnTasks = this.getColumnTasks(columnSlug);
    const taskCards = columnTasks.locator(`[data-testid^="task-card-"]`);
    const count = await taskCards.count();
    return Array.from({ length: count }, (_, i) => taskCards.nth(i));
  }

  /**
   * Get count of tasks in a column.
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} columnSlug - Column slug
   * @returns {Promise<number>}
   */
  async getTaskCountInColumn(columnSlug) {
    const tasks = await this.getTasksInColumn(columnSlug);
    return tasks.length;
  }

  /**
   * Click the create task button to open the modal.
   */
  async clickCreateTask() {
    await this.createTaskButton.click();
    await expect(this.createTaskModal).toBeVisible();
  }

  /**
   * Create a new task via the modal.
   * @param {string} title - Task title
   * @param {string} [description] - Task description (optional)
   */
  async createTask(title, description = "") {
    await this.clickCreateTask();

    await this.inputTaskTitle.fill(title);
    if (description) {
      await this.inputTaskDescription.fill(description);
    }

    await this.btnModalCreate.click();

    // Wait for modal to close
    await expect(this.createTaskModal).not.toBeVisible();
  }

  /**
   * Edit a task inline.
   * @param {string} taskId - Task ID
   * @param {string} newTitle - New title
   * @param {string} [newDescription] - New description (optional)
   */
  async editTaskInline(taskId, newTitle, newDescription = null) {
    // First hover over the task card to reveal the edit button
    const taskCard = this.getTaskCard(taskId);
    await taskCard.hover();

    // Click edit button (pencil icon)
    await this.getTaskEditBtn(taskId).click();

    // Wait for edit form to appear and be ready
    await expect(this.getTaskEditForm(taskId)).toBeVisible();

    // Fill in new values - wait for inputs to be attached and editable
    if (newTitle !== null) {
      const titleInput = this.getTaskEditTitleInput(taskId);
      await titleInput.waitFor({ state: 'attached', timeout: 3000 });
      await this.page.waitForTimeout(500);
      await titleInput.fill(newTitle, { timeout: 10000 });
    }
    if (newDescription !== null) {
      const descInput = this.getTaskEditDescriptionInput(taskId);
      await descInput.waitFor({ state: 'attached', timeout: 3000 });
      await this.page.waitForTimeout(500);
      await descInput.fill(newDescription, { timeout: 10000 });
    }

    // Save changes
    await this.getTaskEditSaveBtn(taskId).click();

    // Wait for edit form to close
    await expect(this.getTaskEditForm(taskId)).not.toBeVisible();
  }

  /**
   * Cancel editing a task.
   * @param {string} taskId - Task ID
   */
  async cancelEditTask(taskId) {
    // First hover over the task card to reveal the edit button
    const taskCard = this.getTaskCard(taskId);
    await taskCard.hover();

    // Click edit button
    await this.getTaskEditBtn(taskId).click();
    await expect(this.getTaskEditForm(taskId)).toBeVisible();

    // Wait for edit mode to fully initialize (React state updates)
    await this.page.waitForTimeout(350);

    // Cancel the edit
    await this.getTaskEditCancelBtn(taskId).click();
    await expect(this.getTaskEditForm(taskId)).not.toBeVisible();
  }

  /**
   * Delete a task with confirmation.
   * @param {string} taskId - Task ID
   */
  async deleteTask(taskId) {
    await this.getTaskDeleteBtn(taskId).click();

    // Wait for confirmation modal
    await expect(this.confirmationModal).toBeVisible();

    // Confirm deletion
    await this.btnConfirm.click();

    // Wait for modal to close
    await expect(this.confirmationModal).not.toBeVisible();
  }

  /**
   * Click delete button but cancel the deletion.
   * @param {string} taskId - Task ID
   */
  async cancelDeleteTask(taskId) {
    await this.getTaskDeleteBtn(taskId).click();
    await expect(this.confirmationModal).toBeVisible();
    await this.btnCancelConfirm.click();
    await expect(this.confirmationModal).not.toBeVisible();
  }

  /**
   * Drag a task to a different column using mouse events.
   * This is needed because @dnd-kit doesn't work well with standard dragTo().
   * @param {string} taskTitle - Task title to find and drag
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} targetColumnSlug - Target column slug
   */
  async dragTaskToColumn(taskTitle, targetColumnSlug) {
    const taskCard = await this.getTaskCardByTitle(taskTitle);
    const targetColumn = this.getColumnTasks(targetColumnSlug);

    // Get bounding boxes
    const taskBox = await taskCard.boundingBox();
    const targetBox = await targetColumn.boundingBox();

    if (!taskBox || !targetBox) {
      throw new Error("Could not get bounding boxes for drag operation");
    }

    // Calculate centers
    const sourceX = taskBox.x + taskBox.width / 2;
    const sourceY = taskBox.y + taskBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    // Perform drag using mouse events
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, targetY, { steps: 10 });
    await this.page.mouse.up();

    // Wait for the operation to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Click the delete done tasks button.
   */
  async clickDeleteDoneTasks() {
    await this.deleteDoneButton.click();
    await expect(this.confirmationModal).toBeVisible();
  }

  /**
   * Delete all DONE tasks with confirmation.
   */
  async deleteDoneTasks() {
    await this.clickDeleteDoneTasks();
    await this.btnConfirm.click();
    await expect(this.confirmationModal).not.toBeVisible();
  }

  /**
   * Assert that a task with the given title is visible.
   * @param {string} title - Task title
   */
  async expectTaskVisible(title) {
    const taskCard = await this.getTaskCardByTitle(title);
    await expect(taskCard).toBeVisible();
  }

  /**
   * Assert that a task with the given title is not visible.
   * @param {string} title - Task title
   */
  async expectTaskNotVisible(title) {
    const taskCard = await this.getTaskCardByTitle(title);
    await expect(taskCard).not.toBeVisible();
  }

  /**
   * Assert that a column has a specific number of tasks.
   * @param {"TODO" | "IN_PROGRESS" | "DONE"} columnSlug - Column slug
   * @param {number} count - Expected task count
   */
  async expectColumnTaskCount(columnSlug, count) {
    const taskCount = await this.getTaskCountInColumn(columnSlug);
    expect(taskCount).toBe(count);
  }

  /**
   * Logout from the board.
   */
  async logout() {
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/\/login/);
  }
}
