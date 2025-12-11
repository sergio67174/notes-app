import { expect } from "@playwright/test";

/**
 * Page Object Model for the Register page.
 *
 * Encapsulates selectors and user actions related to the register UI.
 */
export class RegisterPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright Page instance.
   */
  constructor(page) {
    this.page = page;

    this.container = page.getByTestId("register-container");
    this.nameInput = page.getByTestId("register-input-name");
    this.emailInput = page.getByTestId("register-input-email");
    this.passwordInput = page.getByTestId("register-input-password");
    this.registerButton = page.getByTestId("register-button");
    this.successMessage = page.getByTestId("success-message");
    this.errorMessage = page.getByTestId("error-api");
    this.errorName = page.getByTestId("error-name");
    this.errorEmail = page.getByTestId("error-email");
    this.errorPassword = page.getByTestId("error-password");
    this.loginLink = page.getByTestId("login-link");
  }

  /**
   * Navigates to the registration page using baseURL.
   * Note: Default route "/" redirects to "/login", so we explicitly navigate to "/register".
   */
  async goto() {
    await this.page.goto("/register");
    await expect(this.container).toBeVisible();
  }

  /**
   * Fills in the registration form.
   *
   * @param {{ name?: string; email?: string; password?: string }} params
   * Optional fields to populate in the form.
   */
  async fillForm(params) {
    const { name, email, password } = params;

    if (name !== undefined) {
      await this.nameInput.fill(name);
    }
    if (email !== undefined) {
      await this.emailInput.fill(email);
    }
    if (password !== undefined) {
      await this.passwordInput.fill(password);
    }
  }

  /**
   * Clicks the register button.
   */
  async submit() {
    await this.registerButton.click();
  }

  /**
   * Asserts that the register button is disabled.
   */
  async expectButtonDisabled() {
    await expect(this.registerButton).toBeDisabled();
  }

  /**
   * Asserts that the register button is enabled.
   */
  async expectButtonEnabled() {
    await expect(this.registerButton).toBeEnabled();
  }

  /**
   * Clicks the "Login" link.
   */
  async clickLoginLink() {
    await this.loginLink.click();
  }
}
