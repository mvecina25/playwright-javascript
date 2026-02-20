/**
 * API Fixture Orchestration
 * 
 * WHY: This fixture extends the base Playwright test to provide a high-level API client.
 * By centralizing API logic here, we ensure that tests don't need to handle repetitive 
 * tasks like manually parsing JSON or managing content-type headers, following 
 * the DRY (Don't Repeat Yourself) principle.
 */

import { test as base } from '@playwright/test';
import { apiRequest as apiRequestOriginal } from '../../utils/api-helper.js';

export const test = base.extend({
    /**
     * apiRequest Fixture
     * 
     * WHY: We wrap the original API utility within a Playwright fixture to 
     * leverage Dependency Injection. This allows any test to perform API 
     * calls simply by requesting 'apiRequest' in its arguments, keeping 
     * test setup clean and readable.
     */
    apiRequest: async ({ request }, use) => {
        
        /**
         * Inner request handler function.
         * 
         * @param {Object} options - Configuration for the HTTP request.
         * @param {string} options.method - HTTP verb (GET, POST, etc.).
         * @param {string} options.url - The endpoint path.
         * @param {string} options.baseUrl - The base URL from environment config.
         * @param {Object} [options.body] - Payload for POST/PUT requests.
         * @param {Object} [options.headers] - Custom headers.
         * @param {boolean} [options.isFormData] - Flag to handle multipart/form-data.
         */
        const apiRequestFn = async ({
            method,
            url,
            baseUrl,
            body = null,
            headers,
            isFormData = false,
        }) => {
            
            /**
             * WHY: We delegate the actual network call to a specialized utility 
             * (apiRequestOriginal). This separates the "fixture management" 
             * logic from the "network communication" logic (Single Responsibility Principle).
             */
            const response = await apiRequestOriginal({
                request, // The raw Playwright request context
                method,
                url,
                baseUrl,
                body,
                headers,
                isFormData,
            });

            /**
             * WHY: We return a simplified, pre-parsed object. This ensures 
             * tests can immediately assert on 'response.body' without 
             * needing to await additional transformation methods like .json() 
             * or .text() inside the test body.
             */
            return {
                status: response.status,
                body: response.body,
                headers: response.headers,
            };
        };

        // Expose the helper function to the test context
        await use(apiRequestFn);
    },
});

/**
 * WHY: Re-exporting expect ensures that tests importing this 'test' object 
 * also have access to the standard assertion library from a single import path.
 */
export { expect } from '@playwright/test';