import { test, expect } from "@playwright/test";
import { RegisterPage } from "../pages/RegisterPage";

/**
 * Generates a unique email for registration tests.
 *
 * @returns {string} A unique email based on timestamp.
 */
function generateUniqueEmail() {
  return `regina_${Date.now()}@example.com`;
}

test.describe("Register Page - Phase 1", () => {
  /**
   * Validates that the register button stays disabled
   * until all form fields contain valid input.
   */
  test("register button is disabled until form is valid", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // Initial state: button must be disabled
    await registerPage.expectButtonDisabled();

    // Invalid data → still disabled
    await registerPage.fillForm({
      name: "",
      email: "bad-email",
      password: "abc",
    });

    await registerPage.expectButtonDisabled();

    // Valid data → enabled
    await registerPage.fillForm({
      name: "Regina",
      email: generateUniqueEmail(),
      password: "Password123!",
    });

    await registerPage.expectButtonEnabled();
  });

  /**
   * Validates a successful registration flow with valid input.
   */
  test("successful registration with valid data", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.fillForm({
      name: "Regina",
      email: generateUniqueEmail(),
      password: "Password123!",
    });

    await registerPage.submit();

    await expect(registerPage.successMessage).toBeVisible();
    await expect(registerPage.successMessage).toContainText(/registered|account/i);
  });

  /**
   * Validates that duplicate email registration is rejected
   * and shows an appropriate error message.
   */
  test("duplicate email shows error message", async ({ page }) => {
    const email = generateUniqueEmail();

    const registerPage = new RegisterPage(page);

    // First registration → success
    await registerPage.goto();
    await registerPage.fillForm({
      name: "First User",
      email,
      password: "Password123!",
    });
    await registerPage.submit();
    await expect(registerPage.successMessage).toBeVisible();

    // Second registration → must fail
    await registerPage.goto();
    await registerPage.fillForm({
      name: "Second User",
      email,
      password: "Password123!",
    });
    await registerPage.submit();

    await expect(registerPage.errorMessage).toBeVisible();
    await expect(registerPage.errorMessage).toContainText(/already|exists|registered/i);
  });

  /**
   * Validates that the login link correctly redirects to the login page.
   */
  test("login link navigates to login page", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.clickLoginLink();

    await expect(page).toHaveURL(/login/i);
  });

  /**
 * Validates that password field shows validation message
 * when the user focuses and blurs without entering a value.
 */
test("password field shows warning on blur with empty input", async ({ page }) => {
  const registerPage = new RegisterPage(page);
  await registerPage.goto();

  // Focus password input
  await registerPage.passwordInput.click();

  // Blur by clicking anywhere else (e.g. name field)
  await registerPage.nameInput.click();

  // Expect field validation warning to appear (not API error)
  await expect(registerPage.errorPassword).toBeVisible();
  await expect(registerPage.errorPassword).toContainText(/password/i);
});
});