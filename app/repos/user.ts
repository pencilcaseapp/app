import { and, eq, inArray, lt, sql, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { users } from '~/db/schema';
import { sessions } from '~/db/schema';

export type User = InferSelectModel<typeof users>;

export type UserSession = InferSelectModel<typeof sessions>;

const SESSION_REFRESH_THRESHOLD_MS = 28 * 24 * 60 * 60 * 1000;

export async function createUser(input: {
  email: string;
  name?: string;
  newsletter?: boolean;
  onboarded?: boolean;
}) {
  const { email, name, newsletter, onboarded } = input;
  const response = await db.insert(users).values({
    email,
    name,
    newsletter,
    onboarded,
  }).returning();

  return response[0];
}

export async function getUser(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.users.findFirst({
    where: {
      id,
    },
  });
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: {
      email,
    },
  });
}

export async function getOrCreateUserByEmail(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        email,
      },
    })
    .returning();

  return user;
}

export async function updateUser(id: string, input: {
  email?: string;
  name?: string;
  newsletter?: boolean;
  onboarded?: boolean;
  hasSubscription?: boolean;
  creemCustomerId?: string;
}) {
  const {
    email,
    name,
    newsletter,
    onboarded,
    hasSubscription,
    creemCustomerId,
  } = input;
  const response = await db.update(users)
    .set({
      email,
      name,
      newsletter,
      onboarded,
      hasSubscription,
      creemCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return response[0];
}

export async function getUserByCreemCustomerId(creemCustomerId: string) {
  return db.query.users.findFirst({
    where: {
      creemCustomerId,
    },
  });
}

export async function createUserSession(input: {
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

export async function getAndRefreshUserSession(tokenHash: string) {
  const response = await db.query.sessions.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
    with: {
      user: true,
    },
  });

  if (!response) {
    return null;
  }

  const { user, ...session } = response;
  let refreshedSession: UserSession | undefined;
  const refreshThreshold = new Date(Date.now() + SESSION_REFRESH_THRESHOLD_MS);

  if (session.expiresAt < refreshThreshold) {
    const [updateResponse] = await db
      .update(sessions)
      .set({
        expiresAt: sql`(CURRENT_TIMESTAMP + INTERVAL '30 days')`,
      })
      .where(and(
        eq(sessions.id, session.id),
      ))
      .returning();

    refreshedSession = updateResponse;
  }

  return {
    user,
    session: refreshedSession ?? session,
    isRefreshed: !!refreshedSession,
  };
}

export async function getUserSession(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.sessions.findFirst({
    where: {
      id,
    },
  });
}

const DELETE_BATCH_SIZE = 1000;

/**
 * Deletes in batches so a large backlog never turns into one long-running
 * statement holding locks on a table every signed in request reads.
 */
export async function deleteSessionsExpiredBefore(before: Date) {
  let deletedCount = 0;

  while (true) {
    const batch = db
      .select({ id: sessions.id })
      .from(sessions)
      .where(lt(sessions.expiresAt, before))
      .limit(DELETE_BATCH_SIZE);

    const deleted = await db
      .delete(sessions)
      .where(inArray(sessions.id, batch))
      .returning({ id: sessions.id });

    deletedCount += deleted.length;

    if (deleted.length < DELETE_BATCH_SIZE) {
      return deletedCount;
    }
  }
}
