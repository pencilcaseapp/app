import { AppUser } from '../fixtures/app-user';
import { expect, test } from '../fixtures/test';
import { createTestAccountEmail } from '../utils/test-accounts';

const WRONG_CODE = '111111';

test.describe('signing up', () => {
  test('onboards a new account and opens its first document',
    async ({ visitor }) => {
      const { page } = visitor;
      await page.goto('/');
      await page.waitForURL('**/signin**');
      await visitor.requestCode(createTestAccountEmail('signup'));
      await visitor.enterCode();
      await visitor.completeOnboarding({
        name: 'Ada Lovelace',
        newsletter: true,
      });

      await page.waitForURL('**/doc/**');
      const user = new AppUser(page);
      await user.waitForEditorSynced();

      // The onboarding is only ever shown once.
      await page.goto('/onboarding');
      await expect(page).not.toHaveURL(/\/onboarding/);

      await page.getByRole('link', { name: 'Settings' }).click();
      await expect(page).toHaveURL(/\/settings\/account$/);
      await expect(page.getByLabel('Name')).toHaveValue('Ada Lovelace');
      await expect(page.getByLabel('Subscribe to Newsletter')).toBeChecked();
    });

  test('brings a visitor of a shared document back to it',
    async ({ visitor, userA }) => {
      const { page } = visitor;
      const url = await userA.createDocument();
      await userA.typeLines('Shared plans', 'Read me after signing up');
      await userA.shareDocument();

      await page.goto(url);
      await page.getByRole('link', { name: 'Sign In' }).click();
      await page.waitForURL('**/signin**');
      await visitor.requestCode(createTestAccountEmail('visitor'));
      await visitor.enterCode();
      await visitor.skipOnboarding();

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('Read me after signing up');
      await expect(page.getByRole('link', { name: 'Sign In' })).toHaveCount(0);
    });
});

test.describe('signing in', () => {
  test('sends a returning account back where it was, past the onboarding',
    async ({ userA, visitor }) => {
      const { page } = visitor;
      const url = await userA.createDocument();
      await userA.typeLines('My private notes');

      // Same account, signed out: the private document asks for a session.
      await page.goto(url);
      await page.waitForURL('**/signin**');
      await visitor.requestCode(userA.email!);
      await visitor.enterCode();

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('My private notes');
    });

  test('signs in to the same account whatever the case of the address',
    async ({ userA, visitor }) => {
      const { page } = visitor;
      const url = await userA.createDocument();
      await userA.typeLines('Case insensitive');

      await page.goto(`/signin?returnUrl=${encodeURIComponent(url)}`);
      await visitor.requestCode(userA.email!.toUpperCase());
      await visitor.enterCode();

      await page.waitForURL(url);
      await expect(new AppUser(page).content)
        .toContainText('Case insensitive');
    });

  test('never returns to another site', async ({ visitor, baseURL }) => {
    const { page } = visitor;
    await page.goto('/signin?returnUrl=//example.com/phish');
    await visitor.requestCode(createTestAccountEmail('redirect'));
    await visitor.enterCode();
    await visitor.skipOnboarding();

    await page.waitForURL('**/doc/**');
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
  });

  test('turns down a wrong code and still takes the right one',
    async ({ visitor }) => {
      const { page } = visitor;
      await page.goto('/signin');
      await visitor.requestCode(createTestAccountEmail('wrong-code'));

      await visitor.enterCode(WRONG_CODE);
      await expect(visitor.invalidCodeError).toBeVisible();
      await expect(page).toHaveURL(/\/otp\//);

      await visitor.enterCode();
      await page.waitForURL('**/onboarding**');
    });

  test('expires the code after five wrong attempts', async ({ visitor }) => {
    const { page } = visitor;
    await page.goto('/signin');
    await visitor.requestCode(createTestAccountEmail('guessing'));
    const otpUrl = page.url();

    for (let attempt = 1; attempt < 5; attempt++) {
      await visitor.enterCode(WRONG_CODE);
      await expect(visitor.invalidCodeError).toBeVisible();
    }

    await visitor.enterCode(WRONG_CODE);
    await page.waitForURL('**/signin**');
    await expect(visitor.expiredNotice).toBeVisible();

    // The right code is no use any more either.
    await page.goto(otpUrl);
    await page.waitForURL('**/signin**');
  });

  test('lets the address be corrected on the code page',
    async ({ visitor }) => {
      const { page } = visitor;
      const typo = createTestAccountEmail('typo');
      const email = createTestAccountEmail('fixed');

      await page.goto('/signin');
      await visitor.requestCode(typo);
      await expect(page.getByText(typo)).toBeVisible();

      await page.getByRole('link', { name: 'edit' }).click();
      await page.waitForURL('**/signin**');
      await expect(visitor.emailField).toHaveValue(typo);

      await visitor.requestCode(email);
      await expect(page.getByText(email)).toBeVisible();
      await visitor.enterCode();
      await page.waitForURL('**/onboarding**');
    });

  test('sends a new code and retires the old one', async ({ visitor }) => {
    const { page } = visitor;
    await page.goto('/signin');
    await visitor.requestCode(createTestAccountEmail('resend'));
    const firstOtpUrl = page.url();

    await page.getByRole('button', { name: 'Resend code' }).click();
    await page.waitForURL(url => url.href !== firstOtpUrl);
    await expect(page).toHaveURL(/\/otp\//);

    await visitor.enterCode();
    await page.waitForURL('**/onboarding**');

    await page.context().clearCookies();
    await page.goto(firstOtpUrl);
    await page.waitForURL('**/signin**');
    await expect(visitor.expiredNotice).toBeVisible();
  });

  test('allows three codes per address in fifteen minutes',
    async ({ visitor }) => {
      const { page } = visitor;
      const email = createTestAccountEmail('rate-limit');

      for (let request = 0; request < 3; request++) {
        await page.goto('/signin');
        await visitor.requestCode(email);
      }

      await page.goto('/signin');
      await visitor.submitEmail(email);
      await expect(visitor.tooManyRequestsError).toBeVisible();
      await expect(page).toHaveURL(/\/signin/);

      // Another address is not held up by it.
      await visitor.requestCode(createTestAccountEmail('rate-limit-other'));
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
