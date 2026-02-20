/**
 * Page Object Model for the Home/Overview page.
 * This class handles post-authentication navigation and account summaries.
 */
export class HomePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get logoutLink() {
        return this.page.getByRole('link', { name: 'Log Out' });
    }

    get welcomeMessage() {
        return this.page.locator('#leftPanel .smallText');
    }

    get pageTitle() {
        return this.page.locator('h1.title');
    }

    get accountTableRows() {
        return this.page.locator('#accountTable tbody tr');
    }

    // ==================== Private Helpers ====================

    /**
     * Internal helper to wait for a locator and return its trimmed text.
     * WHY: Centralizing this logic follows the DRY principle and prevents 
     * repetitive null-checking and waiting code across every getter method.
     * 
     * @param {import('@playwright/test').Locator} locator
     */
    async _getTrimmedText(locator) {
        await locator.waitFor({ state: 'visible' });
        const text = await locator.textContent();
        return text ? text.trim() : '';
    }

    // ==================== Actions ====================

    /**
     * Retrieves the welcome banner text (e.g., "Welcome John Doe").
     */
    async getLoggedInWelcomeMessage() {
        return this._getTrimmedText(this.welcomeMessage);
    }

    /**
     * Performs a logout and waits for the session to be terminated.
     */
    async clickLogout() {
        await this.logoutLink.click();
    }

    /**
     * Determines if the user is authenticated by checking for the logout link.
     * WHY: In Parabank, the presence of the logout link is the most reliable 
     * indicator that an active session exists.
     */
    async isUserLoggedIn() {
        return this.logoutLink.isVisible();
    }

    /**
     * Navigates to a specific page via the left-hand menu.
     * WHY: Using the role 'link' with a specific name is more resilient 
     * to UI changes than using indexed CSS selectors.
     * 
     * @param {string} linkName - The visible text of the menu link.
     */
    async navigateViaLeftMenu(linkName) {
        const menuLink = this.page.locator('#leftPanel').getByRole('link', { name: linkName });
        await menuLink.click();
    }

    /**
     * Extracts the account ID from the first row of the account overview table.
     * WHY: This is used to capture the default account created by the system 
     * for use in subsequent transaction tests.
     */
    async getFirstAccountId() {
        // We target the first <a> tag within the first row's first <td>
        const firstAccountLink = this.accountTableRows.first().locator('td a');
        return this._getTrimmedText(firstAccountLink);
    }

    /**
     * Retrieves the current page's main heading.
     */
    async getPageTitleText() {
        return this._getTrimmedText(this.pageTitle);
    }
}