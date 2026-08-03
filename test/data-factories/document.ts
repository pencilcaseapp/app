import { db } from '~/db';
import { faker } from '@faker-js/faker';
import { documents } from '~/db/schema';

export async function createEmptyDocument(userId: string) {
  const [document] = await db.insert(documents).values({
    userId: userId ?? null,
  }).returning();
  return document;
}

export async function createDocumentWithTitle(userId: string) {
  const [document] = await db.insert(documents).values({
    title: faker.lorem.sentence({ min: 3, max: 10 }),
    userId: userId ?? null,
  }).returning();

  return document;
}
