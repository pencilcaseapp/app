import { test as base, type Browser } from '@playwright/test';
import { createTestAccountEmail } from '../utils/test-accounts';
import { AppUser } from './app-user';
import { Visitor } from './visitor';

interface AppUserFixtures {
  /** The shared storage-state user signed in by `auth.setup.ts`. */
  user: AppUser;
  /** A user created fresh for this test, in a context of their own. */
  userA: AppUser;
  /** A second fresh user, isolated from `userA`. */
  userB: AppUser;
  /** Somebody without a session, in a context of their own. */
  visitor: Visitor;
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
  visitor: async ({ browser, baseURL }, provide) => {
    // Without an explicit empty state the context would load the
    // project's `storageState` and start signed in as `user`.
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });

    await provide(new Visitor(await context.newPage()));
    await context.close();
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
  await new Visitor(page).signIn(email);

  await provide(new AppUser(page, email));
  await context.close();
}
