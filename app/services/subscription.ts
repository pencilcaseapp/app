import { validate as isUuid } from 'uuid';
import { z } from 'zod';
import { getConfig } from '~/config';
import {
  getWebhookEvent,
  markWebhookEventProcessed,
  recordWebhookEvent,
} from '~/repos/creem-webhook-event';
import {
  getSubscriptionByCreemId,
  hasSubscriptionWithStatus,
  SubscriptionStatus,
  upsertSubscription,
} from '~/repos/subscription';
import {
  getUser,
  getUserByCreemCustomerId,
  updateUser,
  type User,
} from '~/repos/user';
import {
  createBillingPortalSession,
  createCheckoutSession,
  creemCheckoutSchema,
  creemSubscriptionSchema,
  creemWebhookEventSchema,
  getSubscription,
  verifyRedirectSignature,
  verifyWebhookSignature,
  type CreemSubscription,
} from './creem';
import {
  sendEmailSubscriptionCanceled,
  sendEmailSubscriptionPaymentFailed,
  sendEmailSubscriptionStarted,
} from './email-templates';

const config = getConfig();

/**
 * The statuses during which the user keeps the pro features. `past_due`
 * stays in because Creem retries the payment for a few days and the
 * subscription recovers or ends on its own; `scheduled_cancel` stays in
 * because the running period is paid until its end. Everything else —
 * canceled, expired, unpaid, paused — switches the features off.
 */
const ACCESS_GRANTING_STATUSES = [
  SubscriptionStatus.Active,
  SubscriptionStatus.Trialing,
  SubscriptionStatus.PastDue,
  SubscriptionStatus.ScheduledCancel,
];

/**
 * Grants the pro features to a user coming in through an invite link. One
 * shared code stands in for the paid subscription until it exists, so a
 * wrong code is not an error — the caller sends them on either way.
 */
export async function redeemInviteCode(user: User, code: string) {
  if (code !== config.invite.code || user.hasSubscription) {
    return;
  }

  await updateUser(user.id, { hasSubscription: true });
}

export enum StartProCheckoutError {
  CheckoutFailed,
}

export type StartProCheckoutResult
  = [StartProCheckoutError] | [null, { checkoutUrl: string }];

/**
 * Creates a Creem checkout session for the pro product. The user id rides
 * along as metadata — it is how the webhook events and the callback find
 * their way back to the account, whatever email is used to pay.
 */
export async function startProCheckout(
  user: User,
  successUrl: string,
): Promise<StartProCheckoutResult> {
  const customer = user.creemCustomerId
    ? { id: user.creemCustomerId }
    : { email: user.email };

  try {
    const checkout = await createCheckoutSession({
      successUrl,
      customer,
      metadata: { userId: user.id },
    });

    return [null, { checkoutUrl: checkout.checkoutUrl }];
  }
  catch (error) {
    console.error('Creating a Creem checkout session failed', error);
    return [StartProCheckoutError.CheckoutFailed];
  }
}

export enum CompleteProCheckoutError {
  InvalidSignature,
  SubscriptionNotFound,
}

export type CompleteProCheckoutResult
  = [CompleteProCheckoutError] | [null];

/**
 * Handles the redirect back from the checkout: verifies that the query
 * parameters were signed by Creem, then loads the subscription from the
 * API and stores it. The webhook stores it too — whoever comes first —
 * so the confirmation page never depends on webhook timing.
 */
export async function completeProCheckout(
  searchParams: URLSearchParams,
): Promise<CompleteProCheckoutResult> {
  if (!verifyRedirectSignature(searchParams)) {
    return [CompleteProCheckoutError.InvalidSignature];
  }

  const subscriptionId = searchParams.get('subscription_id');

  if (!subscriptionId || subscriptionId === 'null') {
    return [CompleteProCheckoutError.SubscriptionNotFound];
  }

  let creemSubscription: CreemSubscription;
  try {
    creemSubscription = await getSubscription(subscriptionId);
  }
  catch (error) {
    console.error('Loading the Creem subscription failed', error);
    return [CompleteProCheckoutError.SubscriptionNotFound];
  }

  const synced = await syncCreemSubscription(creemSubscription);

  if (!synced) {
    return [CompleteProCheckoutError.SubscriptionNotFound];
  }

  return [null];
}

export enum GetBillingPortalUrlError {
  NoCreemCustomer,
  PortalFailed,
}

export type GetBillingPortalUrlResult
  = [GetBillingPortalUrlError] | [null, { portalUrl: string }];

export async function getBillingPortalUrl(
  user: User,
): Promise<GetBillingPortalUrlResult> {
  if (!user.creemCustomerId) {
    return [GetBillingPortalUrlError.NoCreemCustomer];
  }

  try {
    const session = await createBillingPortalSession(user.creemCustomerId);
    return [null, { portalUrl: session.customerPortalLink }];
  }
  catch (error) {
    console.error('Creating a Creem portal session failed', error);
    return [GetBillingPortalUrlError.PortalFailed];
  }
}

export enum HandleCreemWebhookError {
  InvalidSignature,
  MalformedPayload,
}

export type HandleCreemWebhookResult
  = [HandleCreemWebhookError] | [null];

/**
 * Verifies, records and processes one webhook delivery. Creem retries
 * deliveries, so the event is recorded under its id first: a redelivery
 * of an already processed event is acknowledged without doing anything
 * again, while a retry after a crashed attempt processes it once more —
 * the processing is idempotent.
 */
