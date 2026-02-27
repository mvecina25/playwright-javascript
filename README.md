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
