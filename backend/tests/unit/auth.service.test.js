/**
 * @fileoverview
 * Unit tests for the Authentication Service (`auth.service.js`).
 *
 * Requirements covered in this file (from Traceability Matrix):
 *  - R-001: System must allow user registration with email, password, name.
 *  - R-002: Password must be securely hashed and compared.
 *  - R-003: User must log in to obtain JWT.
 *  - R-004: Protected endpoints require JWT validation (service side: correct JWT issuance and invalid-credentials handling).
 *
 * Unit Test IDs (from matrix):
 *  - UT-07 / UT-08: Registration & password hashing behavior.
 *  - UT-09: Login & JWT behavior, invalid credentials handling.
 *
 * Test Case IDs (from matrix):
 *  - TC-001: Register a New User Successfully.
 *  - TC-002: Register With Already Used Email.
 *  - TC-004: Login Successfully.
 *  - TC-005: Login With Incorrect Password.
 *
 * Note:
 *  - TC-003 (missing fields) and TC-006 (access protected endpoint without token)
 *    are expected to be covered at controller/API level, not in this service test file.
 */

import { registerUser, loginUser } from "../../src/services/auth.service.js";
import { clearDatabase } from "./dbTestUtils.js";
import { query, pool } from "../../src/config/db.js";

/**
 * @description Test suite for Auth Service functionality.
 */
