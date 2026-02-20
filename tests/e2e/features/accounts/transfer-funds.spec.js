/**
 * Import the unified test and expect objects from the central indexFixtures file.
 * WHY: Centralizing fixtures ensures that Page Objects and custom setup logic (like 
 * user/account creation) are consistently initialized across the suite.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';

const TRANSFER_AMOUNT = '10.00';
const INDEX_URL = '/parabank/index.htm';

test.describe('Transfer Funds', () => {

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

    test('TC-06: should transfer funds from savings to checking @smoke @regression', async ({ 
        userCreationFixture, 
        savingsAccountCreationFixture, 
        homePage, 
        transferFundsPage, 
        accountsOverviewPage 
    }) => {

        // Log the test context for easier debugging in CI environments
        console.log(`User: ${userCreationFixture.username} | Savings Account: ${savingsAccountCreationFixture.accountId}`);

        let balanceBefore = { checking: 0, savings: 0 };

        await test.step('Capture initial account states', async () => {
            await homePage.navigateViaLeftMenu('Accounts Overview');

            const rawChecking = await accountsOverviewPage.getAccountBalance(userCreationFixture.checkingAccountId);
            const rawSavings = await accountsOverviewPage.getAccountBalance(savingsAccountCreationFixture.accountId);

            /**
             * WHY: We validate the format before parsing to ensure the UI is 
             * correctly rendering currency symbols and decimal places.
             */
            expect(rawChecking).toMatch(/^\$\d+\.\d{2}$/);
            expect(rawSavings).toMatch(/^\$\d+\.\d{2}$/);

            balanceBefore.checking = parseBalance(rawChecking);
            balanceBefore.savings = parseBalance(rawSavings);
        });

        await test.step('Perform fund transfer via UI', async () => {
            await homePage.navigateViaLeftMenu('Transfer Funds');

            /**
             * WHY: The transferFunds method encapsulates the form filling and submission.
             * We move from the 'Savings' (source) to the 'Checking' (destination).
             */
            await transferFundsPage.transferFunds(
                TRANSFER_AMOUNT,
                savingsAccountCreationFixture.accountId,
                userCreationFixture.checkingAccountId
            );
        });
        
        await test.step('Verify transaction confirmation', async () => {
            /**
             * WHY: Validating the specific account numbers in the success message 
             * ensures the backend processed the correct source and destination.
             */
            const expectedMsg = `$${TRANSFER_AMOUNT} has been transferred from account #${savingsAccountCreationFixture.accountId} to account #${userCreationFixture.checkingAccountId}.`;
            await expect(transferFundsPage.successMessage).toContainText(expectedMsg);
        });

        await test.step('Validate ledger integrity (Math Verification)', async () => {
            await homePage.navigateViaLeftMenu('Accounts Overview');
    
            const checkingAfter = parseBalance(await accountsOverviewPage.getAccountBalance(userCreationFixture.checkingAccountId));
            const savingsAfter = parseBalance(await accountsOverviewPage.getAccountBalance(savingsAccountCreationFixture.accountId));
            const transferVal = parseFloat(TRANSFER_AMOUNT);

            /**
             * WHY: toBeCloseTo(X, 2) is used to handle floating-point precision 
             * issues inherent in JavaScript math when dealing with cents/decimals.
             */
            expect(checkingAfter, 'Checking account balance should increase by the transfer amount')
                .toBeCloseTo(balanceBefore.checking + transferVal, 2);

            expect(savingsAfter, 'Savings account balance should decrease by the transfer amount')
                .toBeCloseTo(balanceBefore.savings - transferVal, 2);
        });
    });
});