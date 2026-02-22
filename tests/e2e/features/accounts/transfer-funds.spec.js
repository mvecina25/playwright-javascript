/**
 * WHY: Centralizing fixtures ensures that Page Objects and custom setup logic (like 
 * user/account creation) are consistently initialized across the suite.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';

const TRANSFER_AMOUNT = '10.00';
const INDEX_URL = '/parabank/index.htm';

test.describe('Transfer Funds - Ledger Validation', () => {

    /**
     * Helper: Sanitizes currency strings and converts them to floats.
     * WHY: Playwright retrieves balances as strings (e.g., "$1,200.00"). 
     * To perform mathematical verification on account ledgers, we must normalize the data.
     */
    const parseBalance = (balanceStr) => parseFloat(balanceStr.replace(/[$,]/g, ''));

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: We verify the URL after navigation to ensure the environment is 
         * reachable and the application state is reset to the entry point.
         */
        await basePage.navigateTo(INDEX_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_URL));
    });

    test(
        'TC-06: should transfer funds from savings to checking and update account balances',
        { tag: ['@smoke', '@regression'] },
        async ({ 
            userCreationFixture, 
            savingsAccountCreationFixture, 
            homePage, 
            transferFundsPage, 
            accountsOverviewPage 
        }) => {
            
            // Local state to track balances across steps
            let balanceBefore = { checking: 0, savings: 0 };

            await test.step('GIVEN the initial account balances are captured', async () => {
                /**
                 * WHY: Logging context helps during CI/CD failure analysis to trace 
                 * the specific transaction IDs in the backend logs.
                 */
                console.log(`User: ${userCreationFixture.username} | Savings: ${savingsAccountCreationFixture.savingsAccountId}`);

                await homePage.navigateViaLeftMenu('Accounts Overview');

                const rawChecking = await accountsOverviewPage.getAccountBalance(userCreationFixture.checkingAccountId);
                const rawSavings = await accountsOverviewPage.getAccountBalance(savingsAccountCreationFixture.savingsAccountId);

                /**
                 * WHY: Validating format before parsing ensures the UI is rendering 
                 * correct financial formatting (currency symbols and decimals).
                 */
                expect(rawChecking).toMatch(/^\$\d+\.\d{2}$/);
                expect(rawSavings).toMatch(/^\$\d+\.\d{2}$/);

                balanceBefore.checking = parseBalance(rawChecking);
                balanceBefore.savings = parseBalance(rawSavings);
            });

            await test.step('WHEN the user performs a fund transfer via the UI', async () => {
                await homePage.navigateViaLeftMenu('Transfer Funds');

                /**
                 * WHY: The transferFunds method encapsulates form interaction. 
                 * We transfer from the created savings account to the default checking account.
                 */
                await transferFundsPage.transferFunds(
                    TRANSFER_AMOUNT,
                    savingsAccountCreationFixture.savingsAccountId,
                    userCreationFixture.checkingAccountId
                );
            });

            await test.step('THEN a successful transaction confirmation should be displayed', async () => {
                /**
                 * WHY: Validating specific account numbers in the confirmation message 
                 * ensures the backend correctly routed the source and destination.
                 */
                const expectedMsg = `$${TRANSFER_AMOUNT} has been transferred from account #${savingsAccountCreationFixture.savingsAccountId} to account #${userCreationFixture.checkingAccountId}.`;
                
                // WHY: Web-first assertions automatically retry for dynamic content
                await expect(transferFundsPage.successMessage).toContainText(expectedMsg);
            });

            await test.step('AND the updated balances should reflect the transaction amount', async () => {
                await homePage.navigateViaLeftMenu('Accounts Overview');

                const checkingAfter = parseBalance(await accountsOverviewPage.getAccountBalance(userCreationFixture.checkingAccountId));
                const savingsAfter = parseBalance(await accountsOverviewPage.getAccountBalance(savingsAccountCreationFixture.savingsAccountId));
                const transferVal = parseFloat(TRANSFER_AMOUNT);

                /**
                 * WHY: toBeCloseTo(X, 2) is used to handle floating-point precision 
                 * issues inherent in JavaScript math when dealing with cents.
                 */
                expect(checkingAfter, 'Checking account balance should increase')
                    .toBeCloseTo(balanceBefore.checking + transferVal, 2);

                expect(savingsAfter, 'Savings account balance should decrease')
                    .toBeCloseTo(balanceBefore.savings - transferVal, 2);
            });
        }
    );
});