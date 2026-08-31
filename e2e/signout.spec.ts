import { expect, test } from './fixtures';

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
