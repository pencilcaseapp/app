import { eq } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { users } from '~/db/schema';

export async function createUser(input: {
  email: string;
  name?: string;
  newsletter?: boolean;
}) {
  const { email, name, newsletter } = input;
  const response = await db.insert(users).values({
    email,
    name,
    newsletter,
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
}) {
  const { email, name, newsletter } = input;
  const response = await db.update(users)
    .set({
      email,
      name,
      newsletter,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return response[0];
}
