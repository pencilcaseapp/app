import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { otps } from '~/db/schema';

export async function createOtpFixture(userId: string) {
  const response = await db.insert(otps).values({
    userId,
    codeHash: faker.string.alphanumeric(64),
  }).returning();

  return response[0];
}

export async function createExpiredOtpFixture(userId: string) {
  const response = await db.insert(otps).values({
    userId,
    codeHash: faker.string.alphanumeric(64),
    expiresAt: new Date(Date.now() - 1000), // Set expiry in the past
  }).returning();

  return response[0];
}
