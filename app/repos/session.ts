import { type InferSelectModel } from 'drizzle-orm';
import { db } from '~/db';
import { sessions } from '~/db/schema';

export type Session = InferSelectModel<typeof sessions>;

export async function createSession(input: {
  tokenHash: string;
  userId: string;
  userAgent?: string;
}) {
  const { userId, tokenHash, userAgent } = input;

  const [session] = await db.insert(sessions).values({
    userId,
    tokenHash,
    userAgent,
  }).returning();

  return session;
}
