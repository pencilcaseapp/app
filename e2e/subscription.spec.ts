import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * The paid flow runs against Creem's real test-mode checkout, so it
 * needs CREEM_API_KEY (see docs/e2e.md): CI fails without the secret,
 * a local run without the key skips. Each run pays with Creem's
 * always-succeeding test card and leaves a test customer and
 * subscription behind in the test store.
 */

const creemApiKey = process.env.CREEM_API_KEY;

test('upgrading to pro through the Creem checkout', async ({ userA }) => {
  if (!creemApiKey && process.env.CI) {
    throw new Error('The CREEM_API_KEY repository secret is not set');
  }
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
 * Creem's checkout is not our page, so this is the one place to adjust
 * when it changes. Step one wants the full name and a billing address
 * (the email is prefilled and locked); step two holds the card fields
 * inside the payment provider's iframe, with the cardholder name and
 * the pay button outside it. 4111… is Creem's always-succeeding test
 * card; expiry, CVC and the billing address can be anything.
 */
async function payWithTestCard(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Full name' })
    .fill('E2E Tester');

  await page.getByRole('textbox', { name: 'Address line 1' })
    .fill('123 Test Street');
  await page.getByRole('textbox', { name: 'City' }).fill('Los Angeles');
  await page.getByRole('textbox', { name: 'Postal Code' }).fill('90001');
  await page.getByRole('combobox').filter({ hasText: /^State$/ }).click();
  await page.getByRole('option', { name: 'California' }).click();

  await page.getByRole('button', { name: 'Continue to payment' }).click();

  const cardFrame = page.frameLocator('iframe[title="card_form"]');
  await cardFrame.getByRole('textbox', { name: 'Card number' })
    .fill('4111111111111111');
  await cardFrame.getByRole('textbox', { name: 'MM/YY' }).fill('12/30');
  await cardFrame.getByRole('textbox', { name: 'CVC/CVV' }).fill('123');
  await page.getByRole('textbox', { name: 'Cardholder Name' })
    .fill('E2E Tester');

  await page.getByRole('button', { name: /^Pay €/ }).click();
}
