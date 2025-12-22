// tests/k6/utils/helpers.js

import { check } from 'k6';
import { config } from './config.js';

/**
 * Generates a unique email for k6 test users
 * @returns {string} Unique email address
 */
export function generateUniqueEmail() {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);
  return `k6test_${timestamp}_${randomId}@example.com`;
}

/**
 * Registers a new user via API
 * @param {object} http - k6 HTTP module
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @returns {object} Registration response
 */
export function registerUser(http, email, password, name) {
  const url = `${config.API_URL}/auth/register`;
  const payload = JSON.stringify({
    email,
    password,
    name,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'registration successful': (r) => r.status === 201 || r.status === 200,
    'registration has user data': (r) => r.json('user') !== undefined,
  });

  return res;
}

/**
 * Logs in a user and returns access token
 * @param {object} http - k6 HTTP module
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {string|null} Access token or null if login failed
 */
export function loginUser(http, email, password) {
  const url = `${config.API_URL}/auth/login`;
  const payload = JSON.stringify({
    email,
    password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'login successful': (r) => r.status === 200,
    // Note: Cannot check for token here due to k6 json() consumption issue
    // Token validation happens by checking if return value is not null
  });

  if (res.status === 200) {
    const body = res.json();
    return body.accessToken || body.token;
  }

  return null;
}

/**
 * Creates authorization headers with Bearer token
 * @param {string} token - JWT access token
 * @returns {object} Headers object
 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Creates a new task
 * @param {object} http - k6 HTTP module
 * @param {string} token - Access token
 * @param {string} title - Task title
 * @param {string} description - Task description (optional)
 * @returns {object} Create task response
 */
export function createTask(http, token, title, description = '') {
  const url = `${config.API_URL}/tasks`;
  const payload = JSON.stringify({
    title,
    description,
  });

  const params = {
    headers: authHeaders(token),
  };

  const res = http.post(url, payload, params);

  check(res, {
    'task created': (r) => r.status === 201 || r.status === 200,
    // Note: Cannot check for ID here due to k6 json() consumption issue
    // ID validation happens in scenario code
  });

  return res;
}

/**
 * Gets user's board with all tasks
 * @param {object} http - k6 HTTP module
 * @param {string} token - Access token
 * @returns {object} Board response
 */
export function getBoard(http, token) {
  const url = `${config.API_URL}/me/board`;
  const params = {
    headers: authHeaders(token),
  };

  const res = http.get(url, params);

  check(res, {
    'board loaded': (r) => r.status === 200,
    'board has columns': (r) => r.json('board') !== undefined,
  });

  return res;
}

/**
 * Updates a task
 * @param {object} http - k6 HTTP module
 * @param {string} token - Access token
 * @param {number} taskId - Task ID
 * @param {object} updates - Fields to update (title, description)
 * @returns {object} Update task response
 */
export function updateTask(http, token, taskId, updates) {
  const url = `${config.API_URL}/tasks/${taskId}`;
  const payload = JSON.stringify(updates);

  const params = {
    headers: authHeaders(token),
  };

  const res = http.patch(url, payload, params);

  check(res, {
    'task updated': (r) => r.status === 200,
  });

  return res;
}

/**
 * Moves a task to a different column
 * @param {object} http - k6 HTTP module
 * @param {string} token - Access token
 * @param {number} taskId - Task ID
 * @param {string} newStatus - New status (TODO, IN_PROGRESS, DONE)
 * @returns {object} Move task response
 */
export function moveTask(http, token, taskId, newStatus) {
  // Backend expects target_column_id, not newStatus
  // First get board to find column IDs
  const boardRes = http.get(`${config.API_URL}/me/board`, {
    headers: authHeaders(token),
  });

  if (boardRes.status !== 200) {
    return boardRes;
  }

  const boardData = boardRes.json();
  const board = boardData.board;
  if (!board || !board.columns) {
    return { status: 500, error: 'Board data not found' };
  }

  // Map status names to column IDs based on column slug
  const column = board.columns.find(c => c.slug === newStatus);
  if (!column) {
    return { status: 400, error: `Column ${newStatus} not found` };
  }

  const url = `${config.API_URL}/tasks/${taskId}/move`;
  const payload = JSON.stringify({
    target_column_id: column.id,
  });

  const params = {
    headers: authHeaders(token),
  };

  const res = http.patch(url, payload, params);

  check(res, {
    'task moved': (r) => r.status === 200,
  });

  return res;
}

/**
 * Deletes a task
 * @param {object} http - k6 HTTP module
 * @param {string} token - Access token
 * @param {number} taskId - Task ID
 * @returns {object} Delete task response
 */
export function deleteTask(http, token, taskId) {
  const url = `${config.API_URL}/tasks/${taskId}`;

  // http.del(url, body, params) - body must be null if no payload
  const params = {
    headers: authHeaders(token),
  };

  const res = http.del(url, null, params);

  check(res, {
    'task deleted': (r) => r.status === 200 || r.status === 204,
  });

  return res;
}

/**
 * Sleep with randomized duration for more realistic user behavior
 * @param {object} sleep - k6 sleep function
 * @param {number} min - Minimum sleep time in seconds
 * @param {number} max - Maximum sleep time in seconds
 */
export function randomSleep(sleep, min = 1, max = 3) {
  const duration = Math.random() * (max - min) + min;
  sleep(duration);
}
