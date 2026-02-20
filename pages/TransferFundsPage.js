/**
 * Page Object Model for the Transfer Funds module.
 * This class encapsulates the form interactions and the verification of 
 * successful transactions between accounts.
 */
export class TransferFundsPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get amountInput() {
        return this.page.locator('#amount');
    }  

    get fromAccountDropdown() {
        return this.page.locator('#fromAccountId');
    }  

    get toAccountDropdown() {
        return this.page.locator('#toAccountId');
    }  

    get transferButton() {
        return this.page.locator('input[value="Transfer"]');
    }  

    get successMessage() {
        /**
         * WHY: #showResult is the container that appears only after 
         * a successful transaction is processed by the backend.
         */
        return this.page.locator('#showResult'); 
    }  

    get fromAccountOptionSelected() {
        return this.page.locator('#fromAccountId option:checked');
    }  

    get toAccountOptionSelected() {
        return this.page.locator('#toAccountId option:checked');
    }

    // ==================== Private Helpers ====================

    /**
     * Internal helper to wait for a locator and return its cleaned text.
     * WHY: Centralizing this logic follows the DRY principle and prevents 
     * repetitive null-checking and whitespace trimming across the POM.
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
     * Populates the transfer form.
     * WHY: We ensure dropdowns are populated before selection because 
     * Parabank loads account lists asynchronously via AJAX.
     * 
     * @param {string} amount 
     * @param {string} fromAccountId 
     * @param {string} toAccountId 
     */
    async fillTransferForm(amount, fromAccountId, toAccountId) {
        // Ensure the dropdowns have finished loading options from the API
        await this.fromAccountDropdown.waitFor({ state: 'visible' });
        
        await this.amountInput.fill(amount);
        
        // WHY: Selecting by value is more robust than selecting by index 
        // as account order can change between sessions.
        await this.fromAccountDropdown.selectOption(fromAccountId);
        await this.toAccountDropdown.selectOption(toAccountId);
    }

    /**
     * Submits the transfer request.
     */
    async submitTransfer() {
        await this.transferButton.click();
    }

    /**
     * Orchestrates a complete funds transfer in a single high-level step.
     * WHY: This follows the Single Responsibility Principle for test interactions,
     * allowing test scripts to be more declarative.
     */
    async transferFunds(amount, fromAccountId, toAccountId) {
        await this.fillTransferForm(amount, fromAccountId, toAccountId);
        
        /**
         * WHY: A short delay or waiting for the button to be stable is sometimes 
         * needed in Parabank as the internal Angular state updates.
         */
        await this.submitTransfer();
    }

    /**
     * Retrieves the balance text currently selected in the 'From' dropdown.
     */
    async getFromAccountBalance() {
        return this._getTrimmedText(this.fromAccountOptionSelected);
    }

    /**
     * Retrieves the balance text currently selected in the 'To' dropdown.
     */
    async getToAccountBalance() {
        return this._getTrimmedText(this.toAccountOptionSelected);
    }

    /**
     * Retrieves the confirmation message after the transfer is complete.
     * WHY: We wait for the success container to be visible to ensure 
     * the transaction has been successfully processed by the server.
     */
    async getSuccessMessageText() {
        return this._getTrimmedText(this.successMessage);
    }
}