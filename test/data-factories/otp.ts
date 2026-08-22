import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { otps } from '~/db/schema';

export async function createValidOtp(userId: string, email?: string) {
  const [otp] = await db.insert(otps).values({
    userId,
    email: email ?? faker.internet.email(),
    codeHash: faker.string.alphanumeric(64),
  }).returning();

  return otp;
}

export async function createExpiredOtp(
  userId: string,
  email?: string,
  expiresAt?: Date,
) {
  const [otp] = await db.insert(otps).values({
    userId,
    email: email ?? faker.internet.email(),
    codeHash: faker.string.alphanumeric(64),
    expiresAt: expiresAt ?? new Date(Date.now() - 1000), // Expiry in the past
  }).returning();

  return otp;
}

export async function createUsedOtp(userId: string) {
  const [otp] = await db.insert(otps).values({
    userId,
    email: faker.internet.email(),
    codeHash: faker.string.alphanumeric(64),
    usedAt: new Date(),
  }).returning();

  return otp;
}
