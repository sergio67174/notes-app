import { test, expect } from "@playwright/test";
import {
  registerUser,
  loginAndGetToken,
  authHeaders,
} from "../api-helpers.js";

/**
 * Generates a unique email for test users.
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `authtest_${Date.now()}@example.com`;
}

/**
 * Auth API Tests - Authentication and Authorization Edge Cases
 * Tests protected routes, token validation, and session handling.
 *
 * Note: Logout tests removed - backend uses JWT stateless authentication
 * with no server-side /logout endpoint. Logout is handled client-side.
 */
test.describe("Auth API - Logout and Auth Edge Cases", () => {
  /**
   * Test that protected routes require authentication.
   */
  test("protected route /me/board requires authentication", async ({
    request,
  }) => {
    const boardRes = await request.get("/me/board");

    expect(boardRes.status()).toBe(401);
    const data = await boardRes.json();
    expect(data.message || data.error).toMatch(/unauthorized|token|auth/i);
  });

  /**
   * Test that tasks endpoints require authentication.
   */
  test("protected route POST /tasks requires authentication", async ({
    request,
  }) => {
    const taskRes = await request.post("/tasks", {
      data: {
        title: "Unauthorized Task",
        description: "Should fail",
      },
    });

    expect(taskRes.status()).toBe(401);
    const data = await taskRes.json();
    expect(data.message || data.error).toMatch(/unauthorized|token|auth/i);
  });

  /**
   * Test that invalid token returns 401.
   */
  test("invalid token returns 401", async ({ request }) => {
    const invalidToken = "invalid.jwt.token.here";

    const boardRes = await request.get("/me/board", {
      headers: authHeaders(invalidToken),
    });

    expect(boardRes.status()).toBe(401);
    const data = await boardRes.json();
    expect(data.message || data.error).toMatch(/invalid|token|auth/i);
  });

  /**
   * Test that malformed token returns 401.
   */
  test("malformed token returns 401", async ({ request }) => {
    const malformedToken = "not-a-valid-jwt";

    const boardRes = await request.get("/me/board", {
      headers: authHeaders(malformedToken),
    });

    expect(boardRes.status()).toBe(401);
  });

  /**
   * Test that valid token grants access to protected routes.
   */
  test("valid token grants access to protected routes", async ({ request }) => {
    const email = generateUniqueEmail();
    const password = "Password123!";

    // Register and login
    await registerUser(request, email, password, "Valid User");
    const token = await loginAndGetToken(request, email, password);

    // Access protected route
    const boardRes = await request.get("/me/board", {
      headers: authHeaders(token),
    });

    expect(boardRes.ok()).toBeTruthy();
    const data = await boardRes.json();
    expect(data).toHaveProperty("board");
  });

  /**
   * Test that missing Authorization header returns 401.
   */
  test("missing authorization header returns 401", async ({ request }) => {
    const boardRes = await request.get("/me/board", {
      headers: {},
    });

    expect(boardRes.status()).toBe(401);
  });

  /**
   * Test that wrong authorization scheme returns 401.
   */
  test("wrong authorization scheme returns 401", async ({ request }) => {
    const email = generateUniqueEmail();
    const password = "Password123!";

    await registerUser(request, email, password, "Test User");
    const token = await loginAndGetToken(request, email, password);

    // Use wrong scheme (should be "Bearer")
    const boardRes = await request.get("/me/board", {
      headers: {
        Authorization: `Basic ${token}`, // Wrong scheme
      },
    });

    expect(boardRes.status()).toBe(401);
  });
});
