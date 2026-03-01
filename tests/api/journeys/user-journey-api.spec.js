/**
 * WHY: This suite validates the full lifecycle of a user's financial session.
 * We use .serial because each test depends on the authentication and state 
 * (JSESSIONID and account funds) created by the previous step.
 */
import { test, expect } from '../../../fixtures/indexFixtures.js';
import { UserResponseSchema } from '../../../fixtures/api/schemas/userSchema';
import { TransactionListSchema } from '../../../fixtures/api/schemas/transactionSchema';
import { extractCookie } from '../../../utils/api-helper.js';

/**
 * WHY: Centralizing endpoints follows the DRY principle. If the Parabank API 
 * version updates or paths change, we only modify this single object.
 */
const PARABANK_ENDPOINTS = {
    loginHtml: '/parabank/login.htm',
    accounts: (accountId) => `/parabank/services/bank/accounts/${accountId}/transactions/amount`,
    transfer: '/parabank/services/bank/transfer',
    userDetails: (user, pass) => `/parabank/services/bank/login/${user}/${pass}`,
};

test.describe.serial('API - User Banking Journey - Ledger Validation', { tag: ['@smoke', '@journey', '@api'] }, () => {
    let userContext;
    let sharedSessionId;

    /** 
     * WHY: Generating the amount at the suite level ensures data parity 
     * between the "Transfer" action and the "Search" verification steps.
     */
    const transferAmount = (Math.random() * (10 - 1) + 1).toFixed(2);

    test(
        'TC-API-01: should authenticate and capture a valid session ID',
        async ({ userAndAccountCreationForApiFixture, apiRequest }) => {
            
            await test.step('GIVEN a newly registered user with bank accounts', async () => {
                /**
                 * WHY: We leverage a high-level fixture to seed the database.
                 * This follows the Single Responsibility Principle, ensuring this 
                 * test focuses only on the API communication.
                 */
                userContext = userAndAccountCreationForApiFixture;
            });

            await test.step('WHEN the user authenticates via the legacy login form', async () => {
                const response = await apiRequest({
                    method: 'POST',
                    url: PARABANK_ENDPOINTS.loginHtml,
                    baseUrl: process.env.APP_BASE_URL,
                    isFormData: true, // WHY: Parabank's legacy .htm endpoint expects form-data
                    body: {
                        username: userContext.username,
                        password: userContext.password,
                    },
                });

                /**
                 * WHY: A successful login in Parabank results in a 302 Redirect. 
                 * We verify the redirect status to ensure authentication was successful.
                 */
                expect([301, 302], `Login failed with status ${response.status}`).toContain(response.status);

                // Capture the session cookie required for subsequent REST calls
                sharedSessionId = extractCookie(response.headers, 'JSESSIONID');
            });

            await test.step('THEN a valid JSESSIONID should be captured for stateful requests', async () => {
                /**
                 * WHY: Without a valid JSESSIONID, subsequent REST calls will 
                 * return a 401/403 or empty data sets.
                 */
                expect(sharedSessionId, 'Session ID (JSESSIONID) was not found in response headers').toBeTruthy();
            });
        }
    );

    test(
        'TC-API-02: should validate user profile details against the contract schema',
        async ({ apiRequest }) => {
            
            await test.step('GIVEN a valid authenticated session', async () => {
                expect(sharedSessionId).toBeTruthy();
            });

            await test.step('WHEN the user profile details are requested', async () => {
                const response = await apiRequest({
                    method: 'GET',
                    url: PARABANK_ENDPOINTS.userDetails(userContext.username, userContext.password),
                    baseUrl: process.env.APP_BASE_URL,
                    headers: {
                        'Cookie': sharedSessionId,
                        'Accept': 'application/json'
                    },
                });

                expect(response.status).toBe(200);

                /**
                 * WHY: We use Zod's safeParse to perform contract testing. This ensures 
                 * the API provides all required PII (Personally Identifiable Information) 
                 * in the correct format, catching backend regressions.
                 */
                await test.step('THEN user profile details should match the schema', async () => {
                    const validation = UserResponseSchema.safeParse(response.body);
    
                    if (!validation.success) {
                        console.error('SCHEMA ERROR:', JSON.stringify(validation.error.format(), null, 2));
                    }
    
                    expect(validation.success, 'User profile API response does not match the expected schema').toBe(true);
                });
            });
        }
    );

    test(
        'TC-API-03: should successfully transfer funds between checking and savings accounts',
        async ({ apiRequest }) => {
            const { checkingAccountId, savingsAccountId } = userContext;

            await test.step('WHEN a POST request is sent to the transfer endpoint', async () => {
                const queryParams = new URLSearchParams({
                    fromAccountId: checkingAccountId,
                    toAccountId: savingsAccountId,
                    amount: transferAmount
                }).toString();

                const response = await apiRequest({
                    method: 'POST',
                    url: `${PARABANK_ENDPOINTS.transfer}?${queryParams}`,
                    baseUrl: process.env.APP_BASE_URL,
                    headers: {
                        'Accept': 'application/json',
                        'Cookie': sharedSessionId
                    }
                });

                expect(response.status).toBe(200);

                /**
                 * WHY: We verify the specific confirmation message to ensure 
                 * the business logic correctly routed the funds between specific IDs.
                 */
                await test.step('THEN transfer funds should be successful', async () => {
                    const expectedMessage = `Successfully transferred $${transferAmount} from account #${checkingAccountId} to account #${savingsAccountId}`;
                    expect(response.body).toBe(expectedMessage);
                });
            });
        }
    );

    test(
        'TC-API-04: should verify the transaction ledger entry matches the transfer amount',
        async ({ apiRequest }) => {
            const { checkingAccountId } = userContext;

            await test.step('WHEN querying the account transactions by amount', async () => {
                const searchUrl = `${PARABANK_ENDPOINTS.accounts(checkingAccountId)}/${transferAmount}`;

                const response = await apiRequest({
                    method: 'GET',
                    url: searchUrl,
                    baseUrl: process.env.APP_BASE_URL,
                    headers: {
                        'Accept': 'application/json',
                        'Cookie': sharedSessionId
                    }
                });

                expect(response.status).toBe(200);

                // Perform Schema Validation to ensure the list structure is intact
                const validation = TransactionListSchema.safeParse(response.body);
                expect(validation.success, 'Ledger response does not match Transaction schema').toBe(true);

                const latestTransaction = response.body[0];

                /**
                 * WHY: We verify the top ledger entry specifically to ensure 
                 * data integrity (IDs, amounts, and descriptions) across the system.
                 */
                await test.step('THEN the transaction details should reflect the previous transfer', async () => {
                    expect(latestTransaction.accountId).toBe(Number(checkingAccountId));
                    expect(latestTransaction.amount).toBe(Number(transferAmount));
                    expect(latestTransaction.description).toContain('Funds Transfer Sent');
                });
            });
        }
    );
});