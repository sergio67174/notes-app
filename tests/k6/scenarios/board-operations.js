// tests/k6/scenarios/board-operations.js

import { sleep } from 'k6';
import http from 'k6/http';
import { getBoard, randomSleep } from '../utils/helpers.js';

/**
 * Load user's board scenario
 * Simulates a user loading their Kanban board
 *
 * @param {string} token - Access token
 */
export function loadBoardScenario(token) {
  const boardRes = getBoard(http, token);
  randomSleep(sleep, 1, 2);
  return boardRes;
}

/**
 * Repeatedly load board (simulating page refreshes)
 *
 * @param {string} token - Access token
 * @param {number} iterations - Number of times to load board
 */
export function refreshBoardScenario(token, iterations = 5) {
  for (let i = 0; i < iterations; i++) {
    getBoard(http, token);
    randomSleep(sleep, 2, 4);
  }
}
