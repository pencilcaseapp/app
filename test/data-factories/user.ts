import { faker } from '@faker-js/faker';
import { db } from '~/db';
import { users } from '~/db/schema';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { sessions } from '~/db/schema';

export async function createTestUser() {
  const [user] = await db.insert(users).values({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    newsletter: faker.datatype.boolean(),
  }).returning();

  return user;
}

export async function createValidUserSession(userId: string, expiresAt?: Date) {
  const token = crypto.randomBytes(32);
  const codeHash = await argon2.hash(token);

  const [session] = await db.insert(sessions).values({
    userId,
    tokenHash: codeHash,
    userAgent: 'test-agent',
    expiresAt,
  }).returning();

  return session;
}

export async function createExpiredUserSession(userId: string) {
  const token = crypto.randomBytes(32);
  const codeHash = await argon2.hash(token);

  const [session] = await db.insert(sessions).values({
    userId,
    tokenHash: codeHash,
    userAgent: 'test-agent',
    expiresAt: new Date(Date.now() - (60 * 1000)),
  }).returning();

  return session;
}
