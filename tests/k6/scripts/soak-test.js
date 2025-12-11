// tests/k6/scripts/soak-test.js

/**
 * ============================================================================
 * K6 SOAK TEST (Endurance Test)
 * ============================================================================
 *
 * Purpose: Test system stability over extended period
 *          Identify memory leaks, resource exhaustion, and gradual degradation
 *
 * Test Profile:
 * - Duration: 1-2 hours
 * - Virtual Users: Constant 50 users
 * - Simulates: Sustained production load over time
 *
 * When to Run:
 * - Monthly stability testing
 * - Before major releases
 * - After infrastructure changes
 * - When investigating memory leak suspicions
 *
 * What to Monitor:
 * - Memory usage trending upward (memory leaks)
 * - Response time degradation over time
 * - Database connection pool leaks
 * - File handle leaks
 * - Log file growth
 * - Disk space consumption
 *
 * Expected Behavior:
 * - Consistent performance throughout test
 * - No memory growth beyond stabilization period
 * - Stable response times
 * - No resource exhaustion
 *
 * Red Flags:
 * - Response times increasing over time
 * - Memory usage continuously growing
 * - Error rate increasing over time
 * - Database connections not being released
 *
 * ============================================================================
 */

import { sleep } from 'k6';
import { authFlowScenario } from '../scenarios/auth-flow.js';
import { loadBoardScenario, refreshBoardScenario } from '../scenarios/board-operations.js';
import { mixedOperationsScenario, dragDropScenario } from '../scenarios/task-operations.js';
import { config } from '../utils/config.js';

// Test configuration
export const options = {
  stages: config.loadProfiles.soak.stages,
  thresholds: {
    // Strict thresholds - performance should remain consistent
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.01'],
  },
};

/**
 * Main test function - executed by each virtual user
 * Simulates realistic, varied user behavior over extended period
 */
export default function () {
  // Authenticate
  const token = authFlowScenario();

  if (!token) {
    sleep(1);
    return;
  }

  // Scenario 1: Load board and perform mixed operations
  loadBoardScenario(token);
  mixedOperationsScenario(token);

  sleep(2);

  // Scenario 2: Multiple board refreshes (simulating user checking for updates)
  refreshBoardScenario(token, 3);

  sleep(2);

  // Scenario 3: Drag and drop simulation
  dragDropScenario(token);

  sleep(2);

  // Scenario 4: More task operations
  mixedOperationsScenario(token);

  // Wait before next iteration
  sleep(3);
}
