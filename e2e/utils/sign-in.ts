import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';

/** Any address at this domain is a test account in dev and test. */
const TEST_ACCOUNT_DOMAIN = 'pencilcase.test';

/** The fixed code of the test accounts, see `config.testAccounts`. */
const TEST_ACCOUNT_CODE = '000000';

/** A test account nobody has used before. */
export function createTestAccountEmail(name: string) {
  return `e2e-${name}-${randomUUID()}@${TEST_ACCOUNT_DOMAIN}`;
}

/**
 * Signs a test account in through the real form and skips the onboarding.
 * Both return to the sign-in page rather than the start page, which would
 * create a document and leave it in the user's sidebar.
 */
export async function signIn(page: Page, email: string) {
  await page.goto('/signin?returnUrl=/signin');
  await page.getByLabel('E-Mail').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('**/otp/**');
  await page.getByLabel('One-Time Password').fill(TEST_ACCOUNT_CODE);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('**/onboarding**');
  await page.getByRole('button', { name: 'Skip it' }).click();
  await page.waitForURL('**/signin**');
}
