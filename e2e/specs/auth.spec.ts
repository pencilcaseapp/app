import { AppUser } from '../fixtures/app-user';
import { expect, test } from '../fixtures/auth/test';
import { createTestAccountEmail } from '../utils/test-accounts';

const WRONG_CODE = '111111';

test.describe('signing up', () => {
  test('onboards a new account and opens its first document',
    async ({ page, signInPage, otpPage, onboardingPage }) => {
      await page.goto('/');
      await page.waitForURL('**/signin**');
      await signInPage.requestCode(createTestAccountEmail('signup'));
      await otpPage.enterCode();
      await onboardingPage.complete({
        name: 'Ada Lovelace',
        newsletter: true,
      });

      await page.waitForURL('**/doc/**');
      await new AppUser(page).waitForEditorSynced();

      // The onboarding is only ever shown once.
      await page.goto('/onboarding');
      await expect(page).not.toHaveURL(/\/onboarding/);

      await page.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/\/settings\/account$/);
      await expect(page.getByLabel('Name')).toHaveValue('Ada Lovelace');
      await expect(page.getByLabel('Subscribe to Newsletter')).toBeChecked();
    });

  test('brings a visitor of a shared document back to it',
    async ({ page, signInPage, otpPage, onboardingPage, userA }) => {
      const url = await userA.createDocument();
      await userA.typeLines('Shared plans', 'Read me after signing up');
      await userA.shareDocument();

      await page.goto(url);
      await page.getByRole('link', { name: 'Sign In' }).click();
      await page.waitForURL('**/signin**');
      await signInPage.requestCode(createTestAccountEmail('visitor'));
      await otpPage.enterCode();
      await onboardingPage.skip();

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('Read me after signing up');
      await expect(page.getByRole('link', { name: 'Sign In' })).toHaveCount(0);
    });
});

test.describe('signing in', () => {
  test('sends a returning account back where it was, past the onboarding',
    async ({ page, signInPage, otpPage, userA }) => {
      const url = await userA.createDocument();
      await userA.typeLines('My private notes');

      // Same account, signed out: the private document asks for a session.
      await page.goto(url);
      await page.waitForURL('**/signin**');
      await signInPage.requestCode(userA.email!);
      await otpPage.enterCode();

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('My private notes');
    });

  test('signs in to the same account whatever the case of the address',
    async ({ page, signInPage, otpPage, userA }) => {
      const url = await userA.createDocument();
      await userA.typeLines('Case insensitive');

      await signInPage.goto(url);
      await signInPage.requestCode(userA.email!.toUpperCase());
      await otpPage.enterCode();

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('Case insensitive');
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

  test('turns down a wrong code and still takes the right one',
    async ({ page, signInPage, otpPage }) => {
      await signInPage.goto();
      await signInPage.requestCode(createTestAccountEmail('wrong-code'));

      await otpPage.enterCode(WRONG_CODE);
      await expect(otpPage.invalidCodeError).toBeVisible();
      await expect(page).toHaveURL(/\/otp\//);

      await otpPage.enterCode();
      await page.waitForURL('**/onboarding**');
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

  test('lets the address be corrected on the code page',
    async ({ page, signInPage, otpPage }) => {
      const typo = createTestAccountEmail('typo');
      const email = createTestAccountEmail('fixed');

      await signInPage.goto();
      await signInPage.requestCode(typo);
      await expect(page.getByText(typo)).toBeVisible();

      await otpPage.editAddressLink.click();
      await page.waitForURL('**/signin**');
      await expect(signInPage.emailField).toHaveValue(typo);

      await signInPage.requestCode(email);
      await expect(page.getByText(email)).toBeVisible();
      await otpPage.enterCode();
      await page.waitForURL('**/onboarding**');
    });

  test('sends a new code and retires the old one',
    async ({ page, signInPage, otpPage }) => {
      await signInPage.goto();
      await signInPage.requestCode(createTestAccountEmail('resend'));
      const firstOtpUrl = page.url();

      await otpPage.resendButton.click();
      await page.waitForURL(url => url.href !== firstOtpUrl);
      await expect(page).toHaveURL(/\/otp\//);

      await otpPage.enterCode();
      await page.waitForURL('**/onboarding**');

      await page.context().clearCookies();
      await page.goto(firstOtpUrl);
      await page.waitForURL('**/signin**');
      await expect(signInPage.expiredNotice).toBeVisible();
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
