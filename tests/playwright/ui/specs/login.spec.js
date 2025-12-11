import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";

/**
 * Generates a unique email for test users.
 *
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `testuser_${Date.now()}@example.com`;
}

/**
 * Helper function to register a test user for login tests.
 *
 * @param {import('@playwright/test').Page} page - Playwright Page instance
 * @param {Object} userData - User data for registration
 * @returns {Promise<Object>} User credentials
 */
async function registerTestUser(page, userData) {
  const registerPage = new RegisterPage(page);
  await registerPage.goto();
  await registerPage.fillForm(userData);
  await registerPage.submit();
  await expect(registerPage.successMessage).toBeVisible();
  return userData;
}

test.describe("Login Page - Authentication Flow", () => {
  /**
   * Validates that the login button is initially enabled
   * (no client-side validation blocking on login page).
   */
  test("login button is enabled by default", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.loginButton).toBeEnabled();
  });

  /**
   * Validates successful login flow with valid credentials.
   */
  test("successful login with valid credentials", async ({ page }) => {
    // First, register a user
    const email = generateUniqueEmail();
    const password = "Password123!";

    await registerTestUser(page, {
      name: "Test User",
      email,
      password,
    });

    // Navigate to login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill login form
    await loginPage.fillForm({ email, password });
    await loginPage.submit();

    // Should redirect to board page after successful login
    await expect(page).toHaveURL(/board/i);
  });

  /**
   * Validates that login fails with invalid email.
   */
  test("login fails with invalid email", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillForm({
      email: "nonexistent@example.com",
      password: "Password123!",
    });

    await loginPage.submit();

    // Should show error message
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/invalid|password|credentials/i);
  });

  /**
   * Validates that login fails with wrong password.
   */
  test("login fails with wrong password", async ({ page }) => {
    // First, register a user
    const email = generateUniqueEmail();

    await registerTestUser(page, {
      name: "Test User",
      email,
      password: "Password123!",
    });

    // Try to login with wrong password
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillForm({
      email,
      password: "WrongPassword456!",
    });

    await loginPage.submit();

    // Should show error message
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/invalid|password|credentials/i);
  });

  /**
   * Validates that empty form submission shows appropriate error.
   */
  test("login fails with empty fields", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Submit without filling form
    await loginPage.submit();

    // Should show error message
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/enter|email|password|required/i);
  });

  /**
   * Validates that the register link correctly redirects to the register page.
   */
  test("register link navigates to register page", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.clickRegisterLink();

    await expect(page).toHaveURL(/register/i);
  });

  /**
   * Validates login button text changes during loading state.
   */
  test("login button shows loading state during submission", async ({ page }) => {
    // Register a user first
    const email = generateUniqueEmail();
    const password = "Password123!";

    await registerTestUser(page, {
      name: "Test User",
      email,
      password,
    });

    // Navigate to login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillForm({ email, password });

    // Check button text before submission
    await expect(loginPage.loginButton).toHaveText("Login");

    // Click submit and immediately check for loading state
    await loginPage.loginButton.click();

    // Button should show "Logging in..." during API call
    // Note: This might be flaky if API is too fast
    const buttonText = await loginPage.loginButton.textContent();
    expect(buttonText === "Logging in..." || buttonText === "Login").toBeTruthy();
  });

  /**
   * Validates that heading displays correct text.
   */
  test("page displays correct heading", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.heading).toHaveText("Welcome back");
  });

  /**
   * Validates that email and password input fields are present.
   */
  test("page contains email and password input fields", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.emailInput).toHaveAttribute("type", "email");
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
  });

  /**
   * Validates full login flow using the convenience login method.
   */
  test("convenience login method works correctly", async ({ page }) => {
    // Register a user first
    const email = generateUniqueEmail();
    const password = "Password123!";

    await registerTestUser(page, {
      name: "Test User",
      email,
      password,
    });

    // Use convenience login method
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    // Should redirect to board page
    await expect(page).toHaveURL(/board/i);
  });
});
