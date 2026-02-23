import { eq, sql } from 'drizzle-orm';
import { db } from '~/db';
import { documents } from '~/db/schema';

export async function createDocument() {
  const response = await db.insert(documents).values({}).returning();
  return response[0];
}

export async function getDocument(id: string) {
  return db.query.documents.findFirst({
    where: {
      id,
    },
  });
}

export async function updateDocument(
  id: string,
  input: { title?: string | null; content?: Buffer<ArrayBufferLike> | null },
) {
  const { title, content } = input;

  const response = await db.update(documents)
    .set({ title, content, updatedAt: sql`NOW()` })
    .where(eq(documents.id, id))
    .returning();

  return response[0];
}
