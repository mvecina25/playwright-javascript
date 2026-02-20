/**
 * Import the unified test and expect objects from the central indexFixtures file.
 * WHY: Consolidating imports prevents "fixture fragmentation" and ensures that 
 * every test has access to the same initialized Page Object Models (POMs).
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';

/**
 * Constants for maintainability.
 * WHY: Centralizing these values allows us to update business rules (like the 
 * starting balance) in one place rather than searching through multiple test files.
 */
const INITIAL_ACCOUNT_BALANCE = '$100.00';
const INDEX_URL = '/parabank/index.htm';
const ACCOUNT_TYPE_SAVINGS = 'SAVINGS';

/**
 * .serial is used here because these tests follow a logical progression 
 * of a user's lifecycle with a savings account.
 */
test.describe.serial('Accounts - Savings Lifecycle', () => {

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: We ensure the browser is at the entry point before every test.
         * Validating the URL confirms the environment is up and the basePage 
         * successfully resolved the navigation.
         */
        await basePage.navigateTo(INDEX_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_URL));
    });

    test('TC-04: should create savings account and capture account number @smoke @regression', async ({ 
        userCreationFixture, 
        loginPage, 
        homePage, 
        openAccountPage 
    }) => {
        let savingsAccountId;

        /**
         * WHY: Even though the user is created via fixture, we perform an explicit 
         * UI login to verify that the generated credentials work in the standard web flow.
         */
        await loginPage.login(userCreationFixture.username, userCreationFixture.password);

        await test.step('Create new savings account via UI', async () => {
            await homePage.navigateViaLeftMenu('Open New Account');
            
            // Confirm the UI transitioned to the correct module
            await expect(
                homePage.page.getByRole('heading', { name: 'Open New Account' })
            ).toBeVisible();

            /**
             * WHY: Passing 'null' as the funding account tells the POM to use 
             * the default account automatically selected by Parabank.
             */
            await openAccountPage.openAccount(ACCOUNT_TYPE_SAVINGS, null);
        });

        await test.step('Verify account creation and capture ID', async () => {
            await expect(openAccountPage.successMessage)
                .toContainText('Congratulations, your account is now open.');

            savingsAccountId = await openAccountPage.getNewAccountId();

            /**
             * WHY: We validate the ID matches a numeric format (Regex) to ensure 
             * the UI returned a valid account number rather than an empty string or error.
             */
            expect(savingsAccountId, 'The generated Account ID should be numeric').toMatch(/^\d+$/);
            
            console.log(`Successfully created Savings Account: ${savingsAccountId}`);
        });
    });

    test('TC-05: should display and validate the balance details @smoke @regression', async ({ 
        savingsAccountCreationFixture, 
        basePage, 
        accountActivityPage 
    }) => {
        /**
         * WHY: This test leverages the savingsAccountCreationFixture to bypass 
         * the UI creation steps, following the "Single Responsibility" principle. 
         * It focuses solely on the ledger/activity validation.
         */
        
        await test.step('Navigate to account activity page', async () => {
            const targetUrl = `/parabank/activity.htm?id=${savingsAccountCreationFixture.accountId}`;
            
            await basePage.navigateTo(targetUrl);
            
            await expect(accountActivityPage.accountDetailsTitle, 'Heading should confirm we are in Account Details')
                .toHaveText('Account Details');
        });

        await test.step('Validate account integrity and starting balance', async () => {
            // Verify the ID displayed on the page matches our created account
            expect(await accountActivityPage.getAccountIdText())
                .toBe(savingsAccountCreationFixture.accountId);

            // Verify the account was correctly categorized as SAVINGS
            expect(await accountActivityPage.getAccountTypeText())
                .toBe(ACCOUNT_TYPE_SAVINGS);

            const balanceText = await accountActivityPage.getBalanceText();

            /**
             * WHY: We verify the specific format ($XX.XX) and the exact value.
             * Parabank business rules specify a $100.00 opening balance for new accounts.
             */
            expect(balanceText, 'Balance should follow currency format').toMatch(/^\$\d+\.\d{2}$/);
            expect(balanceText, 'New savings accounts must start with the system default balance').toBe(INITIAL_ACCOUNT_BALANCE);
        });
    });
});