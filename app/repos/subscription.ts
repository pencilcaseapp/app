import { and, eq, isNull, lte, or, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { subscriptions } from '~/db/schema';

export type Subscription = InferSelectModel<typeof subscriptions>;

export type UpsertSubscriptionInput = {
  userId: string;
  creemSubscriptionId: string;
  creemCustomerId: string;
  creemProductId: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date | null;
  priceAmount?: number;
  priceCurrency?: string;
  billingPeriod?: string;
  creemUpdatedAt?: Date;
};

/**
 * Inserts the subscription or updates the row already holding its Creem id.
 * `inserted` tells the caller whether this was the first time we saw the
 * subscription — concurrent writers race on the insert, so exactly one of
 * them gets `true`. A stale update (Creem's `updated_at` older than what
 * is stored, webhooks can arrive out of order) leaves the row untouched.
 */
export async function upsertSubscription(input: UpsertSubscriptionInput) {
  const [insertedRow] = await db
    .insert(subscriptions)
    .values(input)
    .onConflictDoNothing({ target: subscriptions.creemSubscriptionId })
    .returning();

  if (insertedRow) {
    return { subscription: insertedRow, inserted: true };
  }

  const notStale = input.creemUpdatedAt
    ? or(
        isNull(subscriptions.creemUpdatedAt),
        lte(subscriptions.creemUpdatedAt, input.creemUpdatedAt),
      )
    : undefined;

  const [updatedRow] = await db
    .update(subscriptions)
    .set({ ...input, updatedAt: new Date() })
    .where(and(
      eq(subscriptions.creemSubscriptionId, input.creemSubscriptionId),
      notStale,
    ))
    .returning();

  return {
    subscription: updatedRow
      ?? await getSubscriptionByCreemId(input.creemSubscriptionId),
    inserted: false,
  };
}

export async function getSubscriptionByCreemId(creemSubscriptionId: string) {
  return db.query.subscriptions.findFirst({
    where: {
      creemSubscriptionId,
    },
  });
}

export async function hasSubscriptionWithStatus(
  userId: string,
  statuses: string[],
) {
  if (!isUuid(userId)) {
    return false;
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: {
      userId,
      status: {
        in: statuses,
      },
    },
  });

  return !!subscription;
}
