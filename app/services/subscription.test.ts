// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completeProCheckout,
  CompleteProCheckoutError,
  getBillingPortalUrl,
  GetBillingPortalUrlError,
  handleCreemWebhook,
  HandleCreemWebhookError,
  redeemInviteCode,
  startProCheckout,
  StartProCheckoutError,
} from './subscription';
import { userFixture } from '~/test/fixtures/user';

const updateUserMock = vi.fn();
const getUserMock = vi.fn();
const getUserByCreemCustomerIdMock = vi.fn();
vi.mock('~/repos/user', () => ({
  updateUser: (...args: unknown[]) => updateUserMock(...args),
  getUser: (...args: unknown[]) => getUserMock(...args),
  getUserByCreemCustomerId:
    (...args: unknown[]) => getUserByCreemCustomerIdMock(...args),
}));

const upsertSubscriptionMock = vi.fn();
const getSubscriptionByCreemIdMock = vi.fn();
const hasSubscriptionWithStatusMock = vi.fn();
vi.mock('~/repos/subscription', () => ({
  upsertSubscription: (...args: unknown[]) => upsertSubscriptionMock(...args),
  getSubscriptionByCreemId:
    (...args: unknown[]) => getSubscriptionByCreemIdMock(...args),
  hasSubscriptionWithStatus:
    (...args: unknown[]) => hasSubscriptionWithStatusMock(...args),
}));

const recordWebhookEventMock = vi.fn();
const getWebhookEventMock = vi.fn();
const markWebhookEventProcessedMock = vi.fn();
vi.mock('~/repos/creem-webhook-event', () => ({
  recordWebhookEvent: (...args: unknown[]) => recordWebhookEventMock(...args),
  getWebhookEvent: (...args: unknown[]) => getWebhookEventMock(...args),
  markWebhookEventProcessed:
    (...args: unknown[]) => markWebhookEventProcessedMock(...args),
}));

const createCheckoutSessionMock = vi.fn();
const getSubscriptionMock = vi.fn();
const createBillingPortalSessionMock = vi.fn();
const verifyRedirectSignatureMock = vi.fn();
const verifyWebhookSignatureMock = vi.fn();
vi.mock('./creem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./creem')>();
  return {
    ...actual,
    createCheckoutSession:
      (...args: unknown[]) => createCheckoutSessionMock(...args),
    getSubscription: (...args: unknown[]) => getSubscriptionMock(...args),
    createBillingPortalSession:
      (...args: unknown[]) => createBillingPortalSessionMock(...args),
    verifyRedirectSignature:
      (...args: unknown[]) => verifyRedirectSignatureMock(...args),
    verifyWebhookSignature:
      (...args: unknown[]) => verifyWebhookSignatureMock(...args),
  };
});

const sendEmailSubscriptionStartedMock = vi.fn();
const sendEmailSubscriptionPaymentFailedMock = vi.fn();
const sendEmailSubscriptionCanceledMock = vi.fn();
vi.mock('./email-templates', () => ({
  sendEmailSubscriptionStarted:
    (...args: unknown[]) => sendEmailSubscriptionStartedMock(...args),
  sendEmailSubscriptionPaymentFailed:
    (...args: unknown[]) => sendEmailSubscriptionPaymentFailedMock(...args),
  sendEmailSubscriptionCanceled:
    (...args: unknown[]) => sendEmailSubscriptionCanceledMock(...args),
}));

function creemSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    customer: { id: 'cust_123', email: userFixture.email },
    product: {
      id: 'prod_test',
      price: 2500,
      currency: 'EUR',
      billing_period: 'every-year',
    },
    current_period_start_date: '2026-08-01T00:00:00.000Z',
    current_period_end_date: '2027-08-01T00:00:00.000Z',
    canceled_at: null,
    metadata: { userId: userFixture.id },
    updated_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function webhookEvent(
  eventType: string,
  object: unknown,
  id = 'evt_123',
) {
  return JSON.stringify({ id, eventType, created_at: 1, object });
}

beforeEach(() => {
  vi.clearAllMocks();

  verifyRedirectSignatureMock.mockReturnValue(true);
  verifyWebhookSignatureMock.mockReturnValue(true);
  getSubscriptionByCreemIdMock.mockResolvedValue(undefined);
  getUserMock.mockResolvedValue(userFixture);
  getUserByCreemCustomerIdMock.mockResolvedValue(undefined);
  upsertSubscriptionMock
    .mockResolvedValue({ subscription: {}, inserted: false });
  hasSubscriptionWithStatusMock.mockResolvedValue(true);
  recordWebhookEventMock.mockResolvedValue({ id: 'evt_123' });
  getWebhookEventMock.mockResolvedValue(undefined);
});

