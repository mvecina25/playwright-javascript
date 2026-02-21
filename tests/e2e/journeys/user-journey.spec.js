/**
 * Import Playwright test runner and custom fixtures.
 * Fixtures allow us to inject Page Object Models directly into tests, 
 * reducing boilerplate and improving test isolation.
 */
import { test, expect } from '../../../fixtures/indexFixtures.js';
import { generateRandomUser, saveCredentials } from '../../../utils/helpers';

/**
 * Constants used to avoid "magic strings" and ensure consistency.
 * Defining these globally makes it easier to update the test if the 
 * application's default values or business rules change.
 */
const INITIAL_ACCOUNT_BALANCE = '$100.00';
const TRANSACTION_AMOUNT = '1.00'; 
const LOGIN_URL = '/parabank/index.htm';

test.describe('Complete User Banking Journey', () => {

    let userProfile;           
    let savingsAccountId;   
    let checkingAccountId;  

    /**
     * Helper: Converts currency strings (e.g., "$10.00") to floating point numbers.
     * WHY: Playwright retrieves text values from the UI as strings. We need numerical 
     * values to perform mathematical assertions (like checking if a balance decreased).
     */
    const parseCurrency = (value) => parseFloat(value.replace(/[$,]/g, ''));

    test.beforeAll(async () => {
        /**
         * WHY: Generating the user profile once per suite ensures all steps 
         * in this serial journey act upon the same identity.
         */
        userProfile = generateRandomUser();
    });

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: Navigating to the index page before each test ensures a consistent 
         * starting state and verifies the application is reachable.
         */
        await basePage.navigateTo(LOGIN_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(LOGIN_URL));
    });

    test('TC-01: End-to-End User Onboarding and Financial Activity', async ({
        basePage,
        loginPage,
        registerPage,
        homePage,
        openAccountPage,
        accountsOverviewPage,
        transferFundsPage,
        accountActivityPage,
        billPayPage
    }) => {

        await test.step('User Registration', async () => {
            await loginPage.clickRegisterLink();

            /**
             * WHY: Parabank occasionally experiences database lag or "eventual consistency" 
             * during account creation. We use toPass() to retry the form submission logic 
             * if the server-side processing takes longer than the default timeout.
             */
            await expect(async () => {
                await registerPage.fillRegistrationForm(userProfile);
                await registerPage.submitRegistration();
                await expect(registerPage.welcomeMessage).toBeVisible({ timeout: 1000 });
            }).toPass({
                intervals: [1000, 2000],
                timeout: 10000
            });

            await expect(registerPage.welcomeMessage).toHaveText(`Welcome ${userProfile.username}`);
        });

        await test.step('Session Management and Account Discovery', async () => {
            /** 
             * WHY: Registration often triggers an automatic login. To validate the 
             * standalone login functionality, we explicitly log out first to clear 
             * the session cookies before re-authenticating.
             */
            if (await homePage.isUserLoggedIn()) {
                await homePage.clickLogout();
            }

            await loginPage.login(userProfile.username, userProfile.password);
            
            /**
             * WHY: Parabank automatically creates a checking account upon registration.
             * We capture this ID to use as the funding source for future transactions.
             */
            checkingAccountId = await homePage.getFirstAccountId();
            userProfile.checkingAccountId = checkingAccountId;

            expect(checkingAccountId, 'Default checking account should be generated').not.toBeNull();
        });

        await test.step('Global Navigation Sanity Check', async () => {
            /**
             * WHY: Iterating through a map of navigation links ensures that all 
             * key areas of the sidebar are functional and resolve to the correct URLs.
             */
            const navLinks = [
                { name: 'Open New Account', expectedTitle: 'Open New Account', urlFragment: 'openaccount.htm' },
                { name: 'Accounts Overview', expectedTitle: 'Accounts Overview', urlFragment: 'overview.htm' },
                { name: 'Transfer Funds', expectedTitle: 'Transfer Funds', urlFragment: 'transfer.htm' },
                { name: 'Bill Pay', expectedTitle: 'Bill Payment Service', urlFragment: 'billpay.htm' }
            ];

            for (const link of navLinks) {
                await homePage.navigateViaLeftMenu(link.name);
                await expect(homePage.page).toHaveURL(new RegExp(link.urlFragment));
                await expect(homePage.page.getByRole('heading', { name: link.expectedTitle })).toBeVisible();
            }
        });

        await test.step('Financial Product Creation (Savings)', async () => {
            await homePage.navigateViaLeftMenu('Open New Account');

            /**
             * WHY: We choose 'SAVINGS' to verify that the application correctly 
             * handles different account types and links them to the existing checking account.
             */
            await openAccountPage.openAccount('SAVINGS', checkingAccountId);

            await expect(openAccountPage.successMessage).toContainText('Congratulations, your account is now open.');

            savingsAccountId = await openAccountPage.getNewAccountId();
            userProfile.savingsAccountId = savingsAccountId;

            /**
             * WHY: Saving credentials locally acts as a "flight recorder," allowing 
             * developers to manually log in and debug if subsequent test steps fail.
             */
            saveCredentials(
                userProfile.username, 
                userProfile.password, 
                userProfile.firstName, 
                userProfile.lastName, 
                userProfile.address.street, 
                userProfile.address.city, 
                userProfile.address.state, 
                userProfile.address.zipCode, 
                userProfile.phoneNumber, 
                userProfile.ssn, 
                checkingAccountId, 
                savingsAccountId);
        });

        await test.step('Balance Verification and Integrity', async () => {
            /**
             * WHY: Navigating directly to the activity URL bypasses menu navigation 
             * to verify that deep-linking and direct resource access are functional.
             */
            await basePage.navigateTo(`/parabank/activity.htm?id=${savingsAccountId}`);

            const balanceText = await accountActivityPage.getBalanceText();
            expect(balanceText).toBe(INITIAL_ACCOUNT_BALANCE);
            expect(await accountActivityPage.getAccountTypeText()).toBe('SAVINGS');
        });

        await test.step('Internal Funds Transfer and Ledger Validation', async () => {
            await homePage.navigateViaLeftMenu('Accounts Overview');

            /**
             * WHY: We capture "Before" balances to perform delta-validation. 
             * This ensures the bank's ledger correctly debits one account and credits the other.
             */
            const checkingBefore = parseCurrency(await accountsOverviewPage.getAccountBalance(checkingAccountId));
            const savingsBefore = parseCurrency(await accountsOverviewPage.getAccountBalance(savingsAccountId));

            await homePage.navigateViaLeftMenu('Transfer Funds');
            await transferFundsPage.transferFunds(TRANSACTION_AMOUNT, savingsAccountId, checkingAccountId);

            await expect(transferFundsPage.successMessage).toBeVisible();

            await homePage.navigateViaLeftMenu('Accounts Overview');
            const checkingAfter = parseCurrency(await accountsOverviewPage.getAccountBalance(checkingAccountId));
            const savingsAfter = parseCurrency(await accountsOverviewPage.getAccountBalance(savingsAccountId));

            const amount = parseFloat(TRANSACTION_AMOUNT);
            
            /**
             * WHY: toBeCloseTo is used to handle floating-point math issues 
             * (e.g., 0.1 + 0.2 !== 0.3) which are common in JavaScript currency calculations.
             */
            expect(checkingAfter).toBeCloseTo(checkingBefore + amount, 2);
            expect(savingsAfter).toBeCloseTo(savingsBefore - amount, 2);
        });

        await test.step('Third-Party Bill Payment Simulation', async () => {
            await homePage.navigateViaLeftMenu('Bill Pay');

            const paymentData = {
                payeeName: `${userProfile.firstName} ${userProfile.lastName}`,
                address: userProfile.address,
                phoneNumber: userProfile.phoneNumber,
                accountNumber: savingsAccountId,
                amount: TRANSACTION_AMOUNT,
                fromAccountId: savingsAccountId,
            };

            /**
             * WHY: The Bill Pay submission involves an asynchronous POST request. 
             * Wrapping this in toPass() ensures we wait for the network response 
             * to render the "Complete" heading before checking for success.
             */
            await expect(async () => {
                await billPayPage.fillBillPaymentForm(paymentData);
                await billPayPage.submitPayment();
                await expect(billPayPage.page.getByRole('heading', { name: 'Bill Payment Complete' })).toBeVisible();
            }).toPass();

            await expect(billPayPage.paymentSuccessDetails).toContainText(`amount of $${TRANSACTION_AMOUNT}`);
        });
    });
});