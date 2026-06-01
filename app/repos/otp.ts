import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { otps } from '~/db/schema';

export async function createOtp(input: {
  userId: string;
  codeHash: string;
}) {
  const { userId, codeHash } = input;

  const response = await db.insert(otps).values({
    userId,
    codeHash,
  }).returning();

  return response[0];
}

export async function getOtp(id: string) {
  return db.query.otps.findFirst({
    where: {
      id,
    },
  });
}

export async function getValidOtp(id: string) {
  return db.query.otps.findFirst({
    where: {
      id,
      expiresAt: {
        gt: new Date(),
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
