/**
 * User and Address Schemas for Parabank Contract Validation.
 * 
 * WHY: We use Zod to enforce strict data contracts on API responses. This prevents 
 * "cascading failures" where a test fails because of a null pointer elsewhere; 
 * instead, the test fails immediately at the boundary if the API returns unexpected data.
 */

import { z } from 'zod';

/**
 * Reusable Address Schema.
 * 
 * WHY: Following the DRY principle, we extract the address structure. 
 * Since addresses are used for both Customers and Payees in Parabank, 
 * this ensures consistent validation rules across the entire test suite.
 */
export const AddressSchema = z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Zip Code is required"),
});

/**
 * Main User Response Schema.
 * 
 * WHY: This matches the 'Customer' object returned by Parabank's REST services. 
 * It acts as a security and performance filter, ensuring that all required 
 * PII (Personally Identifiable Information) is present and correctly formatted.
 */
export const UserResponseSchema = z.object({
    /**
     * WHY: 'id' is optional because Parabank's 'login' endpoint often returns 
     * the customer object without the internal database ID.
     */
    id: z.number().optional(),
    
    firstName: z.string().min(1, "First name cannot be empty"),
    lastName: z.string().min(1, "Last name cannot be empty"),
    
    // Nested schema reuse
    address: AddressSchema,
    
    /**
     * WHY: We use strings for phone and SSN to preserve formatting characters 
     * (like dashes or parentheses) provided by the legacy backend.
     */
    phoneNumber: z.string(),
    ssn: z.string(),

    /**
     * WHY: Authentication credentials (username/password) are usually omitted 
     * from standard 'GET' profile responses for security reasons, so they 
     * are marked as optional to allow the schema to pass during profile checks.
     */
    username: z.string().optional(), 
    password: z.string().optional(),
});