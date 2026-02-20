/**
 * Page Object Model for the User Registration page.
 * This class encapsulates the complex registration form and post-registration messages.
 */
export class RegisterPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get firstNameInput() { return this.page.locator('input[id="customer.firstName"]'); }
    get lastNameInput() { return this.page.locator('input[id="customer.lastName"]'); }
    get streetInput() { return this.page.locator('input[id="customer.address.street"]'); }
    get cityInput() { return this.page.locator('input[id="customer.address.city"]'); }
    get stateInput() { return this.page.locator('input[id="customer.address.state"]'); }
    get zipCodeInput() { return this.page.locator('input[id="customer.address.zipCode"]'); }
    get phoneInput() { return this.page.locator('input[id="customer.phoneNumber"]'); }
    get ssnInput() { return this.page.locator('input[id="customer.ssn"]'); }
    get usernameInput() { return this.page.locator('input[id="customer.username"]'); }
    get passwordInput() { return this.page.locator('input[id="customer.password"]'); }
    get confirmPasswordInput() { return this.page.locator('input[id="repeatedPassword"]'); }
    
    get registerButton() {
        return this.page.locator('input[value="Register"]');
    }

    get welcomeMessage() {
        return this.page.locator('h1.title');
    }

    get registrationSuccessMessage() {
        return this.page.locator('#rightPanel p');
    }

    get errorMessage() {
        return this.page.locator('.error');
    }

    // ==================== Private Helpers ====================

    /**
     * Standardized method to retrieve text from a locator.
     * WHY: Centralizing this logic follows the DRY principle. It ensures consistent 
     * waiting for visibility and string trimming across all registration assertions.
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
     * Populates the entire registration form.
     * WHY: We use a structured userData object to keep the method interface clean 
     * and compatible with our random data generation utilities.
     * 
     * @param {Object} userData 
     */
    async fillRegistrationForm(userData) {
        await this.firstNameInput.fill(userData.firstName);
        await this.lastNameInput.fill(userData.lastName);
        await this.streetInput.fill(userData.address.street);
        await this.cityInput.fill(userData.address.city);
        await this.stateInput.fill(userData.address.state);
        await this.zipCodeInput.fill(userData.address.zipCode);
        await this.phoneInput.fill(userData.phoneNumber);
        await this.ssnInput.fill(userData.ssn);
        await this.usernameInput.fill(userData.username);
        await this.passwordInput.fill(userData.password);

        /**
         * WHY: Many data generators provide one password. To ensure a successful 
         * registration, we default the confirmation field to match the primary password 
         * unless a specific confirmation value is provided.
         */
        const confirmation = userData.confirmPassword || userData.password;
        await this.confirmPasswordInput.fill(confirmation);
    }

    /**
     * Submits the registration form.
     */
    async submitRegistration() {
        await this.registerButton.click();
    }

    /**
     * A high-level workflow to register a user in a single call.
     * WHY: This abstraction allows tests to focus on the intent (onboarding a user) 
     * rather than the specific form fields, following the Single Responsibility Principle.
     */
    async registerNewUser(userData) {
        await this.fillRegistrationForm(userData);
        await this.submitRegistration();
    }

    /**
     * Retrieves the welcome title after registration (e.g., "Welcome [Username]").
     */
    async getWelcomeMessageText() {
        return this._getTrimmedText(this.welcomeMessage);
    }

    /**
     * Retrieves the specific success text from the confirmation panel.
     */
    async getRegistrationSuccessMessageText() {
        // We target the first paragraph of the success section
        return this._getTrimmedText(this.registrationSuccessMessage.first());
    }

    /**
     * Retrieves any validation or system error displayed on the form.
     */
    async getErrorMessageText() {
        return this._getTrimmedText(this.errorMessage);
    }
}