// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  verifyRedirectSignature,
  verifyWebhookSignature,
} from './creem';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function sentRequest(): Request {
  return fetchMock.mock.calls[0][0];
}

function subscriptionResponse() {
  return {
    id: 'sub_123',
    object: 'subscription',
    mode: 'test',
    status: 'active',
    collection_method: 'charge_automatically',
    customer: {
      id: 'cust_123',
      object: 'customer',
      email: 'user@example.com',
      name: null,
      country: 'DE',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
      mode: 'test',
    },
    product: {
      id: 'prod_test',
      object: 'product',
      name: 'pencil case PRO',
      description: 'All the features.',
      price: 2500,
      currency: 'EUR',
      billing_type: 'recurring',
      billing_period: 'every-year',
      status: 'active',
      tax_mode: 'inclusive',
      tax_category: 'saas',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
      mode: 'test',
    },
    current_period_start_date: '2026-08-01T00:00:00.000Z',
    current_period_end_date: '2027-08-01T00:00:00.000Z',
    canceled_at: null,
    metadata: { userId: 'user-1' },
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z',
  };
}

describe('createCheckoutSession', () => {
  it('posts the checkout and returns the checkout url', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      id: 'ch_123',
      object: 'checkout',
      status: 'pending',
      mode: 'test',
      product: 'prod_test',
      checkout_url: 'https://creem.invalid/checkout/ch_123',
    }));

    const checkout = await createCheckoutSession({
      successUrl: 'http://localhost:3000/upgrade/callback',
      customer: { email: 'user@example.com' },
      metadata: { userId: 'user-1' },
    });

    expect(checkout.checkoutUrl)
      .toBe('https://creem.invalid/checkout/ch_123');

    const request = sentRequest();
    expect(request.url).toBe('https://creem.invalid/v1/checkouts');
    expect(request.headers.get('x-api-key')).toBe('creem_test_apikey');
    expect(await request.json()).toStrictEqual({
      product_id: 'prod_test',
      success_url: 'http://localhost:3000/upgrade/callback',
      customer: { email: 'user@example.com' },
      metadata: { userId: 'user-1' },
    });
  });

  it('throws when Creem rejects the request', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'nope' }, 403));

    await expect(createCheckoutSession({
      successUrl: 'http://localhost:3000/upgrade/callback',
      customer: { email: 'user@example.com' },
      metadata: {},
    })).rejects.toThrow();
  });
});

describe('getSubscription', () => {
  it('fetches by subscription id and returns the wire shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse(subscriptionResponse()));

    const subscription = await getSubscription('sub_123');

    expect(sentRequest().url)
      .toBe('https://creem.invalid/v1/subscriptions?subscription_id=sub_123');
    expect(subscription).toStrictEqual({
      id: 'sub_123',
      status: 'active',
      customer: {
        id: 'cust_123',
        email: 'user@example.com',
        name: null,
      },
      product: {
        id: 'prod_test',
        price: 2500,
        currency: 'EUR',
        billing_period: 'every-year',
      },
      current_period_start_date: '2026-08-01T00:00:00.000Z',
      current_period_end_date: '2027-08-01T00:00:00.000Z',
      canceled_at: null,
      metadata: { userId: 'user-1' },
      updated_at: '2026-08-15T00:00:00.000Z',
    });
  });
});

describe('createBillingPortalSession', () => {
  it('posts the customer id and returns the portal link', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      customer_portal_link: 'https://creem.invalid/my-orders/login/abc',
    }));

    const session = await createBillingPortalSession('cust_123');

    expect(session.customerPortalLink)
      .toBe('https://creem.invalid/my-orders/login/abc');

    const request = sentRequest();
    expect(request.url).toBe('https://creem.invalid/v1/customers/billing');
    expect(await request.json()).toStrictEqual({ customer_id: 'cust_123' });
  });
});

describe('verifyRedirectSignature', () => {
  // SHA-256 of 'checkout_id=ch_123|subscription_id=sub_123|
  // customer_id=cust_123|product_id=prod_test|salt=creem_test_apikey'
  const signature
    = '05664cef46e243b681d532176ea48d7a99933663ad20b8a8de150cd2cfa9200c';

  function params(signatureOverride = signature) {
    return new URLSearchParams({
      checkout_id: 'ch_123',
      subscription_id: 'sub_123',
      customer_id: 'cust_123',
      product_id: 'prod_test',
      signature: signatureOverride,
    });
  }

  it('accepts a signature computed the way Creem does', () => {
    expect(verifyRedirectSignature(params())).toBe(true);
  });

  it('rejects a tampered signature', () => {
    expect(verifyRedirectSignature(params('0'.repeat(64)))).toBe(false);
  });

  it('rejects tampered parameters', () => {
    const tampered = params();
    tampered.set('subscription_id', 'sub_evil');

    expect(verifyRedirectSignature(tampered)).toBe(false);
  });

  it('rejects a missing signature', () => {
    const withoutSignature = params();
    withoutSignature.delete('signature');

    expect(verifyRedirectSignature(withoutSignature)).toBe(false);
  });

  it('skips null and empty values like Creem does', () => {
    // SHA-256 of 'checkout_id=ch_123|product_id=prod_test|
    // salt=creem_test_apikey'
    const searchParams = new URLSearchParams({
      checkout_id: 'ch_123',
      order_id: 'null',
      subscription_id: '',
      product_id: 'prod_test',
      signature: '148b46905e74f054de338c392c392bb2'
        + '4055103bbcff04504e272eaaa2f3fd0b',
    });

    expect(verifyRedirectSignature(searchParams)).toBe(true);
  });
});

describe('verifyWebhookSignature', () => {
  const body = '{"id":"evt_1"}';
  // HMAC-SHA256 of the body, keyed with 'whsec-test'
  const signature
    = '89e206126a114e8f1fceb7a8183a9e23ed01aac274e207680ea65a015e8f120f';

  it('accepts a signature computed the way Creem does', async () => {
    expect(await verifyWebhookSignature(body, signature)).toBe(true);
  });

  it('rejects a tampered body', async () => {
    expect(await verifyWebhookSignature('{"id":"evt_2"}', signature))
      .toBe(false);
  });

  it('rejects a missing signature', async () => {
    expect(await verifyWebhookSignature(body, null)).toBe(false);
  });

  it('rejects a signature of a different length', async () => {
    expect(await verifyWebhookSignature(body, 'abc')).toBe(false);
  });
});
