/**
 * Page Object Model for the Accounts Overview page.
 * This class handles the extraction of financial data from the summary table.
 */
export class AccountsOverviewPage {
    /**
     * WHY: We define column indices as a constant to avoid "magic numbers."
     * If the Parabank developers change the table layout, we only update this object.
     */
    static COLUMN_INDEX = {
        BALANCE: 1,
        AVAILABLE_AMOUNT: 2
    };

    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get accountTable() {
        return this.page.locator('#accountTable');
    }

    // ==================== Private Helpers ====================

    /**
     * Locates a specific row in the table based on the Account ID.
     * WHY: Parabank dynamically generates IDs in the href of the account links. 
     * Filtering by the href attribute is the most unique and robust way to target a specific row.
     */
    _getAccountRow(accountId) {
        return this.page.locator('#accountTable tbody tr', {
            has: this.page.locator(`a[href*="id=${accountId}"]`)
        });
    }

    /**
     * Common logic to retrieve text from a specific column for a specific account.
     * WHY: This follows the DRY principle by centralizing the "Locate -> Wait -> Extract" 
     * workflow used by all balance-related getters.
     * 
     * @param {string} accountId 
     * @param {number} colIndex 
     */
    async _getAccountField(accountId, colIndex) {
        const row = this._getAccountRow(accountId);
        const cell = row.locator('td').nth(colIndex);

        /**
         * WHY: Table data in Parabank is often populated via AJAX. 
         * Waiting for 'visible' ensures the dynamic content has finished loading 
         * before we attempt to read the text.
         */
        await cell.waitFor({ state: 'visible' });
        
        const content = await cell.textContent();
        return content ? content.trim() : '';
    }

    // ==================== Actions ====================

    /**
     * Retrieves the Balance for the specified account.
     * @param {string} accountId 
     */
    async getAccountBalance(accountId) {
        return this._getAccountField(accountId, AccountsOverviewPage.COLUMN_INDEX.BALANCE);
    }

    /**
     * Retrieves the Available Amount for the specified account.
     * @param {string} accountId 
     */
    async getAvailableAmount(accountId) {
        return this._getAccountField(accountId, AccountsOverviewPage.COLUMN_INDEX.AVAILABLE_AMOUNT);
    }

    /**
     * WHY: Added a specific validation method to ensure the table is loaded.
     * This can be used in test steps to verify the UI state before data extraction.
     */
    async isTableVisible() {
        return this.accountTable.isVisible();
    }
}