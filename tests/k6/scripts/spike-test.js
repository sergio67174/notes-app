// tests/k6/scripts/spike-test.js

/**
 * ============================================================================
 * K6 SPIKE TEST
 * ============================================================================
 *
 * Purpose: Test system behavior under sudden, extreme traffic spikes
 *
 * Test Profile:
 * - Duration: 5 minutes
 * - Virtual Users: 0 → 500 (immediate spike) → hold → 0
 * - Simulates: Viral event, marketing campaign, DDoS-like traffic
 *
 * When to Run:
 * - Before major product launches
 * - Before marketing campaigns
 * - Quarterly resilience testing
 *
 * What to Monitor:
 * - Initial spike response (first 10 seconds)
 * - Auto-scaling behavior (if enabled)
 * - Circuit breaker activation
 * - Error recovery time
 * - Database connection pool behavior
 *
 * Expected Behavior:
 * - Some initial errors acceptable during spike
 * - System should stabilize within 30 seconds
 * - No cascading failures
 * - Graceful degradation, not complete outage
 *
 * ============================================================================
 */

import { sleep } from 'k6';
import { authFlowScenario } from '../scenarios/auth-flow.js';
import { loadBoardScenario } from '../scenarios/board-operations.js';
import { createMultipleTasksScenario } from '../scenarios/task-operations.js';
import { config } from '../utils/config.js';

// Test configuration
export const options = {
  stages: config.loadProfiles.spike.stages,
  thresholds: {
    // Very relaxed thresholds - we expect degradation during spike
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.10'], // Allow up to 10% failure during spike
  },
};

/**
 * Main test function - executed by each virtual user
 */
export default function () {
  // Quick authentication
  const token = authFlowScenario();

  if (!token) {
    sleep(0.5);
    return;
  }

  // Quick board load
  loadBoardScenario(token);

  // Create a few tasks rapidly
  createMultipleTasksScenario(token, 3);

  sleep(0.5);
}
