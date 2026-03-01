# 🏦 ParaBank Playwright Automation Framework

A robust, enterprise-grade test automation framework built with **Playwright (JavaScript)** following the **Page Object Model (POM)** pattern. This project provides comprehensive **End-to-End (E2E) UI coverage** and **REST API validation** for the ParaBank demo banking application. The framework implements advanced concepts including **custom fixtures**, **dependency injection**, **contract testing with Zod**, **dynamic test data generation**, and **automated CI/CD reporting** with Allure and GitHub Pages.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Environment Variables](#-environment-variables)
- [Running Tests](#-running-tests)
- [Writing Tests](#-writing-tests)
- [Page Object Model](#-page-object-model)
- [API Testing](#-api-testing)
- [Fixtures](#-fixtures)
- [Code Quality & Standards](#-code-quality--standards)
- [CI/CD Integration](#-cicd-integration)
- [Reporting](#-reporting)
- [Debugging](#-debugging)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **Hybrid Testing Framework** – Supports both UI (E2E) and API testing within a single unified test suite
- **Page Object Model (POM)** – Clean separation of test logic from page interactions with lazy-loaded fixtures
- **Custom Fixtures** – Reusable test setup with dependency injection and automatic teardown
- **Data Generation** – Realistic, unique test data using `@faker-js/faker` with timestamp guarantees
- **Schema Validation** – API contract testing with **Zod** to enforce data integrity at the network boundary
- **Allure Reporting** – Interactive, visually rich test reports with history, trends, and categorizations
- **GitHub Pages Deployment** – Automatic report publishing for stakeholder visibility
- **Tag-Based Execution** – Run tests by `@smoke`, `@regression`, `@nightly`, `@journey` for flexible pipeline integration
- **Cross-Browser Testing** – Chromium, Firefox, WebKit with consistent viewport configuration
- **Parallel Execution** – Optimized for speed in CI environments with configurable worker pools
- **Flake Resistance** – Built-in retry strategies, `toPass()` assertions, and wait mechanisms
- **Multi-Environment Support** – Configurable via `.env` and GitHub Variables with manual override capabilities
- **Credential Management** – Automatic saving and retrieval of test user credentials for debugging and reuse
- **Session Management** – Cookie extraction and reuse for stateful API testing
- **CI/CD Integration** – Two production-ready GitHub Actions workflows with detailed step documentation

---

## 🛠 Tech Stack

| Tool/Library | Purpose |
|--------------|---------|
| [Playwright](https://playwright.dev/) | Browser automation, API testing, network interception |
| [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) | Primary programming language (ES6+ modules) |
| [Allure Report](https://qameta.io/allure-report/) | Test reporting with history, graphs, and trends |
| [Zod](https://zod.dev/) | Runtime schema validation for API contract testing |
| [Faker](https://fakerjs.dev/) | Realistic, locale-aware test data generation |
| [Dotenv](https://github.com/motdotla/dotenv) | Environment variable management across environments |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipelines with matrix testing and artifact management |

---

## ✅ Prerequisites

- **Node.js** (v20 or higher)
- **npm** (v9 or higher)
- **Git** (for cloning and version control)
- **Playwright Browsers** (installed automatically via `npx playwright install`)
- **Java Runtime** (optional, for local Allure CLI if not using `npx`)

---

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/playwright-javascript.git
   cd playwright-javascript

2. **Install dependencies**
   ```bash
   npm install --force --omit=optional

3. **Install Playwright browsers**
   ```bash
   npx playwright install --with-deps chromium

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update APP_BASE_URL with your target environment (e.g., https://parabank.parasoft.com)

## Project Structure
```
root/
├── .github/
│   └── workflows/
│       ├── nightly-tests.yml               # Scheduled nightly regression
│       └── smoke-tests.yml                 # PR/push validation
├── .vscode/                                # IDE settings
├── allure-report/                          # Generated Allure HTML
├── allure-results/                         # Raw Allure test results
├── fixtures/
│   ├── api/
│   │   ├── schemas/
│   │   │   ├── transactionSchema.js        # Zod schema for transactions
│   │   │   └── userSchema.js               # Zod schema for users
│   │   └── apiFixtures.js                  # API request fixture
│   └── pom/
│       ├── customFixtures.js               # Business-logic fixtures
│       ├── pomFixtures.js                  # Page object fixtures
│       └── indexFixtures.js                # Unified fixture export
├── node_modules/
├── pages/                                  # Page Object Models
│   ├── AccountActivityPage.js
│   ├── AccountsOverviewPage.js
│   ├── BasePage.js
│   ├── BillPayPage.js
│   ├── HomePage.js
│   ├── LoginPage.js
│   ├── OpenAccountPage.js
│   ├── ProfilePage.js
│   ├── RegisterPage.js
│   └── TransferFundsPage.js
├── playwright-report/                      # Playwright's native report
├── test-results/                           # Artifacts (traces, videos)
├── tests/
│   ├── api/
│   │   └── journeys/
│   │       └── user-journey-api.spec.js    # API-only journey
│   ├── e2e/
│   │   ├── features/
│   │   ├── accounts/
│   │   │   ├── bill-pay.spec.js
│   │   │   ├── open-account.spec.js
│   │   │   └── transfer-funds.spec.js
│   │   └── auth/
│   │       ├── login.spec.js
│   │       └── register.spec.js
│   └── journeys/
│       └── user-journey.spec.js            # Full UI + API journey
├── utils/
│   ├── api-helper.js                       # Centralized HTTP client
│   ├── credentials.json                    # Persisted test users
│   └── helpers.js                          # Data generators & file utils
├── .env                                    # Local environment config
├── .gitignore
├── package-lock.json
├── package.json
├── playwright.config.js                    # Playwright master config
└── README.md
```

---

## 🔧 Configuration

### Playwright Configuration

The `playwright.config.js` file establishes a predictable runtime environment across local and CI environments:

| Setting            | Local                   | CI                |
| ------------------ | ----------------------- | ----------------- |
| Parallel execution | Enabled (fullyParallel)      | Enabled (fullyParallel)   |
| Workers            | Auto (All available cores)   | 1 (Resource Management)   |
| Retries            | 0                            | 2 (Flakiness Mitigation)  |
| Headless Mode      | True                         | True                      |
| Reporter           | List, HTML, Allure           | List, HTML, Allure        |
| Traces             | retain-on-failure            | retain-on-failure         |
| Screenshots        | only-on-failure              | only-on-failure           |
| Videos             | Retain on failure            | Retain on failure         |

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

| Task | Command |
| ------------------ | ----------------------- | 
| Clean Results	| npm run allure:clean
| Generate Report	| npm run allure:generate
| Open Report	| npm run allure:open
| Run & Report (All)	| npm run allure
| Run & Report (Smoke)	| npm run smoke

## 📦 Dependencies & Tools

### Core Framework
- Playwright (^1.52.0): The core automation engine.
- Zod (^4.3.6): TypeScript-first schema declaration and validation for API contract testing.

### Development Utilities
- Faker (^9.8.0): Generates high-quality, randomized test data for user identities and addresses.
- Dotenv (^17.2.4): Manages environment-specific variables.
- Allure Playwright: Adapter for generating interactive test reports.

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

    test('should perform a critical business action', { tag: '@smoke' }, async ({ loginPage, homePage }) => {
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
    });
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
    { user: 'wrong_user', pass: 'password', error: 'The username and password could not be verified.' },
    { user: 'john', pass: 'wrong_pass', error: 'The username and password could not be verified.' }
];

for (const data of invalidCredentials) {
    test(`should show error for user: ${data.user}`, { tag: '@regression' }, async ({ loginPage }) => {
        await loginPage.login(data.user, data.pass);
        await expect(loginPage.errorMessage).toHaveText(data.error);
    });
}
```

## Page Object Model

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