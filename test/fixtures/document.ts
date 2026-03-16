import { db } from '~/db';
import { faker } from '@faker-js/faker';
import { documents } from '~/db/schema';

export async function createEmptyDocument() {
  const response = await db.insert(documents).values({}).returning();
  return response[0];
}

export async function createDocumentWithTitle() {
  const response = await db.insert(documents).values({
    title: faker.lorem.sentence({ min: 3, max: 10 }),
  }).returning();

  return response[0];
}
