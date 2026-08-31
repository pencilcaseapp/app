import crypto from 'node:crypto';
import { data, redirect } from 'react-router';
import { z } from 'zod';
import { getConfig } from '~/config';
import {
  createRedirectSignature,
  createWebhookSignature,
} from '~/services/creem';
import type { Route } from './+types/e2e-creem';

/**
 * A fake of the few Creem endpoints the app talks to, plus stand-ins for
 * the hosted checkout and customer portal pages, so the e2e tests cover
 * the whole subscription flow without leaving localhost. The dev server
 * points at it when Playwright sets CREEM_API_URL (see
 * playwright.config.ts); `deliver-webhook` plays the part of Creem's
 * webhook delivery, signing events exactly like the real one. Gated on
 * `config.e2e` like /e2e/auth, so none of this exists in prod.
 */

type FakeCheckout = {
  id: string;
  productId: string;
  successUrl: string;
  customerId?: string;
  email?: string;
  metadata: Record<string, string>;
};

// Shaped like the real API responses — the SDK validates what it loads,
// so the entities have to be complete, not just the fields the app uses.
type FakeSubscription = {
  id: string;
  object: 'subscription';
  status: string;
  collection_method: 'charge_automatically';
  customer: {
    id: string;
    object: 'customer';
    email: string;
    name: string | null;
    country: 'DE';
    created_at: string;
    updated_at: string;
    mode: 'test';
  };
  product: {
    id: string;
    object: 'product';
    name: string;
    description: string;
    price: number;
    currency: string;
    billing_type: 'recurring';
    billing_period: string;
    status: 'active';
    tax_mode: 'inclusive';
    tax_category: 'saas';
    created_at: string;
    updated_at: string;
    mode: 'test';
  };
  current_period_start_date: string;
  current_period_end_date: string;
  canceled_at: string | null;
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
  mode: 'test';
};

const checkouts = new Map<string, FakeCheckout>();
const subscriptions = new Map<string, FakeSubscription>();
const customerEmails = new Map<string, string>();