describe('redeemInviteCode', () => {
  it('gives the user a subscription for a valid code', async () => {
    await redeemInviteCode(userFixture, 'super-secret');

    expect(updateUserMock)
      .toHaveBeenCalledWith(userFixture.id, { hasSubscription: true });
  });

  it('does nothing for an invalid code', async () => {
    await redeemInviteCode(userFixture, 'not-the-code');

    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('does nothing when the user already has a subscription', async () => {
    await redeemInviteCode(
      { ...userFixture, hasSubscription: true },
      'super-secret',
    );

    expect(updateUserMock).not.toHaveBeenCalled();
  });
});

describe('startProCheckout', () => {
  it('prefills the email of a first time subscriber', async () => {
    createCheckoutSessionMock.mockResolvedValue({
      id: 'ch_123',
      checkout_url: 'https://creem.invalid/checkout/ch_123',
    });

    const [error, result] = await startProCheckout(
      userFixture,
      'http://localhost:3000/upgrade/callback',
    );

    expect(error).toBeNull();
    expect(result?.checkoutUrl)
      .toBe('https://creem.invalid/checkout/ch_123');
    expect(createCheckoutSessionMock).toHaveBeenCalledWith({
      successUrl: 'http://localhost:3000/upgrade/callback',
      customer: { email: userFixture.email },
      metadata: { userId: userFixture.id },
    });
  });

  it('hands over the Creem customer id of a returning one', async () => {
    createCheckoutSessionMock.mockResolvedValue({
      id: 'ch_123',
      checkout_url: 'https://creem.invalid/checkout/ch_123',
    });

    await startProCheckout(
      { ...userFixture, creemCustomerId: 'cust_123' },
      'http://localhost:3000/upgrade/callback',
    );

    expect(createCheckoutSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer: { id: 'cust_123' } }),
    );
  });

  it('reports a failing checkout creation', async () => {
    createCheckoutSessionMock.mockRejectedValue(new Error('down'));

    const [error] = await startProCheckout(
      userFixture,
      'http://localhost:3000/upgrade/callback',
    );

    expect(error).toBe(StartProCheckoutError.CheckoutFailed);
  });
});

describe('completeProCheckout', () => {
  function callbackParams() {
    return new URLSearchParams({
      checkout_id: 'ch_123',
      subscription_id: 'sub_123',
      customer_id: 'cust_123',
      product_id: 'prod_test',
      signature: 'sig',
    });
  }

  it('rejects an unsigned redirect', async () => {
    verifyRedirectSignatureMock.mockReturnValue(false);

    const [error] = await completeProCheckout(callbackParams());

    expect(error).toBe(CompleteProCheckoutError.InvalidSignature);
    expect(upsertSubscriptionMock).not.toHaveBeenCalled();
  });

  it('rejects a redirect without a subscription', async () => {
    const params = callbackParams();
    params.delete('subscription_id');

    const [error] = await completeProCheckout(params);

    expect(error).toBe(CompleteProCheckoutError.SubscriptionNotFound);
  });

  it('reports a subscription Creem does not know', async () => {
    getSubscriptionMock.mockRejectedValue(new Error('404'));

    const [error] = await completeProCheckout(callbackParams());

    expect(error).toBe(CompleteProCheckoutError.SubscriptionNotFound);
  });

  it('stores the subscription and switches the features on', async () => {
    getSubscriptionMock.mockResolvedValue(creemSubscription());
    upsertSubscriptionMock
      .mockResolvedValue({ subscription: {}, inserted: true });

    const [error] = await completeProCheckout(callbackParams());

    expect(error).toBeNull();
    expect(upsertSubscriptionMock).toHaveBeenCalledWith({
      userId: userFixture.id,
      creemSubscriptionId: 'sub_123',
      creemCustomerId: 'cust_123',
      creemProductId: 'prod_test',
      status: 'active',
      currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2027-08-01T00:00:00.000Z'),
      canceledAt: null,
      priceAmount: 2500,
      priceCurrency: 'EUR',
      billingPeriod: 'every-year',
      creemUpdatedAt: new Date('2026-08-01T00:00:00.000Z'),
    });
    expect(updateUserMock).toHaveBeenCalledWith(userFixture.id, {
      hasSubscription: true,
      creemCustomerId: 'cust_123',
    });
    expect(sendEmailSubscriptionStartedMock).toHaveBeenCalledWith({
      to: { email: userFixture.email, name: userFixture.name ?? undefined },
    });
  });
});

