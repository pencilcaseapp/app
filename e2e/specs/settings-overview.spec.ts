import { expect, test } from '../fixtures/settings/test';
import { OtpPage } from '../fixtures/auth/otp-page';
import { SignInPage } from '../fixtures/auth/sign-in-page';

test.describe('the account settings', () => {
  test('save the name and the newsletter preference', async ({ userA }) => {
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

test.describe('deleting the account', () => {
  test('signs out and restores everything on the next sign in', async ({
    userA,
  }) => {
    const { page, settings } = userA;
    await userA.document.create();
    await userA.document.waitForSynced();
    await userA.document.typeLines('Keep me');
    await settings.open();

    await settings.deleteAccount();

    await expect(page).toHaveURL(/\/signin\?restoreUntil=/);
    await expect(page.getByText('Account scheduled for deletion'))
      .toBeVisible();

    await new SignInPage(page).requestCode(userA.email!);
    await new OtpPage(page).enterCode();

    await expect(
      page.getByText('Welcome back, account restored'),
    ).toBeVisible();
    await expect(userA.document.editor).toContainText('Keep me');
  });
});
