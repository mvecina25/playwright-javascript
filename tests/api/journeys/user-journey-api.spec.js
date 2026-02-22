/**
 * API - User Banking Journey
 * 
 * WHY: This suite validates the full lifecycle of a user's financial session, 
 * from authentication to ledger verification. We use .serial because each 
 * step depends on the state (session and funds) created by the previous one.
 */

import { test, expect } from '../../../fixtures/indexFixtures.js';
import { UserResponseSchema } from '../../../fixtures/api/schemas/userSchema';
import { TransactionListSchema } from '../../../fixtures/api/schemas/transactionSchema';

/**
 * Centralized API endpoints (DRY Principle).
 * WHY: Consolidating URIs here prevents hardcoding strings within tests, 
 * making it easier to update the suite if the API version or paths change.
 */
const PARABANK_ENDPOINTS = {
    loginHtml: '/parabank/login.htm',
    accounts: (accountId) => `/parabank/services/bank/accounts/${accountId}/transactions/amount`,
    transfer: '/parabank/services/bank/transfer',
    userDetails: (user, pass) => `/parabank/services/bank/login/${user}/${pass}`,
};

test.describe.serial('API - User Banking Journey @journey', () => {
    let userContext;
    let sharedSessionId;

    /** 
     * WHY: We generate the transfer amount once at the suite level. 
     * This ensures consistency between the "Transfer" action and the "Search" 
     * verification in subsequent tests.
     */
    const transferAmount = (Math.random() * (10 - 1) + 1).toFixed(2);

    /**
     * Helper: extractSessionId
     * WHY: Parabank uses JSESSIONID for state management. This function 
     * isolates the extraction logic from the test assertions, following the 
     * Single Responsibility Principle (SRP).
     */
    const extractSessionId = (headers) => {
        const setCookie = headers['set-cookie'];
        if (!setCookie) return null;

        const cookieValue = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        return cookieValue.split(';')[0];
    };

    test('TC-API-01: should authenticate and capture session', async ({ userAndAccountCreationForApiFixture, apiRequest }) => {
        /**
         * WHY: We use the userAndAccountCreationForApiFixture to ensure the 
         * database is seeded with a valid user and accounts before we begin 
         * the API interactions.
         */
        userContext = userAndAccountCreationForApiFixture;

        const response = await apiRequest({
            method: 'POST',
            url: PARABANK_ENDPOINTS.loginHtml,
            baseUrl: process.env.APP_BASE_URL,
            isFormData: true, // Parabank legacy login requires form-urlencoded data
            body: {
                username: userContext.username,
                password: userContext.password,
            },
        });

        /**
         * WHY: Allow 301 (Protocol Redirect) or 302 (Login Redirect)
         */
        const successRedirects = [301, 302];
        expect(successRedirects, `Expected 301 or 302 but got ${response.status}`).toContain(response.status);

        sharedSessionId = extractSessionId(response.headers);
        expect(sharedSessionId, 'JSESSIONID must be captured for stateful requests').toContain('JSESSIONID');
    });

    test('TC-API-02: should validate user profile via contract schema', async ({ apiRequest }) => {
        const response = await apiRequest({
            method: 'GET',
            url: PARABANK_ENDPOINTS.userDetails(userContext.username, userContext.password),
            baseUrl: process.env.APP_BASE_URL,
            headers: { 'Accept': 'application/json' },
        });

        expect(response.status).toBe(200);

        /**
         * WHY: We use Zod's safeParse to perform contract testing. This ensures 
         * the API provides all required fields (names, addresses, etc.) in the 
         * correct format, catching backend regressions early.
         */
        const validation = UserResponseSchema.safeParse(response.body);
        expect(validation.success, 'API response must match User Contract Schema').toBe(true);
    });

    test('TC-API-03: should execute internal funds transfer', async ({ apiRequest }) => {
        const { checkingAccountId, savingsAccountId } = userContext;

        /**
         * WHY: URLSearchParams handles character encoding and formatting 
         * automatically, preventing malformed URL strings during concatenation.
         */
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
                'Cookie': sharedSessionId // Injecting the session ID captured in TC-01
            }
        });

        expect(response.status).toBe(200);

        /**
         * WHY: Verifying the specific success message confirms that the 
         * business logic correctly processed the source and destination IDs.
         */
        const expectedMessage = `Successfully transferred $${transferAmount} from account #${checkingAccountId} to account #${savingsAccountId}`;
        expect(response.body).toBe(expectedMessage);
    });

    test('TC-API-04: should verify transaction ledger entry', async ({ apiRequest }) => {
        const { checkingAccountId } = userContext;
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

        /**
         * WHY: Validating the transaction list against the schema ensures 
         * that the ledger entry contains required fields like 'id', 'type', and 'date'.
         */
        const validation = TransactionListSchema.safeParse(response.body);
        if (!validation.success) {
            console.error('Ledger Schema Error:', JSON.stringify(validation.error.format(), null, 2));
        }
        expect(validation.success, 'Transaction response must match Ledger Contract Schema').toBe(true);

        /**
         * WHY: We verify that the first result in the list matches the 
         * specific amount and account from our previous transfer (TC-03), 
         * ensuring data integrity across the system.
         */
        const latestTransaction = response.body[0];
        expect(latestTransaction.accountId).toBe(Number(checkingAccountId));
        expect(latestTransaction.amount).toBe(Number(transferAmount));
        expect(latestTransaction.description).toContain('Funds Transfer Sent');
    });
});