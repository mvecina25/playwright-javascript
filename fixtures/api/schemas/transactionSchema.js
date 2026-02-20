/**
 * Transaction Data Schemas for Parabank Ledger Validation.
 * 
 * WHY: We implement schema validation for transactions to ensure the financial 
 * records returned by the API conform to the bank's data contract. This acts 
 * as a first line of defense against corrupted data or breaking backend changes.
 */

import { z } from 'zod';

/**
 * Individual Transaction Schema
 * 
 * WHY: This matches the 'Transaction' object model in Parabank. We enforce 
 * specific types here to prevent logical errors during balance calculations 
 * or transaction filtering in tests.
 */
export const TransactionSchema = z.object({
    id: z.number(),
    
    accountId: z.number(),
    
    /**
     * WHY: We use an Enum to strictly enforce allowed business categories. 
     * If the API returns a type like 'Transfer' instead of 'Credit/Debit', 
     * the test will fail immediately with a descriptive error.
     */
    type: z.enum(['Credit', 'Debit']),
    
    /**
     * WHY: Parabank's legacy backend is inconsistent with date formats. 
     * It may return a Unix Epoch timestamp (number) or an ISO-8601 string. 
     * z.union allows our tests to remain robust regardless of the specific format.
     */
    date: z.union([z.string(), z.number()]), 
    
    /**
     * WHY: Amount is verified as a number to facilitate mathematical 
     * delta-validation (calculating differences) within the test scripts.
     */
    amount: z.number(),
    
    description: z.string()
});

/**
 * Transaction List Schema
 * 
 * WHY: Parabank endpoints (like transaction search) return an array of objects. 
 * Defining this as an array of the base TransactionSchema follows the DRY 
 * principle and ensures that every item in the list is validated against 
 * the same strict criteria.
 */
export const TransactionListSchema = z.array(TransactionSchema);