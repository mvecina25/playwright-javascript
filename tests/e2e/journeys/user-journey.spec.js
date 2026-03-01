/**
 * WHY: This maintains a single source of truth for all Page Objects and custom fixtures,
 * preventing import bloat and ensuring consistent configuration across the suite.
 */
import { test, expect } from '../../../fixtures/indexFixtures.js';
import { generateRandomUser, saveCredentials } from '../../../utils/helpers';

/**
 * WHY: Centralizing values prevents "magic numbers" and ensures that if the 
 * test data requirements change, we update in one place.
 */
const INITIAL_ACCOUNT_BALANCE = '$100.00';
const TRANSACTION_AMOUNT = '1.00'; 
const LOGIN_URL = '/parabank/index.htm';

test.describe('Complete User Banking Journey - End to End Flow', () => {

    let userProfile;           
    let savingsAccountId;   
    let checkingAccountId;  

    /**
     * Helper: Sanitizes currency strings and converts them to floats.
     * WHY: Playwright retrieves balances as strings (e.g., "$100.00"). 
     * Numerical values are required for mathematical delta-assertions.
     */
    const parseCurrency = (value) => parseFloat(value.replace(/[$,]/g, ''));

    test.beforeAll(async () => {
        /**
         * WHY: Generating the user identity once per suite ensures all 
         * serial steps act upon the same persistent record in the database.
         */
        userProfile = generateRandomUser();
    });

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: Navigating to the entry page before every test ensures a clean 
         * browser state and confirms system availability.
         */
        await basePage.navigateTo(LOGIN_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(LOGIN_URL));
    });

    test(
        'should complete a full user onboarding and financial transaction journey',
        { tag: ['@nightly', '@journey', '@ui'] },
        async ({
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

            await test.step('GIVEN the user registers a new account identity', async () => {
                await loginPage.clickRegisterLink();

                /**
                 * WHY: Parabank occasionally experiences database lag (eventual consistency). 
                 * toPass() retries the form submission if the welcome message isn't rendered immediately.
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

            await test.step('AND the user logs in to discover their default checking account', async () => {
                /** 
                 * WHY: We explicitly logout to destroy the registration session. 
                 * This verifies that the actual authentication service works for the new record.
                 */
                if (await homePage.isUserLoggedIn()) {
                    await homePage.clickLogout();
                }

                await loginPage.login(userProfile.username, userProfile.password);
                
                // Capture the system-generated checking account for funding future transactions
                checkingAccountId = await homePage.getFirstAccountId();
                userProfile.checkingAccountId = checkingAccountId;

                expect(checkingAccountId, 'Default checking account should be generated').not.toBeNull();
            });

            await test.step('THEN the global sidebar navigation should be functional and verified', async () => {
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

            await test.step('WHEN the user opens a new savings account funded by the checking account', async () => {
                await homePage.navigateViaLeftMenu('Open New Account');

                // Selecting 'SAVINGS' tests the application's account categorization logic
                await openAccountPage.openAccount('SAVINGS', checkingAccountId);

                await expect(openAccountPage.successMessage).toContainText('Congratulations, your account is now open.');

                savingsAccountId = await openAccountPage.getNewAccountId();
                userProfile.savingsAccountId = savingsAccountId;

                /**
                 * WHY: Persisting credentials acts as an audit trail for CI/CD, 
                 * allowing manual reproduction of failures using the generated identity.
                 */
                saveCredentials(userProfile.username, userProfile.password, userProfile.firstName, userProfile.lastName, userProfile.address.street, userProfile.address.city, userProfile.address.state, userProfile.address.zipCode, userProfile.phoneNumber, userProfile.ssn, checkingAccountId, savingsAccountId);
            });

            await test.step('THEN the savings account details should reflect the correct initial balance', async () => {
                /**
                 * WHY: Direct navigation verifies deep-linking capabilities 
                 * and direct resource access independently of menu components.
                 */
                await basePage.navigateTo(`/parabank/activity.htm?id=${savingsAccountId}`);

                await expect(accountActivityPage.accountDetailsTitle).toBeVisible();
                expect(await accountActivityPage.getBalanceText()).toBe(INITIAL_ACCOUNT_BALANCE);
                expect(await accountActivityPage.getAccountTypeText()).toBe('SAVINGS');
            });

            await test.step('WHEN the user transfers funds between checking and savings accounts', async () => {
                await homePage.navigateViaLeftMenu('Accounts Overview');

                // Capture states before the transaction to calculate deltas
                const checkingBefore = parseCurrency(await accountsOverviewPage.getAccountBalance(checkingAccountId));
                const savingsBefore = parseCurrency(await accountsOverviewPage.getAccountBalance(savingsAccountId));

                await homePage.navigateViaLeftMenu('Transfer Funds');
                await transferFundsPage.transferFunds(TRANSACTION_AMOUNT, savingsAccountId, checkingAccountId);

                await expect(transferFundsPage.successMessage).toBeVisible();

                await test.step('THEN the ledger should update correctly with the transaction amounts', async () => {
                    await homePage.navigateViaLeftMenu('Accounts Overview');
                    const checkingAfter = parseCurrency(await accountsOverviewPage.getAccountBalance(checkingAccountId));
                    const savingsAfter = parseCurrency(await accountsOverviewPage.getAccountBalance(savingsAccountId));

                    const amount = parseFloat(TRANSACTION_AMOUNT);
                    
                    /**
                     * WHY: toBeCloseTo(X, 2) handles floating-point math issues inherent 
                     * in JS currency calculations (e.g., handling cents accurately).
                     */
                    expect(checkingAfter).toBeCloseTo(checkingBefore + amount, 2);
                    expect(savingsAfter).toBeCloseTo(savingsBefore - amount, 2);
                });
            });

            await test.step('WHEN the user completes a third-party bill payment', async () => {
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
                 * WHY: Bill Pay involves complex AJAX POST requests. toPass() ensures 
                 * the UI state has transitioned to 'Complete' before validating text.
                 */
                await expect(async () => {
                    await billPayPage.fillBillPaymentForm(paymentData);
                    await billPayPage.submitPayment();
                    await expect(billPayPage.page.getByRole('heading', { name: 'Bill Payment Complete' })).toBeVisible();
                }).toPass();
            });

            await test.step('THEN the bill payment confirmation should be successfully displayed', async () => {
                await expect(billPayPage.paymentSuccessDetails).toContainText(`amount of $${TRANSACTION_AMOUNT}`);
            });
        }
    );
});