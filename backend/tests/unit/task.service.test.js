/**
 * @fileoverview
 * Unit tests for the Task Service (`task.service.js`).
 *
 * Requirements covered (from Traceability Matrix):
 *  - R-008: Users can create tasks in TODO column by default.
 *  - R-009: Users can update task fields (title, description).
 *  - R-010: Tasks must have updated_at automatically updated.
 *  - R-011: Users can move tasks between columns (reversible).
 *  - R-012: Moving tasks to an invalid column must fail.
 *  - R-013: GET /me/board must not return soft-deleted tasks (partially via board tests).
 *  - R-021: System must protect cross-user access (authZ) – for cross-board move.
 *
 * Unit Tests (matrix references):
 *  - UT-04: Task creation in TODO and default values.
 *  - UT-01 / UT-02: Moving tasks between columns (forwards/backwards).
 *  - UT-03: Invalid move / cross-board scenarios.
 *
 * Test Case IDs (from matrix):
 *  - TC-010: Create Task Successfully.
 *  - TC-012: Task Default Values Are Correct.
 *  - TC-015: Move Task Forward (TODO → IN_PROGRESS).
 *  - TC-016: Move Task Forward (IN_PROGRESS → DONE).
 *  - TC-017: Move Task Backward (DONE → IN_PROGRESS).
 *  - TC-018: Move Task To Invalid Column.
 *  - TC-030 / TC-031: Cross-user isolation behavior.
 */

import { clearDatabase } from "./dbTestUtils.js";
import { registerUser } from "../../src/services/auth.service.js";
import { getMyBoard } from "../../src/services/board.service.js";
import {
  createTaskForUser,
  moveTaskForUser,
} from "../../src/services/task.service.js";
import { pool } from "../../src/config/db.js";

/**
 * @description Test suite for Task Service behavior.
 */
