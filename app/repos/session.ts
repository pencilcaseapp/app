import { eq, sql, type InferSelectModel } from 'drizzle-orm';
import { db } from '~/db';
import { sessions } from '~/db/schema';

export type Session = InferSelectModel<typeof sessions>;

const SESSION_DURATION_DAYS = 30;
const SESSION_SLIDING_THRESHOLD_MS
  = (SESSION_DURATION_DAYS - 1) * 24 * 60 * 60 * 1000;

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

export async function getSessionByTokenHash(tokenHash: string) {
  const session = await db.query.sessions.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!session) {
    return undefined;
  }

  const remainingMs = session.expiresAt.getTime() - Date.now();
  if (remainingMs <= SESSION_SLIDING_THRESHOLD_MS) {
    const [extended] = await db.update(sessions)
      .set({
        expiresAt: sql`(CURRENT_TIMESTAMP + INTERVAL '30 days')`,
      })
      .where(eq(sessions.id, session.id))
      .returning();

    return extended;
  }

  return session;
}
