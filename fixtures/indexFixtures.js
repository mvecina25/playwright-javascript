/**
 * Unified Fixture Hub
 * 
 * WHY: This file acts as the central orchestration point for all Playwright fixtures.
 * By merging POM, Custom, and API fixtures here, we provide a single "test" object 
 * that contains the entire power of our automation framework. This prevents 
 * fragmented imports across the test suite.
 */

import { test as baseTest, mergeTests } from '@playwright/test';
import { test as pomFixtures } from './pom/pomFixtures';
import { test as customFixtures } from './pom/customFixtures';
import { test as apiFixtures } from './api/apiFixtures';

/**
 * Merge specialized fixture sets into a single unified test object.
 * 
 * WHY: Playwright's mergeTests allows us to compose multiple fixture files 
 * into one. This follows the Interface Segregation and Open/Closed principles 
 * (SOLID), as we can add new fixture types (e.g., Database fixtures) by 
 * simply adding them to this merge list without breaking existing tests.
 */
const test = mergeTests(
    pomFixtures,    // Includes all Page Object Models (Login, Register, etc.)
    customFixtures, // Includes high-level logic (User creation, setup/teardown)
    apiFixtures     // Includes REST API request utilities
);

/**
 * Export the standard expect from the base Playwright library.
 * 
 * WHY: By exporting both 'test' and 'expect' from this index, we ensure 
 * developers only ever need to remember one import path for their test files.
 */
const expect = baseTest.expect;

export { test, expect };