import { faker } from '@faker-js/faker';
import type { InferInsertModel } from 'drizzle-orm';
import { db } from '~/db';
import { subscriptions } from '~/db/schema';

export async function createTestSubscription(
  userId: string,
  overrides: Partial<InferInsertModel<typeof subscriptions>> = {},
) {
  const periodStart = faker.date.recent();
  const periodEnd = faker.date.soon({ days: 365, refDate: periodStart });

  const [subscription] = await db.insert(subscriptions).values({
    userId,
    creemSubscriptionId: `sub_${faker.string.alphanumeric(22)}`,
    creemCustomerId: `cust_${faker.string.alphanumeric(21)}`,
    creemProductId: `prod_${faker.string.alphanumeric(21)}`,
    status: 'active',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    priceAmount: 2500,
    priceCurrency: 'EUR',
    billingPeriod: 'every-year',
    creemUpdatedAt: periodStart,
    ...overrides,
  }).returning();

  return subscription;
}
