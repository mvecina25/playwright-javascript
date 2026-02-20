/**
 * Page Object Model for the Login module.
 * This class centralizes all interactions with the Parabank authentication form.
 * Encapsulating these elements here ensures that if the UI changes, 
 * we only need to update the locator in one place (DRY principle).
 */
export class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get usernameInput() {
        return this.page.locator('input[name="username"]');
    }

    get passwordInput() {
        return this.page.locator('input[name="password"]');
    }

    get loginButton() {
        return this.page.locator('input[value="Log In"]');
    }

    get registerLink() {
        /**
         * WHY: Using getByRole is preferred as it mimics how a user 
         * interacts with the page (accessibility-first) and is less 
         * brittle than complex CSS selectors.
         */
        return this.page.getByRole('link', { name: 'Register' });
    }

    get errorMessage() {
        return this.page.locator('.error');
    }

    // ==================== Actions ====================    

    /**
     * Executes the login sequence.
     * WHY: Combining these steps into a single action simplifies test scripts 
     * and reduces boilerplate code in the test files.
     * 
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        // Ensure inputs are ready before typing
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        
        // WHY: We click the button directly; Playwright's auto-waiting 
        // handles the element readiness.
        await this.loginButton.click();
    }

    /**
     * Navigates to the Registration page.
     * WHY: Abstracting navigation into named methods makes the intent 
     * of the test clear at a glance (Clean Code).
     */
    async clickRegisterLink() {
        await this.registerLink.click();
    }

    /**
     * Retrieves the text from the error message container.
     * WHY: We include a visibility check to ensure the asynchronous error 
     * message has appeared before the test attempts to read it.
     */
    async getErrorMessageText() {
        await this.errorMessage.waitFor({ state: 'visible' });
        const text = await this.errorMessage.textContent();
        return text ? text.trim() : '';
    }
}