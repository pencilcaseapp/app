import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { otps } from '~/db/schema';
import { getCanonicalEmail } from '~/utils/email';

export async function createValidOtp(userId: string, email?: string) {
  const to = email ?? faker.internet.email();

  const [otp] = await db.insert(otps).values({
    userId,
    email: to,
    canonicalEmail: getCanonicalEmail(to),
    codeHash: faker.string.alphanumeric(64),
  }).returning();

  return otp;
}

export async function createExpiredOtp(input: {
  userId: string;
  email?: string;
  expiresAt?: Date;
}) {
  const { userId, email, expiresAt } = input;
  const to = email ?? faker.internet.email();

  const [otp] = await db.insert(otps).values({
    userId,
    email: to,
    canonicalEmail: getCanonicalEmail(to),
    codeHash: faker.string.alphanumeric(64),
    expiresAt: expiresAt ?? new Date(Date.now() - 1000), // Expiry in the past
  }).returning();

  return otp;
}

export async function createUsedOtp(userId: string) {
  const to = faker.internet.email();

  const [otp] = await db.insert(otps).values({
    userId,
    email: to,
    canonicalEmail: getCanonicalEmail(to),
    codeHash: faker.string.alphanumeric(64),
    usedAt: new Date(),
  }).returning();

  return otp;
}
