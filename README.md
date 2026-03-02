# 🏦 ParaBank Playwright Automation Framework

A robust, enterprise-grade test automation framework built with **Playwright (JavaScript)** following the **Page Object Model (POM)** pattern. This project provides comprehensive **End-to-End (E2E) UI coverage** and **REST API validation** for the ParaBank demo banking application. The framework implements advanced concepts including **custom fixtures**, **dependency injection**, **contract testing with Zod**, **dynamic test data generation**, and **automated CI/CD reporting** with Allure and GitHub Pages.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [✅ Prerequisites](#-prerequisites)
- [🔧 Installation](#-installation)
- [📂 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [🌍 Multi-Environment Management](#-multi-environment-management)
- [🚀 Running Tests](#-running-tests)
- [📝 Writing Tests](#-writing-tests)
- [🏛️ Page Object Model](#-page-object-model)
- [📡 API Testing](#-api-testing)
- [🔐 Session & Authentication Management](#-session--authentication-management)
- [🛠️ Coding Standards & Best Practices](#-coding-standards--best-practices)
- [🧪 Test Guidelines](#-test-guidelines)

---

## ✨ Features

- **Hybrid Testing Architecture** – Seamlessly integrates UI (End-to-End) and REST API testing within a single unified framework.
- **Advanced Page Object Model (POM)** – Implements a clean separation of concerns, decoupling locators from business logic for high maintainability.
- **Fixture-Based Dependency Injection** – Utilizes a unified fixture hub for lazy-loaded Page Objects and API clients, reducing test boilerplate.
- **API Contract Validation** – Employs **Zod** to enforce strict schema validation at the network boundary, catching backend regressions instantly.
- **Dynamic Data Generation** – Integrated with **Faker** to produce realistic, unique test identities with timestamped uniqueness guarantees.
- **Interactive Allure Reporting** – Generates rich, visual reports featuring execution trends, categorical breakdowns, and historical data.
- **Multi-Environment Management** – Supports switching between Dev, Staging, and Production tiers via dynamic `.env` loading and strict fail-fast configuration.
- **Stateful Session Management** – Advanced cookie extraction and injection utilities to maintain authenticated sessions across legacy and REST endpoints.
- **Production-Ready CI/CD** – Includes optimized GitHub Actions workflows for **Nightly Regressions** and **Smoke Testing** with automated GitHub Pages deployment.
- **Enterprise Code Quality** – Enforces industry standards via **ESLint**, **Prettier**, and **Husky** pre-commit hooks to ensure a "Green" repository.
- **Performance Optimized** – Configured for fully parallel execution with smart worker management to prevent resource exhaustion in CI environments.
- **Robust Stability Logic** – Mitigates flakiness in legacy systems using web-first assertions and specialized `toPass()` retry mechanisms.
- **Flexible Tagging System** – Enables targeted execution using `@smoke`, `@regression`, `@journey`, and `@api` tags via the Playwright Grep engine.

---

## 🛠 Tech Stack

| Tool/Library                                                                     | Purpose                | Benefit                                                                                  |
| :------------------------------------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------- |
| **[Playwright](https://playwright.dev/)**                                        | Core Automation Engine | Unified framework for UI, API, and cross-browser testing with auto-waiting capabilities. |
| **[JavaScript (ES6+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)** | Programming Language   | Highly flexible, industry-standard language using modern modular syntax.                 |
| **[Zod](https://zod.dev/)**                                                      | Contract Validation    | Enforces strict schema validation for API responses to ensure data integrity.            |
| **[Allure Report](https://qameta.io/allure-report/)**                            | Interactive Reporting  | Provides visually rich dashboards, historical trends, and detailed execution steps.      |
| **[Faker](https://fakerjs.dev/)**                                                | Test Data Generation   | Generates randomized, realistic user identities, addresses, and financial data.          |
| **[GitHub Actions](https://github.com/features/actions)**                        | CI/CD Orchestration    | Automates test execution on schedules or pull requests with GH Pages integration.        |
| **[Husky & lint-staged](https://typicode.github.io/husky/)**                     | Git Hooks              | Automates code quality gates by running linters and formatters before every commit.      |
| **[ESLint & Prettier](https://eslint.org/)**                                     | Code Quality           | Standardizes code style and prevents anti-patterns (e.g., hardcoded timeouts).           |
| **[Dotenv](https://github.com/motdotla/dotenv)**                                 | Environment Management | Manages secrets and tier-specific configurations (Dev/Staging/Prod) securely.            |

---

## ✅ Prerequisites

- **[Node.js](https://nodejs.org/)** – v20.x or later (LTS recommended).
- **[npm](https://www.npmjs.com/)** – v10.x or later.
- **[Git](https://git-scm.com/)** – Required for cloning the repository and managing version control.
- **Playwright Browsers** – Installed via CLI (e.g., Chromium, Firefox, WebKit) once the project is initialized.
- **Java Runtime Environment (JRE)** – Required only for serving **Allure Reports** locally using the `allure open` command.
- **[VS Code](https://code.visualstudio.com/)** (Recommended) – Optimized for development with the included `.vscode` configuration and Playwright extension support.

---

## 🔧 Installation

Follow these steps to initialize the framework and provision the required dependencies.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd playwright-javascript
```

### 2. Install Project Dependencies

We use `--force` to ensure consistent resolution of peer dependencies across different environments.

```bash
npm install --force
```

### 3. Provision Playwright Browsers

Install the required browser binaries and their system-level dependencies.

```bash
npx playwright install --with-deps chromium
```

### 4. Configure Environment Variables

The framework uses a centralized `env/` directory to manage tier-specific configurations.

1. **Create the environment folder** (if it doesn't exist):
    ```bash
    mkdir env
    ```
2. **Initialize your development environment file**:
    ```bash
    cp env/.env.example env/.env.dev
    ```
3. **Update the variables**: Open `env/.env.dev` and ensure `APP_BASE_URL` points to your target Parabank instance:
    ```ini
    APP_BASE_URL=https://parabank.parasoft.com
    ```

### 5. Initialize Husky (Git Hooks)

Ensure pre-commit hooks are active to maintain code quality standards.

```bash
npx husky install
```

---

## Project Structure

````
## 📂 Project Structure

```text
root/
├── .github/
│   └── workflows/
│       ├── nightly-tests.yml             # Scheduled nightly regression pipeline
│       └── smoke-tests.yml               # PR/push validation pipeline
├── .husky/                               # Git hooks for code quality
│   └── pre-commit                        # Triggers lint-staged before commit
├── .vscode/                              # Workspace and IDE settings
├── allure-report/                        # Generated interactive Allure HTML report
├── allure-results/                       # Raw JSON Allure test results
├── env/                                  # Multi-environment configurations
│   ├── .env.dev                          # Local development environment variables
│   └── .env.example                      # Template for required environment variables
├── fixtures/                             # Playwright Fixture Orchestration
│   ├── api/                              # API request & schema validation fixtures
│   ├── pom/                              # Page Object & custom business logic fixtures
│   └── indexFixtures.js                  # Unified fixture hub (import from here)
├── node_modules/                         # Installed npm dependencies
├── pages/                                # Page Object Models (POMs)
│   ├── AccountActivityPage.js
│   ├── AccountsOverviewPage.js
│   ├── BasePage.js                       # Global navigation & shared page utilities
│   ├── BillPayPage.js
│   ├── HomePage.js
│   ├── LoginPage.js
│   ├── OpenAccountPage.js
│   ├── ProfilePage.js
│   ├── RegisterPage.js
│   └── TransferFundsPage.js
├── playwright-report/                    # Default Playwright HTML reporter output
├── test-results/                         # Artifacts (traces, screenshots, videos)
├── tests/                                # Test Specifications
│   ├── api/
│   │   └── journeys/
│   │       └── user-journey-api.spec.js  # API-only data contract & ledger validation
│   └── e2e/
│       ├── features/
│       │   ├── accounts/
│       │   │   ├── bill-pay.spec.js      # Bill payment functional tests
│       │   │   ├── open-account.spec.js  # Account opening functional tests
│       │   │   └── transfer-funds.spec.js# Fund transfer functional tests
│       │   └── auth/
│       │       ├── login.spec.js         # Authentication functional tests
│       │       └── register.spec.js      # User onboarding functional tests
│       └── journeys/
│           └── user-journey.spec.js      # Full End-to-End multi-page workflow
├── utils/                                # Helper Functions & Utilities
│   ├── api-helper.js                     # REST client & cookie extraction utility
│   ├── credentials.json                  # Persisted test user audit trail
│   └── helpers.js                        # Faker data generation & file read/write
├── .gitignore                            # Untracked files and folders
├── .prettierrc                           # Prettier code formatting rules
├── eslint.config.mjs                     # ESLint Flat Config with Playwright plugins
├── package-lock.json                     # Dependency lockfile
├── package.json                          # Project scripts and dependencies
├── playwright.config.js                  # Core Playwright runner configuration
└── README.md                             # Framework documentation
````

---

## 🔧 Configuration

### Playwright Configuration

The `playwright.config.js` file establishes a predictable runtime environment across local and CI environments:

| Setting            | Local                      | CI                       |
| ------------------ | -------------------------- | ------------------------ |
| Parallel execution | Enabled (fullyParallel)    | Enabled (fullyParallel)  |
| Workers            | Auto (All available cores) | 1 (Resource Management)  |
| Retries            | 0                          | 2 (Flakiness Mitigation) |
| Headless Mode      | True                       | True                     |
| Reporter           | List, HTML, Allure         | List, HTML, Allure       |
| Traces             | retain-on-failure          | retain-on-failure        |
| Screenshots        | only-on-failure            | only-on-failure          |
| Videos             | Retain on failure          | Retain on failure        |

---

## 🌍 Multi-Environment Management

This framework supports seamless switching between different environments (Development, Staging, Production) using dynamic `.env` loading.

### Project Structure Setup

1. **Create an `env` folder** in your project root:
    ```bash
    mkdir env
    ```
2. **Create your environment files** inside that folder:

- env/.env.dev (Default)
- env/.env.staging
- env/.env.prod

3. **Add the variables** to each file. For example, in env/.env.staging:

```Ini
APP_BASE_URL=https://parabank.parasoft.com
```

### Switching Environments

```bash
# Default (dev)
npm test

# Staging environment
ENVIRONMENT=staging npm test

# Production environment
ENVIRONMENT=prod npm test
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Chromium (Chrome/Edge)
npm run test:chromium

# Firefox
npm run test:firefox

# Webkit (Safari)
npm run test:webkit

# UI Mode - Opens the interactive Playwright Test Runner (Chromium)
npm run test:ui

# Headed Mode - Runs tests with a visible browser window (Chromium)
npm run test:headed

# Debug Mode - Opens the Playwright Inspector for step-by-step execution (Chromium)
npm run test:debug
```

### Test Tags

Tests are tagged for selective execution:

```bash
# Run Smoke tests only (Critical path validation) (Chromium)
npm run test:smoke

# Run Regression suite (Full feature validation) (Chromium)
npm run test:regression

# Run End-to-End User Journeys (Chromium)
npm run test:journey

# Run API-specific tests
npm run test:api

# Run E2E-specific tests (Chromium)
npm run test:e2e
```

### CI Mode

Executes tests with a single worker, optimized for CI environments.

```bash
npm run test:ci
```

### Allure Reporting

The framework integrates Allure for comprehensive, interactive HTML repo/rts.

| Task                 | Command                 |
| -------------------- | ----------------------- |
| Clean Results        | npm run allure:clean    |
| Generate Report      | npm run allure:generate |
| Open Report          | npm run allure:open     |
| Run & Report (All)   | npm run allure          |
| Run & Report (Smoke) | npm run smoke           |

---

## 📦 Dependencies & Tools

### Core Framework

- Playwright (^1.52.0): The core automation engine.
- Zod (^4.3.6): TypeScript-first schema declaration and validation for API contract testing.

### Development Utilities

- Faker (^9.8.0): Generates high-quality, randomized test data for user identities and addresses.
- Dotenv (^17.2.4): Manages environment-specific variables.
- Allure Playwright: Adapter for generating interactive test reports.

---

## Writing Tests

### Test File Structure

Always import test and expect from the unified fixture hub in indexFixtures.js. This ensures all Page Objects and custom logic are automatically injected and ready for use.

```javascript
import { test, expect } from '../../../fixtures/indexFixtures.js';

test.describe('Feature Module Tests @functional', () => {
    test.beforeEach(async ({ basePage }) => {
        // Navigate to the module entry point before every test
        await basePage.navigateTo('/parabank/index.htm');
    });

    test(
        'should perform a critical business action',
        { tag: '@smoke' },
        async ({ loginPage, homePage }) => {
            await test.step('GIVEN user is on the login page', async () => {
                await expect(loginPage.usernameInput).toBeVisible();
            });

            await test.step('WHEN user logs in with valid credentials', async () => {
                await loginPage.login('john_doe', 'password123');
            });

            await test.step('THEN the user should be redirected to the account overview', async () => {
                // Web-first assertions provide automatic retries
                await expect(homePage.logoutLink).toBeVisible();
                await expect(homePage.welcomeMessage).toContainText('Welcome');
            });
        },
    );
});
```

### Using Test Steps

Use test.step() to wrap your logic. This creates a clear "Given/When/Then" structure in your Allure reports and the Playwright HTML reporter, making it easier for stakeholders to understand failure points.

```javascript
test('descriptive test name', async ({ registerPage }) => {
    await test.step('GIVEN user provides unique registration details', async () => {
        // Logic here
    });

    await test.step('WHEN the registration form is submitted', async () => {
        // Action here
    });

    await test.step('THEN the system should create the new account', async () => {
        // Assertion here
    });
});
```

### Data-Driven Tests

For scenarios like form validation or multiple login failures, use standard JavaScript loops to generate individual test cases dynamically.

```javascript
const invalidCredentials = [
    {
        user: 'wrong_user',
        pass: 'password',
        error: 'The username and password could not be verified.',
    },
    { user: 'john', pass: 'wrong_pass', error: 'The username and password could not be verified.' },
];

for (const data of invalidCredentials) {
    test(
        `should show error for user: ${data.user}`,
        { tag: '@regression' },
        async ({ loginPage }) => {
            await loginPage.login(data.user, data.pass);
            await expect(loginPage.errorMessage).toHaveText(data.error);
        },
    );
}
```

---

## 🏛️ Page Object Model

### Creating Page Objects

Page objects encapsulate locators and actions for a specific page or component. By using the Page Object Model (POM), we ensure that if the UI changes, we only need to update the locator in one centralized place (DRY principle).

```javascript
/**
 * Page Object Model for the Login module.
 */
export class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    // ==================== Locators ====================

    /**
     * The username input field.
     */
    get usernameInput() {
        return this.page.locator('input[name="username"]');
    }

    /**
     * The password input field.
     */
    get passwordInput() {
        return this.page.locator('input[name="password"]');
    }

    /**
     * The submit login button.
     */
    get loginButton() {
        return this.page.locator('input[value="Log In"]');
    }

    /**
     * The registration link.
     * WHY: Using getByRole is preferred as it mimics user interaction
     * and is less brittle than CSS selectors.
     */
    get registerLink() {
        return this.page.getByRole('link', { name: 'Register' });
    }

    /**
     * The error message container.
     */
    get errorMessage() {
        return this.page.locator('.error');
    }

    // ==================== Actions ====================

    /**
     * Executes the login sequence.
     * @param {string} username
     * @param {string} password
     * @returns {Promise<void>}
     */
    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    /**
     * Navigates to the Registration page.
     * @returns {Promise<void>}
     */
    async clickRegisterLink() {
        await this.registerLink.click();
    }

    /**
     * Retrieves the text from the error message container.
     * @returns {Promise<string>}
     */
    async getErrorMessageText() {
        await this.errorMessage.waitFor({ state: 'visible' });
        const text = await this.errorMessage.textContent();
        return text ? text.trim() : '';
    }
}
```

### Page Object Guidelines

1. **Locators as Getters**: Use get accessors for all locators to ensure they are evaluated lazily at the moment of interaction.
2. **Semantic Locators**: Prioritize semantic locators in this order:
    - page.getByRole() (Accessibility-based)
    - page.getByText()
    - page.getByLabel()
    - page.locator() (CSS/XPath - use as a last resort)
3. **Action Methods**: Methods should represent complete user flows (e.g., login) to keep test scripts declarative rather than imperative.
4. **Wait Logic**: Encapsulate specific wait logic (like waitFor({ state: 'visible' })) inside the POM action methods to make tests more stable.

### Registering Page Objects

Add new page objects to fixtures/pom/pomFixtures.js to make them available in your tests via dependency injection:

```javascript
import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

export const test = base.extend({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
});
```

---

## 📡 API Testing

### Making API Requests

The framework provides an apiRequest fixture that abstracts Playwright's low-level request logic. It automatically handles session management, header orchestration, and intelligent response parsing (JSON or Plain Text).

Always import test from the unified fixture hub:

```javascript
import { test, expect } from '../../../fixtures/indexFixtures.js';
import { UserResponseSchema } from '../../../fixtures/api/schemas/userSchema';

test('should retrieve user profile details via API', async ({ apiRequest }) => {
    const response = await apiRequest({
        method: 'GET',
        url: `/parabank/services/bank/login/john/demo`,
        baseUrl: process.env.APP_BASE_URL,
        headers: {
            Accept: 'application/json',
            Cookie: 'JSESSIONID=12345ABCDE', // Session captured from login setup
        },
    });

    expect(response.status).toBe(200);

    // Contract Validation
    const validation = UserResponseSchema.safeParse(response.body);
    expect(validation.success, 'API response does not match schema').toBe(true);
});
```

### API Request Options

| Option     | Type    | Description                                                                    |
| ---------- | ------- | ------------------------------------------------------------------------------ |
| method     | string  | HTTP verb: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'.                            |
| url        | string  | The endpoint path.                                                             |
| baseUrl    | string  | The base URL (e.g., process.env.APP_BASE_URL).                                 |
| body       | Object  | The request payload (JSON or Form-Data).                                       |
| headers    | Object  | Header key-value pairs (e.g., {'Accept': 'application/json'}).                 |
| isFormData | boolean | If true, body is sent as application/x-www-form-urlencoded. Defaults to false. |

### Schema Validation with Zod

We use Zod to enforce strict data contracts. This ensures that the backend responses conform to the expected structure, catching regressions in data types or missing fields immediately at the API boundary.

Define schemas in fixtures/api/schemas/:

```javascript
import { z } from 'zod';

// Example: Transaction Schema
export const TransactionSchema = z.object({
    id: z.number(),
    accountId: z.number(),
    type: z.enum(['Credit', 'Debit']),
    date: z.union([z.string(), z.number()]),
    amount: z.number(),
    description: z.string(),
});

export const TransactionListSchema = z.array(TransactionSchema);
```

Use the schemas in your tests to perform contract validation:

```javascript
const { body } = await apiRequest({ ... });

// safeParse returns an object with success (boolean) and data/error
const validation = TransactionListSchema.safeParse(body);

if (!validation.success) {
    console.error('Schema Mismatch:', validation.error.format());
}
expect(validation.success).toBe(true);
```

## 🔐 Session & Authentication Management

**How It Works**

Parabank utilizes stateful sessions via a JSESSIONID cookie. The framework manages this session lifecycle across API tests:

1. Authentication Step: Perform a POST request to the login endpoint using isFormData: true.
2. Cookie Capture: Use the extractCookie utility to isolate the JSESSIONID from the response headers.
3. Stateful Requests: Pass the captured cookie in the headers object for all subsequent REST calls.

**Capturing the Session**

The extractCookie helper is designed to handle CI environments where Playwright might merge multiple set-cookie headers into a single string.

```javascript
import { extractCookie } from '../../../utils/api-helper.js';

// Inside a test
const response = await apiRequest({
    method: 'POST',
    url: '/parabank/login.htm',
    isFormData: true,
    body: { username: 'myUser', password: 'myPassword' },
});

const sessionId = extractCookie(response.headers, 'JSESSIONID');
```

**Using the Session in API Tests**

Once the session ID is captured, pass it in the headers object for any protected REST endpoints:

```javascript
const response = await apiRequest({
    method: 'GET',
    url: '/parabank/services/bank/accounts/12345/transactions',
    headers: {
        Cookie: sessionId,
        Accept: 'application/json',
    },
});
```

---

## 🛠️ Coding Standards & Best Practices

This framework enforces strict code quality and formatting standards to ensure the codebase remains maintainable, readable, and free of common automation pitfalls.

### 🧩 Linting with ESLint

We use the modern ESLint Flat Config (eslint.config.mjs) to inherit standard JavaScript best practices and specialized Playwright rules.

| Role                | Benefit                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Playwright Plugin   | Enforces web-first assertions and handles asynchronous race conditions.                       |
| No Wait For Timeout | Errors out if page.waitForTimeout() is used, forcing stable, signal-based waiting.            |
| No Force Option     | Warns against using { force: true }, encouraging engineers to fix underlying UI state issues. |
| Valid Titles        | Ensures test.step() and test() blocks have descriptive, meaningful names for reporting.       |

**Commands:**

```bash
# Check for linting issues
npm run lint

# Automatically fix fixable issues
npm run lint:fix
```

### 🎨 Formatting with Prettier

Prettier is our "Single Source of Truth" for code style. It is integrated directly into ESLint, meaning formatting violations are flagged as linting errors.

**Core Standards (.prettierrc):**

- **Tabs**: 4 spaces for better visual hierarchy in complex Page Objects.
- **Quotes**: Single quotes for cleaner string declarations.
- **Semicolons**: Always enabled to prevent ASI (Automatic Semicolon Insertion) bugs.
- **Trailing Commas**: Enabled for cleaner git diffs.

**Commands:**

```bash
# Format the entire codebase
npm run format
```

### 🛡️ Pre-commit Hooks (Husky)

To maintain a "Green" repository, we utilize Husky and lint-staged. Every time a developer attempts to commit code, the following workflow is triggered automatically:

1. **Stage**: Only modified files are analyzed.
2. **Lint**: ESLint checks for logical errors and Playwright anti-patterns.
3. **Format**: Prettier automatically fixes styling issues.
4. **Verify**: If any error is unfixable, the commit is blocked, preventing "broken" code from reaching the remote repository.

**Implementation Logic**:
The .husky/pre-commit script executes npx lint-staged, ensuring that quality gates are passed before code is even pushed to a Pull Request.

---

## 🏛️ Coding Standards & Best Practices

This framework follows enterprise-grade engineering principles to ensure the automation suite is maintainable, scalable, and robust.

### 📜 JavaScript & Type Safety

While using JavaScript, we enforce type-safety and clarity through **JSDoc** and strict **ESLint** rules.

| Rule                  | Description                                                                     | Example                              |
| :-------------------- | :------------------------------------------------------------------------------ | :----------------------------------- |
| **JSDoc Annotations** | Document all methods, parameters, and return types for better IDE Intellisense. | `/** @param {string} amount */`      |
| **Avoid `any` Logic** | Ensure data structures are known. Use **Zod** for API response validation.      | `UserResponseSchema.safeParse(body)` |
| **ES6+ Features**     | Leverage Optional Chaining and Nullish Coalescing for cleaner code.             | `userData.address?.street ?? 'N/A'`  |
| **Strict Linting**    | No `await` inside loops (where possible) and mandatory handled promises.        | `eslint.config.mjs`                  |

---

### 🏷️ Naming Conventions

Standardized naming ensures the project structure is predictable.

| Type                       | Convention           | Example                             |
| :------------------------- | :------------------- | :---------------------------------- |
| **Variables / Properties** | `camelCase`          | `checkingAccountId`                 |
| **Functions / Methods**    | `camelCase`          | `navigateViaLeftMenu()`             |
| **Classes**                | `PascalCase`         | `TransferFundsPage`                 |
| **Files (Classes/POMs)**   | `PascalCase.js`      | `RegisterPage.js`                   |
| **Files (Specs/Tests)**    | `kebab-case.spec.js` | `user-journey.spec.js`              |
| **Test Tags**              | `@lowercase`         | `@smoke`, `@regression`, `@nightly` |

### 🏗️ Page Object Model (POM) Guidelines

1.  **Locators as Getters**: All locators must be defined as `get` accessors. This ensures they are evaluated lazily at the moment of interaction.
    ```javascript
    get loginButton() { return this.page.locator('input[value="Log In"]'); }
    ```
2.  **Semantic Locators**: Prioritize `getByRole`, `getByLabel`, and `getByPlaceholder` to ensure tests are accessibility-aware. Use CSS/ID selectors (`#customer\\.firstName`) only as a last resort.
3.  **Encapsulated Actions**: Methods should represent logical user flows (e.g., `login(user, pass)`) rather than individual clicks.
4.  **Private Helpers**: Use the `_` prefix for internal utility methods (e.g., `_getTrimmedText()`) to keep the public API clean.
5.  **Wait for Stability**: Utilize internal helpers like `_clickWithRetry()` or `toPass()` inside POMs for elements known to be flaky due to asynchronous re-rendering.

### 🧪 Test Authoring Standards

1.  **Descriptive Step Documentation**: Every test must use `test.step()` with a **GIVEN / WHEN / THEN** structure.
2.  **Atomic Independence**: Each test should ideally be able to run in isolation. Use **Fixtures** (e.g., `userCreationFixture`) to set up state instead of relying on the outcome of a previous test.
3.  **Serial Execution**: Use `test.describe.serial` only when a strict sequence of stateful changes is required (e.g., a specific User Journey where funds move across multiple steps).
4.  **Web-First Assertions**: Never use `manual` timeouts. Always use auto-retrying assertions:
    - ✅ `await expect(locator).toBeVisible()`
    - ❌ `await page.waitForTimeout(5000); expect(await locator.isVisible()).toBe(true)`
5.  **Tagging Strategy**:
    - `@smoke`: Critical path validation (Login, Transfer).
    - `@regression`: Full feature coverage.
    - `@journey`: End-to-end multi-step flows.
    - `@api`: Specialized ledger and contract validation.

### 🔗 API & Contract Testing Best Practices

1.  **Schema Enforcement**: Every API response must be validated against a **Zod Schema**. This prevents "Silent Failures" where a test passes but the data structure has changed.
2.  **Session Isolation**: Use the `extractCookie` utility to isolate `JSESSIONID`. Ensure cookies are explicitly passed in headers to simulate real browser behavior in REST calls.
3.  **Intelligent Parsing**: API helpers must handle both JSON and Plain Text gracefully, as legacy systems like Parabank often return confirmation strings instead of JSON objects.
4.  **Fail-Fast Config**: Use strict environment variable checking. If `APP_BASE_URL` is missing, the framework will `throw new Error` immediately rather than timing out.

### 🛠️ Quality Gatekeeping

- **Pre-commit Hooks**: Husky ensures that no code with linting errors or formatting violations reaches the repository.
- **Fail-Fast Logic**: We prioritize immediate failures over long timeouts. If a configuration or a required fixture setup fails, the test stops immediately to save CI resources.
- **Dry-Run Analysis**: Use `test:ui` or `test:debug` to visually verify locators before committing new Page Objects.

---

## 🧪 Test Guidelines

The framework emphasizes readability, stability, and high-quality reporting. Follow these rules when authoring new test specs.

### 1. Descriptive Naming

Test names should clearly describe the expected behavior and include the Test Case (TC) ID for easy tracking.

- **Good**: `test('TC-01a: should register a new user successfully', ...)`
- **Bad**: `test('registration works', ...)`

### 2. Categorization with Test Tags

Use Playwright tags to allow for selective execution via the `grep` command.

- `@smoke`: Critical business paths (Login, basic navigation).
- `@regression`: Full feature validation.
- `@journey`: Complex, multi-page End-to-End flows.
- `@nightly`: Heavy-duty tests scheduled for the nightly suite.
- `@api`: Tests focused on REST endpoints and ledger validation.

### 3. Readability with Test Steps

Wrap logic inside `test.step()` to provide a clear "Given/When/Then" structure. This directly translates into readable logs in the Allure and HTML reports.

```javascript
await test.step('GIVEN the user navigates to the registration page', async () => {
    await loginPage.clickRegisterLink();
});

await test.step('WHEN the user submits valid and unique registration details', async () => {
    await registerPage.registerNewUser(newUserData);
});

await test.step('THEN the account should be created successfully', async () => {
    await expect(registerPage.welcomeMessage).toBeVisible();
});
```

### 4. Test Independence vs. Serial Execution

- **Independence (Default)**: Tests should be atomic and independent. Use **Fixtures** (like `userCreationFixture`) to set up the necessary state instead of relying on a previous test.
- **Serial (`test.describe.serial`)**: Use this sparingly, only when the suite represents a linear "journey" where each step modifies a persistent database state that the next step requires.

### 5. Web-First Assertions

Always use auto-retrying assertions. Avoid checking states manually with `if` statements.

- **Do**: `await expect(locator).toBeVisible();` or `await expect(locator).toHaveText('Welcome');`
- **Don't**: `const isVisible = await locator.isVisible(); expect(isVisible).toBe(true);`

### 6. Stability (No Hardcoded Timeouts)

- **Auto-waiting**: Rely on Playwright's built-in wait logic for actions like `click()` and `fill()`.
- **Retry Logic**: For legacy systems like Parabank that experience database lag, use `toPass()` for transient UI re-rendering issues instead of `page.waitForTimeout()`.

```javascript
// ✅ Correct way to handle flaky asynchronous rendering
await expect(async () => {
    await billPayPage.submitPayment();
    await expect(billPayPage.successMessage).toBeVisible();
}).toPass({ timeout: 10000 });
```

---
