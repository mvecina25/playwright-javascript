/**
 * WHY: Consolidating imports prevents "fixture fragmentation" and ensures that 
 * every test has access to the same initialized Page Object Models (POMs).
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';

/**
 * WHY: Centralizing these values allows us to update business rules (like the 
 * starting balance) in one place rather than searching through multiple test files.
 */
const INITIAL_ACCOUNT_BALANCE = '$100.00';
const INDEX_URL = '/parabank/index.htm';
const ACCOUNT_TYPE_SAVINGS = 'SAVINGS';

/**
 * WHY: .serial is used here because these tests follow a logical progression 
 * of a user's lifecycle where the second test relies on the state created by the first.
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

    test(
        'should create savings account and capture account number',
        { tag: ['@smoke', '@regression'] },
        async ({ userCreationFixture, loginPage, homePage, openAccountPage }) => {
            let savingsAccountId;
            let checkingAccountId;

            await test.step('GIVEN the user is authenticated and on the home page', async () => {
                /**
                 * WHY: Even though the user is created via fixture, we perform an explicit 
                 * UI login to verify that the generated credentials work in the standard web flow.
                 */
                await loginPage.login(userCreationFixture.username, userCreationFixture.password);
                
                // Capture the default checking account to use as a funding source
                checkingAccountId = await homePage.getFirstAccountId();
                expect(checkingAccountId).not.toBeNull();
            });

            await test.step('WHEN the user navigates to the Open New Account section', async () => {
                await homePage.navigateViaLeftMenu('Open New Account');

                // WHY: Web-first assertion ensures the UI has transitioned before action
                await expect(
                    homePage.page.getByRole('heading', { name: 'Open New Account' })
                ).toBeVisible();
            });

            await test.step('AND the user selects the savings account type and submits', async () => {
                /**
                 * WHY: Selecting the checking account as the funding source tells 
                 * the system where to transfer the initial deposit from.
                 */
                await openAccountPage.openAccount(ACCOUNT_TYPE_SAVINGS, checkingAccountId);
            });

            await test.step('THEN a success message should appear and a numeric account ID should be captured', async () => {
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
        }
    );

    test(
        'should display and validate the balance details',
        { tag: ['@smoke', '@regression'] },
        async ({ savingsAccountCreationFixture, basePage, accountActivityPage }) => {
            
            await test.step('GIVEN a savings account has been successfully created', async () => {
                /**
                 * WHY: This test leverages the savingsAccountCreationFixture to bypass 
                 * the UI creation steps, following the Single Responsibility Principle.
                 */
                expect(savingsAccountCreationFixture.savingsAccountId).not.toBeNull();
            });

            await test.step('WHEN the user navigates to the account activity details', async () => {
                const targetUrl = `/parabank/activity.htm?id=${savingsAccountCreationFixture.savingsAccountId}`;
                await basePage.navigateTo(targetUrl);

                await expect(accountActivityPage.accountDetailsTitle, 'Heading should confirm we are in Account Details')
                    .toHaveText('Account Details');
            });

            await test.step('THEN the account type and initial balance should match the system defaults', async () => {
                // Verify the ID displayed matches the fixture account
                expect(await accountActivityPage.getAccountIdText())
                    .toBe(savingsAccountCreationFixture.savingsAccountId);

                // Verify the account categorization
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
        }
    );
});