/**
 * @fileoverview
 * Unit tests for the Board Service (`board.service.js`).
 *
 * Requirements covered (from Traceability Matrix):
 *  - R-005: Each user must have exactly one board, created on registration.
 *  - R-006: Board must contain default columns TODO, IN_PROGRESS, DONE.
 *  - R-014: DONE tasks are visible until user removes them.
 *  - R-015: Clicking “Remove done tasks” soft-deletes tasks in DONE.
 *  - R-017: Soft delete must set is_deleted = true and deleted_at not null.
 *  - R-018: Active task queries must filter out soft-deleted tasks.
 *
 * Unit Tests (matrix references):
 *  - UT-10: Board existence + columns per user.
 *  - UT-05 / UT-06: Soft delete behavior + filtering for active tasks.
 *
 * Test Case IDs (from matrix):
 *  - TC-007: Board Automatically Created After Registration.
 *  - TC-009: Verify Columns Structure.
 *  - TC-019: Deleted Tasks Must Not Appear in Board.
 *  - TC-021: Remove All Done Tasks.
 *  - TC-023: Soft Delete Sets deleted_at.
 */

import { clearDatabase } from "./dbTestUtils.js";
import { registerUser } from "../../src/services/auth.service.js";
import {
  getMyBoard,
  removeDoneTasksForMyBoard,
} from "../../src/services/board.service.js";
import { createTaskForUser, moveTaskForUser } from "../../src/services/task.service.js";
import { query, pool } from "../../src/config/db.js";

/**
 * @description Test suite for Board Service behavior.
 */
