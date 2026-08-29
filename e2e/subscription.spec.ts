import { expect, test } from './fixtures';

/**
 * These specs run against the fake Creem in app/routes/e2e-creem.ts: the
 * checkout, the redirect signature, the webhook signature and the portal
 * behave like the real ones, so everything on our side of the integration
 * is covered end to end — only Creem's hosted pages are stand-ins.
 */

test('upgrading to pro through the Creem checkout', async ({ userA }) => {
  await userA.page.goto('/upgrade');
  await userA.page.getByRole('button', { name: 'Upgrade' }).click();

  await userA.page.waitForURL('**/e2e/creem/checkout/**');
  await expect(userA.page.getByText(userA.email ?? '')).toBeVisible();

  await userA.page.getByRole('button', { name: 'Pay now' }).click();

  await userA.page.waitForURL('**/upgrade/callback**');
  await expect(userA.page.getByText('You are all set!')).toBeVisible();

  await userA.page.goto('/upgrade');
  await expect(
    userA.page.getByRole('link', { name: 'Manage subscription' }),
  ).toBeVisible();
});

test('a canceled subscription switches pro off, resubscribing reuses '
  + 'the Creem customer', async ({ userA }) => {
  const subscriptionId = await userA.upgradeToPro();

  await userA.deliverCreemWebhook('subscription.canceled', subscriptionId);

  await userA.page.goto('/upgrade');
  await expect(userA.page.getByRole('button', { name: 'Upgrade' }))
    .toBeVisible();

  await userA.page.getByRole('button', { name: 'Upgrade' }).click();
  await userA.page.waitForURL('**/e2e/creem/checkout/**');
  await expect(userA.page.getByText(/cust_e2e_/)).toBeVisible();
});

test('a failed renewal keeps pro on while Creem retries', async ({
  userA,
}) => {
  const subscriptionId = await userA.upgradeToPro();

  await userA.deliverCreemWebhook('subscription.past_due', subscriptionId);

  await userA.page.goto('/upgrade');
  await expect(
    userA.page.getByRole('link', { name: 'Manage subscription' }),
  ).toBeVisible();
});

test('the customer portal opens in a new tab', async ({ userA }) => {
  await userA.upgradeToPro();

  await userA.page.goto('/upgrade');
  const popupPromise = userA.page.waitForEvent('popup');
  await userA.page
    .getByRole('link', { name: 'Manage subscription' })
    .click();

  const popup = await popupPromise;
  await popup.waitForURL('**/e2e/creem/portal/**');
  await expect(popup.getByText('Creem Customer Portal (fake)'))
    .toBeVisible();
});

test('a redelivered webhook event is applied only once', async ({
  userA,
}) => {
  const subscriptionId = await userA.upgradeToPro();
  const eventId = `evt_e2e_${Date.now()}`;

  await userA.deliverCreemWebhook('subscription.canceled', subscriptionId, {
    eventId,
  });
  await userA.deliverCreemWebhook('subscription.canceled', subscriptionId, {
    eventId,
  });

  await userA.page.goto('/upgrade');
  await expect(userA.page.getByRole('button', { name: 'Upgrade' }))
    .toBeVisible();
});

test('a tampered checkout redirect grants nothing', async ({ userA }) => {
  const forged = new URLSearchParams({
    checkout_id: 'ch_forged',
    subscription_id: 'sub_forged',
    customer_id: 'cust_forged',
    product_id: 'prod_forged',
    signature: '0'.repeat(64),
  });
  await userA.page.goto(`/upgrade/callback?${forged}`);

  await expect(userA.page.getByText('We could not confirm this payment.'))
    .toBeVisible();

  await userA.page.goto('/upgrade');
  await expect(userA.page.getByRole('button', { name: 'Upgrade' }))
    .toBeVisible();
});

test('the webhook endpoint rejects an unsigned delivery', async ({
  userA,
}) => {
  const response = await userA.page.request.post('/webhooks/creem', {
    headers: { 'creem-signature': '0'.repeat(64) },
    data: { id: 'evt_forged', eventType: 'subscription.paid', object: {} },
  });

  expect(response.status()).toBe(401);
});
