import { expect } from '@playwright/test';

/**
 * Page Object Model for the Bill Payment module.
 * This class encapsulates the complex form logic required to issue payments
 * to third-party payees.
 */
export class BillPayPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get payeeNameInput() {
        return this.page.locator('input[name="payee.name"]');
    }

    get payeeAddressStreetInput() {
        return this.page.locator('input[name="payee.address.street"]');
    }

    get payeeAddressCityInput() {
        return this.page.locator('input[name="payee.address.city"]');
    }

    get payeeAddressStateInput() {
        return this.page.locator('input[name="payee.address.state"]');
    }

    get payeeAddressZipCodeInput() {
        return this.page.locator('input[name="payee.address.zipCode"]');
    }

    get payeePhoneNumberInput() {
        return this.page.locator('input[name="payee.phoneNumber"]');
    }

    get payeeAccountNumberInput() {
        return this.page.locator('input[name="payee.accountNumber"]');
    }

    get verifyAccountNumberInput() {
        return this.page.locator('input[name="verifyAccount"]');
    }

    get amountInput() {
        return this.page.locator('input[name="amount"]');
    }

    get fromAccountDropdown() {
        return this.page.locator('select[name="fromAccountId"]');
    }

    get sendPaymentButton() {
        return this.page.locator('input[value="Send Payment"]');
    }

    get paymentSuccessTitle() {
        /**
         * WHY: We target the specific div with 'ng-show="showResult"' to ensure
         * we are looking at the result view rather than a generic page heading.
         */
        return this.page.locator('div[ng-show="showResult"] h1.title');
    }

    get paymentSuccessDetails() {
        return this.page.locator('#billpayResult p').first();
    }

    // ==================== Private Helpers ====================

    /**
     * Internal helper to retrieve and sanitize text.
     * WHY: Centralizing text retrieval ensures that we always handle potential
     * whitespace issues consistently across the entire POM.
     */
    async _getTrimmedText(locator) {
        await locator.waitFor({ state: 'visible' });
        const text = await locator.textContent();
        return text ? text.trim() : '';
    }

    // ==================== Actions ====================

    /**
     * Populates all fields in the Bill Payment form.
     * WHY: This method accepts a structured object to keep the method signature
     * clean and easy to read.
     *
     * @param {Object} paymentData
     */
    async fillBillPaymentForm(paymentData) {
        // Filling personal details
        await this.payeeNameInput.fill(paymentData.payeeName);
        await this.payeeAddressStreetInput.fill(paymentData.address.street);
        await this.payeeAddressCityInput.fill(paymentData.address.city);
        await this.payeeAddressStateInput.fill(paymentData.address.state);
        await this.payeeAddressZipCodeInput.fill(paymentData.address.zipCode);
        await this.payeePhoneNumberInput.fill(paymentData.phoneNumber);

        /**
         * WHY: Parabank requires the account number to be entered twice for validation.
         * We fill both fields using the same data point to satisfy this requirement.
         */
        await this.payeeAccountNumberInput.fill(paymentData.accountNumber);
        await this.verifyAccountNumberInput.fill(paymentData.accountNumber);

        // Transactional details
        await this.amountInput.fill(paymentData.amount.toString());
        await this.fromAccountDropdown.selectOption(paymentData.fromAccountId);
    }

    /**
     * Submits the payment form.
     */
    async submitPayment() {
        await this.sendPaymentButton.click();
    }

    /**
     * A high-level workflow method to pay a bill in a single call.
     *
     * WHY: We use toPass() here because Parabank's Bill Pay module is Angular-based.
     * Transient UI re-rendering or backend session lag can cause the initial
     * submission to fail or get intercepted. Encapsulating the retry logic within
     * this workflow method makes our tests more resilient without bloating the test files.
     *
     * @param {Object} paymentData
     */
    async payBill(paymentData) {
        await expect(async () => {
            await this.fillBillPaymentForm(paymentData);
            await this.submitPayment();

            /**
             * WHY: We check for a specific success signal to determine if
             * the transaction was processed. If this heading isn't visible
             * within the interval, the entire block retries.
             */
            await expect(
                this.page.getByRole('heading', { name: 'Bill Payment Complete' }),
            ).toBeVisible({ timeout: 1000 });
        }).toPass({
            intervals: [1000, 2000],
            timeout: 10000,
        });
    }

    async getPaymentSuccessTitleText() {
        return this._getTrimmedText(this.paymentSuccessTitle);
    }

    async getPaymentSuccessDetailsText() {
        return this._getTrimmedText(this.paymentSuccessDetails);
    }
}
