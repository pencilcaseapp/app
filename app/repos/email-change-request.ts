import { and, eq, gt, inArray, isNull, lt, or, sql, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db, type Executor } from '~/db';
import { emailChangeRequests } from '~/db/schema';

export type EmailChangeRequest = InferSelectModel<typeof emailChangeRequests>;

export async function createEmailChangeRequest(input: {
  userId: string;
  email: string;
  canonicalEmail: string;
  codeHash: string;
}) {
  const { userId, email, canonicalEmail, codeHash } = input;

  const [request] = await db.insert(emailChangeRequests).values({
    userId,
    email,
    canonicalEmail,
    codeHash,
  }).returning();

  return request;
}

export async function getValidEmailChangeRequest(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.emailChangeRequests.findFirst({
    where: {
      id,
      expiresAt: {
        gt: new Date(),
      },
      usedAt: {
        isNull: true,
      },
    },
  });
}

export async function expireEmailChangeRequest(id: string) {
  const [request] = await db.update(emailChangeRequests)
    .set({
      expiresAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(emailChangeRequests.id, id))
    .returning();

  return request;
}

export async function expireAllValidEmailChangeRequests(userId: string) {
  await db.update(emailChangeRequests)
    .set({
      expiresAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(emailChangeRequests.userId, userId),
        gt(emailChangeRequests.expiresAt, new Date()),
        isNull(emailChangeRequests.usedAt),
      ));
}

/**
 * Counts an attempt before the code is checked, in the same statement that
 * checks the request is still valid and has attempts left, so guesses sent
 * in parallel cannot get past the limit. Returns `undefined` when there is
 * no attempt left to take.
 */
export async function claimEmailChangeRequestAttempt(
  id: string,
  maxAttempts: number,
) {
  if (!isUuid(id)) {
    return undefined;
  }

  const [request] = await db.update(emailChangeRequests)
    .set({
      attempts: sql`${emailChangeRequests.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(emailChangeRequests.id, id),
      gt(emailChangeRequests.expiresAt, new Date()),
      isNull(emailChangeRequests.usedAt),
      lt(emailChangeRequests.attempts, maxAttempts),
    ))
    .returning();

  return request;
}

/**
 * Returns `undefined` when the request was used or expired in the
 * meantime, so a code is only ever redeemed once.
 */
export async function markEmailChangeRequestAsUsed(
  id: string,
  executor: Executor = db,
) {
  const [request] = await executor.update(emailChangeRequests)
    .set({
      usedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(emailChangeRequests.id, id),
      gt(emailChangeRequests.expiresAt, new Date()),
      isNull(emailChangeRequests.usedAt),
    ))
    .returning();

  return request;
}

/**
 * Counts the requests of the last fifteen minutes both by the account
 * making them and by the mailbox they would go to, so neither one account
 * nor several of them can flood an address with codes.
 */
export async function canRequestEmailChange(
  userId: string,
  canonicalEmail: string,
) {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

  const count = await db.$count(
    emailChangeRequests,
    and(
      or(
        eq(emailChangeRequests.userId, userId),
        eq(emailChangeRequests.canonicalEmail, canonicalEmail),
      ),
      gt(emailChangeRequests.createdAt, new Date(fifteenMinutesAgo)),
    ),
  );

  return count < 3;
}

const DELETE_BATCH_SIZE = 1000;

/**
 * Deletes in batches, like the OTPs, so a backlog never turns into one
 * long-running statement.
 */
export async function deleteEmailChangeRequestsExpiredBefore(before: Date) {
  let deletedCount = 0;

  while (true) {
    const batch = db
      .select({ id: emailChangeRequests.id })
      .from(emailChangeRequests)
      .where(lt(emailChangeRequests.expiresAt, before))
      .limit(DELETE_BATCH_SIZE);

    const deleted = await db
      .delete(emailChangeRequests)
      .where(inArray(emailChangeRequests.id, batch))
      .returning({ id: emailChangeRequests.id });

    deletedCount += deleted.length;

    if (deleted.length < DELETE_BATCH_SIZE) {
      return deletedCount;
    }
  }
}
