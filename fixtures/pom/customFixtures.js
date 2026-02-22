/**
 * Custom Business Logic Fixtures
 * 
 * WHY: These fixtures encapsulate multi-page business processes. By moving 
 * setup logic here, we adhere to the Single Responsibility Principle (SRP). 
 * Tests remain declarative—requesting a "state" (like a created user) 
 * rather than executing the "process" to create it.
 */

import { test as pomFixtures } from './pomFixtures';
import { generateRandomUser, saveCredentials } from '../../utils/helpers';

const INDEX_PAGE_URL = '/parabank/index.htm';

export const test = pomFixtures.extend({

    /**
     * userCreationFixture
     * 
     * WHY: Provides a unique, authenticated user session. It includes a 
     * retry mechanism because Parabank's registration endpoint frequently 
     * fails due to eventual consistency lag in its internal database.
     */
    userCreationFixture: async ({ loginPage, registerPage, homePage, basePage }, use) => {
        const newIdentity = generateRandomUser();

        await basePage.navigateTo(INDEX_PAGE_URL);
        await loginPage.clickRegisterLink();

        /**
         * WHY: Parabank occasionally fails to commit the new user record 
         * before the UI redirects. We use toPass() to retry the registration 
         * attempt until the welcome message confirms success.
         */
        await test.expect(async () => {
            await registerPage.fillRegistrationForm(newIdentity);
            await registerPage.submitRegistration();
            await test.expect(registerPage.welcomeMessage).toBeVisible({ timeout: 1000 });
        }).toPass({
            intervals: [1000, 2000],
            timeout: 10000
        });

        /**
         * WHY: Persisting credentials to a JSON file serves as a 'flight recorder'. 
         * If a regression occurs, developers can use these credentials to 
         * manually reproduce the issue in the browser.
         */
        await saveCredentials(
            newIdentity.username,
            newIdentity.password,
            newIdentity.firstName,
            newIdentity.lastName,
            newIdentity.address.street,
            newIdentity.address.city,
            newIdentity.address.state,
            newIdentity.address.zipCode,
            newIdentity.phoneNumber,
            newIdentity.ssn
        );

        // Discovery step: Capture the checking account Parabank creates automatically
        await homePage.navigateViaLeftMenu('Accounts Overview');
        const checkingAccountId = await homePage.getFirstAccountId();

        /**
         * WHY: We log out to ensure the test starts from a clean, unauthenticated 
         * state. This prevents session bleed between fixtures and tests.
         */
        await homePage.clickLogout();

        await use({
            ...newIdentity,
            ...newIdentity.address, // Flattened for cleaner test assertions
            checkingAccountId
        });
    },

    /**
     * savingsAccountCreationFixture
     * 
     * WHY: Extends the user state by adding a secondary financial product. 
     * This allows tests for Transfers or Bill Pay to operate immediately 
     * without repeating the onboarding steps.
     */
    savingsAccountCreationFixture: async ({ userCreationFixture, loginPage, homePage, openAccountPage }, use) => {
        
        // Re-authenticate using the credentials from the dependency fixture
        await loginPage.login(userCreationFixture.username, userCreationFixture.password);

        await homePage.navigateViaLeftMenu('Open New Account');
        await openAccountPage.openAccount('SAVINGS', userCreationFixture.checkingAccountId);

        const savingsAccountId = await openAccountPage.getNewAccountId();

        /**
         * WHY: We validate the ID immediately. Failing the fixture here 
         * provides a clearer error than letting the test fail later 
         * with a 'null' account ID error.
         */
        if (!savingsAccountId) {
            throw new Error(`Fixture Setup Failed: Savings Account ID was not captured for user ${userCreationFixture.username}`);
        }

        await use({
            savingsAccountId
        });
    },

    /**
     * userAndAccountCreationForApiFixture
     * 
     * WHY: This specialized fixture is designed for API-level tests that 
     * require a pre-configured database state (User + Checking + Savings). 
     * It uses the UI for setup because Parabank's API does not always 
     * initialize session cookies correctly without a UI-based login.
     */
    userAndAccountCreationForApiFixture: async ({ userCreationFixture, savingsAccountCreationFixture }, use) => {
        /**
         * WHY: By injecting both previous fixtures, we follow the DRY principle. 
         * This fixture simply aggregates the result of the registration and 
         * account opening flows into a single object for the API tests.
         */
        await use({
            ...userCreationFixture,
            savingsAccountId: savingsAccountCreationFixture.savingsAccountId
        });
    }

});

export const expect = test.expect;