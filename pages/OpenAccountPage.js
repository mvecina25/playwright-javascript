import { expect } from "@playwright/test";

/**
 * Page Object Model for the Open New Account module.
 * This class handles the selection of account types and the capture of 
 * newly generated account numbers.
 */
export class OpenAccountPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get accountTypeDropdown() {
        return this.page.locator('#type');
    }

    get fromAccountDropdown() {
        return this.page.locator('#fromAccountId');
    }

    get openNewAccountButton() {
        return this.page.getByRole('button', { name: 'Open New Account' });
    }

    get successMessage() {
        return this.page.locator('#rightPanel p', {
            hasText: 'Congratulations, your account is now open.'
        });
    }

    get newAccountIdLink() {
        return this.page.locator('#newAccountId');
    }

    // ==================== Private Helpers ====================

    /**
     * Standardized text extraction helper.
     * WHY: Centralizing this ensures we handle visibility and whitespace 
     * consistently, reducing boilerplate in public methods.
     */
    async _getTrimmedText(locator) {
        await locator.waitFor({ state: 'visible' });
        const text = await locator.textContent();
        return text ? text.trim() : '';
    }

    /**
     * Executes a click with automatic retries.
     * WHY: Parabank's "Open New Account" button is notoriously flaky due to 
     * client-side re-rendering. Using 'toPass' is the modern Playwright 
     * approach to handle transient "element intercepted" or "detached" errors.
     */
    async _clickWithRetry(locator) {
        await expect(async () => {
            await locator.click();
        }).toPass({
            intervals: [200, 500],
            timeout: 5000
        });
    }

    // ==================== Actions ====================

    /**
     * Orchestrates the account opening process.
     * WHY: We provide default parameters to make the test call concise, 
     * while allowing overrides for specific scenarios (e.g., Opening checking vs savings).
     * 
     * @param {string} accountType - 'CHECKING' or 'SAVINGS'
     * @param {string|null} fromAccountId - The ID of the funding account
     */
    async openAccount(accountType = 'SAVINGS', fromAccountId = null) {
        // Select the desired account product
        await this.accountTypeDropdown.selectOption(accountType);

        if (fromAccountId) {
            /**
             * WHY: Dropdowns in Parabank are often populated via AJAX after the 
             * page loads. We ensure the dropdown actually contains the required 
             * ID before selecting to prevent "option not found" errors.
             */
            await expect(this.fromAccountDropdown.locator('option')).not.toHaveCount(0);
            await this.fromAccountDropdown.selectOption(fromAccountId);
        }

        // Finalize account creation
        await this._clickWithRetry(this.openNewAccountButton);
    }

    /**
     * Retrieves the confirmation message after a successful submission.
     */
    async getSuccessMessageText() {
        return this._getTrimmedText(this.successMessage);
    }

    /**
     * Captures the newly generated account ID from the success page.
     * WHY: This ID is often required for downstream tests (e.g., checking balance).
     */
    async getNewAccountId() {
        return this._getTrimmedText(this.newAccountIdLink);
    }
}