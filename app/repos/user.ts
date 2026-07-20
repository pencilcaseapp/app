import { eq, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { users } from '~/db/schema';
import { sessions } from '~/db/schema';

export type User = InferSelectModel<typeof users>;

export type UserSession = InferSelectModel<typeof sessions>;

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
}) {
  const { email, name, newsletter, onboarded } = input;
  const response = await db.update(users)
    .set({
      email,
      name,
      newsletter,
      onboarded,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return response[0];
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

export async function getUserBySessionTokenHash(tokenHash: string) {
  return db.query.users.findFirst({
    where: {
      sessions: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    },
  });
}