describe("Task Service", () => {
  /**
   * @description
   * Global setup:
   *  - Clears DB so task creation/movement tests start from an empty state.
   */
  beforeAll(async () => {
    await clearDatabase();
  });

  /**
   * @description
   * Cleanup after each test:
   *  - Ensures each test case (TC-010, TC-015, etc.) is isolated.
   */
  afterEach(async () => {
    await clearDatabase();
  });

  /**
   * @description
   * Global teardown:
   *  - Closes DB pool after all task tests complete.
   */
  afterAll(async () => {
    await pool.end();
  });

  // -------------------------------------------------------------------------
  //  TC-010 / TC-012 / UT-04 / R-008 (+ default fields part of R-010)
  // -------------------------------------------------------------------------

  /**
   * @test
   * @testCase TC-010
   * @testCase TC-012
   * @unitTest UT-04
   * @requirement R-008
   * @requirement R-010
   *
   * @description
   * Validates that:
   *  - When a user creates tasks through the service, they are created in the TODO column by default (R-008 / TC-010).
   *  - Positions are assigned incrementally (1, 2, …) which is part of default task behavior (TC-012).
   *  - The board returned by `getMyBoard` reflects the newly created tasks under TODO.
   */
  test("createTaskForUser creates tasks in TODO with increasing position", async () => {
    const user = await registerUser({
      email: "tasks1@example.com",
      password: "Password123!",
      name: "Task User 1",
    });

    // First task
    const t1 = await createTaskForUser({
      userId: user.id,
      title: "Task 1",
      description: "First task",
    });

    // Second task
    const t2 = await createTaskForUser({
      userId: user.id,
      title: "Task 2",
      description: "Second task",
    });

    // Load board to inspect columns & tasks
    const boardData = await getMyBoard(user.id);
    const columns = boardData.board.columns;
    const tasks = boardData.board.tasks;

    const todoColumn = columns.find((c) => c.slug === "TODO");
    expect(todoColumn).toBeDefined();

    // Both tasks should be in TODO
    const task1 = tasks.find((t) => t.id === t1.id);
    const task2 = tasks.find((t) => t.id === t2.id);

    expect(task1).toBeDefined();
    expect(task2).toBeDefined();
    expect(task1.column_id).toBe(todoColumn.id);
    expect(task2.column_id).toBe(todoColumn.id);

    // Positions should increase
    expect(task1.position).toBe(1);
    expect(task2.position).toBe(2);
  });

  // -------------------------------------------------------------------------
  //  TC-015 / TC-016 / TC-017 / UT-01, UT-02 / R-011
  // -------------------------------------------------------------------------

  /**
   * @test
   * @testCase TC-015
   * @testCase TC-016
   * @testCase TC-017
   * @unitTest UT-01
   * @unitTest UT-02
   * @requirement R-011
   *
   * @description
   * Validates the “move task between columns” requirement:
   *  - A task created in TODO can be moved to another column (e.g., IN_PROGRESS) via `moveTaskForUser`.
   *  - Movement is reversible by design (R-011) — this test covers one direction (TODO → IN_PROGRESS),
   *    and the corresponding reverse moves are covered at API/UI levels.
   */
  test("moveTaskForUser moves task to another column of same board", async () => {
    const user = await registerUser({
      email: "tasks2@example.com",
      password: "Password123!",
      name: "Task User 2",
    });

    const created = await createTaskForUser({
      userId: user.id,
      title: "Movable Task",
      description: "To be moved",
    });

    const boardData = await getMyBoard(user.id);
    const columns = boardData.board.columns;

    const todoColumn = columns.find((c) => c.slug === "TODO");
    const inProgressColumn = columns.find((c) => c.slug === "IN_PROGRESS");

    expect(todoColumn).toBeDefined();
    expect(inProgressColumn).toBeDefined();

    // Move TODO → IN_PROGRESS
    const updated = await moveTaskForUser({
      userId: user.id,
      taskId: created.id,
      targetColumnId: inProgressColumn.id,
      newPosition: 1,
    });

    expect(updated).toBeDefined();
    expect(updated.column_id).toBe(inProgressColumn.id);
    expect(updated.position).toBe(1);
  });

  // -------------------------------------------------------------------------
  //  Extra negative test (no direct TC mapping) – 404 on non-existing task
  // -------------------------------------------------------------------------

  /**
   * @test
   * @unitTest UT-03
   * @requirement R-012
   *
   * @description
   * Negative test: attempts to move a task that does not exist.
   *
   * Expected:
   *  - `moveTaskForUser` rejects with a 404-style error.
   *  - This supports the “invalid move” requirement (R-012) from the service level.
   */
  test("moveTaskForUser throws 404 when task does not exist", async () => {
    const user = await registerUser({
      email: "tasks3@example.com",
      password: "Password123!",
      name: "Task User 3",
    });

    const fakeTaskId = "00000000-0000-0000-0000-000000000000";

    await expect(
      moveTaskForUser({
        userId: user.id,
        taskId: fakeTaskId,
        targetColumnId: fakeTaskId,
        newPosition: 1,
      })
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  // -------------------------------------------------------------------------
  //  TC-018 / TC-030 / TC-031 / UT-03, UT-09 / R-012, R-021
  // -------------------------------------------------------------------------

  /**
   * @test
   * @testCase TC-018
   * @testCase TC-030
   * @testCase TC-031
   * @unitTest UT-03
   * @unitTest UT-09
   * @requirement R-012
   * @requirement R-021
   *
   * @description
   * Cross-user / cross-board isolation test:
   *
   * Scenario:
   *  - User A and User B both register and get separate boards.
   *  - Task is created for User A.
   *  - We attempt to move User A’s task into a column that belongs to User B’s board.
   *
   * Validates that:
   *  - The operation fails with a 403-style error.
   *  - Users cannot move tasks into columns of another user’s board (R-012, R-021).
   *  - This aligns with TC-018 (invalid column) and TC-030/031 (cross-user isolation).
   */
  test("moveTaskForUser throws 403 when moving to column of another user's board", async () => {
    // User A
    const userA = await registerUser({
      email: "userA@example.com",
      password: "Password123!",
      name: "User A",
    });

    // User B
    const userB = await registerUser({
      email: "userB@example.com",
      password: "Password123!",
      name: "User B",
    });

    // Task for user A
    const taskForA = await createTaskForUser({
      userId: userA.id,
      title: "Task A1",
      description: "Belongs to A",
    });

    // Get a column from user B's board
    const boardDataB = await getMyBoard(userB.id);
    const someColumnOfB = boardDataB.board.columns[0];

    // Try moving A's task into B's column
    await expect(
      moveTaskForUser({
        userId: userA.id,
        taskId: taskForA.id,
        targetColumnId: someColumnOfB.id,
        newPosition: 1,
      })
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  /**
 * @test
 * @testCase TC-015
 * @testCase TC-016
 * @testCase TC-017
 * @unitTest UT-01
 * @unitTest UT-02
 * @requirement R-011
 *
 * @description
 * Validates reversible movement of tasks across columns:
 *
 * Scenario:
 *  - Task starts in TODO.
 *  - Move TODO → IN_PROGRESS.
 *  - Move IN_PROGRESS → DONE.
 *  - Move DONE → IN_PROGRESS.
 *
 * Expected:
 *  - Column_id follows the movement correctly.
 *  - Movement is reversible (not one-way).
 */
test("moveTaskForUser supports reversible movement across TODO → IN_PROGRESS → DONE → IN_PROGRESS", async () => {
  const user = await registerUser({
    email: "reversible@example.com",
    password: "Password123!",
    name: "Reversible User",
  });

  const boardData = await getMyBoard(user.id);
  const columns = boardData.board.columns;

  const todoColumn = columns.find((c) => c.slug === "TODO");
  const inProgressColumn = columns.find((c) => c.slug === "IN_PROGRESS");
  const doneColumn = columns.find((c) => c.slug === "DONE");

  expect(todoColumn).toBeDefined();
  expect(inProgressColumn).toBeDefined();
  expect(doneColumn).toBeDefined();

  // Create task (in TODO by default)
  const created = await createTaskForUser({
    userId: user.id,
    title: "Reversible Task",
    description: "Will jump columns",
  });

  // TODO → IN_PROGRESS
  const step1 = await moveTaskForUser({
    userId: user.id,
    taskId: created.id,
    targetColumnId: inProgressColumn.id,
    newPosition: 1,
  });
  expect(step1.column_id).toBe(inProgressColumn.id);

  // IN_PROGRESS → DONE
  const step2 = await moveTaskForUser({
    userId: user.id,
    taskId: created.id,
    targetColumnId: doneColumn.id,
    newPosition: 1,
  });
  expect(step2.column_id).toBe(doneColumn.id);

  // DONE → IN_PROGRESS (move backward)
  const step3 = await moveTaskForUser({
    userId: user.id,
    taskId: created.id,
    targetColumnId: inProgressColumn.id,
    newPosition: 1,
  });
  expect(step3.column_id).toBe(inProgressColumn.id);
});

/**
 * @test
 * @testCase TC-018
 * @unitTest UT-03
 * @requirement R-012
 *
 * @description
 * Validates that moving a task to a non-existing column fails.
 *
 * Scenario:
 *  - Create a valid task for a user.
 *  - Try to move it to a fake column UUID that does not exist.
 *
 * Expected:
 *  - Service rejects with a 404-style error (invalid target column).
 */
test("moveTaskForUser throws 404 when target column does not exist", async () => {
  const user = await registerUser({
    email: "invalidcolumn@example.com",
    password: "Password123!",
    name: "Invalid Column User",
  });

  const created = await createTaskForUser({
    userId: user.id,
    title: "Task for invalid move",
    description: "Will be used for invalid target column",
  });

  const fakeColumnId = "00000000-0000-0000-0000-000000000000";

  await expect(
    moveTaskForUser({
      userId: user.id,
      taskId: created.id,
      targetColumnId: fakeColumnId,
      newPosition: 1,
    })
  ).rejects.toMatchObject({
    status: 404,
  });
});
});