import { db } from '~/db';
import { documents } from '~/db/schema';

export async function createEmptyDocument() {
  const response = await db.insert(documents).values({}).returning();
  return response[0];
}
