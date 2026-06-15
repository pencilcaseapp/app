import crypto from 'node:crypto';
import argon2 from 'argon2';
import { db } from '~/db';
import { sessions } from '~/db/schema';

export async function createValidSession(userId: string, expiresAt?: Date) {
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

export async function createExpiredSession(userId: string) {
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
