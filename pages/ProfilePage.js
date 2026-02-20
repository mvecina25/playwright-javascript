import { expect } from '@playwright/test';

/**
 * Page Object Model for the Profile/Update Contact Info page.
 * This class encapsulates the form logic for modifying user records.
 */
export class ProfilePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    get pageTitle() {
        return this.page.locator('h1.title');
    }

    /**
     * WHY: We use double backslashes (\\) to escape the dots in Parabank's 
     * ID attributes, as dots are normally interpreted as CSS classes.
     */
    get firstNameInput() { return this.page.locator('#customer\\.firstName'); }
    get lastNameInput() { return this.page.locator('#customer\\.lastName'); }
    get addressInput() { return this.page.locator('#customer\\.address\\.street'); }
    get cityInput() { return this.page.locator('#customer\\.address\\.city'); }
    get stateInput() { return this.page.locator('#customer\\.address\\.state'); }
    get zipCodeInput() { return this.page.locator('#customer\\.address\\.zipCode'); }
    get phoneNumberInput() { return this.page.locator('#customer\\.phoneNumber'); }

    get updateProfileButton() {
        return this.page.locator('input.button[value="Update Profile"]');
    }

    // Error locators are grouped for validation scenarios
    get firstNameError() { return this.page.locator('#firstName-error'); }
    get lastNameError() { return this.page.locator('#lastName-error'); }
    get streetError() { return this.page.locator('#street-error'); }
    get cityError() { return this.page.locator('#city-error'); }
    get stateError() { return this.page.locator('#state-error'); }
    get zipCodeError() { return this.page.locator('#zipCode-error'); }

    get successMessage() {
        return this.page.locator('#rightPanel p', {
            hasText: 'Your updated address and phone number have been added to the system.'
        });
    }

    // ==================== Private Helpers ====================

    /**
     * Standardized text extraction helper.
     * WHY: Centralizing this ensures we handle visibility and trimming 
     * consistently across all text-based assertions in the POM.
     */
    async _getTrimmedText(locator) {
        await locator.waitFor({ state: 'visible' });
        const text = await locator.textContent();
        return text ? text.trim() : '';
    }

    // ==================== Actions ====================  

    /**
     * Populates the profile form.
     * WHY: We assume the structure of the userData object matches our 
     * global user generation helpers to maintain data consistency.
     * 
     * @param {Object} userData 
     */
    async fillProfileForm(userData) {
        await this.firstNameInput.fill(userData.firstName);
        await this.lastNameInput.fill(userData.lastName);
        
        // Handling nested address object if provided, otherwise fallback to flat property
        const street = userData.address?.street || userData.address;
        const city = userData.address?.city || userData.city;
        const state = userData.address?.state || userData.state;
        const zipCode = userData.address?.zipCode || userData.zipCode;

        await this.addressInput.fill(street);
        await this.cityInput.fill(city);
        await this.stateInput.fill(state);
        await this.zipCodeInput.fill(zipCode);
        await this.phoneNumberInput.fill(userData.phoneNumber);
    }

    /**
     * Submits the profile update.
     */
    async clickUpdateProfile() {
        await this.updateProfileButton.click();
    }

    /**
     * High-level workflow for updating a profile.
     * WHY: This abstraction allows tests to focus on the intent (updating data) 
     * rather than the individual UI steps.
     * 
     * @param {Object} userData 
     */
    async updateProfile(userData) {
        await this.fillProfileForm(userData);
        await this.clickUpdateProfile();
    }

    /**
     * Sanity check to ensure navigation landed on the correct module.
     */
    async verifyOnProfilePage() {
        await expect(this.pageTitle).toHaveText('Update Profile');
    }

    /**
     * Captures the confirmation text after a successful update.
     */
    async getSuccessMessageText() {
        return this._getTrimmedText(this.successMessage);
    }
}