describe('handleCreemWebhook', () => {
  it('rejects an invalid signature', async () => {
    verifyWebhookSignatureMock.mockReturnValue(false);

    const [error] = await handleCreemWebhook('{}', 'bad');

    expect(error).toBe(HandleCreemWebhookError.InvalidSignature);
    expect(recordWebhookEventMock).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    const [error] = await handleCreemWebhook('not json', 'sig');

    expect(error).toBe(HandleCreemWebhookError.MalformedPayload);
  });

  it('rejects a body without the event fields', async () => {
    const [error] = await handleCreemWebhook('{"foo":"bar"}', 'sig');

    expect(error).toBe(HandleCreemWebhookError.MalformedPayload);
  });

  it('acknowledges an already processed event without reprocessing',
    async () => {
      recordWebhookEventMock.mockResolvedValue(undefined);
      getWebhookEventMock.mockResolvedValue({
        id: 'evt_123',
        processedAt: new Date(),
      });

      const [error] = await handleCreemWebhook(
        webhookEvent('subscription.paid', creemSubscription()),
        'sig',
      );

      expect(error).toBeNull();
      expect(upsertSubscriptionMock).not.toHaveBeenCalled();
    });

  it('reprocesses an event whose first attempt crashed', async () => {
    recordWebhookEventMock.mockResolvedValue(undefined);
    getWebhookEventMock.mockResolvedValue({
      id: 'evt_123',
      processedAt: null,
    });

    const [error] = await handleCreemWebhook(
      webhookEvent('subscription.paid', creemSubscription()),
      'sig',
    );

    expect(error).toBeNull();
    expect(upsertSubscriptionMock).toHaveBeenCalled();
    expect(markWebhookEventProcessedMock).toHaveBeenCalledWith('evt_123');
  });

  it('activates the subscription on subscription.paid', async () => {
    upsertSubscriptionMock
      .mockResolvedValue({ subscription: {}, inserted: true });

    const [error] = await handleCreemWebhook(
      webhookEvent('subscription.paid', creemSubscription()),
      'sig',
    );

    expect(error).toBeNull();
    expect(updateUserMock).toHaveBeenCalledWith(userFixture.id, {
      hasSubscription: true,
      creemCustomerId: 'cust_123',
    });
    expect(sendEmailSubscriptionStartedMock).toHaveBeenCalled();
    expect(markWebhookEventProcessedMock).toHaveBeenCalledWith('evt_123');
  });

  it('sends no welcome email for a subscription already stored',
    async () => {
      upsertSubscriptionMock
        .mockResolvedValue({ subscription: {}, inserted: false });

      await handleCreemWebhook(
        webhookEvent('subscription.paid', creemSubscription()),
        'sig',
      );

      expect(sendEmailSubscriptionStartedMock).not.toHaveBeenCalled();
    });

  it('sends no welcome email when the first stored state is canceled',
    async () => {
      upsertSubscriptionMock
        .mockResolvedValue({ subscription: {}, inserted: true });
      hasSubscriptionWithStatusMock.mockResolvedValue(false);

      await handleCreemWebhook(
        webhookEvent(
          'subscription.canceled',
          creemSubscription({ status: 'canceled' }),
        ),
        'sig',
      );

      expect(sendEmailSubscriptionStartedMock).not.toHaveBeenCalled();
    });

  it('switches the features off and confirms a cancellation', async () => {
    hasSubscriptionWithStatusMock.mockResolvedValue(false);

    const [error] = await handleCreemWebhook(
      webhookEvent(
        'subscription.canceled',
        creemSubscription({
          status: 'canceled',
          canceled_at: '2026-08-15T00:00:00.000Z',
        }),
      ),
      'sig',
    );

    expect(error).toBeNull();
    expect(updateUserMock).toHaveBeenCalledWith(
      userFixture.id,
      expect.objectContaining({ hasSubscription: false }),
    );
    expect(sendEmailSubscriptionCanceledMock).toHaveBeenCalledWith({
      to: { email: userFixture.email, name: userFixture.name ?? undefined },
    });
  });

  it('keeps the features on and warns about a failed payment', async () => {
    const [error] = await handleCreemWebhook(
      webhookEvent(
        'subscription.past_due',
        creemSubscription({ status: 'past_due' }),
      ),
      'sig',
    );

    expect(error).toBeNull();
    expect(hasSubscriptionWithStatusMock).toHaveBeenCalledWith(
      userFixture.id,
      expect.arrayContaining(['past_due']),
    );
    expect(updateUserMock).toHaveBeenCalledWith(
      userFixture.id,
      expect.objectContaining({ hasSubscription: true }),
    );
    expect(sendEmailSubscriptionPaymentFailedMock).toHaveBeenCalled();
  });

  it('stores the subscription delivered with checkout.completed',
    async () => {
      const [error] = await handleCreemWebhook(
        webhookEvent('checkout.completed', {
          id: 'ch_123',
          subscription: creemSubscription(),
        }),
        'sig',
      );

      expect(error).toBeNull();
      expect(upsertSubscriptionMock).toHaveBeenCalled();
    });

  it('skips a checkout that only references its subscription by id',
    async () => {
      const [error] = await handleCreemWebhook(
        webhookEvent('checkout.completed', {
          id: 'ch_123',
          subscription: 'sub_123',
        }),
        'sig',
      );

      expect(error).toBeNull();
      expect(upsertSubscriptionMock).not.toHaveBeenCalled();
      expect(markWebhookEventProcessedMock).toHaveBeenCalled();
    });

  it('syncs the subscription embedded in a refund', async () => {
    hasSubscriptionWithStatusMock.mockResolvedValue(false);

    const [error] = await handleCreemWebhook(
      webhookEvent('refund.created', {
        id: 'ref_123',
        subscription: creemSubscription({ status: 'canceled' }),
      }),
      'sig',
    );

    expect(error).toBeNull();
    expect(upsertSubscriptionMock).toHaveBeenCalled();
    expect(sendEmailSubscriptionCanceledMock).not.toHaveBeenCalled();
  });

  it('records an event type it does not know and moves on', async () => {
    const [error] = await handleCreemWebhook(
      webhookEvent('something.else', { id: 'x' }),
      'sig',
    );

    expect(error).toBeNull();
    expect(upsertSubscriptionMock).not.toHaveBeenCalled();
    expect(markWebhookEventProcessedMock).toHaveBeenCalledWith('evt_123');
  });

  it('resolves the user through the stored subscription first',
    async () => {
      getSubscriptionByCreemIdMock
        .mockResolvedValue({ userId: userFixture.id });

      await handleCreemWebhook(
        webhookEvent(
          'subscription.paid',
          creemSubscription({ metadata: null }),
        ),
        'sig',
      );

      expect(getUserMock).toHaveBeenCalledWith(userFixture.id);
      expect(upsertSubscriptionMock).toHaveBeenCalled();
    });

  it('resolves the user through the linked Creem customer', async () => {
    getUserMock.mockResolvedValue(undefined);
    getUserByCreemCustomerIdMock.mockResolvedValue(userFixture);

    await handleCreemWebhook(
      webhookEvent(
        'subscription.paid',
        creemSubscription({ metadata: null }),
      ),
      'sig',
    );

    expect(getUserByCreemCustomerIdMock).toHaveBeenCalledWith('cust_123');
    expect(upsertSubscriptionMock).toHaveBeenCalled();
  });

  it('skips a subscription no user can be found for', async () => {
    getUserMock.mockResolvedValue(undefined);

    const [error] = await handleCreemWebhook(
      webhookEvent('subscription.paid', creemSubscription()),
      'sig',
    );

    expect(error).toBeNull();
    expect(upsertSubscriptionMock).not.toHaveBeenCalled();
    expect(markWebhookEventProcessedMock).toHaveBeenCalledWith('evt_123');
  });

  it('never links a Creem customer another user already holds',
    async () => {
      getUserByCreemCustomerIdMock
        .mockResolvedValue({ ...userFixture, id: 'other-user' });

      await handleCreemWebhook(
        webhookEvent('subscription.paid', creemSubscription()),
        'sig',
      );

      expect(updateUserMock).toHaveBeenCalledWith(userFixture.id, {
        hasSubscription: true,
        creemCustomerId: undefined,
      });
    });
});

describe('getBillingPortalUrl', () => {
  it('reports a user without a Creem customer', async () => {
    const [error] = await getBillingPortalUrl(userFixture);

    expect(error).toBe(GetBillingPortalUrlError.NoCreemCustomer);
  });

  it('returns the portal url', async () => {
    createBillingPortalSessionMock.mockResolvedValue({
      customer_portal_link: 'https://creem.invalid/my-orders/login/abc',
    });

    const [error, result] = await getBillingPortalUrl(
      { ...userFixture, creemCustomerId: 'cust_123' },
    );

    expect(error).toBeNull();
    expect(result?.portalUrl)
      .toBe('https://creem.invalid/my-orders/login/abc');
    expect(createBillingPortalSessionMock).toHaveBeenCalledWith('cust_123');
  });

  it('reports a failing portal creation', async () => {
    createBillingPortalSessionMock.mockRejectedValue(new Error('down'));

    const [error] = await getBillingPortalUrl(
      { ...userFixture, creemCustomerId: 'cust_123' },
    );

    expect(error).toBe(GetBillingPortalUrlError.PortalFailed);
  });
});
