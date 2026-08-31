import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * The paid flow runs against Creem's real test-mode checkout, so it
 * needs CREEM_API_KEY (see docs/e2e.md) and is skipped without it. Each
 * run pays with Creem's always-succeeding test card and leaves a test
 * customer and subscription behind in the test store.
 */

const creemApiKey = process.env.CREEM_API_KEY;

test('upgrading to pro through the Creem checkout', async ({ userA }) => {
  test.skip(
    !creemApiKey,
    'Set CREEM_API_KEY to run the paid checkout flow (docs/e2e.md)',
  );
  test.setTimeout(180_000);

  await userA.page.goto('/upgrade');
  await userA.page.getByRole('button', { name: 'Upgrade' }).click();

  await userA.page.waitForURL('**creem.io/**', { timeout: 30_000 });
  await payWithTestCard(userA.page);

  await userA.page.waitForURL('**/upgrade/callback**', { timeout: 90_000 });
  await expect(userA.page.getByText('You are all set!')).toBeVisible();

  await userA.page.goto('/upgrade');
  const manage = userA.page
    .getByRole('link', { name: 'Manage subscription' });
  await expect(manage).toBeVisible();

  const popupPromise = userA.page.waitForEvent('popup');
  await manage.click();
  const popup = await popupPromise;
  await popup.waitForURL('**creem.io/**', { timeout: 30_000 });
});

/**
 * Creem's checkout is not our page: the locators lean on accessible
 * names and placeholders instead of markup, and this helper is the one
 * place to adjust when their checkout changes. The full name comes
 * before the card details; 4111… is Creem's always-succeeding test
 * card, and expiry and CVC can be anything valid.
 */
async function payWithTestCard(page: Page): Promise<void> {
  await fillPaymentField(page, /full name/i, 'E2E Tester');
  await fillPaymentField(page, /card number/i, '4111111111111111');
  await fillPaymentField(page, /expir|mm\s*\/?\s*yy/i, '12/30');
  await fillPaymentField(page, /cvc|cvv|security code/i, '123');

  await page.getByRole('button', { name: /pay|subscribe/i }).first().click();
}

async function fillPaymentField(
  page: Page,
  matcher: RegExp,
  value: string,
): Promise<void> {
  await page
    .getByRole('textbox', { name: matcher })
    .or(page.getByPlaceholder(matcher))
    .first()
    .fill(value);
}
