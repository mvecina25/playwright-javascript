/**
 * WHY: This maintains a single source of truth for all Page Objects and custom fixtures,
 * preventing import bloat and ensuring consistent configuration across the suite.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';

/**
 * WHY: Centralizing values prevents "magic numbers" and ensures that if the
 * test data requirements change, we update in one place.
 */
const TRANSACTION_AMOUNT = '10.00';
const INDEX_PAGE_URL = '/parabank/index.htm';

test.describe('Bills Payment - End to End Flow', () => {
    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: We navigate to the entry page before every test to ensure a clean
         * browser state and verify the application is responsive.
         */
        await basePage.navigateTo(INDEX_PAGE_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_PAGE_URL));
    });

    test(
        'TC-07: should pay a bill successfully using a newly created savings account',
        { tag: ['@regression', '@ui'] },
        async ({ userCreationFixture, savingsAccountCreationFixture, homePage, billPayPage }) => {
            // Data Setup: Mapping fixture data to the payment payload
            const paymentPayload = {
                payeeName: `${userCreationFixture.firstName} ${userCreationFixture.lastName}`,
                address: {
                    street: userCreationFixture.street,
                    city: userCreationFixture.city,
                    state: userCreationFixture.state,
                    zipCode: userCreationFixture.zipCode,
                },
                phoneNumber: userCreationFixture.phoneNumber,
                accountNumber: savingsAccountCreationFixture.savingsAccountId,
                amount: TRANSACTION_AMOUNT,
                fromAccountId: savingsAccountCreationFixture.savingsAccountId,
            };

            await test.step('GIVEN a user with an active savings account is logged in', async () => {
                /**
                 * WHY: Logging IDs for the user and account helps during CI/CD failure
                 * analysis, allowing developers to trace the specific transaction in logs.
                 */
                console.log(`User Context: ${userCreationFixture.username}`);
                console.log(`Source Account: ${savingsAccountCreationFixture.savingsAccountId}`);
            });

            await test.step('WHEN the user navigates to the Bill Pay module', async () => {
                await homePage.navigateViaLeftMenu('Bill Pay');

                // WHY: Web-first assertions provide built-in retries for dynamic URL changes
                await expect(homePage.page).toHaveURL(/.*billpay\.htm/);
            });

            await test.step('AND the user provides payee details and submits the payment', async () => {
                /**
                 * WHY: We simply call the high-level workflow method.
                 * All the 'toPass' retry logic, form filling, and waiting
                 * for the success heading is handled automatically by the POM.
                 */
                await billPayPage.payBill(paymentPayload);
            });

            await test.step('THEN the system should display the successful transaction confirmation', async () => {
                /**
                 * WHY: We verify the full confirmation string to ensure the backend
                 * correctly mapped the amount, payee, and source account in the transaction receipt.
                 */
                const expectedSuccessMessage = `Bill Payment to ${paymentPayload.payeeName} in the amount of $${paymentPayload.amount} from account ${savingsAccountCreationFixture.savingsAccountId} was successful.`;

                await expect(billPayPage.paymentSuccessDetails).toContainText(
                    expectedSuccessMessage,
                );
            });
        },
    );
});
