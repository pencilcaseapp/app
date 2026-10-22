import { expect, test } from '../fixtures/auth/test';
import { createTestAccountEmail } from '../utils/test-accounts';

const WRONG_CODE = '111111';

test.describe('signing up', () => {
  test('onboards a new account and opens its first document',
    async ({ page, signInPage, otpPage, onboardingPage, documentPage }) => {
      await page.goto('/');
      await page.waitForURL('**/signin**');
      await signInPage.requestCode(createTestAccountEmail('signup'));
      await otpPage.enterCode();
      await onboardingPage.complete({
        name: 'Ada Lovelace',
        newsletter: true,
      });

      await page.waitForURL('**/doc/**');
      await documentPage.waitForSynced();

      // The onboarding is only ever shown once.
      await page.goto('/onboarding');
      await expect(page).not.toHaveURL(/\/onboarding/);

      await page.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/\/settings\/account$/);
      await expect(page.getByLabel('Name')).toHaveValue('Ada Lovelace');
      await expect(page.getByLabel('Subscribe to Newsletter')).toBeChecked();
    });

  test('brings a visitor of a shared document back to it',
    async ({
      page,
      signInPage,
      otpPage,
      onboardingPage,
      documentPage,
      userA,
    }) => {
      const url = await userA.document.create();
      await userA.document.typeLines('Shared plans', 'Read me after signing up');
      await userA.sharePanel.share();

      await page.goto(url);
      await page.getByRole('link', { name: 'Sign In' }).click();
      await page.waitForURL('**/signin**');
      await signInPage.requestCode(createTestAccountEmail('visitor'));
      await otpPage.enterCode();
      await onboardingPage.skip();

      await page.waitForURL(url);
      await expect(documentPage.content)
        .toContainText('Read me after signing up');
      await expect(page.getByRole('link', { name: 'Sign In' })).toHaveCount(0);
    });
});

test.describe('signing in', () => {
  test('sends a returning account back where it was, past the onboarding',
    async ({ page, signInPage, otpPage, userA, documentPage }) => {
      const url = await userA.document.create();
      await userA.document.typeLines('My private notes');

      // Same account, signed out: the private document asks for a session.
      await page.goto(url);
      await page.waitForURL('**/signin**');
      await signInPage.requestCode(userA.email!);
      await otpPage.enterCode();

      await page.waitForURL(url);
      await expect(documentPage.content)
        .toContainText('My private notes');
    });

  test('never returns to another site',
    async ({ page, signInPage, otpPage, onboardingPage, baseURL }) => {
      await signInPage.goto('//example.com/phish');
      await signInPage.requestCode(createTestAccountEmail('redirect'));
      await otpPage.enterCode();
      await onboardingPage.skip();

      await page.waitForURL('**/doc/**');
      expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
    });

  test('expires the code after five wrong attempts',
    async ({ page, signInPage, otpPage }) => {
      await signInPage.goto();
      await signInPage.requestCode(createTestAccountEmail('guessing'));
      const otpUrl = page.url();

      for (let attempt = 1; attempt < 5; attempt++) {
        await otpPage.enterCode(WRONG_CODE);
        await expect(otpPage.invalidCodeError).toBeVisible();
      }

      await otpPage.enterCode(WRONG_CODE);
      await page.waitForURL('**/signin**');
      await expect(signInPage.expiredNotice).toBeVisible();

      // The right code is no use any more either.
      await page.goto(otpUrl);
      await page.waitForURL('**/signin**');
    });

  test('allows three codes per address in fifteen minutes',
    async ({ page, signInPage }) => {
      const email = createTestAccountEmail('rate-limit');

      for (let request = 0; request < 3; request++) {
        await signInPage.goto();
        await signInPage.requestCode(email);
      }

      await signInPage.goto();
      await signInPage.submitEmail(email);
      await expect(signInPage.tooManyRequestsError).toBeVisible();
      await expect(page).toHaveURL(/\/signin/);

      // Another address is not held up by it.
      await signInPage.requestCode(createTestAccountEmail('rate-limit-other'));
    });
});

test.describe('signing out', () => {
  test('ends the session and sends the user back to sign in',
    async ({ userA }) => {
      const { page } = userA;
      await userA.document.create();

      await page.getByRole('link', { name: 'Settings' }).click();
      await page.getByRole('link', { name: 'Logout' }).click();

      await page.waitForURL('**/signin**');
      await expect(page.getByLabel('E-Mail')).toBeVisible();

      // The session is gone server side, not just in this tab.
      await page.goto('/');
      await page.waitForURL('**/signin**');
    });
});
