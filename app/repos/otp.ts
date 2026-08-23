import { eq, and, gt, lt, inArray, sql, type InferSelectModel, isNull } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { otps } from '~/db/schema';

export type Otp = InferSelectModel<typeof otps>;

export async function createOtp(input: {
  email: string;
  canonicalEmail: string;
  codeHash: string;
}) {
  const { email, canonicalEmail, codeHash } = input;

  const [otp] = await db.insert(otps).values({
    email,
    canonicalEmail,
    codeHash,
  }).returning();

  return otp;
}

export async function getOtp(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.otps.findFirst({
    where: {
      id,
    },
  });
}

export async function getValidOtp(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.otps.findFirst({
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

export async function expireOtp(id: string) {
  const [otp] = await db.update(otps)
    .set({
      expiresAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(otps.id, id))
    .returning();

  return otp;
}

export async function expireAllValidOtps(canonicalEmail: string) {
  await db.update(otps)
    .set({
      expiresAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(otps.canonicalEmail, canonicalEmail),
        gt(otps.expiresAt, new Date()),
        isNull(otps.usedAt),
      ))
    .returning();
}

export async function recordFailedOtpAttempt(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  const [otp] = await db.update(otps)
    .set({
      attempts: sql`${otps.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(otps.id, id))
    .returning();

  return otp;
}

export async function markOtpAsUsed(id: string) {
  const [otp] = await db.update(otps)
    .set({
      usedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(otps.id, id))
    .returning();

  return otp;
}

const DELETE_BATCH_SIZE = 1000;

/**
 * Deletes in batches so a large backlog never turns into one long-running
 * statement holding locks on a table the sign-in flow writes to.
 */
export async function deleteOtpsExpiredBefore(before: Date) {
  let deletedCount = 0;

  while (true) {
    const batch = db
      .select({ id: otps.id })
      .from(otps)
      .where(lt(otps.expiresAt, before))
      .limit(DELETE_BATCH_SIZE);

    const deleted = await db
      .delete(otps)
      .where(inArray(otps.id, batch))
      .returning({ id: otps.id });

    deletedCount += deleted.length;

    if (deleted.length < DELETE_BATCH_SIZE) {
      return deletedCount;
    }
  }
}

export async function canRequestNewOtp(canonicalEmail: string) {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

  const count = await db.$count(
    otps,
    and(
      eq(otps.canonicalEmail, canonicalEmail),
      gt(otps.createdAt, new Date(fifteenMinutesAgo)),
    ),
  );

  return count < 3;
}
