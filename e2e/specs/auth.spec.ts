import { AppUser } from '../fixtures/app-user';
import { expect, test } from '../fixtures/test';
import {
  createTestAccountEmail,
  enterCode,
  requestCode,
} from '../utils/sign-in';

const WRONG_CODE = '111111';

test.describe('signing up', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('onboards a new account and opens its first document',
    async ({ page }) => {
      await page.goto('/');
      await page.waitForURL('**/signin**');
      await requestCode(page, createTestAccountEmail('signup'));
      await enterCode(page);

      await page.waitForURL('**/onboarding**');
      await page.getByLabel('Name').fill('Ada Lovelace');
      await page.getByLabel(/I want to receive emails/).check();
      await page.getByRole('button', { name: 'Continue' }).click();

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
    async ({ page, userA }) => {
      const url = await userA.createDocument();
      await userA.typeLines('Shared plans', 'Read me after signing up');
      await userA.shareDocument();

      await page.goto(url);
      await page.getByRole('link', { name: 'Sign In' }).click();
      await page.waitForURL('**/signin**');
      await requestCode(page, createTestAccountEmail('visitor'));
      await enterCode(page);

      await page.waitForURL('**/onboarding**');
      await page.getByRole('button', { name: 'Skip it' }).click();

      await page.waitForURL(url);
      const visitor = new AppUser(page);
      await expect(visitor.content).toContainText('Read me after signing up');
      await expect(page.getByRole('link', { name: 'Sign In' })).toHaveCount(0);
    });
});

test.describe('signing in', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sends a returning account back where it was, past the onboarding',
    async ({ userA, page }) => {
      const url = await userA.createDocument();
      await userA.typeLines('My private notes');

      // Same account, signed out: the private document asks for a session.
      await page.goto(url);
      await page.waitForURL('**/signin**');
      await requestCode(page, userA.email!);
      await enterCode(page);

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('My private notes');
    });

  test('signs in to the same account whatever the case of the address',
    async ({ userA, page }) => {
      const url = await userA.createDocument();
      await userA.typeLines('Case insensitive');

      await page.goto(`/signin?returnUrl=${encodeURIComponent(url)}`);
      await requestCode(page, userA.email!.toUpperCase());
      await enterCode(page);

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('Case insensitive');
    });

  test('never returns to another site', async ({ page, baseURL }) => {
    await page.goto('/signin?returnUrl=//example.com/phish');
    await requestCode(page, createTestAccountEmail('redirect'));
    await enterCode(page);
    await page.waitForURL('**/onboarding**');
    await page.getByRole('button', { name: 'Skip it' }).click();

    await page.waitForURL('**/doc/**');
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
  });

  test('turns down a wrong code and still takes the right one',
    async ({ page }) => {
      await page.goto('/signin');
      await requestCode(page, createTestAccountEmail('wrong-code'));

      await enterCode(page, WRONG_CODE);
      await expect(page.getByText('Invalid code. Please check the code'))
        .toBeVisible();
      await expect(page).toHaveURL(/\/otp\//);

      await enterCode(page);
      await page.waitForURL('**/onboarding**');
    });

  test('expires the code after five wrong attempts', async ({ page }) => {
    await page.goto('/signin');
    await requestCode(page, createTestAccountEmail('guessing'));
    const otpUrl = page.url();

    for (let attempt = 1; attempt < 5; attempt++) {
      await enterCode(page, WRONG_CODE);
      await expect(page.getByText('Invalid code. Please check the code'))
        .toBeVisible();
    }

    await enterCode(page, WRONG_CODE);
    await page.waitForURL('**/signin**');
    await expect(page.getByText('Code has expired. Please try again.'))
      .toBeVisible();

    // The right code is no use any more either.
    await page.goto(otpUrl);
    await page.waitForURL('**/signin**');
  });

  test('lets the address be corrected on the code page', async ({ page }) => {
    const typo = createTestAccountEmail('typo');
    const email = createTestAccountEmail('fixed');

    await page.goto('/signin');
    await requestCode(page, typo);
    await expect(page.getByText(typo)).toBeVisible();

    await page.getByRole('link', { name: 'edit' }).click();
    await page.waitForURL('**/signin**');
    await expect(page.getByLabel('E-Mail')).toHaveValue(typo);

    await requestCode(page, email);
    await expect(page.getByText(email)).toBeVisible();
    await enterCode(page);
    await page.waitForURL('**/onboarding**');
  });

  test('sends a new code and retires the old one', async ({ page }) => {
    await page.goto('/signin');
    await requestCode(page, createTestAccountEmail('resend'));
    const firstOtpUrl = page.url();

    await page.getByRole('button', { name: 'Resend code' }).click();
    await page.waitForURL(url => url.href !== firstOtpUrl);
    await expect(page).toHaveURL(/\/otp\//);

    await enterCode(page);
    await page.waitForURL('**/onboarding**');

    await page.context().clearCookies();
    await page.goto(firstOtpUrl);
    await page.waitForURL('**/signin**');
    await expect(page.getByText('Code has expired. Please try again.'))
      .toBeVisible();
  });

  test('allows three codes per address in fifteen minutes',
    async ({ page }) => {
      const email = createTestAccountEmail('rate-limit');

      for (let request = 0; request < 3; request++) {
        await page.goto('/signin');
        await requestCode(page, email);
      }

      await page.goto('/signin');
      await page.getByLabel('E-Mail').fill(email);
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page.getByText('Too many requests. Please try again later.'))
        .toBeVisible();
      await expect(page).toHaveURL(/\/signin/);

      // Another address is not held up by it.
      await requestCode(page, createTestAccountEmail('rate-limit-other'));
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
