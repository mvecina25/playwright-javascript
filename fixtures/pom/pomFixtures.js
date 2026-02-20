/**
 * POM Fixtures Orchestration
 * 
 * WHY: This file extends the base Playwright test object to include all Page Object Models (POMs).
 * By using fixtures, we implement Dependency Injection, allowing tests to access page objects 
 * as arguments. This keeps tests clean, reduces boilerplate, and ensures that Page Objects 
 * are instantiated only when needed (Lazy Loading).
 */

import { test as base } from '@playwright/test';

// Import Page Object Models
import { BasePage } from '../../pages/BasePage';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { HomePage } from '../../pages/HomePage';
import { OpenAccountPage } from '../../pages/OpenAccountPage';
import { AccountsOverviewPage } from '../../pages/AccountsOverviewPage';
import { TransferFundsPage } from '../../pages/TransferFundsPage';
import { BillPayPage } from '../../pages/BillPayPage';
import { AccountActivityPage } from '../../pages/AccountActivityPage';

/**
 * Extend the base test with POM fixtures.
 * 
 * WHY: This approach follows the Engineering Principle of "Don't Reinvent the Wheel" 
 * by leveraging Playwright's built-in fixture system to manage object lifecycles. 
 * Each fixture is scoped to a single test and is automatically cleaned up after execution.
 */
export const test = base.extend({

    /**
     * WHY: We provide access to the BasePage for common utilities like 
     * cross-module navigation or global health checks.
     */
    basePage: async ({ page }, use) => {
        await use(new BasePage(page));
    },

    /**
     * WHY: Dedicated fixtures for each module (Login, Register, etc.) ensure 
     * that tests follow the Single Responsibility Principle, only pulling in 
     * the specific page objects required for the scenario.
     */
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    registerPage: async ({ page }, use) => {
        await use(new RegisterPage(page));
    },

    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    openAccountPage: async ({ page }, use) => {
        await use(new OpenAccountPage(page));
    },

    accountsOverviewPage: async ({ page }, use) => {
        await use(new AccountsOverviewPage(page));
    },

    transferFundsPage: async ({ page }, use) => {
        await use(new TransferFundsPage(page));
    },

    billPayPage: async ({ page }, use) => {
        await use(new BillPayPage(page));
    },

    accountActivityPage: async ({ page }, use) => {
        await use(new AccountActivityPage(page));
    },
});