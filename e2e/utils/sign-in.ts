import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';

/** Any address at this domain is a test account in dev and test. */
const TEST_ACCOUNT_DOMAIN = 'pencilcase.test';

/** The fixed code of the test accounts, see `config.testAccounts`. */
export const TEST_ACCOUNT_CODE = '000000';

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
  await requestCode(page, email);
  await enterCode(page);

  await page.waitForURL('**/onboarding**');
  await page.getByRole('button', { name: 'Skip it' }).click();
  await page.waitForURL('**/signin**');
}

/** Asks for a code on the sign-in page the browser is on. */
export async function requestCode(page: Page, email: string) {
  await waitForHydration(page);
  await page.getByLabel('E-Mail').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/otp/**');
}

/** Submits a code on the code page the browser is on. */
export async function enterCode(page: Page, code = TEST_ACCOUNT_CODE) {
  await waitForHydration(page);
  const field = page.getByLabel('One-Time Password');

  // The field keeps a rejected code, and filling over it only replaces
  // the last digit.
  await field.clear();
  await field.fill(code);
  await page.getByRole('button', { name: 'Continue' }).click();
}

/**
 * Hydration resets the form fields to their defaults, so whatever was
 * typed into the server-rendered page before it gets lost. React marks
 * the elements it has taken over with its fiber key.
 */
async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const form = document.querySelector('form');

    return !!form && Object.keys(form)
      .some(key => key.startsWith('__reactFiber'));
  });
}
