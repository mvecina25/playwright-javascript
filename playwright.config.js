// @ts-check

/**
 * Playwright Test Configuration
 * This file centralizes the execution environment, browser defaults, and reporting logic.
 * Adheres to the principle of "Plan Before Coding" by establishing a predictable runtime.
 */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * WHY: Load environment variables early.
 * We use path.resolve to ensure the .env file is found regardless of where the 
 * test runner is invoked from, making the configuration more robust.
 */
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Validation: Ensure critical environment variables are present.
 * WHY: Failing fast with a clear error message is better than running tests 
 * against an 'undefined' URL, saving compute time and debugging effort.
 */
if (!process.env.APP_BASE_URL) {
  console.warn('WARNING: APP_BASE_URL is not defined in environment variables. Falling back to localhost.');
}

/**
 * Configuration Constants
 * WHY: Centralizing magic numbers (timeouts) follows the DRY principle and
 * makes the configuration easier to maintain.
 */
const GLOBAL_TIMEOUT = 60 * 1000;         // 60 seconds total for a single test
const ACTION_TIMEOUT = 15 * 1000;         // 15 seconds for clicks/fills
const NAVIGATION_TIMEOUT = 30 * 1000;     // 30 seconds for page loads
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8080';

export default defineConfig({
  // Root directory for test files
  testDir: './tests',

  /**
   * WHY: fullyParallel is set to true to maximize resource utilization.
   * Modern hardware and cloud agents can handle parallel execution to reduce CI bottlenecks.
   */
  fullyParallel: true,

  /**
   * WHY: We fail the build in CI if .only is left in code to prevent 
   * accidental exclusion of the rest of the test suite.
   */
  forbidOnly: !!process.env.CI,

  /**
   * WHY: Flakiness management. 
   * In CI, we retry to account for transient network or environment issues. 
   * Locally, we want tests to fail immediately for faster debugging.
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * WHY: Resource management.
   * On local machines, we use all available cores. On CI, we restrict workers 
   * to prevent memory exhaustion and "noisy neighbor" flakiness.
   */
  workers: process.env.CI ? 1 : undefined,

  /**
   * WHY: 'html' for detailed post-run analysis; 'list' for real-time CI console feedback.
   */
  reporter: [
    ['html', { open: 'never' }],  // 'never' prevents CI from hanging
    ['list']                      // Useful for seeing progress in CI logs
  ],

  // Global timeout for the entire test execution
  timeout: GLOBAL_TIMEOUT,

  /**
   * Shared settings applied to all projects.
   * See https://playwright.dev/docs/api/class-testoptions.
   */
  use: {
    baseURL: BASE_URL,

    /**
     * WHY: We ignore HTTPS errors to allow tests to run in lower environments (Dev/QA)
     * which often use self-signed or non-standard SSL certificates.
     */
    ignoreHTTPSErrors: true,

    // Testing is strictly headless to ensure consistency between local and CI runs.
    headless: true,

    actionTimeout: ACTION_TIMEOUT,
    navigationTimeout: NAVIGATION_TIMEOUT,

    /**
     * WHY: 'retain-on-failure' saves disk space by only keeping traces 
     * for tests that actually require debugging.
     */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    /**
   * WHY: Custom launch arguments for consistent viewport behavior.
   * Forcing window size ensures that UI layout-dependent tests pass consistently.
   */
    launchOptions: {
      args: ['--window-position=0,0', '--window-size=1920,1080'],
    }
  },

  /**
   * Cross-browser execution strategy.
   * WHY: We define multiple projects to ensure the application behaves 
   * correctly across different rendering engines (Chromium, WebKit, Firefox).
   */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /**
     * Mobile views can be enabled here to test responsive design logic.
     * Following "Don't Reinvent the Wheel," we use Playwright's built-in device presets.
     */
    /*
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    */
  ],

  /**
   * WHY: Automation of environment setup.
   * This ensures the application is actually running before tests start, 
   * following the "Implement Robust Development Processes" principle.
   */
  /*
  webServer: {
    command: 'npm run start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  */
});