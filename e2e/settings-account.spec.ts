import { expect, test } from './fixtures';

test.describe('the account settings', () => {
  test('save the name and the newsletter preference',
    async ({ userA }) => {
      const { page } = userA;
      await userA.createDocument();

      // The sidebar skips the menu page on a desktop viewport.
      await page.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/\/settings\/account$/);

      await page.getByLabel('Name').fill('Ada Lovelace');
      await page.getByLabel('Subscribe to Newsletter').check();
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Your account has been updated'))
        .toBeVisible();

      await page.reload();
      await expect(page.getByLabel('Name')).toHaveValue('Ada Lovelace');
      await expect(page.getByLabel('Subscribe to Newsletter')).toBeChecked();
    });
});
