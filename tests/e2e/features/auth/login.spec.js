/**
 * WHY: This maintains a single source of truth for all Page Objects and custom fixtures,
 * preventing import bloat and ensuring consistent configuration across the suite.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';
import { generateRandomUser, saveCredentials, getLatestCredentials } from '../../../../utils/helpers';

const INDEX_URL = '/parabank/index.htm';

/**
 * WHY: .serial is utilized because the navigation test (TC-03) relies on the 
 * credentials persisted to the local file system by the registration test (TC-02a).
 */
test.describe.serial('Authentication - Login Flow', () => {

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: Navigating to the index page ensures every test starts from a 
         * clean, unauthenticated state and verifies the system's entry point.
         */
        await basePage.navigateTo(INDEX_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_URL));
    });

    test(
        'TC-02a: should allow a newly registered user to authenticate successfully',
        { tag: ['@regression'] },
        async ({ loginPage, registerPage, homePage }) => {
            const newIdentity = generateRandomUser();

            await test.step('GIVEN a new user identity is registered in the system', async () => {
                await loginPage.clickRegisterLink();
                await registerPage.registerNewUser(newIdentity);

                /**
                 * WHY: Credentials are saved to a JSON file to facilitate data 
                 * persistence for subsequent tests in the serial block and 
                 * to assist in manual debugging if a failure occurs.
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

            await test.step('WHEN the user logs out and attempts to log back in with valid credentials', async () => {
                /**
                 * WHY: We explicitly logout to destroy the registration session. 
                 * This ensures we are testing the actual authentication service 
                 * rather than a cached session.
                 */
                await homePage.clickLogout();
                await loginPage.login(newIdentity.username, newIdentity.password);
            });

            await test.step('THEN the user should be greeted with a personalized welcome banner', async () => {
                const expectedWelcome = `Welcome ${newIdentity.firstName} ${newIdentity.lastName}`;
                
                // WHY: Web-first assertions automatically handle dynamic element rendering
                await expect(homePage.welcomeMessage).toContainText(expectedWelcome);
                await expect(homePage.logoutLink).toBeVisible();
            });
        }
    );

    test(
        'TC-02b: should display an error message when logging in with invalid credentials',
        { tag: ['@regression'] },
        async ({ loginPage }) => {
            await test.step('WHEN the user attempts to log in with an unrecognized account', async () => {
                await loginPage.login('non_existent_user_123', 'invalid_password_456');
            });

            await test.step('THEN a security warning should be displayed to the user', async () => {
                /**
                 * WHY: Verifying specific error text ensures the application 
                 * provides clear feedback without leaking sensitive system details.
                 */
                await expect(loginPage.errorMessage).toBeVisible();
                await expect(loginPage.errorMessage).toHaveText('The username and password could not be verified.');
            });
        }
    );

    test(
        'TC-03: should allow navigation to all core banking modules via the sidebar menu',
        { tag: ['@regression'] },
        async ({ loginPage, homePage }) => {
            
            await test.step('GIVEN an authenticated user session is active', async () => {
                const credentials = getLatestCredentials();
                await loginPage.login(credentials.username, credentials.password);
                await expect(homePage.logoutLink).toBeVisible();
            });

            await test.step('THEN the user should be able to access all sidebar links successfully', async () => {
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
                     * WHY: We iterate through scenarios to enforce the DRY principle. 
                     * Each iteration validates that the sidebar component routes 
                     * to the correct URL and renders the expected module heading.
                     */
                    await homePage.navigateViaLeftMenu(scenario.name);

                    await expect(homePage.page).toHaveURL(new RegExp(scenario.urlFragment));
                    await expect(
                        homePage.page.getByRole('heading', { name: scenario.expectedTitle })
                    ).toBeVisible();
                }
            });
        }
    );
});