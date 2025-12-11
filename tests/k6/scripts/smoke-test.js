// tests/k6/scripts/smoke-test.js

/**
 * ============================================================================
 * K6 SMOKE TEST (CI/CD OPTIMIZED)
 * ============================================================================
 *
 * Purpose: Fast validation test for CI/CD pipeline
 *
 * Test Profile:
 * - Duration: ~2 minutes (vs 10 minutes for full load test)
 * - Virtual Users: 1-10 (minimal load)
 * - Simulates: Basic functionality verification under light load
 *
 * When to Run:
 * - Every CI/CD pipeline run
 * - Pull request validation
 * - Quick performance sanity check
 *
 * Success Criteria:
 * - p95 response time < 500ms
 * - p99 response time < 1000ms
 * - Error rate < 1%
 * - All API endpoints respond correctly
 *
 * Note: This is NOT a replacement for full load testing.
 *       Run full load-test.js before releases and weekly.
 *
 * ============================================================================
 */

import { sleep } from 'k6';
import { authFlowScenario } from '../scenarios/auth-flow.js';
import { loadBoardScenario } from '../scenarios/board-operations.js';
import { mixedOperationsScenario } from '../scenarios/task-operations.js';
import { config } from '../utils/config.js';

// Smoke test configuration (fast, minimal load)
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: config.thresholds,
};

/**
 * Main test function - executed by each virtual user
 * Same scenarios as load test, just with fewer users and shorter duration
 */
export default function () {
  // Step 1: Authenticate (register + login)
  const token = authFlowScenario();

  if (!token) {
    console.error('Authentication failed, skipping test iteration');
    sleep(1);
    return;
  }

  // Step 2: Load board
  loadBoardScenario(token);

  // Step 3: Perform mixed operations (create, edit, move, delete tasks)
  mixedOperationsScenario(token);

  // Step 4: Load board again (simulating user checking their updates)
  loadBoardScenario(token);

  // Wait before next iteration
  sleep(1);
}