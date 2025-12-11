import { expect } from "@playwright/test";

/**
 * Page Object Model for the Login page.
 *
 * Encapsulates selectors and user actions related to the login UI.
 */
export class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright Page instance.
   */
  constructor(page) {
    this.page = page;

    this.container = page.getByTestId("auth-page");
    this.heading = page.getByTestId("login-heading");
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("input-email");
    this.passwordInput = page.getByTestId("input-password");
    this.errorMessage = page.getByTestId("error-message");
    this.loginButton = page.getByTestId("button-login");
    this.registerLink = page.getByTestId("register-link");
  }

  /**
   * Navigates to the login page using baseURL.
   * Note: "/" also redirects to "/login" by default.
   */
  async goto() {
    await this.page.goto("/login");
    await expect(this.container).toBeVisible();
  }

  /**
   * Navigates to the root path (which redirects to login).
   */
  async gotoRoot() {
    await this.page.goto("/");
    await expect(this.container).toBeVisible();
  }

  /**
   * Fills in the login form.
   *
   * @param {{ email?: string; password?: string }} params
   * Optional fields to populate in the form.
   */
  async fillForm(params) {
    const { email, password } = params;

    if (email !== undefined) {
      await this.emailInput.fill(email);
    }
    if (password !== undefined) {
      await this.passwordInput.fill(password);
    }
  }

  /**
   * Clicks the login button.
   */
  async submit() {
    await this.loginButton.click();
  }

  /**
   * Asserts that the login button is disabled.
   */
  async expectButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }

  /**
   * Asserts that the login button is enabled.
   */
  async expectButtonEnabled() {
    await expect(this.loginButton).toBeEnabled();
  }

  /**
   * Asserts that the error message is visible with specific text.
   * @param {string} text - Expected error message text.
   */
  async expectErrorMessage(text) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(text);
  }

  /**
   * Clicks the "Register" link.
   */
  async clickRegisterLink() {
    await this.registerLink.click();
  }

  /**
   * Performs a complete login with email and password.
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    await this.fillForm({ email, password });
    await this.submit();
  }
}
