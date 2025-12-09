// tests/playwright/api/api-helpers.js
import { expect } from '@playwright/test';

/**
 * Safely parses JSON; throws a clear error if response is HTML or not JSON.
 * @param {import('@playwright/test').APIResponse} res
 * @returns {Promise<any>}
 */
export async function safeJson(res) {
  const contentType = res.headers()['content-type'] || '';
  const text = await res.text();

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON but got content-type="${contentType}", status=${res.status()}, body="${text.slice(
        0,
        300
      )}"`
    );
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Failed to parse JSON, status=${res.status()}, body="${text.slice(0, 300)}"`
    );
  }
}

/**
 * Registers a user through the API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} password
 * @param {string} [name='Test User']
 */
export async function registerUser(request, email, password, name = 'Test User') {
  const res = await request.post('/auth/register', {
    data: { email, password, name },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `registerUser failed: status=${res.status()} body="${body.slice(0, 300)}"`
    );
  }

  return res;
}

/**
 * Logs in and returns the access token.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} access token
 */
export async function loginAndGetToken(request, email, password) {
  const res = await request.post('/auth/login', {
    data: { email, password },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `loginAndGetToken failed: status=${res.status()} body="${body.slice(0, 300)}"`
    );
  }

  const json = await safeJson(res);
  // adjust property name if needed
  return json.accessToken || json.token;
}

/**
 * Generates Bearer authorization headers.
 * @param {string} token
 */
export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
