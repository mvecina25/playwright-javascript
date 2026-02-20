/**
 * Import Faker library
 * Used to generate realistic random test data
 */
import { faker } from '@faker-js/faker';

/**
 * Import Node.js File System module
 * Used for reading and writing files
 */
import fs from 'fs';

import path from 'path';

// Path where user credentials are stored
const filePath = path.resolve('./utils/credentials.json');


/**
 * ========================================
 * USERNAME GENERATOR
 * ========================================
 */

/**
 * Generates a unique username
 * - Uses faker to create a base name
 * - Removes special characters
 * - Appends timestamp for uniqueness
 */
export function generateRandomUsername() {

    // Create base username from faker
    // const baseUsername =
        // faker.internet.username().replace(/[^a-zA-Z0-9]/g, '');

    // Add timestamp to guarantee uniqueness
    // return `${baseUsername}_${Date.now()}`;

    // Alternative shorter username (kept for reference)
    return `${faker.internet.username().replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * ========================================
 * PASSWORD GENERATOR
 * ========================================
 */

/**
 * Generates a strong random password
 * - Fixed length
 * - Not memorable
 * - Always starts with P@$$
 */
export function generateRandomPassword() {

    return faker.internet.password({
        length: 10,          // Total number of characters
        memorable: false,    // Forces complex password
        prefix: 'P@$$'       // Adds special characters at start
    });
}

/**
 * ========================================
 * FULL USER DATA GENERATOR
 * ========================================
 */

/**
 * Generates complete user data object
 * Used for registration and login tests
 */
export function generateRandomUser() {

    // Personal details
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    // Address information
    const street = faker.location.streetAddress();
    const city = faker.location.city();
    const state = faker.location.state();
    const zipCode = faker.location.zipCode();

    // Contact information
    const phoneNumber = faker.phone.number('##########'); // Always 10 digits
    const ssn = faker.string.numeric(9);                  // 9-digit numeric string

    // Login credentials
    const username = generateRandomUsername();
    const password = generateRandomPassword();

    /**
     * Return user object
     * Structure matches registration form fields
     */
    return {
        firstName,
        lastName,

        address: {
            street,
            city,
            state,
            zipCode,
        },

        phoneNumber,
        ssn,
        username,
        password,

        // Confirm password mirrors password
        confirmPassword: password
    };
}

/**
 * =====================================================
 * SAVE USER CREDENTIALS TO FILE
 * =====================================================
 */

/**
 * Saves a new set of credentials into credentials.json
 * Each call appends a new user record
 */
export function saveCredentials(
    username,
    password,
    firstName,
    lastName,
    address,
    city,
    state,
    zipCode,
    phoneNumber,
    ssn,
    checkingAccountId,
    savingsAccountId
) {

    // Local container for file data
    let data = [];

    // Check if credentials file already exists
    if (fs.existsSync(filePath)) {

        // Read file and convert JSON string into object
        data = JSON.parse(fs.readFileSync(filePath));
    }

    // Add new user record to array
    data.push({
        username,
        password,
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        phoneNumber,
        ssn,
        checkingAccountId,
        savingsAccountId,

        // Timestamp when record was created
        createdAt: new Date().toISOString()
    });

    // Write updated array back to file in formatted JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * =====================================================
 * GET MOST RECENTLY SAVED CREDENTIALS
 * =====================================================
 */

/**
 * Returns the last saved user from credentials.json
 */
export function getLatestCredentials() {

    // Throw clear error if file does not exist
    if (!fs.existsSync(filePath)) {
        throw new Error('credentials.json does not exist');
    }

    // Read file and convert JSON string into object
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    if (!fileContent.trim()) {
        throw new Error('credentials.json is empty');
    }

    const data = JSON.parse(fileContent);

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No saved credentials found');
    }

    // Return last entry in the array
    return data[data.length - 1];
}