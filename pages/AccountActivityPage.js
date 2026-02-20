import { expect } from "@playwright/test";

/**
 * Page Object Model representing the Account Activity page.
 * This class encapsulates locators and interactions to ensure tests remain
 * decoupled from the underlying HTML structure.
 */
export class AccountActivityPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get accountDetailsTitle() {
        return this.page.getByRole('heading', { name: 'Account Details' });
    }

    get accountId() {
        return this.page.locator('#accountId');
    }

    get accountType() {
        return this.page.locator('#accountType');
    }

    get balance() {
        return this.page.locator('#balance');
    }

    get availableBalance() {
        return this.page.locator('#availableBalance');
    }

    // ==================== Private Helpers ====================

    /**
     * Standardized method to retrieve text from a locator.
     * WHY: Centralizing this logic follows the DRY principle. It ensures that 
     * every text retrieval in our POM handles visibility and trimming consistently,
     * reducing the risk of "undefined" or "null" values in assertions.
     * 
     * @param {import('@playwright/test').Locator} locator
     * @returns {Promise<string>}
     */
    // async _getSafeText(locator) {
    //     await locator.waitFor({ state: 'visible' });
    //     const text = await locator.textContent();
    //     return text ? text.trim() : '';
    // }
    async _getSafeText(locator) {
        await locator.waitFor({ state: 'visible' });

        // Wait for the text to contain a "$" or a word (Account Type)
        // This avoids grabbing the empty string during the data-fetch phase.
        await expect(locator).toHaveText(/[\w\$]/);

        const text = await locator.textContent();
        return text ? text.trim() : '';
    }

    // ==================== Actions ====================

    /**
     * WHY: We provide a dedicated method for the title to allow tests to 
     * verify page transitions independently of data loading.
     */
    async getAccountDetailsTitleText() {
        return this._getSafeText(this.accountDetailsTitle);
    }

    /**
     * WHY: In Parabank, the Account ID is often loaded via an asynchronous 
     * AJAX call. The element might exist but be empty for a few milliseconds.
     * We use a custom 'toPass' style logic (implicitly via safe assertions in tests)
     * or ensure the text is present before returning.
     */
    async getAccountIdText() {
        const locator = this.accountId;
        await locator.waitFor({ state: 'visible' });

        /**
         * WHY: If the text is empty, we wait briefly for the AJAX call to populate.
         * We avoid long hard-coded timeouts and instead rely on Playwright's 
         * ability to re-evaluate the text content.
         */
        await this.page.waitForFunction(
            (el) => el.textContent && el.textContent.trim().length > 0,
            await locator.elementHandle()
        );

        return this._getSafeText(locator);
    }

    async getAccountTypeText() {
        return this._getSafeText(this.accountType);
    }

    async getBalanceText() {
        return this._getSafeText(this.balance);
    }

    async getAvailableBalanceText() {
        return this._getSafeText(this.availableBalance);
    }
}