/**
 * Custom Business Logic Fixtures
 * 
 * WHY: These fixtures encapsulate complex, multi-page setup workflows. 
 * This follows the Single Responsibility Principle (SRP) by moving setup 
 * logic out of the test files and into reusable components. Tests can 
 * simply request a 'savingsAccount' without knowing how it's created.
 */

import { test as pomFixtures } from './pomFixtures';
import { generateRandomUser, saveCredentials } from '../../utils/helpers';

export const test = pomFixtures.extend({

  /**
   * userCreationFixture
   * 
   * WHY: Every journey in Parabank requires a unique user. This fixture 
   * automates the registration process so that regression tests always 
   * operate on a fresh, isolated data set.
   */
  userCreationFixture: async ({ loginPage, registerPage, homePage }, use) => {
    const newIdentity = generateRandomUser();

    // Perform registration workflow
    await loginPage.clickRegisterLink();
    await registerPage.registerNewUser(newIdentity);

    /**
     * WHY: We persist credentials to a local JSON file. This acts as an 
     * 'audit trail' and allows developers to manually inspect the 
     * account if a test fails during the CI process.
     */
    await saveCredentials(
      newIdentity.username,
      newIdentity.password,
      newIdentity.firstName,
      newIdentity.lastName,
      newIdentity.address.street,
      newIdentity.address.city,
      newIdentity.address.state,
      newIdentity.address.zipCode,
      newIdentity.phoneNumber,
      newIdentity.ssn
    );

    // Navigate to discover the account created by default upon registration
    await homePage.navigateViaLeftMenu('Accounts Overview');
    const checkingAccountId = await homePage.getFirstAccountId();

    /**
     * WHY: We logout to ensure that the test utilizing this fixture starts 
     * from the login page, allowing us to verify the full authentication 
     * flow if needed, and to prevent session leakage between fixtures.
     */
    await homePage.clickLogout();

    // Expose the structured user data to the test
    await use({
      ...newIdentity,
      ...newIdentity.address, // Flattening address for easier access in tests
      checkingAccountId
    });
  },

  /**
   * savingsAccountCreationFixture
   * 
   * WHY: Many banking scenarios (Transfers, Bill Pay) require at least two 
   * accounts. This fixture provides a second account (Savings) by building 
   * on top of the userCreationFixture.
   */
  savingsAccountCreationFixture: async ({ userCreationFixture, loginPage, homePage, openAccountPage }, use) => {
    
    // Re-authenticate to simulate a realistic user session start
    await loginPage.login(userCreationFixture.username, userCreationFixture.password);

    // Perform the "Open New Account" business process
    await homePage.navigateViaLeftMenu('Open New Account');
    await openAccountPage.openAccount('SAVINGS');

    const accountId = await openAccountPage.getNewAccountId();

    /**
     * WHY: We validate the ID is captured before 'using' the fixture. 
     * This ensures the test fails at the setup stage with a clear 
     * indication if the account service is down.
     */
    if (!accountId) {
      throw new Error('Failed to capture New Savings Account ID during fixture setup.');
    }

    await use({
      accountId: accountId
    });
  }

});

export const expect = test.expect;