/**
 * BasePage serves as the parent class for all Page Object Models.
 * WHY: It centralizes common utilities (navigation, title checks, logging) that are 
 * shared across the entire application, adhering to the DRY (Don't Repeat Yourself) principle.
 */
export class BasePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigates to a specific path within the application.
     * WHY: We centralize navigation here to ensure consistent handling of environment 
     * variables and page load states across all tests.
     * 
     * @param {string} urlPath - The specific endpoint (e.g., '/register.htm'). 
     * Defaults to an empty string for the home page.
     */
    async navigateTo(urlPath = '') {
        const baseUrl = process.env.APP_BASE_URL;

        /**
         * WHY: We validate the base URL existence to "fail fast." 
         * This provides a clear error message if the environment configuration is missing, 
         * rather than letting Playwright fail with a generic navigation error.
         */
        if (!baseUrl) {
            throw new Error('APP_BASE_URL is not defined. Please check your .env file or CI environment.');
        }

        /**
         * WHY: Manual string concatenation can lead to "//" if both the base URL 
         * and the path contain slashes. This approach ensures a clean URL.
         */
        const formattedPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
        const fullUrl = `${baseUrl.replace(/\/$/, '')}${formattedPath}`;

        /**
         * WHY: We use 'domcontentloaded' as the default wait state to speed up tests.
         * For legacy apps like Parabank, this is often sufficient to start interactions 
         * without waiting for heavy external assets to load.
         */
        await this.page.goto(fullUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
    }

    /**
     * Retrieves the document title of the current page.
     * WHY: Centralizing this allows us to add global transformations or 
     * logging in the future without changing individual test files.
     */
    async getTitle() {
        return await this.page.title();
    }

    /**
     * WHY: Added a utility to wait for the page to reach a stable state.
     * This can be used by child classes to ensure AJAX content is ready.
     */
    async waitForLoadState() {
        await this.page.waitForLoadState('load');
    }
}