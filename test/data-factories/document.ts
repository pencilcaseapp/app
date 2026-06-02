import { db } from '~/db';
import { faker } from '@faker-js/faker';
import { documents } from '~/db/schema';

export async function createEmptyDocument() {
  const [document] = await db.insert(documents).values({}).returning();
  return document;
}

export async function createDocumentWithTitle() {
  const [document] = await db.insert(documents).values({
    title: faker.lorem.sentence({ min: 3, max: 10 }),
  }).returning();

  return document;
}
