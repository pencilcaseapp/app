import { describe, expect, it } from 'vitest';
import { faker } from '@faker-js/faker';
import { SubscriptionStatus } from '~/constants/subscription';
import {
  getSubscriptionByCreemId,
  getSubscriptionWithStatus,
  hasSubscriptionWithStatus,
  upsertSubscription,
  type UpsertSubscriptionInput,
} from './subscription';
import { createTestSubscription } from '~/test/data-factories/subscription';
import { createTestUser } from '~/test/data-factories/user';

function upsertInput(
  userId: string,
  overrides: Partial<UpsertSubscriptionInput> = {},
): UpsertSubscriptionInput {
  return {
    userId,
    creemSubscriptionId: `sub_${faker.string.alphanumeric(22)}`,
    creemCustomerId: `cust_${faker.string.alphanumeric(21)}`,
    creemProductId: `prod_${faker.string.alphanumeric(21)}`,
    status: 'active',
    currentPeriodStart: new Date('2026-08-01T00:00:00Z'),
    currentPeriodEnd: new Date('2027-08-01T00:00:00Z'),
    priceAmount: 2500,
    priceCurrency: 'EUR',
    billingPeriod: 'every-year',
    creemUpdatedAt: new Date('2026-08-01T00:00:00Z'),
    ...overrides,
  };
}

describe('upsertSubscription', () => {
  it('inserts a subscription seen for the first time', async () => {
    const user = await createTestUser();
    const input = upsertInput(user.id);

    const { subscription, inserted } = await upsertSubscription(input);

    expect(inserted).toBe(true);
    expect(subscription).toStrictEqual({
      id: expect.any(String),
      userId: user.id,
      creemSubscriptionId: input.creemSubscriptionId,
      creemCustomerId: input.creemCustomerId,
      creemProductId: input.creemProductId,
      status: 'active',
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      canceledAt: null,
      priceAmount: 2500,
      priceCurrency: 'EUR',
      billingPeriod: 'every-year',
      creemUpdatedAt: input.creemUpdatedAt,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('updates the row already holding the creem id', async () => {
    const user = await createTestUser();
    const existing = await createTestSubscription(user.id, {
      creemUpdatedAt: new Date('2026-08-01T00:00:00Z'),
    });

    const { subscription, inserted } = await upsertSubscription(
      upsertInput(user.id, {
        creemSubscriptionId: existing.creemSubscriptionId,
        creemCustomerId: existing.creemCustomerId,
        status: 'canceled',
        canceledAt: new Date('2026-08-15T00:00:00Z'),
        creemUpdatedAt: new Date('2026-08-15T00:00:00Z'),
      }),
    );

    expect(inserted).toBe(false);
    expect(subscription?.id).toBe(existing.id);
    expect(subscription?.status).toBe('canceled');
    expect(subscription?.canceledAt)
      .toStrictEqual(new Date('2026-08-15T00:00:00Z'));
  });

  it('leaves the row untouched for a stale update', async () => {
    const user = await createTestUser();
    const existing = await createTestSubscription(user.id, {
      status: 'canceled',
      creemUpdatedAt: new Date('2026-08-15T00:00:00Z'),
    });

    const { subscription, inserted } = await upsertSubscription(
      upsertInput(user.id, {
        creemSubscriptionId: existing.creemSubscriptionId,
        status: 'active',
        creemUpdatedAt: new Date('2026-08-01T00:00:00Z'),
      }),
    );

    expect(inserted).toBe(false);
    expect(subscription?.status).toBe('canceled');
  });

  it('applies an update without a creem timestamp', async () => {
    const user = await createTestUser();
    const existing = await createTestSubscription(user.id, {
      status: 'active',
    });

    const { subscription } = await upsertSubscription(
      upsertInput(user.id, {
        creemSubscriptionId: existing.creemSubscriptionId,
        status: 'past_due',
        creemUpdatedAt: undefined,
      }),
    );

    expect(subscription?.status).toBe('past_due');
  });
});

describe('getSubscriptionByCreemId', () => {
  it('returns the subscription', async () => {
    const user = await createTestUser();
    const existing = await createTestSubscription(user.id);

    const subscription
      = await getSubscriptionByCreemId(existing.creemSubscriptionId);

    expect(subscription?.id).toBe(existing.id);
  });

  it('returns undefined for an unknown id', async () => {
    const subscription = await getSubscriptionByCreemId('sub_unknown');

    expect(subscription).toBeUndefined();
  });
});

describe('getSubscriptionWithStatus', () => {
  it('returns the newest subscription in one of the given statuses',
    async () => {
      const user = await createTestUser();
      const older = await createTestSubscription(user.id, {
        status: 'canceled',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      });
      const newer = await createTestSubscription(user.id, {
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
      await createTestSubscription(user.id, {
        status: 'active',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });

      const subscription = await getSubscriptionWithStatus(
        user.id,
        [SubscriptionStatus.Active, SubscriptionStatus.PastDue],
      );

      expect(subscription?.id).toBe(newer.id);
      expect(subscription?.id).not.toBe(older.id);
    });

  it('returns undefined without a matching subscription', async () => {
    const user = await createTestUser();
    await createTestSubscription(user.id, { status: 'canceled' });

    expect(await getSubscriptionWithStatus(
      user.id,
      [SubscriptionStatus.Active],
    )).toBeUndefined();
  });

  it('returns undefined for an invalid user id', async () => {
    expect(await getSubscriptionWithStatus(
      'invalid-id',
      [SubscriptionStatus.Active],
    )).toBeUndefined();
  });
});

describe('hasSubscriptionWithStatus', () => {
  it('finds a subscription in one of the given statuses', async () => {
    const user = await createTestUser();
    await createTestSubscription(user.id, { status: 'past_due' });

    expect(await hasSubscriptionWithStatus(
      user.id,
      [SubscriptionStatus.Active, SubscriptionStatus.PastDue],
    )).toBe(true);
  });

  it('ignores subscriptions in other statuses', async () => {
    const user = await createTestUser();
    await createTestSubscription(user.id, { status: 'canceled' });

    expect(await hasSubscriptionWithStatus(
      user.id,
      [SubscriptionStatus.Active],
    )).toBe(false);
  });

  it('returns false for an invalid user id', async () => {
    expect(await hasSubscriptionWithStatus(
      'invalid-id',
      [SubscriptionStatus.Active],
    )).toBe(false);
  });
});
