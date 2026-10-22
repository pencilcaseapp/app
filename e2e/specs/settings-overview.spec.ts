import { expect, test } from '../fixtures/settings/test';

test.describe('the account settings', () => {
  test('save the name and the newsletter preference',
    async ({ userA }) => {
      const { settings } = userA;
      await userA.document.create();
      await settings.open();

      await settings.nameField.fill('Ada Lovelace');
      await settings.newsletterCheckbox.check();
      await settings.saveAccount();

      await userA.page.reload();
      await expect(settings.nameField).toHaveValue('Ada Lovelace');
      await expect(settings.newsletterCheckbox).toBeChecked();
    });

  test('keeps the document scroll position', async ({ userA }) => {
    const { page, settings } = userA;
    await userA.document.create();

    // A document long enough for the page itself to scroll.
    await userA.document.editor.click();
    await page.keyboard.type('A long document');
    await page.keyboard.press('Enter');
    await page.keyboard.insertText(
      Array.from({ length: 60 }, (_, line) => `Line ${line}`).join('\n'),
    );
    await expect(userA.document.editor).toContainText('Line 59');

    await page.evaluate(() => window.scrollTo(0, 600));
    const scrollY = () => page.evaluate(() => window.scrollY);
    await expect.poll(scrollY).toBe(600);

    await settings.open();
    await expect.poll(scrollY).toBe(600);

    await settings.openSection('Support');
    await expect.poll(scrollY).toBe(600);

    await settings.close();
    await expect.poll(scrollY).toBe(600);
  });
});
