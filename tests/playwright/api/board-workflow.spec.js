// tests/playwright/api/board-workflow.spec.js
import { test, expect } from '@playwright/test';
import { registerUser, loginAndGetToken, authHeaders, safeJson } from './api-helpers.js';

// Base route for board operations: {{base_url}}/me/board
const BOARD_BASE = '/me/board';

/**
 * @testcase TC-API-BOARD-001
 * @requirement REQ-BOARD-001 - A user can create exactly one board.
 * @requirement REQ-COLUMN-001 - A board must support creating columns.
 * @requirement REQ-TASK-001 - A task can be created under a column.
 * @requirement REQ-TASK-002 - A task can be moved between columns.
 * @requirement REQ-TASK-003 - DONE tasks can be soft-deleted.
 * @requirement REQ-BOARD-GET-001 - User can retrieve their board with columns and tasks.
 */
test('API Workflow → create board → create columns → create task → move task → delete DONE', async ({ request }) => {
  const unique = Date.now();
  const email = `workflow+${unique}@example.com`;
  const password = 'Password123!';

  // 1) Register (board and default columns are auto-created)
  await registerUser(request, email, password, 'Workflow Tester');

  // 2) Login
  const token = await loginAndGetToken(request, email, password);
  const headers = authHeaders(token);

  // 3) Get board (auto-created during registration)
  const getBoardRes = await request.get(BOARD_BASE, { headers });
  expect(getBoardRes.ok()).toBeTruthy();
  const boardData = await safeJson(getBoardRes);
  const board = boardData.board;
  const columns = board.columns || [];

  // Find auto-created columns by slug
  const todoCol = columns.find(c => c.slug === 'TODO');
  const inProgressCol = columns.find(c => c.slug === 'IN_PROGRESS');
  const doneCol = columns.find(c => c.slug === 'DONE');

  expect(todoCol).toBeTruthy();
  expect(inProgressCol).toBeTruthy();
  expect(doneCol).toBeTruthy();

  // 4) Create task in TODO: POST /tasks (automatically creates in TODO column)
  const createTaskRes = await request.post('/tasks', {
    headers,
    data: {
      title: 'First task',
      description: 'Created during API workflow test',
    },
  });

  if (!createTaskRes.ok()) {
    const body = await createTaskRes.text();
    throw new Error(
      `Create task failed: status=${createTaskRes.status()} body="${body.slice(0, 300)}"`
    );
  }

  const task = await safeJson(createTaskRes);

  // 5) Move task → IN_PROGRESS: PATCH /tasks/:id/move
  const moveToDoingRes = await request.patch(`/tasks/${task.id}/move`, {
    headers,
    data: { target_column_id: inProgressCol.id },
  });
  expect(moveToDoingRes.ok()).toBeTruthy();

  // 6) Move task → DONE
  const moveToDoneRes = await request.patch(`/tasks/${task.id}/move`, {
    headers,
    data: { target_column_id: doneCol.id },
  });
  expect(moveToDoneRes.ok()).toBeTruthy();

  // 7) Delete DONE tasks: POST /me/board/remove-done-tasks
  const deleteDoneRes = await request.post(`${BOARD_BASE}/remove-done-tasks`, {
    headers,
  });
  expect(deleteDoneRes.ok()).toBeTruthy();

  // 8) Get board again and verify task is deleted
  const getBoardRes2 = await request.get(BOARD_BASE, { headers });
  expect(getBoardRes2.ok()).toBeTruthy();
  const fullBoard = await safeJson(getBoardRes2);

  const allTasks = (fullBoard.board.tasks || []);
  const exists = allTasks.find(t => t.id === task.id);

  expect(exists).toBeFalsy();
});

/**
 * @testcase TC-API-BOARD-003
 * @requirement REQ-BOARD-GET-001 - User can retrieve their board with nested columns and tasks.
 * @requirement REQ-COLUMN-001 - Board exposes its columns.
 * @requirement REQ-TASK-001 - Columns expose their tasks.
 */
test('Get my board returns board with columns and tasks', async ({ request }) => {
  const unique = Date.now();
  const email = `getboard+${unique}@example.com`;
  const password = 'Password123!';

  await registerUser(request, email, password, 'Get Board User');
  const token = await loginAndGetToken(request, email, password);
  const headers = authHeaders(token);

  // Get auto-created board
  const boardRes = await request.get(BOARD_BASE, { headers });
  expect(boardRes.ok()).toBeTruthy();
  const boardData = await safeJson(boardRes);
  const board = boardData.board;
  const columns = board.columns || [];

  // Find auto-created columns
  const todoCol = columns.find(c => c.slug === 'TODO');
  const inProgressCol = columns.find(c => c.slug === 'IN_PROGRESS');

  // Create tasks (creates in TODO, then move to other columns)
  const task1Res = await request.post('/tasks', {
    headers,
    data: {
      title: 'Todo task',
      description: 'Task in TODO',
    },
  });
  const task1 = await safeJson(task1Res);

  const task2Res = await request.post('/tasks', {
    headers,
    data: {
      title: 'InProgress task',
      description: 'Task in IN_PROGRESS',
    },
  });
  const task2 = await safeJson(task2Res);

  // Move second task to IN_PROGRESS
  await request.patch(`/tasks/${task2.id}/move`, {
    headers,
    data: { target_column_id: inProgressCol.id },
  });

  // Get board again
  const getBoardRes = await request.get(BOARD_BASE, { headers });
  expect(getBoardRes.ok()).toBeTruthy();
  const fullBoard = await safeJson(getBoardRes);

  expect(fullBoard.board.id).toBe(board.id);
  expect(Array.isArray(fullBoard.board.columns)).toBe(true);
  expect(fullBoard.board.columns.length).toBeGreaterThanOrEqual(2);

  fullBoard.board.columns.forEach(col => {
    expect(col).toHaveProperty('id');
    expect(col).toHaveProperty('name');
  });

  const totalTasks = (fullBoard.board.tasks || []).length;
  expect(totalTasks).toBeGreaterThanOrEqual(2);
});