export async function handleCreemWebhook(
  rawBody: string,
  signature: string | null,
): Promise<HandleCreemWebhookResult> {
  if (!await verifyWebhookSignature(rawBody, signature)) {
    return [HandleCreemWebhookError.InvalidSignature];
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  }
  catch {
    return [HandleCreemWebhookError.MalformedPayload];
  }

  const event = creemWebhookEventSchema.safeParse(payload);

  if (!event.success) {
    return [HandleCreemWebhookError.MalformedPayload];
  }

  const recorded = await recordWebhookEvent({
    id: event.data.id,
    eventType: event.data.eventType,
    payload,
  });

  if (!recorded) {
    const existing = await getWebhookEvent(event.data.id);
    if (existing?.processedAt) {
      return [null];
    }
  }

  await processWebhookEvent(event.data.eventType, event.data.object);
  await markWebhookEventProcessed(event.data.id);

  return [null];
}

async function processWebhookEvent(eventType: string, object: unknown) {
  if (eventType === 'checkout.completed') {
    const checkout = creemCheckoutSchema.parse(object);

    if (
      checkout.subscription && typeof checkout.subscription !== 'string'
    ) {
      await syncCreemSubscription(checkout.subscription);
    }

    return;
  }

  if (eventType.startsWith('subscription.')) {
    const creemSubscription = creemSubscriptionSchema.parse(object);
    const synced = await syncCreemSubscription(creemSubscription);

    if (!synced) {
      return;
    }

    if (eventType === 'subscription.past_due') {
      await sendEmailSubscriptionPaymentFailed({
        to: emailData(synced.user),
      });
    }

    if (eventType === 'subscription.canceled') {
      await sendEmailSubscriptionCanceled({
        to: emailData(synced.user),
      });
    }

    return;
  }

  if (eventType === 'refund.created' || eventType === 'dispute.created') {
    const embedded = z
      .object({ subscription: creemSubscriptionSchema })
      .safeParse(object);

    if (embedded.success) {
      await syncCreemSubscription(embedded.data.subscription);
    }
  }
}

/**
 * Mirrors one Creem subscription into the database and recomputes the
 * user's `hasSubscription` flag from what is stored. The account is found
 * through the subscription we already stored, the user id from the
 * checkout metadata, or the Creem customer already linked to a user —
 * an unknown subscription is logged and skipped.
 */
async function syncCreemSubscription(creemSubscription: CreemSubscription) {
  const user = await resolveUser(creemSubscription);

  if (!user) {
    console.warn(
      `No user found for Creem subscription ${creemSubscription.id}`,
    );
    return undefined;
  }

  const { customer, product } = creemSubscription;
  const creemCustomerId
    = typeof customer === 'string' ? customer : customer.id;

  const { inserted } = await upsertSubscription({
    userId: user.id,
    creemSubscriptionId: creemSubscription.id,
    creemCustomerId,
    creemProductId: typeof product === 'string' ? product : product.id,
    status: creemSubscription.status,
    currentPeriodStart:
      parseDate(creemSubscription.current_period_start_date),
    currentPeriodEnd: parseDate(creemSubscription.current_period_end_date),
    canceledAt: creemSubscription.canceled_at
      ? new Date(creemSubscription.canceled_at)
      : null,
    priceAmount:
      typeof product === 'string' ? undefined : product.price ?? undefined,
    priceCurrency:
      typeof product === 'string'
        ? undefined
        : product.currency ?? undefined,
    billingPeriod:
      typeof product === 'string'
        ? undefined
        : product.billing_period ?? undefined,
    creemUpdatedAt: parseDate(creemSubscription.updated_at),
  });

  const hasSubscription
    = await hasSubscriptionWithStatus(user.id, ACCESS_GRANTING_STATUSES);

  await updateUser(user.id, {
    hasSubscription,
    creemCustomerId: await customerIdLinkableTo(user, creemCustomerId),
  });

  if (
    inserted
    && ACCESS_GRANTING_STATUSES
      .includes(creemSubscription.status as SubscriptionStatus)
  ) {
    await sendEmailSubscriptionStarted({ to: emailData(user) });
  }

  return { user };
}

async function resolveUser(creemSubscription: CreemSubscription) {
  const stored = await getSubscriptionByCreemId(creemSubscription.id);
  if (stored) {
    return getUser(stored.userId);
  }

  const metadataUserId = creemSubscription.metadata?.userId;
  if (typeof metadataUserId === 'string' && isUuid(metadataUserId)) {
    const user = await getUser(metadataUserId);
    if (user) {
      return user;
    }
  }

  const { customer } = creemSubscription;
  return getUserByCreemCustomerId(
    typeof customer === 'string' ? customer : customer.id,
  );
}

/**
 * A Creem customer can only be linked to one account. When another user
 * already holds this customer id (two accounts paying with the same email
 * on Creem's side), the link is left as it is instead of failing the sync
 * on the unique index.
 */
async function customerIdLinkableTo(user: User, creemCustomerId: string) {
  if (user.creemCustomerId === creemCustomerId) {
    return undefined;
  }

  const holder = await getUserByCreemCustomerId(creemCustomerId);

  if (holder && holder.id !== user.id) {
    console.warn(
      `Creem customer ${creemCustomerId} is already linked `
      + `to another user`,
    );
    return undefined;
  }

  return creemCustomerId;
}

function emailData(user: User) {
  return { email: user.email, name: user.name ?? undefined };
}

function parseDate(value: string | null | undefined) {
  return value ? new Date(value) : undefined;
}
