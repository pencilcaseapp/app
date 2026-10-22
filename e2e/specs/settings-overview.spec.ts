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
});