describe("Auth Service", () => {
  /**
   * @description
   * Global setup before all tests:
   *  - Ensures the database is fully cleaned so no previous data affects UT-07/08/09.
   */
  beforeAll(async () => {
    await clearDatabase();
  });

  /**
   * @description
   * Cleanup after each test:
   *  - Removes users, boards, columns and tasks created by each test case.
   *  - Guarantees isolation between TC-001, TC-002, TC-004, TC-005.
   */
  afterEach(async () => {
    await clearDatabase();
  });

  /**
   * @description
   * Global teardown after the entire suite:
   *  - Closes the PostgreSQL pool cleanly so Jest can exit without open handles.
   */
  afterAll(async () => {
    await pool.end();
  });

  // -------------------------------------------------------------------------
  //  TC-001 / UT-07 / UT-08 / R-001, R-002 (+ R-005/R-006 parcialmente)
  // -------------------------------------------------------------------------

  /**
   * @test TC-001
   * @unitTest UT-07
   * @unitTest UT-08
   * @requirement R-001
   * @requirement R-002
   * @requirement R-005
   * @requirement R-006
   *
   * @description
   * Corresponds to: "Register a New User Successfully".
   *
   * This test validates that:
   *  - A new user can be registered with email, password and name (R-001).
   *  - The user is persisted in the `users` table.
   *  - A board is automatically created for that user (R-005).
   *  - Three default columns (TODO, IN_PROGRESS, DONE) are created for that board (R-006).
   *  - The internal flow implies password hashing & storage (R-002), even if the hash value
   *    is not asserted directly here (covered indirectly via login behavior in UT-09).
   */
  test("registerUser creates user, board and columns", async () => {
    const email = "testuser@example.com";
    const password = "StrongPass123!";
    const name = "Test User";

    const user = await registerUser({ email, password, name });

    // Basic response validation
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.name).toBe(name);
    expect(user.id).toBeDefined();

    // --- DB verification: user exists ---
    const userRes = await query("SELECT * FROM users WHERE email = $1", [email]);
    expect(userRes.rowCount).toBe(1);

    const userId = userRes.rows[0].id;

    // Board must be created for this user (R-005)
    const boardRes = await query("SELECT * FROM boards WHERE owner_id = $1", [userId]);
    expect(boardRes.rowCount).toBe(1);

    const boardId = boardRes.rows[0].id;

    // Default columns must exist (R-006)
    const columnsRes = await query(
      "SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC",
      [boardId]
    );
    expect(columnsRes.rowCount).toBe(3);

    const slugs = columnsRes.rows.map((c) => c.slug).sort();
    expect(slugs).toEqual(["DONE", "IN_PROGRESS", "TODO"].sort());
  });

  // -------------------------------------------------------------------------
  //  TC-002 / UT-08 / R-001, R-002
  // -------------------------------------------------------------------------

  /**
   * @test TC-002
   * @unitTest UT-08
   * @requirement R-001
   * @requirement R-002
   *
   * @description
   * Corresponds to: "Register With Already Used Email".
   *
   * This test validates that:
   *  - A second registration with the same email is rejected with a 409-style error.
   *  - The service enforces uniqueness at the business logic level for emails (R-001).
   *  - In combination with password hashing, prevents ambiguous account ownership (R-002).
   */
  test("registerUser fails when email already exists", async () => {
    const email = "duplicate@example.com";

    await registerUser({
      email,
      password: "Password1!",
      name: "User One",
    });

    // Attempt duplicate registration
    await expect(
      registerUser({
        email,
        password: "Password2!",
        name: "User Two",
      })
    ).rejects.toMatchObject({
      message: "Email already registered",
      status: 409,
    });
  });

  // -------------------------------------------------------------------------
  //  TC-004 / UT-09 / R-002, R-003
  // -------------------------------------------------------------------------

  /**
   * @test TC-004
   * @unitTest UT-09
   * @requirement R-002
   * @requirement R-003
   *
   * @description
   * Corresponds to: "Login Successfully".
   *
   * This test validates that:
   *  - A previously registered user can log in with correct credentials (R-003).
   *  - A JWT token is returned on successful login (R-003).
   *  - The returned user object matches the registered user.
   *  - Password hashing/comparison must be correct (R-002), because login only succeeds
   *    when the stored hash and provided password match.
   */
  test("loginUser returns token and user for valid credentials", async () => {
    const email = "login@example.com";
    const password = "LoginPass123!";
    const name = "Login User";

    // Arrange: register user
    await registerUser({ email, password, name });

    // Act: login with correct credentials
    const result = await loginUser({ email, password });

    // Assert: login successful and token is issued (R-003)
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(email);
    expect(result.user.name).toBe(name);
  });

  // -------------------------------------------------------------------------
  //  TC-005 / UT-09 / R-004 (invalid password case)
  // -------------------------------------------------------------------------

  /**
   * @test TC-005
   * @unitTest UT-09
   * @requirement R-004
   * @requirement R-002
   *
   * @description
   * Partially corresponds to: "Login With Incorrect Password".
   *
   * This test validates that:
   *  - When the email exists but the password is incorrect,
   *    `loginUser` throws an error with:
   *      status: 401
   *      message: "Invalid credentials"
   *  - This contributes to R-004 by ensuring that
   *    invalid credentials never produce a JWT.
   *  - Also reinforces correct password comparison behavior (R-002),
   *    since a mismatched password correctly fails authentication.
   */
  test("loginUser fails with invalid password", async () => {
    const email = "wrongpass@example.com";
    const password = "CorrectPass1!";
    const name = "Wrong Pass User";

    await registerUser({ email, password, name });

    await expect(
      loginUser({
        email,
        password: "IncorrectPass!",
      })
    ).rejects.toMatchObject({
      message: "Invalid credentials",
      status: 401,
    });
  });

  // -------------------------------------------------------------------------
  //  TC-005 / UT-09 / R-004 (non-existing user case)
  // -------------------------------------------------------------------------

  /**
   * @test TC-005
   * @unitTest UT-09
   * @requirement R-004
   *
   * @description
   * Also contributes to: "Login With Incorrect Password" from the perspective
   * of invalid credentials.
   *
   * This test validates that:
   *  - If a user with the given email does not exist,
   *    `loginUser` still responds with "Invalid credentials" (401).
   *  - The service does not leak whether the email is registered or not,
   *    which is aligned with secure authentication practices (R-004).
   *  - No JWT is issued for unknown users.
   */
  test("loginUser fails when user does not exist", async () => {
    await expect(
      loginUser({
        email: "nonexistent@example.com",
        password: "Whatever123!",
      })
    ).rejects.toMatchObject({
      message: "Invalid credentials",
      status: 401,
    });
  });
});
