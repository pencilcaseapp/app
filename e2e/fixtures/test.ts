import { test as base, type Browser } from '@playwright/test';
import { createTestAccountEmail, signIn } from '../utils/sign-in';
import { AppUser } from './app-user';

interface AppUserFixtures {
  /** The shared storage-state user signed in by `auth.setup.ts`. */
  user: AppUser;
  /** A user created fresh for this test, in a context of their own. */
  userA: AppUser;
  /** A second fresh user, isolated from `userA`. */
  userB: AppUser;
}

// Playwright calls the second fixture parameter `use`, which the React
// hooks lint rule reads as a hook — `provide` is the same callback.
export const test = base.extend<AppUserFixtures>({
  user: async ({ page }, provide) => {
    await provide(new AppUser(page));
  },
  userA: async ({ browser, baseURL }, provide) => {
    await provideFreshUser(browser, baseURL, 'a', provide);
  },
  userB: async ({ browser, baseURL }, provide) => {
    await provideFreshUser(browser, baseURL, 'b', provide);
  },
});

export { expect } from '@playwright/test';

/**
 * Signs a brand new test account in through the form in a browser context
 * of their own, so a test can put several users into the same document
 * without them sharing cookies. A fresh user also keeps the sidebar
 * assertions independent of documents left behind by earlier runs.
 */
async function provideFreshUser(
  browser: Browser,
  baseURL: string | undefined,
  name: string,
  provide: (user: AppUser) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const email = createTestAccountEmail(name);
  await signIn(page, email);

  await provide(new AppUser(page, email));
  await context.close();
}
