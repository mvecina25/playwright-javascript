/**
 * Import the unified test and expect objects from the central indexFixtures file.
 * WHY: This ensures all Page Object Models (POMs) and custom setup fixtures 
 * are available from a single source of truth, making the test code more maintainable.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';
import { generateRandomUser, saveCredentials, getLatestCredentials } from '../../../../utils/helpers';

const INDEX_URL = '/parabank/index.htm';

/**
 * .serial is used because TC-03 depends on the credentials 
 * persisted to disk by TC-02a.
 */
test.describe.serial('Authentication - Login Flow', () => {

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: Starting from the index page for every test ensures a clean 
         * state and validates that the core application entry point is up.
         */
        await basePage.navigateTo(INDEX_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_URL));
    });

    test('TC-02a: should login successfully using newly registered user @smoke @regression', async ({ loginPage, registerPage, homePage }) => {
        const newIdentity = generateRandomUser();

        await test.step('Register new user identity', async () => {
            await loginPage.clickRegisterLink();
            
            // registerNewUser encapsulates the form filling and submission logic
            await registerPage.registerNewUser(newIdentity);

            /**
             * WHY: We persist credentials to a local JSON to facilitate 
             * cross-test data sharing and to allow for manual debugging if the test fails.
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
        });

        await test.step('Verify authentication persistence', async () => {
            /**
             * WHY: We explicitly log out after registration to clear the active 
             * session. This allows us to verify that the 'Login' service correctly 
             * authenticates the newly created record in the database.
             */
            await homePage.clickLogout();
            await loginPage.login(newIdentity.username, newIdentity.password);

            // Validation of the welcome banner ensures the session state is correctly tied to the user profile
            await expect(homePage.welcomeMessage).toContainText(`Welcome ${newIdentity.firstName} ${newIdentity.lastName}`);
        });
    });
 
    test('TC-02b: should show error for invalid credentials @regression', async ({ loginPage }) => {
        await test.step('Attempt login with non-existent credentials', async () => {
            await loginPage.login('non_existent_user_123', 'invalid_password_456');
        });

        await test.step('Validate security error message', async () => {
            /**
             * WHY: Verifying specific error text ensures the application is providing 
             * clear feedback to the user and not leaking sensitive system information.
             */
            await expect(loginPage.errorMessage).toBeVisible();
            await expect(loginPage.errorMessage).toHaveText('The username and password could not be verified.');
        });
    });

    test('TC-03: should successfully navigate all global menus @smoke @regression', async ({ loginPage, homePage }) => {
        /**
         * WHY: We retrieve the credentials generated in TC-02a to verify 
         * that a standard authenticated session has access to all core modules.
         */
        const credentials = getLatestCredentials();
        await loginPage.login(credentials.username, credentials.password);

        const navigationScenarios = [
            { name: 'Open New Account', expectedTitle: 'Open New Account', urlFragment: 'openaccount.htm' },
            { name: 'Accounts Overview', expectedTitle: 'Accounts Overview', urlFragment: 'overview.htm' },
            { name: 'Transfer Funds', expectedTitle: 'Transfer Funds', urlFragment: 'transfer.htm' },
            { name: 'Bill Pay', expectedTitle: 'Bill Payment Service', urlFragment: 'billpay.htm' },
            { name: 'Find Transactions', expectedTitle: 'Find Transactions', urlFragment: 'findtrans.htm' },
            { name: 'Update Contact Info', expectedTitle: 'Update Profile', urlFragment: 'updateprofile.htm' },
            { name: 'Request Loan', expectedTitle: 'Apply for a Loan', urlFragment: 'requestloan.htm' }
        ];

        for (const scenario of navigationScenarios) {
            /**
             * WHY: This loop implements the DRY principle by reusing the same 
             * navigation and assertion logic for all sidebar links.
             */
            await test.step(`Navigate to and verify "${scenario.name}" module`, async () => {
                await homePage.navigateViaLeftMenu(scenario.name);

                // Ensure the URL matches the expected fragment
                await expect(homePage.page).toHaveURL(new RegExp(scenario.urlFragment));            
                
                /**
                 * WHY: Checking for a specific heading role ensures that the page 
                 * content has actually loaded and the UI is not stuck on a blank or error screen.
                 */
                await expect(
                    homePage.page.getByRole('heading', { name: scenario.expectedTitle })
                ).toBeVisible();                
            });
        }
    });
});