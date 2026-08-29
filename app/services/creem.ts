import crypto from 'node:crypto';
import { z } from 'zod';
import { getConfig } from '~/config';

const config = getConfig();

export const creemCustomerSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullish(),
});

export const creemProductSchema = z.object({
  id: z.string(),
  price: z.number().nullish(),
  currency: z.string().nullish(),
  billing_period: z.string().nullish(),
});

export const creemSubscriptionSchema = z.object({
  id: z.string(),
  status: z.string(),
  customer: z.union([z.string(), creemCustomerSchema]),
  product: z.union([z.string(), creemProductSchema]),
  current_period_start_date: z.string().nullish(),
  current_period_end_date: z.string().nullish(),
  canceled_at: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  updated_at: z.string().nullish(),
});

export type CreemSubscription = z.infer<typeof creemSubscriptionSchema>;

export const creemCheckoutSchema = z.object({
  id: z.string(),
  subscription: z.union([z.string(), creemSubscriptionSchema]).nullish(),
});

export const creemWebhookEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  object: z.unknown(),
});

export type CreemWebhookEvent = z.infer<typeof creemWebhookEventSchema>;

const checkoutSessionSchema = z.object({
  id: z.string(),
  checkout_url: z.string(),
});

const billingPortalSessionSchema = z.object({
  customer_portal_link: z.string(),
});

export async function createCheckoutSession(input: {
  successUrl: string;
  customer: { id: string } | { email: string };
  metadata: Record<string, string>;
}) {
  const { successUrl, customer, metadata } = input;

  const response = await creemFetch('/v1/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      product_id: config.creem.productId,
      success_url: successUrl,
      customer,
      metadata,
    }),
  });

  return checkoutSessionSchema.parse(response);
}

export async function getSubscription(subscriptionId: string) {
  const search = new URLSearchParams({ subscription_id: subscriptionId });
  const response = await creemFetch(`/v1/subscriptions?${search}`);

  return creemSubscriptionSchema.parse(response);
}

export async function createBillingPortalSession(customerId: string) {
  const response = await creemFetch('/v1/customers/billing', {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId }),
  });

  return billingPortalSessionSchema.parse(response);
}

/**
 * Creem signs the redirect back from the checkout with a SHA-256 over the
 * query parameters joined as `key=value|…|salt={apiKey}` — in the order
 * they appear in the URL, skipping the signature itself and empty values.
 */
export function verifyRedirectSignature(searchParams: URLSearchParams) {
  const signature = searchParams.get('signature');

  if (!signature) {
    return false;
  }

  const pairs = [...searchParams].filter(([key, value]) =>
    key !== 'signature' && value !== '' && value !== 'null',
  );

  return timingSafeEqualHex(signature, createRedirectSignature(pairs));
}

/** The signing half is shared with the fake Creem the e2e tests run. */
export function createRedirectSignature(pairs: [string, string][]) {
  const data = pairs
    .map(([key, value]) => `${key}=${value}`)
    .concat(`salt=${config.creem.apiKey}`)
    .join('|');

  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Webhooks are signed with an HMAC-SHA256 of the raw body in the
 * `creem-signature` header, keyed with the webhook secret.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
) {
  if (!signature) {
    return false;
  }

  return timingSafeEqualHex(signature, createWebhookSignature(rawBody));
}

/** The signing half is shared with the fake Creem the e2e tests run. */
export function createWebhookSignature(rawBody: string) {
  return crypto
    .createHmac('sha256', config.creem.webhookSecret)
    .update(rawBody)
    .digest('hex');
}

function timingSafeEqualHex(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

async function creemFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${config.creem.apiUrl}${path}`, {
    ...init,
    headers: {
      'x-api-key': config.creem.apiKey,
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    const method = init?.method ?? 'GET';
    throw new Error(
      `Creem request failed: ${method} ${path} → ${response.status}`,
    );
  }

  return response.json();
}