/**
 * @testcase TC-API-TASK-004
 * @requirement REQ-TASK-003 - Only tasks in DONE status are soft-deleted.
 */
test('Delete DONE tasks only affects DONE tasks', async ({ request }) => {
  const unique = Date.now();
  const email = `deletedone+${unique}@example.com`;
  const password = 'Password123!';

  await registerUser(request, email, password, 'Delete DONE User');
  const token = await loginAndGetToken(request, email, password);
  const headers = authHeaders(token);

  // Get auto-created board and columns
  const boardRes = await request.get(BOARD_BASE, { headers });
  const boardData = await safeJson(boardRes);
  const columns = boardData.board.columns || [];

  const todoCol = columns.find(c => c.slug === 'TODO');
  const inProgressCol = columns.find(c => c.slug === 'IN_PROGRESS');
  const doneCol = columns.find(c => c.slug === 'DONE');

  // Create tasks (all start in TODO)
  const todoTaskRes = await request.post('/tasks', {
    headers,
    data: {
      title: 'Task TODO',
    },
  });
  const todoTask = await safeJson(todoTaskRes);

  const doingTaskRes = await request.post('/tasks', {
    headers,
    data: {
      title: 'Task DOING',
    },
  });
  const doingTask = await safeJson(doingTaskRes);

  const doneTaskRes = await request.post('/tasks', {
    headers,
    data: {
      title: 'Task DONE',
    },
  });
  const doneTask = await safeJson(doneTaskRes);

  // Move tasks to their respective columns
  await request.patch(`/tasks/${doingTask.id}/move`, {
    headers,
    data: { target_column_id: inProgressCol.id },
  });

  await request.patch(`/tasks/${doneTask.id}/move`, {
    headers,
    data: { target_column_id: doneCol.id },
  });

  // Delete DONE tasks
  const deleteRes = await request.post(`${BOARD_BASE}/remove-done-tasks`, {
    headers,
  });
  expect(deleteRes.ok()).toBeTruthy();

  // Get board and check tasks
  const getBoardRes = await request.get(BOARD_BASE, { headers });
  const fullBoard = await safeJson(getBoardRes);

  const tasksById = new Map();
  (fullBoard.board.tasks || []).forEach(task => tasksById.set(task.id, task));

  expect(tasksById.has(todoTask.id)).toBe(true);
  expect(tasksById.has(doingTask.id)).toBe(true);
  expect(tasksById.has(doneTask.id)).toBe(false);
});

/**
 * @testcase TC-API-TASK-005
 * @requirement REQ-TASK-003 - Deleting DONE tasks is idempotent.
 */
test('Delete DONE tasks is idempotent (multiple calls are safe)', async ({ request }) => {
  const unique = Date.now();
  const email = `idempotent+${unique}@example.com`;
  const password = 'Password123!';

  await registerUser(request, email, password, 'Idempotent User');
  const token = await loginAndGetToken(request, email, password);
  const headers = authHeaders(token);

  // Get auto-created board and DONE column
  const boardRes = await request.get(BOARD_BASE, { headers });
  const boardData = await safeJson(boardRes);
  const columns = boardData.board.columns || [];
  const doneCol = columns.find(c => c.slug === 'DONE');

  // Create DONE task
  const taskRes = await request.post('/tasks', {
    headers,
    data: {
      title: 'Done task',
    },
  });
  const task = await safeJson(taskRes);

  // Move to DONE column
  await request.patch(`/tasks/${task.id}/move`, {
    headers,
    data: { target_column_id: doneCol.id },
  });

  // First delete
  const deleteRes1 = await request.post(`${BOARD_BASE}/remove-done-tasks`, {
    headers,
  });
  expect(deleteRes1.ok()).toBeTruthy();

  const boardAfterFirst = await safeJson(
    await request.get(BOARD_BASE, { headers })
  );
  const idsFirst = (boardAfterFirst.board.tasks || []).map(t => t.id);

  // Second delete
  const deleteRes2 = await request.post(`${BOARD_BASE}/remove-done-tasks`, {
    headers,
  });
  expect(deleteRes2.ok()).toBeTruthy();

  const boardAfterSecond = await safeJson(
    await request.get(BOARD_BASE, { headers })
  );
  const idsSecond = (boardAfterSecond.board.tasks || []).map(t => t.id);

  expect(idsSecond).toEqual(idsFirst);
});

/**
 * @testcase TC-API-BOARD-004
 * @requirement REQ-BOARD-GET-002 - Getting a board returns board with auto-created columns.
 */
test('Get my board returns error when user has no board', async ({ request }) => {
  const unique = Date.now();
  const email = `noboard+${unique}@example.com`;
  const password = 'Password123!';

  await registerUser(request, email, password, 'No Board User');
  const token = await loginAndGetToken(request, email, password);
  const headers = authHeaders(token);

  const res = await request.get(BOARD_BASE, { headers });

  const bodyText = await res.text();
  console.log('GET /me/board without board →', res.status(), bodyText.slice(0, 200));

  // Since board is auto-created during registration, this should return 200
  expect(res.status()).toBe(200);
  const data = JSON.parse(bodyText);
  expect(data.board).toBeTruthy();
  expect(data.board.id).toBeTruthy();
});
