import crypto from 'node:crypto';
import { Creem } from 'creem';
import type { SubscriptionEntity } from 'creem/models/components';
import {
  verifyWebhookSignature as sdkVerifyWebhookSignature,
} from 'creem/webhooks';
import { z } from 'zod';
import { getConfig } from '~/config';

const config = getConfig();

const creem = new Creem({
  apiKey: config.creem.apiKey,
  serverURL: config.creem.apiUrl,
});

// The webhook payloads arrive as raw JSON, not through the SDK, so the
// fields the app consumes are parsed with these schemas — tolerant of
// anything Creem adds around them.
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

export async function createCheckoutSession(input: {
  successUrl: string;
  customer: { id: string } | { email: string };
  metadata: Record<string, string>;
}) {
  const { successUrl, customer, metadata } = input;

  const checkout = await creem.checkouts.create({
    productId: config.creem.productId,
    successUrl,
    customer,
    metadata,
  });

  if (!checkout.checkoutUrl) {
    throw new Error(`Checkout ${checkout.id} came back without a url`);
  }

  return { checkoutUrl: checkout.checkoutUrl };
}

export async function getSubscription(subscriptionId: string) {
  return toCreemSubscription(await creem.subscriptions.get(subscriptionId));
}

export async function createBillingPortalSession(customerId: string) {
  return creem.customers.generateBillingLinks({ customerId });
}

/**
 * Creem signs the redirect back from the checkout with a SHA-256 over the
 * query parameters joined as `key=value|…|salt={apiKey}` — in the order
 * they appear in the URL, skipping the signature itself and empty values.
 * The SDK offers no helper for this one, so it stays hand-rolled.
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
 * Webhooks carry an HMAC-SHA256 of the raw body in the `creem-signature`
 * header; the verification is the SDK's, which also understands the
 * newer standard-webhooks headers.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
) {
  if (!signature) {
    return false;
  }

  try {
    await sdkVerifyWebhookSignature(
      rawBody,
      { 'creem-signature': signature },
      { secret: config.creem.webhookSecret },
    );
    return true;
  }
  catch {
    return false;
  }
}

/** The signing half is shared with the fake Creem the e2e tests run. */
export function createWebhookSignature(rawBody: string) {
  return crypto
    .createHmac('sha256', config.creem.webhookSecret)
    .update(rawBody)
    .digest('hex');
}

/**
 * The SDK models are camelCase with parsed dates; the webhook payloads
 * are the raw wire format. Everything downstream speaks the wire format,
 * so what the SDK loads is folded back into it.
 */
function toCreemSubscription(entity: SubscriptionEntity): CreemSubscription {
  const { customer, product } = entity;

  return {
    id: entity.id,
    status: entity.status,
    customer: typeof customer === 'string'
      ? customer
      : { id: customer.id, email: customer.email, name: customer.name },
    product: typeof product === 'string'
      ? product
      : {
          id: product.id,
          price: product.price,
          currency: product.currency,
          billing_period: product.billingPeriod,
        },
    current_period_start_date:
      entity.currentPeriodStartDate?.toISOString(),
    current_period_end_date: entity.currentPeriodEndDate?.toISOString(),
    canceled_at: entity.canceledAt?.toISOString() ?? null,
    metadata: entity.metadata,
    updated_at: entity.updatedAt.toISOString(),
  };
}

function timingSafeEqualHex(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
