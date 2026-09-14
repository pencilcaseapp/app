import { faker } from '@faker-js/faker';
import type { InferInsertModel } from 'drizzle-orm';
import { db } from '~/db';
import { emailChangeRequests } from '~/db/schema';
import { getCanonicalEmail } from '~/utils/email';

export async function createTestEmailChangeRequest(
  userId: string,
  overrides: Partial<InferInsertModel<typeof emailChangeRequests>> = {},
) {
  const email = overrides.email ?? faker.internet.email().toLowerCase();

  const [request] = await db.insert(emailChangeRequests).values({
    userId,
    email,
    canonicalEmail: getCanonicalEmail(email),
    codeHash: faker.string.alphanumeric(64),
    ...overrides,
  }).returning();

  return request;
}

export function createExpiredEmailChangeRequest(
  userId: string,
  expiresAt: Date = new Date(Date.now() - 1000),
) {
  return createTestEmailChangeRequest(userId, { expiresAt });
}

export function createUsedEmailChangeRequest(userId: string) {
  return createTestEmailChangeRequest(userId, { usedAt: new Date() });
}
