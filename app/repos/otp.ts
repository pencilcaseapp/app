import { eq, and, gt, type InferSelectModel, isNull } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { otps } from '~/db/schema';

export type Otp = InferSelectModel<typeof otps>;

export async function createOtp(input: {
  userId: string;
  email: string;
  codeHash: string;
}) {
  const { userId, email, codeHash } = input;

  const response = await db.insert(otps).values({
    userId,
    email,
    codeHash,
  }).returning();

  return response[0];
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
  const response = await db.update(otps)
    .set({
      expiresAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(otps.id, id))
    .returning();

  return response[0];
}

export async function expireAllValidOtps(email: string) {
  await db.update(otps)
    .set({
      expiresAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(otps.email, email),
        gt(otps.expiresAt, new Date()),
        isNull(otps.usedAt),
      ))
    .returning();
}

export async function markOtpAsUsed(id: string) {
  const response = await db.update(otps)
    .set({
      usedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(otps.id, id))
    .returning();

  return response[0];
}

export async function canRequestNewOtp(email: string) {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

  const count = await db.$count(
    otps,
    and(
      eq(otps.email, email),
      gt(otps.createdAt, new Date(fifteenMinutesAgo)),
    ),
  );

  return count < 3;
}
