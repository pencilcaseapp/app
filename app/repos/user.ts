import { and, asc, eq, getColumns, gt, inArray, isNotNull, isNull, lt, ne, sql, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db, type Executor } from '~/db';
import { users } from '~/db/schema';
import { sessions } from '~/db/schema';

export type User = InferSelectModel<typeof users>;

export type UserSession = InferSelectModel<typeof sessions>;

const SESSION_REFRESH_THRESHOLD_MS = 89 * 24 * 60 * 60 * 1000;

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

/**
 * `xmax` is 0 only on a row this very statement inserted, which is what
 * tells a new account from a returning one.
 */
export async function getOrCreateUserByEmail(
  email: string,
  executor: Executor = db,
) {
  const [{ created, ...user }] = await executor
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
    .returning({
      ...getColumns(users),
      created: sql<boolean>`xmax = 0`,
    });

  return { user, created };
}

export async function updateUser(id: string, input: {
  email?: string;
  name?: string;
  newsletter?: boolean;
  onboarded?: boolean;
  hasSubscription?: boolean;
  creemCustomerId?: string;
}, executor: Executor = db) {
  const {
    email,
    name,
    newsletter,
    onboarded,
    hasSubscription,
    creemCustomerId,
  } = input;
  const response = await executor.update(users)
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

/**
 * Locks the user's row until the transaction passed in ends, so writes
 * that derive a user's fields from other tables run one after the other.
 */
export async function lockUser(id: string, executor: Executor) {
  if (!isUuid(id)) {
    return;
  }

  await executor.select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .for('update');
}

/**
 * Marks the account as deleted, unless it is already. Returns when it was
 * deleted, or nothing for an account that was deleted before.
 */
export async function markUserDeleted(id: string, executor: Executor = db) {
  if (!isUuid(id)) {
    return undefined;
  }

  const [user] = await executor.update(users)
    .set({ deletedAt: sql`NOW()`, updatedAt: new Date() })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning({ deletedAt: users.deletedAt });

  return user?.deletedAt ?? undefined;
}

/** Takes the deletion back. Returns whether there was one to take back. */
export async function restoreDeletedUser(id: string, executor: Executor = db) {
  if (!isUuid(id)) {
    return false;
  }

  const restored = await executor.update(users)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(users.id, id), isNotNull(users.deletedAt)))
    .returning({ id: users.id });

  return restored.length > 0;
}

/** Accounts deleted before the given date, oldest first. */
export async function getUserIdsDeletedBefore(before: Date) {
  const rows = await db.select({ id: users.id })
    .from(users)
    .where(lt(users.deletedAt, before))
    .orderBy(asc(users.deletedAt));

  return rows.map(row => row.id);
}

/**
 * The account, if it was deleted before the given date, locked until the
 * transaction passed in ends: signing in, which restores it, waits for the
 * purge, and a purge that comes second finds it restored and leaves it.
 */
export async function lockUserDeletedBefore(
  id: string,
  before: Date,
  executor: Executor,
) {
  if (!isUuid(id)) {
    return undefined;
  }

  const [user] = await executor.select()
    .from(users)
    .where(and(eq(users.id, id), lt(users.deletedAt, before)))
    .for('update');

  return user;
}

/** Deletes the user and their sessions, the last step of a purge. */
export async function hardDeleteUser(id: string, executor: Executor = db) {
  if (!isUuid(id)) {
    return false;
  }

  await executor.delete(sessions).where(eq(sessions.userId, id));
  const deleted = await executor.delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return deleted.length > 0;
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
        expiresAt: sql`(CURRENT_TIMESTAMP + INTERVAL '90 days')`,
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

export async function expireUserSession(tokenHash: string) {
  const [session] = await db
    .update(sessions)
    .set({
      expiresAt: new Date(),
    })
    .where(eq(sessions.tokenHash, tokenHash))
    .returning();

  return session;
}

export async function expireOtherUserSessions(
  userId: string,
  keptTokenHash: string,
  executor: Executor = db,
) {
  return executor
    .update(sessions)
    .set({
      expiresAt: new Date(),
    })
    .where(and(
      eq(sessions.userId, userId),
      ne(sessions.tokenHash, keptTokenHash),
      gt(sessions.expiresAt, new Date()),
    ))
    .returning();
}

/** Signs the user out on every device. */
export async function expireAllUserSessions(
  userId: string,
  executor: Executor = db,
) {
  return executor
    .update(sessions)
    .set({
      expiresAt: new Date(),
    })
    .where(and(
      eq(sessions.userId, userId),
      gt(sessions.expiresAt, new Date()),
    ))
    .returning({ id: sessions.id });
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
