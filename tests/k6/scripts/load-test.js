// tests/k6/scripts/load-test.js

/**
 * ============================================================================
 * K6 LOAD TEST
 * ============================================================================
 *
 * Purpose: Test system performance under expected normal and peak load
 *
 * Test Profile:
 * - Duration: 10 minutes
 * - Virtual Users: Ramps from 0 → 50 → 100 → 50 → 0
 * - Simulates: Normal daily traffic with peak hours
 *
 * When to Run:
 * - Before releases
 * - Weekly performance benchmarking
 * - After infrastructure changes
 *
 * Success Criteria:
 * - p95 response time < 500ms
 * - p99 response time < 1000ms
 * - Error rate < 1%
 * - No database connection pool exhaustion
 *
 * ============================================================================
 */

import { sleep } from 'k6';
import { authFlowScenario } from '../scenarios/auth-flow.js';
import { loadBoardScenario } from '../scenarios/board-operations.js';
import { mixedOperationsScenario } from '../scenarios/task-operations.js';
import { config } from '../utils/config.js';

// Test configuration
export const options = {
  stages: config.loadProfiles.load.stages,
  thresholds: config.thresholds,
};

/**
 * Main test function - executed by each virtual user
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
