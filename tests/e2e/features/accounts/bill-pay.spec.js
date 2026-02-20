/**
 * Import the unified test and expect objects from the central indexFixtures file.
 * WHY: This maintains a single source of truth for all Page Objects and custom fixtures,
 * preventing import bloat and ensuring consistent configuration across the suite.
 */
import { test, expect } from '../../../../fixtures/indexFixtures.js';

/**
 * Constants defined at the module level for maintainability.
 * WHY: Centralizing values like the base amount prevents "magic numbers" 
 * and makes it easy to update test data requirements globally.
 */
const BILL_PAYMENT_AMOUNT = '10.00';
const INDEX_PAGE_URL = '/parabank/index.htm';

test.describe('Bills Payment Flow', () => {

    test.beforeEach(async ({ basePage, loginPage }) => {
        /**
         * WHY: We navigate to the entry page before every test to ensure a clean 
         * browser state and to verify that the application core is responsive.
         */
        await basePage.navigateTo(INDEX_PAGE_URL);
        await expect(loginPage.page).toHaveURL(new RegExp(INDEX_PAGE_URL));
    });

    /**
     * TC-07: Validates that a user can successfully pay a bill using a 
     * secondary account created during the same session.
     */
    test('TC-07: should pay bill with newly created savings account @smoke @regression', async ({ 
        userCreationFixture, 
        savingsAccountCreationFixture, 
        homePage, 
        billPayPage 
    }) => {
       
        /**
         * WHY: We leverage custom fixtures (userCreationFixture and savingsAccountCreationFixture)
         * to handle the setup logic. This adheres to the Single Responsibility Principle, 
         * keeping this test focused strictly on the Bill Pay logic rather than setup.
         */
        await test.step('Log dependency state', async () => {
            console.log(`Executing test for User: ${userCreationFixture.username}`);
            console.log(`Source Account for Payment: ${savingsAccountCreationFixture.accountId}`);
        });
        
        await test.step('Execute and Verify Bill Payment', async () => {
            // Navigate to the Bill Pay module
            await homePage.navigateViaLeftMenu('Bill Pay');
    
            /**
             * WHY: Verifying the URL ensures that the navigation component correctly 
             * routed the user before we attempt to interact with the form.
             */
            await expect(homePage.page).toHaveURL(/.*billpay\.htm/);

            /**
             * Mapping fixture data to the payment payload.
             * WHY: By reusing userCreationFixture properties directly, we maintain 
             * the DRY principle and ensure the payee data matches the registered user.
             */
            const paymentPayload = {
                payeeName: `${userCreationFixture.firstName} ${userCreationFixture.lastName}`,
                address: {
                    street: userCreationFixture.street,
                    city: userCreationFixture.city,
                    state: userCreationFixture.state,
                    zipCode: userCreationFixture.zipCode,
                },
                phoneNumber: userCreationFixture.phoneNumber,
                accountNumber: savingsAccountCreationFixture.accountId,
                amount: BILL_PAYMENT_AMOUNT,
                fromAccountId: savingsAccountCreationFixture.accountId,
            };
            
            /**
             * WHY: We use a consolidated POM method 'payBill' to encapsulate form filling 
             * and submission. This keeps the test script clean and readable.
             */
            await billPayPage.payBill(paymentPayload);

            /**
             * WHY: We assert the visibility of the success heading to confirm the 
             * server-side transaction completed and the UI transitioned successfully.
             */
            await expect(
                billPayPage.page.getByRole('heading', { name: 'Bill Payment Complete' })
            ).toBeVisible();

            /**
             * WHY: Validating the confirmation text ensures that the specific 
             * details (Payee, Amount, Account) in the success message are accurate 
             * and correspond to the input data.
             */
            const expectedSuccessMessage = `Bill Payment to ${paymentPayload.payeeName} in the amount of $${paymentPayload.amount} from account ${savingsAccountCreationFixture.accountId} was successful.`;
            
            await expect(billPayPage.paymentSuccessDetails).toContainText(expectedSuccessMessage);
        });
    });
});