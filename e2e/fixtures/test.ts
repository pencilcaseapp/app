import { randomUUID } from 'node:crypto';
import { expect, test as base, type Browser } from '@playwright/test';
import { AppUser } from './app-user';

/**
 * Matches the default in `app/config/dev.ts`; set E2E_API_TOKEN to
 * override both sides at once.
 */
const apiToken = process.env.E2E_API_TOKEN ?? 'e2e-t0k3n';

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

export { expect };

/**
 * Signs a brand new user in through `POST /e2e/auth` in a browser context
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
  const email = `e2e-${name}-${randomUUID()}@pencilcase.app`;
  const response = await context.request.post('/e2e/auth', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    data: {
      email,
    },
  });

  expect(response.ok()).toBeTruthy();

  await provide(new AppUser(await context.newPage(), email));
  await context.close();
}
