/**
 * @typedef {Object} ApiRequestParams
 * @property {import('@playwright/test').APIRequestContext} request - The Playwright request object.
 * @property {'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'} method - The HTTP method to use.
 * @property {string} url - The URL endpoint.
 * @property {string} [baseUrl] - The base URL to prepend to the request URL.
 * @property {Object | null} [body=null] - The payload to send with the request.
 * @property {string | Object} [headers] - Authorization Token (string) or a Header Object.
 * @property {boolean} [isFormData=false] - Whether to send the body as x-www-form-urlencoded.
 */

/**
 * Standardized network utility for making API requests.
 * 
 * WHY: This helper abstracts Playwright's low-level request methods into a 
 * single, consistent interface. It handles common tasks like header merging, 
 * URL construction, and intelligent response parsing, ensuring all API tests 
 * follow the DRY (Don't Repeat Yourself) principle.
 * 
 * @param {ApiRequestParams} params
 * @returns {Promise<{ status: number, body: any, headers: Object }>}
 */
export async function apiRequest({
    request,
    method,
    url,
    baseUrl,
    body = null,
    headers,
    isFormData = false,
}) {
    /**
     * WHY: We set maxRedirects to 0 because many legacy systems (like Parabank) 
     * use 302 Redirects as a success indicator for form submissions. 
     * Allowing Playwright to follow redirects would skip these status code assertions.
     */
    const httpRequestOptions = {
        headers: {},
        maxRedirects: 0
    };

    // 1. Header Orchestration
    if (headers) {
        if (typeof headers === 'string') {
            /**
             * WHY: A common pattern in this framework is passing a string token. 
             * We automatically wrap it in the expected 'Token' format for authorization.
             */
            httpRequestOptions.headers['Authorization'] = `Token ${headers}`;
        } else if (typeof headers === 'object') {
            httpRequestOptions.headers = { ...httpRequestOptions.headers, ...headers };
        }
    }

    // 2. Body Payload Formatting (JSON vs Form-Data)
    if (body) {
        if (isFormData) {
            /**
             * WHY: Playwright uses the 'form' key to automatically set the 
             * 'application/x-www-form-urlencoded' Content-Type and format the body.
             */
            httpRequestOptions.form = body;
        } else {
            httpRequestOptions.data = body;
            if (!httpRequestOptions.headers['Content-Type']) {
                httpRequestOptions.headers['Content-Type'] = 'application/json';
            }
        }
    }

    // 3. URL Construction
    const requestUrl = baseUrl ? `${baseUrl}${url}` : url;

    // 4. Request Execution
    const networkResponse = await executeNetworkCall(request, method, requestUrl, httpRequestOptions);

    // 5. Response Sanitization and Parsing
    const statusCode = networkResponse.status();
    const responseHeaders = networkResponse.headers();
    const parsedBody = await parseResponseBody(networkResponse);

    return {
        status: statusCode,
        body: parsedBody,
        headers: responseHeaders
    };
}

/**
 * Internal helper to map HTTP methods to Playwright request actions.
 * 
 * WHY: Separating the execution logic from the configuration logic adheres 
 * to the Single Responsibility Principle, making the code easier to maintain.
 */
async function executeNetworkCall(request, method, url, options) {
    const verb = method.toUpperCase();
    switch (verb) {
        case 'POST': return await request.post(url, options);
        case 'GET': return await request.get(url, options);
        case 'PUT': return await request.put(url, options);
        case 'DELETE': return await request.delete(url, options);
        case 'PATCH': return await request.patch(url, options);
        default: throw new Error(`Unsupported HTTP method: ${verb}`);
    }
}

/**
 * Intelligent response body parser.
 * 
 * WHY: API responses are not always JSON. This helper attempts to parse JSON 
 * first but gracefully falls back to plain text (common for success messages 
 * in Parabank), ensuring tests don't crash on non-JSON payloads.
 */
async function parseResponseBody(response) {
    try {
        const rawText = await response.text();
        if (!rawText) return null;

        try {
            return JSON.parse(rawText);
        } catch (jsonError) {
            /**
             * WHY: If JSON parsing fails, we return the raw text. This is 
             * intentional for endpoints that return simple confirmation strings.
             */
            return rawText;
        }
    } catch (readError) {
        console.warn(`CRITICAL: Could not read response body: ${readError.message}`);
        return null;
    }
}

/**
 * Extracts a specific cookie by name from the response headers.
 * 
 * WHY: Playwright lowercases all header keys. This helper handles 
 * 'set-cookie' regardless of whether it is an array or a single string,
 * and extracts only the 'Name=Value' part needed for subsequent requests.
 * 
 * @param {Object} headers - The headers object from the response.
 * @param {string} cookieName - Name of the cookie (e.g., 'JSESSIONID').
 * @returns {string | null}
 */
export function extractCookie(headers, cookieName) {
    const setCookie = headers['set-cookie'];
    if (!setCookie) return null;

    // Normalize to an array
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];

    // Find the cookie entry starting with the desired name (case-insensitive)
    const targetCookie = cookieArray.find(c =>
        c.trim().split('=')[0].toLowerCase() === cookieName.toLowerCase()
    );

    if (!targetCookie) return null;

    // Return the 'Name=Value' part (before the first semicolon)
    return targetCookie.split(';')[0];
}