const checkoutBodySchema = z.object({
  product_id: z.string(),
  success_url: z.string(),
  customer: z.object({
    id: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const billingBodySchema = z.object({
  customer_id: z.string(),
});

const deliverWebhookBodySchema = z.object({
  eventType: z.string(),
  subscriptionId: z.string(),
  status: z.string().optional(),
  eventId: z.string().optional(),
});

const eventStatuses: Record<string, string> = {
  'subscription.active': 'active',
  'subscription.paid': 'active',
  'subscription.trialing': 'trialing',
  'subscription.past_due': 'past_due',
  'subscription.unpaid': 'unpaid',
  'subscription.paused': 'paused',
  'subscription.scheduled_cancel': 'scheduled_cancel',
  'subscription.canceled': 'canceled',
};

export async function loader({ request, params }: Route.LoaderArgs) {
  requireE2e();
  const path = params['*'];
  const url = new URL(request.url);

  if (path === 'v1/subscriptions') {
    requireApiKey(request);
    const subscription
      = subscriptions.get(url.searchParams.get('subscription_id') ?? '');

    if (!subscription) {
      throw data('Not Found', { status: 404 });
    }

    return data(subscription);
  }

  if (path.startsWith('checkout/')) {
    const checkout = checkouts.get(path.slice('checkout/'.length));

    if (!checkout) {
      throw data('Not Found', { status: 404 });
    }

    return htmlResponse(`
      <h1>Creem Checkout (fake)</h1>
      <p>Product: ${escapeHtml(checkout.productId)}</p>
      <p>Email: ${escapeHtml(checkout.email ?? '')}</p>
      <p>Customer: ${escapeHtml(checkout.customerId ?? 'new customer')}</p>
      <form method="post"><button type="submit">Pay now</button></form>
    `);
  }

  if (path.startsWith('portal/')) {
    const customerId = path.slice('portal/'.length);

    return htmlResponse(`
      <h1>Creem Customer Portal (fake)</h1>
      <p>Customer: ${escapeHtml(customerId)}</p>
    `);
  }

  throw data('Not Found', { status: 404 });
}

export async function action({ request, params }: Route.ActionArgs) {
  const config = requireE2e();
  const path = params['*'];

  if (path === 'v1/checkouts') {
    requireApiKey(request);
    const body = checkoutBodySchema.parse(await request.json());
    const checkout: FakeCheckout = {
      id: `ch_e2e_${crypto.randomUUID()}`,
      productId: body.product_id,
      successUrl: body.success_url,
      customerId: body.customer?.id,
      email: body.customer?.email
        ?? emailForCustomer(body.customer?.id),
      metadata: body.metadata ?? {},
    };
    checkouts.set(checkout.id, checkout);

    return data({
      id: checkout.id,
      object: 'checkout',
      status: 'pending',
      mode: 'test',
      product: checkout.productId,
      checkout_url:
        new URL(`/e2e/creem/checkout/${checkout.id}`, request.url).href,
    });
  }

  if (path === 'v1/customers/billing') {
    requireApiKey(request);
    const body = billingBodySchema.parse(await request.json());

    return data({
      customer_portal_link:
        new URL(`/e2e/creem/portal/${body.customer_id}`, request.url).href,
    });
  }

  if (path.startsWith('checkout/')) {
    const checkout = checkouts.get(path.slice('checkout/'.length));

    if (!checkout) {
      throw data('Not Found', { status: 404 });
    }

    return completeCheckout(checkout, request);
  }

  if (path === 'deliver-webhook') {
    const authorization = request.headers.get('Authorization');
    if (authorization !== `Bearer ${config.e2e?.apiToken}`) {
      throw data('Unauthorized', { status: 401 });
    }

    const body = deliverWebhookBodySchema.parse(await request.json());

    return deliverWebhook(body, request);
  }

  throw data('Not Found', { status: 404 });
}

/**
 * "Pays" the checkout: creates the subscription and sends the browser
 * back to the success url with the same signed query parameters Creem
 * appends. Paying with the same email again reuses the customer id, like
 * Creem matching customers by email.
 */
function completeCheckout(checkout: FakeCheckout, request: Request) {
  const email = checkout.email ?? 'e2e-buyer@pencilcase.app';
  const customerId = checkout.customerId
    ?? `cust_e2e_${crypto.createHash('sha256')
      .update(email).digest('hex').slice(0, 16)}`;
  customerEmails.set(customerId, email);

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const subscription: FakeSubscription = {
    id: `sub_e2e_${crypto.randomUUID()}`,
    object: 'subscription',
    status: 'active',
    collection_method: 'charge_automatically',
    customer: {
      id: customerId,
      object: 'customer',
      email,
      name: null,
      country: 'DE',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      mode: 'test',
    },
    product: {
      id: checkout.productId,
      object: 'product',
      name: 'pencil case PRO',
      description: 'The pro product of the fake Creem.',
      price: 2500,
      currency: 'EUR',
      billing_type: 'recurring',
      billing_period: 'every-year',
      status: 'active',
      tax_mode: 'inclusive',
      tax_category: 'saas',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      mode: 'test',
    },
    current_period_start_date: now.toISOString(),
    current_period_end_date: periodEnd.toISOString(),
    canceled_at: null,
    metadata: checkout.metadata,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    mode: 'test',
  };
  subscriptions.set(subscription.id, subscription);

  const pairs: [string, string][] = [
    ['checkout_id', checkout.id],
    ['subscription_id', subscription.id],
    ['customer_id', customerId],
    ['product_id', checkout.productId],
  ];

  const successUrl = new URL(checkout.successUrl, request.url);
  for (const [key, value] of pairs) {
    successUrl.searchParams.set(key, value);
  }
  successUrl.searchParams.set('signature', createRedirectSignature(pairs));

  return redirect(successUrl.toString());
}

async function deliverWebhook(
  body: z.infer<typeof deliverWebhookBodySchema>,
  request: Request,
) {
  const subscription = subscriptions.get(body.subscriptionId);

  if (!subscription) {
    throw data('Not Found', { status: 404 });
  }

  const status
    = body.status ?? eventStatuses[body.eventType] ?? subscription.status;
  subscription.status = status;
  subscription.canceled_at
    = status === 'canceled' ? new Date().toISOString() : null;
  subscription.updated_at = new Date().toISOString();

  const event = {
    id: body.eventId ?? `evt_e2e_${crypto.randomUUID()}`,
    eventType: body.eventType,
    created_at: Date.now(),
    object: subscription,
  };
  const rawBody = JSON.stringify(event);

  const response = await fetch(new URL('/webhooks/creem', request.url), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'creem-signature': createWebhookSignature(rawBody),
    },
    body: rawBody,
  });

  return data({ eventId: event.id, status: response.status });
}

function emailForCustomer(customerId: string | undefined) {
  return customerId ? customerEmails.get(customerId) : undefined;
}

function requireE2e() {
  const config = getConfig();

  if (!config.e2e) {
    throw data('Not Found', { status: 404 });
  }

  return config;
}

function requireApiKey(request: Request) {
  const config = getConfig();

  if (request.headers.get('x-api-key') !== config.creem.apiKey) {
    throw data('Forbidden', { status: 403 });
  }
}

function htmlResponse(body: string) {
  return new Response(`<!doctype html><html><body>${body}</body></html>`, {
    headers: { 'content-type': 'text/html' },
  });
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
}
