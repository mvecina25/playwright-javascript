/**
 * Import the unified test and expect objects from the central indexFixtures file.
 * WHY: Centralizing fixture imports ensures all Page Objects (POMs) are 
 * pre-configured and share a single source of truth for dependencies.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';
import { generateRandomUser, saveCredentials } from '../../../../utils/helpers';

const INDEX_PAGE = '/parabank/index.htm';
const REGISTER_PAGE_URL = /.*register.htm/;

test.describe('Authentication - Registration Flow', () => {

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: Navigating to the index page ensures every registration test 
         * begins from a clean, unauthenticated state.
         */
        await basePage.navigateTo(INDEX_PAGE);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_PAGE));
    });

    test('TC-01a: should register new user successfully @smoke @regression', async ({ loginPage, registerPage }) => {
        const newAccountData = generateRandomUser();

        await test.step('Submit registration form with unique credentials', async () => {
            await loginPage.clickRegisterLink();
            
            // Confirm we have transitioned to the registration module
            await expect(loginPage.page).toHaveURL(REGISTER_PAGE_URL);

            await registerPage.registerNewUser(newAccountData);

            /**
             * WHY: Credentials are persisted to a JSON file to allow downstream 
             * API or UI tests to reuse this specific user identity without re-registering.
             */
            await saveCredentials(
                newAccountData.username,
                newAccountData.password,
                newAccountData.firstName,
                newAccountData.lastName,
                newAccountData.address.street,
                newAccountData.address.city,
                newAccountData.address.state,
                newAccountData.address.zipCode,
                newAccountData.phoneNumber,
                newAccountData.ssn
            );
        });

        await test.step('Verify account creation and automatic session start', async () => {
            /**
             * WHY: Parabank automatically logs the user in upon success. 
             * We verify the username in the welcome message to ensure the session 
             * is correctly mapped to the new database record.
             */
            await expect(registerPage.welcomeMessage).toContainText(newAccountData.username);
            await expect(registerPage.registrationSuccessMessage)
                .toContainText('Your account was created successfully. You are now logged in.');
        });
    });

    test('TC-01b: should prevent registration with an existing username @regression', async ({ loginPage, registerPage, homePage }) => {
        const existingAccountData = generateRandomUser();

        await test.step('Establish a pre-existing user state', async () => {
            /**
             * WHY: To test duplicate username errors, we must first ensure the 
             * username exists in the system. We perform a full registration flow.
             */
            await loginPage.clickRegisterLink();
            await registerPage.registerNewUser(existingAccountData);
            
            // Logout to return to a state where we can attempt a fresh registration
            await homePage.clickLogout();
        });

        await test.step('Attempt registration with the same username', async () => {
            await loginPage.clickRegisterLink();
            
            // Ensure the form is ready for input after the previous session
            await expect(registerPage.firstNameInput).toBeVisible();
    
            /**
             * WHY: We reuse the same data object. This follows the DRY principle 
             * and ensures an exact collision on the 'username' primary key.
             */
            await registerPage.registerNewUser(existingAccountData);
        });

        await test.step('Validate collision error message', async () => {
            /**
             * WHY: The application should gracefully handle duplicate records 
             * and provide clear feedback to the user rather than crashing or 
             * allowing the duplicate entry.
             */
            await expect(registerPage.errorMessage).toBeVisible();
            await expect(registerPage.errorMessage).toHaveText('This username already exists.');
        });
    });
});