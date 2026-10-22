import { randomUUID } from 'node:crypto';
import { expect, test } from '../fixtures/test';

test.describe('signing in as a test account', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('signs in with the fixed code', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('E-Mail')
      .fill(`e2e-${randomUUID()}@pencilcase.test`);
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForURL('**/otp**');
    await page.getByLabel('One-Time Password').fill('000000');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForURL('**/onboarding**');
    await page.getByRole('button', { name: 'Skip it' }).click();

    await page.waitForURL('**/doc/**');
  });
});

test.describe('signing out', () => {
  test('ends the session and sends the user back to sign in',
    async ({ userA }) => {
      const { page } = userA;
      await userA.createDocument();

      await page.getByRole('link', { name: 'Settings' }).click();
      await page.getByRole('link', { name: 'Logout' }).click();

      await page.waitForURL('**/signin**');
      await expect(page.getByLabel('E-Mail')).toBeVisible();

      // The session is gone server side, not just in this tab.
      await page.goto('/');
      await page.waitForURL('**/signin**');
    });
});
