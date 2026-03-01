/**
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

    test(
        'TC-01a: should register a new user successfully',
        { tag: ['@regression', '@ui'] },
        async ({ loginPage, registerPage }) => {
            const newUserData = generateRandomUser();

            await test.step('GIVEN the user navigates to the registration page', async () => {
                await loginPage.clickRegisterLink();
                
                // WHY: Web-first assertions provide automatic retries for dynamic URL transitions
                await expect(loginPage.page).toHaveURL(REGISTER_PAGE_URL);
            });

            await test.step('WHEN the user submits valid and unique registration details', async () => {
                await registerPage.registerNewUser(newUserData);

                /**
                 * WHY: Credentials are persisted to a JSON file to facilitate 
                 * downstream API or UI tests (serial execution) and manual debugging.
                 */
                await saveCredentials(
                    newUserData.username,
                    newUserData.password,
                    newUserData.firstName,
                    newUserData.lastName,
                    newUserData.address.street,
                    newUserData.address.city,
                    newUserData.address.state,
                    newUserData.address.zipCode,
                    newUserData.phoneNumber,
                    newUserData.ssn
                );
            });

            await test.step('THEN the account should be created and a success message displayed', async () => {
                /**
                 * WHY: Parabank automatically initiates a session upon successful registration. 
                 * We verify the greeting banner to ensure the session is correctly mapped.
                 */
                await expect(registerPage.welcomeMessage).toContainText(newUserData.username);
                await expect(registerPage.registrationSuccessMessage)
                    .toContainText('Your account was created successfully. You are now logged in.');
            });
        }
    );

    test(
        'TC-01b: should prevent registration when using an existing username',
        { tag: ['@regression', '@ui'] },
        async ({ loginPage, registerPage, homePage }) => {
            const existingUserData = generateRandomUser();

            await test.step('GIVEN a user identity is already registered in the system', async () => {
                /**
                 * WHY: To validate duplicate constraints, we must first establish 
                 * a pre-existing state by completing a full registration.
                 */
                await loginPage.clickRegisterLink();
                await registerPage.registerNewUser(existingUserData);
                
                // WHY: Logout ensures we are in a clean state to attempt a fresh registration
                await homePage.clickLogout();
            });

            await test.step('WHEN another registration is attempted using the same username', async () => {
                await loginPage.clickRegisterLink();
                
                // WHY: Visibility check ensures the DOM is stable before interaction
                await expect(registerPage.firstNameInput).toBeVisible();
        
                /**
                 * WHY: We reuse the exact data object to ensure a collision 
                 * on the unique 'username' primary key in the backend.
                 */
                await registerPage.registerNewUser(existingUserData);
            });

            await test.step('THEN a duplicate username error message should be displayed', async () => {
                /**
                 * WHY: Friendly error handling prevents system exposure and 
                 * ensures the user is notified of the specific constraint violation.
                 */
                await expect(registerPage.errorMessage).toBeVisible();
                await expect(registerPage.errorMessage).toHaveText('This username already exists.');
            });
        }
    );
});