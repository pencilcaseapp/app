import { expect, test } from '../fixtures/settings/test';

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

  const { page, settings } = userA;
  const documentUrl = await userA.document.create();

  // The sidebar opens the subscription settings over the document.
  await userA.sidebar.upgradeLink.click();
  await expect(page).toHaveURL(`${documentUrl}/settings/subscription`);
  await settings.upgradeLink.click();

  await userA.checkout.payWithTestCard();

  // Creem sends the user back to the same settings over the same
  // document, where the signed parameters are confirmed and dropped.
  await page.waitForURL('**/settings/subscription**', { timeout: 90_000 });
  expect(page.url()).toContain(`${documentUrl}/settings/subscription`);
  await expect(page.getByText('Welcome to Pro! Your subscription is active.'))
    .toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'You’re on Pencil Case Pro.' }),
  ).toBeVisible();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await expect(settings.upgradeLink).not.toBeVisible();
  await expect(settings.manageSubscriptionLink).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
  await settings.manageSubscriptionLink.click();
  const popup = await popupPromise;
  await popup.waitForURL('**creem.io/**', { timeout: 30_000 });
});
