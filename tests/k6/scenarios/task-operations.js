// tests/k6/scenarios/task-operations.js

import { sleep } from 'k6';
import http from 'k6/http';
import {
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getBoard,
  randomSleep
} from '../utils/helpers.js';

/**
 * Complete task lifecycle scenario
 * Creates, edits, moves, and deletes a task
 *
 * @param {string} token - Access token
 */
export function taskLifecycleScenario(token) {
  // Create a task
  const createRes = createTask(
    http,
    token,
    `Task ${Date.now()}`,
    'Performance test task'
  );

  if (createRes.status !== 200 && createRes.status !== 201) {
    return;
  }

  const task = createRes.json();  // Backend returns task directly, not wrapped
  const taskId = task ? task.id : null;

  if (!taskId) {
    return;
  }

  randomSleep(sleep, 1, 2);

  // Update the task
  updateTask(http, token, taskId, {
    title: `Updated Task ${Date.now()}`,
    description: 'Updated description',
  });

  randomSleep(sleep, 1, 2);

  // Move task to IN_PROGRESS
  moveTask(http, token, taskId, 'IN_PROGRESS');

  randomSleep(sleep, 1, 2);

  // Move task to DONE
  moveTask(http, token, taskId, 'DONE');

  randomSleep(sleep, 1, 2);

  // Delete the task
  deleteTask(http, token, taskId);

  randomSleep(sleep, 0.5, 1);
}

/**
 * Create multiple tasks scenario
 * Simulates a user creating several tasks in succession
 *
 * @param {string} token - Access token
 * @param {number} count - Number of tasks to create
 */
export function createMultipleTasksScenario(token, count = 5) {
  for (let i = 0; i < count; i++) {
    createTask(
      http,
      token,
      `Bulk Task ${i + 1} - ${Date.now()}`,
      `Description for task ${i + 1}`
    );
    randomSleep(sleep, 0.5, 1.5);
  }
}

/**
 * Mixed CRUD operations scenario
 * Simulates realistic user behavior with mixed operations
 *
 * @param {string} token - Access token
 */
export function mixedOperationsScenario(token) {
  // Load board first
  const boardRes = getBoard(http, token);
  randomSleep(sleep, 1, 2);

  // Create 2 tasks
  const task1 = createTask(http, token, `Task A ${Date.now()}`, 'First task');
  randomSleep(sleep, 1, 2);

  const task2 = createTask(http, token, `Task B ${Date.now()}`, 'Second task');
  randomSleep(sleep, 1, 2);

  // Reload board to see new tasks
  getBoard(http, token);
  randomSleep(sleep, 1, 2);

  // Edit first task
  if (task1.status === 200 || task1.status === 201) {
    const task1Data = task1.json();  // Backend returns task directly
    const taskId1 = task1Data ? task1Data.id : null;

    if (taskId1) {
      updateTask(http, token, taskId1, {
        title: `Edited Task A ${Date.now()}`,
      });
      randomSleep(sleep, 1, 2);

      // Move first task
      moveTask(http, token, taskId1, 'IN_PROGRESS');
      randomSleep(sleep, 1, 2);
    }
  }

  // Move second task
  if (task2.status === 200 || task2.status === 201) {
    const task2Data = task2.json();  // Backend returns task directly
    const taskId2 = task2Data ? task2Data.id : null;

    if (taskId2) {
      moveTask(http, token, taskId2, 'DONE');
      randomSleep(sleep, 1, 2);

      // Delete second task
      deleteTask(http, token, taskId2);
      randomSleep(sleep, 1, 2);
    }
  }

  // Final board refresh
  getBoard(http, token);
  randomSleep(sleep, 0.5, 1);
}

/**
 * Drag and drop simulation scenario
 * Moves a task through all columns
 *
 * @param {string} token - Access token
 */
export function dragDropScenario(token) {
  // Create a task in TODO
  const createRes = createTask(
    http,
    token,
    `Draggable Task ${Date.now()}`,
    'Will be moved through columns'
  );

  if (createRes.status !== 200 && createRes.status !== 201) {
    return;
  }

  const task = createRes.json();  // Backend returns task directly
  const taskId = task ? task.id : null;

  if (!taskId) {
    return;
  }

  randomSleep(sleep, 1, 2);

  // Simulate drag: TODO -> IN_PROGRESS
  moveTask(http, token, taskId, 'IN_PROGRESS');
  randomSleep(sleep, 2, 3);

  // Simulate drag: IN_PROGRESS -> DONE
  moveTask(http, token, taskId, 'DONE');
  randomSleep(sleep, 2, 3);

  // Simulate drag backward: DONE -> IN_PROGRESS
  moveTask(http, token, taskId, 'IN_PROGRESS');
  randomSleep(sleep, 1, 2);

  // Simulate drag: IN_PROGRESS -> TODO
  moveTask(http, token, taskId, 'TODO');
  randomSleep(sleep, 1, 2);
}
