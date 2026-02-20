import { test, expect } from '../../../fixtures/api/apiFixtures';
import { getLatestCredentials } from '../../../utils/helpers';
import { UserResponseSchema } from '../../../fixtures/api/schemas/userSchema';
import { TransactionListSchema } from '../../../fixtures/api/schemas/transactionSchema';

/**
 * Centralized API endpoints to follow the DRY (Don't Repeat Yourself) principle.
 * This makes the test suite easier to maintain if the API contract changes.
 */
const PARABANK_ENDPOINTS = {
    loginHtml: '/parabank/login.htm',
    accounts: (accountId) => `/parabank/services/bank/accounts/${accountId}/transactions/amount`,
    transfer: '/parabank/services/bank/transfer',
    userDetails: (user, pass) => `/parabank/services/bank/login/${user}/${pass}`,
};

test.describe.serial('API - User Banking Journey @journey', () => {
    let sharedSessionId;
    
    /** 
     * We define the transfer amount at the suite level to ensure the same value 
     * is used across both the "Transfer" and "Filter" tests.
     */
    const transferAmount = (Math.random() * (10 - 1) + 1).toFixed(2);

    /**
     * Extracts the JSESSIONID from the 'set-cookie' header.
     * Required because subsequent REST calls in Parabank rely on this session cookie 
     * rather than Bearer tokens for authentication.
     */
    const extractSessionId = (headers) => {
        const setCookie = headers['set-cookie'];
        if (!setCookie) return null;
        
        // We split by ';' to isolate the ID from attributes like 'Path' or 'HttpOnly'
        const cookieValue = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        return cookieValue.split(';')[0];
    };

    test('TC-API-01: should authenticate and capture session', async ({ apiRequest }) => {
        const credentials = getLatestCredentials();

        const response = await apiRequest({
            method: 'POST',
            url: PARABANK_ENDPOINTS.loginHtml,
            baseUrl: process.env.APP_BASE_URL,
            isFormData: true, // Parabank's legacy login expects form-data, not JSON
            body: {
                username: credentials.username,
                password: credentials.password,
            },
        });

        /**
         * WHY: In Parabank, a successful login via the .htm endpoint results in a 302 Redirect.
         * If the server returns 200, it usually means the login failed and the page 
         * reloaded with an error message.
         */
        expect(response.status, 'Should redirect (302) on successful login').toBe(302);

        sharedSessionId = extractSessionId(response.headers);
        expect(sharedSessionId, 'Session ID (JSESSIONID) must be present in cookies').toContain('JSESSIONID');
    });

    test('TC-API-02: Retrieve User Profile Details', async ({ apiRequest }) => {
        const credentials = getLatestCredentials();
        
        const response = await apiRequest({
            method: 'GET',
            url: PARABANK_ENDPOINTS.userDetails(credentials.username, credentials.password),
            baseUrl: process.env.APP_BASE_URL,
            headers: { 'Accept': 'application/json' },
        });

        expect(response.status).toBe(200);

        /**
         * WHY: We use Zod schema validation to ensure the API contract hasn't changed.
         * This catches missing fields or type mismatches that simple assertions might miss.
         */
        const validation = UserResponseSchema.safeParse(response.body);
        expect(validation.success, 'User profile response should match the schema').toBe(true);
    });

    test('TC-API-03: should transfer funds between accounts', async ({ apiRequest }) => {
        const { checkingAccountId, savingsAccountId } = getLatestCredentials();

        /**
         * Using URLSearchParams ensures that special characters or decimals in the 
         * amount are correctly URL-encoded to prevent malformed requests.
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
                'Cookie': sharedSessionId // Injecting the session captured in TC-01
            }
        });

        expect(response.status).toBe(200);

        // Verification of the success message string returned by the API
        const expectedMessage = `Successfully transferred $${transferAmount} from account #${checkingAccountId} to account #${savingsAccountId}`;
        expect(response.body).toBe(expectedMessage);
    });

    test('TC-API-04: should verify transaction history by Amount', async ({ apiRequest }) => {
        const { checkingAccountId } = getLatestCredentials();
        const url = `${PARABANK_ENDPOINTS.accounts(checkingAccountId)}/${transferAmount}`;

        const response = await apiRequest({
            method: 'GET',
            url: url,
            baseUrl: process.env.APP_BASE_URL,
            headers: {
                'Accept': 'application/json',
                'Cookie': sharedSessionId
            }
        });

        expect(response.status).toBe(200);

        /**
         * safeParse is used here to prevent the test from crashing on failure.
         * This allows us to log a formatted error tree for easier debugging.
         */
        const validation = TransactionListSchema.safeParse(response.body);
        if (!validation.success) {
            console.error('Schema Error Details:', validation.error.format());
        }
        expect(validation.success, 'Transaction list should match expected schema').toBe(true);

        /**
         * Beyond schema validation, we perform logic validation to ensure the 
         * top-most transaction matches the values from the transfer performed in TC-03.
         */
        const latestTransaction = response.body[0];
        expect(latestTransaction.accountId).toBe(Number(checkingAccountId));
        expect(latestTransaction.amount).toBe(Number(transferAmount));
        expect(latestTransaction.description).toContain('Funds Transfer Sent');
    });
});