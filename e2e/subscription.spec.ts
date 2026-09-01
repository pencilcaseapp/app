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

  const { page } = userA;
  const documentUrl = await userA.createDocument();

  // The sidebar opens the subscription settings over the document.
  await page.getByRole('link', { name: 'Upgrade to Pro' }).click();
  await expect(page).toHaveURL(`${documentUrl}/settings/subscription`);
  await page.getByRole('button', { name: 'Upgrade to Pro' }).click();

  await page.waitForURL('**creem.io/**', { timeout: 30_000 });
  await payWithTestCard(page);

  // Creem sends the user back to the same settings over the same
  // document, where the signed parameters are confirmed and dropped.
  await page.waitForURL('**/settings/subscription**', { timeout: 90_000 });
  expect(page.url()).toContain(`${documentUrl}/settings/subscription`);
  await expect(page.getByText('Welcome to Pro! Your subscription is active.'))
    .toBeVisible();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upgrade to Pro' }))
    .not.toBeVisible();

  const manage = page.getByRole('link', { name: 'Manage Subscription' });
  await expect(manage).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
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
