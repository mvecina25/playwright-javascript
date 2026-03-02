import playwright from 'eslint-plugin-playwright';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import js from '@eslint/js'; // WHY: Inherit standard JS best practices
import globals from 'globals';

export default [
    {
        // WHY: Exclude build artifacts and reports from linting to save compute time.
        ignores: [
            'node_modules/**', 
            'playwright-report/**', 
            'test-results/**', 
            'allure-results/**',
            'allure-report/**'
        ],
    },
    // Apply standard JavaScript recommended rules
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.node, ...globals.browser },
        },
        plugins: { 
            playwright, 
            prettier: prettierPlugin 
        },
        rules: {
            // Playwright Recommended Rules
            ...playwright.configs['flat/recommended'].rules,

            // WHY: Enforce Prettier formatting as an ESLint error.
            // Note: We don't define 'semi' or 'tabWidth' here; ESLint will 
            // automatically read your .prettierrc file (Single Source of Truth).
            'prettier/prettier': 'error',

            // --- General Code Quality ---
            'no-console': 'off', // Allowed for test logging
            'prefer-const': 'error',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Prevent dead code
            'no-undef': 'error',

            // --- Senior Playwright Best Practices ---
            
            // WHY: Prevents 'await page.waitForTimeout(5000)'. 
            // Forces engineers to use web-first assertions or signal-based waiting.
            'playwright/no-wait-for-timeout': 'error',

            // WHY: Prevents '.skip' from being accidentally committed to the main branch.
            'playwright/no-skipped-test': 'warn',

            // WHY: Encourages better locators. Using { force: true } usually 
            // hides an underlying issue with the page state.
            'playwright/no-force-option': 'warn',

            // WHY: Ensures all Playwright promises are handled correctly to avoid race conditions.
            'playwright/missing-playwright-await': 'error',
            'playwright/no-useless-await': 'error',

            // WHY: Standardizes assertions to use Playwright's retry-ability (e.g., toBeVisible).
            'playwright/prefer-web-first-assertions': 'error',
            
            // WHY: Helps in debugging by requiring descriptive titles for test.step().
            'playwright/valid-title': 'warn',
        },
    },
    // WHY: Must be last to override any ESLint rules that conflict with Prettier.
    prettierConfig,
];