describe("Board Service", () => {
  /**
   * @description
   * Global setup before all tests:
   *  - Ensures DB is empty so board-related tests (UT-10, UT-05/06) start from a known state.
   */
  beforeAll(async () => {
    await clearDatabase();
  });

  /**
   * @description
   * Cleanup after each test:
   *  - Removes users, boards, columns, tasks to avoid cross-test contamination.
   */
  afterEach(async () => {
    await clearDatabase();
  });

  /**
   * @description
   * Global teardown:
   *  - Closes PostgreSQL pool so Jest can exit cleanly without open handles.
   */
  afterAll(async () => {
    await pool.end();
  });

  // -------------------------------------------------------------------------
  //  TC-007 / TC-009 / UT-10 / R-005, R-006 (+ R-008 partially)
  // -------------------------------------------------------------------------

  /**
   * @test
   * @testCase TC-007
   * @testCase TC-009
   * @unitTest UT-10
   * @requirement R-005
   * @requirement R-006
   * @requirement R-008
   *
   * @description
   * Validates that:
   *  - After registering a user, `getMyBoard(userId)` returns:
   *      - Exactly one board for that user (R-005 / TC-007).
   *      - Three default columns: TODO, IN_PROGRESS, DONE (R-006 / TC-009).
   *  - When a task is created for the user, the board payload also includes that task,
   *    which ties into the “create task in TODO” requirement (R-008) at the board level.
   */
  test("getMyBoard should return board, columns and tasks", async () => {
    const user = await registerUser({
      email: "boardtest@example.com",
      password: "Password123!",
      name: "Board Tester",
    });

    // Create a task in TODO via service
    await createTaskForUser({
      userId: user.id,
      title: "Sample Task",
      description: "Test task",
    });

    const result = await getMyBoard(user.id);

    // Basic structure
    expect(result.board).toBeDefined();
    expect(result.board.id).toBeDefined();
    expect(result.board.owner_id).toBe(user.id);

    // Columns must contain exactly the default 3
    expect(result.board.columns.length).toBe(3);
    const slugs = result.board.columns.map((c) => c.slug).sort();
    expect(slugs).toEqual(["DONE", "IN_PROGRESS", "TODO"].sort());

    // At least one task returned (the one we just created)
    expect(result.board.tasks.length).toBe(1);
    expect(result.board.tasks[0].title).toBe("Sample Task");
  });

  // -------------------------------------------------------------------------
  //  TC-021 / TC-019 / TC-023 / UT-05, UT-06 / R-014, R-015, R-017, R-018
  // -------------------------------------------------------------------------

  /**
   * @test
   * @testCase TC-021
   * @testCase TC-019
   * @testCase TC-023
   * @unitTest UT-05
   * @unitTest UT-06
   * @requirement R-014
   * @requirement R-015
   * @requirement R-017
   * @requirement R-018
   *
   * @description
   * Validates the soft-delete flow for DONE tasks:
   *
   * Scenario:
   *  1. Register user and create two tasks.
   *  2. Move one task into the DONE column.
   *  3. Call `removeDoneTasksForMyBoard(userId)`.
   *
   * Asserts:
   *  - Only tasks in DONE are soft-deleted (R-015 / TC-021).
   *  - Soft-deleted tasks have is_deleted = true and deleted_at not null (R-017 / TC-023).
   *  - Subsequent queries that list active tasks do not include the deleted task (R-018 / TC-019).
   */
  test("removeDoneTasksForMyBoard should soft-delete only DONE tasks", async () => {
    const user = await registerUser({
      email: "removedone@example.com",
      password: "Password123!",
      name: "Done Remover",
    });

    // Get board and columns
    const boardData = await getMyBoard(user.id);
    const { columns } = boardData.board;

    const doneColumn = columns.find((c) => c.slug === "DONE");
    expect(doneColumn).toBeDefined();

    // Create 2 tasks in TODO initially
    const t1 = await createTaskForUser({
      userId: user.id,
      title: "Task 1",
      description: "Test",
    });

    const t2 = await createTaskForUser({
      userId: user.id,
      title: "Task 2",
      description: "Test",
    });

    // Move t1 to DONE
    await moveTaskForUser({
      userId: user.id,
      taskId: t1.id,
      targetColumnId: doneColumn.id,
      newPosition: 1,
    });

    // Call remove-done-tasks
    const result = await removeDoneTasksForMyBoard(user.id);
    expect(result.removedCount).toBe(1);

    // Verify DB flags for both tasks
    const rows = await query(
      "SELECT id, is_deleted, deleted_at FROM tasks ORDER BY title ASC"
    );

    const [task1, task2] = rows.rows;

    // t1 was in DONE → must be soft-deleted
    expect(task1.is_deleted).toBe(true);
    expect(task1.deleted_at).not.toBeNull();

    // t2 stayed in TODO → must remain active
    expect(task2.is_deleted).toBe(false);
    expect(task2.deleted_at).toBeNull();
  });

  // -------------------------------------------------------------------------
  //  Extra safety test (no direct TC mapping, supports R-005)
  // -------------------------------------------------------------------------

  /**
   * @test
   * @requirement R-005
   *
   * @description
   * Safety test that validates service behavior when a board does NOT exist
   * for a given userId (e.g., corrupted data or manual DB changes).
   *
   * Expected:
   *  - `getMyBoard(nonExistingUserId)` throws an error with status 404.
   *
   * This complements R-005 by ensuring that the service fails clearly when
   * the invariant “one board per user” is broken.
   */
  test("getMyBoard should throw error if board does not exist", async () => {
    const nonExistingUserId = "00000000-0000-0000-0000-000000000000";

    await expect(getMyBoard(nonExistingUserId)).rejects.toMatchObject({
      status: 404,
    });
  });



/**
 * @test
 * @testCase TC-008
 * @unitTest UT-11
 * @requirement R-005
 *
 * @description
 * Validates "one board per user" at the database level.
 *
 * Scenario:
 *  - Register a user (this creates the first board).
 *  - Try to insert a second board with the same owner_id directly in DB.
 *
 * Expected:
 *  - The insert fails due to a uniqueness constraint on owner_id (PG 23505).
 */
test("user cannot have more than one board (DB unique constraint)", async () => {
  const user = await registerUser({
    email: "oneboard@example.com",
    password: "Password123!",
    name: "One Board User",
  });

  // Attempt to create a second board manually for the same user
  await expect(
    query(
      `
      INSERT INTO boards (owner_id, name)
      VALUES ($1, $2)
      `,
      [user.id, "Second Board"]
    )
  ).rejects.toHaveProperty("code", "23505"); // PG unique_violation
});


/**
 * @test
 * @testCase TC-022
 * @unitTest UT-05
 * @requirement R-015
 * @requirement R-016
 *
 * @description
 * Validates that "Remove done tasks" is idempotent:
 *
 * Scenario:
 *  - Create a DONE task.
 *  - Call removeDoneTasksForMyBoard() twice.
 *
 * Expected:
 *  - 1st call: removedCount = 1.
 *  - 2nd call: removedCount = 0 and no error.
 */
test("removeDoneTasksForMyBoard is idempotent when called twice", async () => {
  const user = await registerUser({
    email: "idempotent@example.com",
    password: "Password123!",
    name: "Idempotent User",
  });

  const boardData = await getMyBoard(user.id);
  const { columns } = boardData.board;

  const todoColumn = columns.find((c) => c.slug === "TODO");
  const doneColumn = columns.find((c) => c.slug === "DONE");
  expect(todoColumn).toBeDefined();
  expect(doneColumn).toBeDefined();

  // Create a task in TODO
  const task = await createTaskForUser({
    userId: user.id,
    title: "Task to be done",
    description: "Will go to DONE",
  });

  // Move it to DONE
  await moveTaskForUser({
    userId: user.id,
    taskId: task.id,
    targetColumnId: doneColumn.id,
    newPosition: 1,
  });

  // First run: should remove 1 task
  const first = await removeDoneTasksForMyBoard(user.id);
  expect(first.removedCount).toBe(1);

  // Second run: should remove 0 and not fail (idempotent)
  const second = await removeDoneTasksForMyBoard(user.id);
  expect(second.removedCount).toBe(0);
});

/**
 * @test
 * @testCase TC-019
 * @testCase TC-021
 * @unitTest UT-05
 * @unitTest UT-06
 * @requirement R-013
 * @requirement R-014
 * @requirement R-015
 * @requirement R-018
 *
 * @description
 * Validates that soft-deleted DONE tasks:
 *  - Are visible in DONE before removal (R-014).
 *  - Are soft-deleted by removeDoneTasksForMyBoard (R-015, R-017).
 *  - Are NOT returned anymore in GET /me/board (R-013, R-018).
 */
test("getMyBoard should not return soft-deleted DONE tasks", async () => {
  const user = await registerUser({
    email: "softdeleteboard@example.com",
    password: "Password123!",
    name: "Soft Delete Board User",
  });

  const initialBoard = await getMyBoard(user.id);
  const columns = initialBoard.board.columns;

  const todoColumn = columns.find((c) => c.slug === "TODO");
  const doneColumn = columns.find((c) => c.slug === "DONE");
  expect(todoColumn).toBeDefined();
  expect(doneColumn).toBeDefined();

  // Create a task in TODO
  const task = await createTaskForUser({
    userId: user.id,
    title: "Task to be soft deleted",
    description: "Will go to DONE then be removed",
  });

  // Move task to DONE
  await moveTaskForUser({
    userId: user.id,
    taskId: task.id,
    targetColumnId: doneColumn.id,
    newPosition: 1,
  });

  // BEFORE removal: task must be visible under DONE
  const before = await getMyBoard(user.id);
  const beforeTask = before.board.tasks.find((t) => t.id === task.id);
  expect(beforeTask).toBeDefined();
  expect(beforeTask.column_id).toBe(doneColumn.id);

  // Soft delete with remove-done-tasks
  await removeDoneTasksForMyBoard(user.id);

  // AFTER removal: task must not be returned in active tasks
  const after = await getMyBoard(user.id);
  const afterTask = after.board.tasks.find((t) => t.id === task.id);
  expect(afterTask).toBeUndefined();
});
});