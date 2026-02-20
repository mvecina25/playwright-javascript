/**
 * @typedef {Object} ApiRequestParams
 * @property {import('@playwright/test').APIRequestContext} request - The Playwright request object.
 * @property {'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'} method - The HTTP method to use.
 * @property {string} url - The URL to send the request to.
 * @property {string} [baseUrl] - The base URL to prepend to the request URL.
 * @property {Object | null} [body=null] - The body to send with the request.
 * @property {string | Object} [headers] - If a string, used as an Authorization Token. If an object, merged into headers.
 * @property {boolean} [isFormData=false] - If true, sends the body as x-www-form-urlencoded.
 */

/**
 * Simplified helper for making API requests and returning the status and parsed body.
 * 
 * @param {ApiRequestParams} params - The parameters for the request.
 * @returns {Promise<{ status: number, body: any }>} - An object containing the status code and parsed response body.
 */
export async function apiRequest({
    request,
    method,
    url,
    baseUrl,
    body = null,
    headers,
    isFormData = false, // Add this flag
}) {
    let response;
    // const options = { headers: {} };
    const options = {
        headers: {},
        maxRedirects: 0 // <-- ADD THIS: Prevents Playwright from skipping the 302
    };

    // 1. Handle Headers
    if (headers && typeof headers === 'string') {
        // If it's a string, treat as Token (your existing logic)
        options.headers['Authorization'] = `Token ${headers}`;
    } else if (headers && typeof headers === 'object') {
        // If it's an object, merge it
        options.headers = { ...options.headers, ...headers };
    }

    // 2. Handle Body (Data vs Form)
    if (body) {
        if (isFormData) {
            options.form = body; // Playwright uses 'form' for x-www-form-urlencoded
        } else {
            options.data = body; // Playwright uses 'data' for application/json
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json';
            }
        }
    }

    const fullUrl = baseUrl ? `${baseUrl}${url}` : url;

    switch (method.toUpperCase()) {
        case 'POST': response = await request.post(fullUrl, options); break;
        case 'GET': response = await request.get(fullUrl, options); break;
        case 'PUT': response = await request.put(fullUrl, options); break;
        case 'DELETE': response = await request.delete(fullUrl, options); break;
        case 'PATCH': response = await request.patch(fullUrl, options); break;
        default: throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // const status = response.status();
    // const responseHeaders = response.headers(); // <--- 1. Capture headers here
    // let bodyData = null;
    // const contentType = response.headers()['content-type'] || '';

    // try {
    //     if (contentType.includes('application/json')) {
    //         bodyData = await response.json();
    //     } else {
    //         bodyData = await response.text();
    //     }
    // } catch (err) {
    //     console.warn(`Could not parse body: ${err}`);
    // }

    // return { status, body: bodyData, headers: responseHeaders };
    const status = response.status();
    const responseHeaders = response.headers();
    let bodyData = null;

    try {
        // 1. Always get the raw text first
        const rawText = await response.text();

        try {
            // 2. Try to parse it as JSON
            bodyData = JSON.parse(rawText);
        } catch (e) {
            // 3. If parsing fails, it's just a plain string (like Parabank's transfer message)
            bodyData = rawText;
        }
    } catch (err) {
        console.warn(`Could not read response body: ${err}`);
    }

    return { status, body: bodyData, headers: responseHeaders };
}