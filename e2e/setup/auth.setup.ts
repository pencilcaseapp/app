import { expect, test as setup } from '@playwright/test';

/**
 * Matches the default in `app/config/dev.ts`; set E2E_API_TOKEN to
 * override both sides at once.
 */
const apiToken = process.env.E2E_API_TOKEN ?? 'e2e-t0k3n';

setup('sign in through /e2e/auth', async ({ request }) => {
  const response = await request.post('/e2e/auth', {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    data: {
      email: 'e2e@pencilcase.app',
    },
  });

  expect(response.ok()).toBeTruthy();

  await request.storageState({ path: 'e2e/.auth/user.json' });
});
