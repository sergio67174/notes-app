// tests/k6/scripts/stress-test.js

/**
 * ============================================================================
 * K6 STRESS TEST
 * ============================================================================
 *
 * Purpose: Find the system's breaking point and identify bottlenecks
 *
 * Test Profile:
 * - Duration: 15 minutes
 * - Virtual Users: Ramps from 0 → 100 → 200 → 300 → 0
 * - Simulates: Traffic exceeding normal capacity
 *
 * When to Run:
 * - Before major releases
 * - Monthly capacity planning
 * - After infrastructure upgrades
 *
 * What to Monitor:
 * - CPU usage on backend server
 * - Database connection pool usage
 * - Memory consumption
 * - Response time degradation
 * - Error rates at each load level
 *
 * Expected Behavior:
 * - System should gracefully degrade
 * - Errors should be handled properly
 * - No crashes or unrecoverable failures
 *
 * ============================================================================
 */

import { sleep } from 'k6';
import { authFlowScenario } from '../scenarios/auth-flow.js';
import { loadBoardScenario } from '../scenarios/board-operations.js';
import { taskLifecycleScenario } from '../scenarios/task-operations.js';
import { config } from '../utils/config.js';

// Test configuration
export const options = {
  stages: config.loadProfiles.stress.stages,
  thresholds: {
    // Relaxed thresholds for stress testing
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'], // Allow up to 5% failure at peak stress
  },
};

/**
 * Main test function - executed by each virtual user
 */
export default function () {
  // Authenticate
  const token = authFlowScenario();

  if (!token) {
    sleep(1);
    return;
  }

  // Perform intensive task operations
  taskLifecycleScenario(token);

  // Load board to verify data consistency
  loadBoardScenario(token);

  sleep(1);
}
