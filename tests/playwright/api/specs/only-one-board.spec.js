// tests/playwright/api/only-one-board.spec.js
import { test, expect } from '@playwright/test';
import { registerUser, loginAndGetToken, authHeaders, safeJson } from '../api-helpers.js';

const BOARD_BASE = '/me/board';

/**
 * @testcase TC-API-BOARD-002
 * @requirement REQ-BOARD-001 - A user can only have one active board.
 */
test('User cannot create more than one board', async ({ request }) => {
  const unique = Date.now();
  const email = `single+${unique}@example.com`;
  const password = 'Password123!';

  await registerUser(request, email, password);
  const token = await loginAndGetToken(request, email, password);
  const headers = authHeaders(token);

  // Get the auto-created board
  const first = await request.get(BOARD_BASE, { headers });
  expect(first.ok()).toBeTruthy();
  const firstBoard = await safeJson(first);

  // Verify the board was created
  expect(firstBoard.board).toBeTruthy();
  expect(firstBoard.board.id).toBeTruthy();

  // Get board again - should return the same board
  const second = await request.get(BOARD_BASE, { headers });
  expect(second.ok()).toBeTruthy();
  const secondBoard = await safeJson(second);

  // Should be the same board ID
  expect(secondBoard.board.id).toBe(firstBoard.board.id);
});
