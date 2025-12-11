// tests/k6/scenarios/auth-flow.js

import { sleep } from 'k6';
import http from 'k6/http';
import {
  generateUniqueEmail,
  registerUser,
  loginUser,
  randomSleep
} from '../utils/helpers.js';
import { config } from '../utils/config.js';

/**
 * Complete authentication flow scenario
 * Simulates a user registering and logging in
 *
 * @returns {string|null} Access token if successful
 */
export function authFlowScenario() {
  const email = generateUniqueEmail();
  const password = config.testUsers.password;
  const name = `${config.testUsers.namePrefix}_${Date.now()}`;

  // Register user
  const registerRes = registerUser(http, email, password, name);
  randomSleep(sleep, 0.5, 1);

  // Login user
  const token = loginUser(http, email, password);
  randomSleep(sleep, 0.5, 1);

  return token;
}

/**
 * Login-only scenario (for existing users)
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {string|null} Access token if successful
 */
export function loginOnlyScenario(email, password) {
  const token = loginUser(http, email, password);
  randomSleep(sleep, 0.5, 1);
  return token;
}
