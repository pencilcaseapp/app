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

  test('keeps the document scroll position', async ({ userA }) => {
    const { page } = userA;
    await userA.createDocument();

    // A document long enough for the page itself to scroll.
    await userA.editor.click();
    await page.keyboard.type('A long document');
    await page.keyboard.press('Enter');
    await page.keyboard.insertText(
      Array.from({ length: 60 }, (_, line) => `Line ${line}`).join('\n'),
    );
    await expect(userA.editor).toContainText('Line 59');

    await page.evaluate(() => window.scrollTo(0, 600));
    const scrollY = () => page.evaluate(() => window.scrollY);
    await expect.poll(scrollY).toBe(600);

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings\/account$/);
    await expect.poll(scrollY).toBe(600);

    await page.getByRole('link', { name: 'Support' }).click();
    await expect(page).toHaveURL(/\/settings\/support$/);
    await expect.poll(scrollY).toBe(600);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page).not.toHaveURL(/\/settings/);
    await expect.poll(scrollY).toBe(600);
  });
});
