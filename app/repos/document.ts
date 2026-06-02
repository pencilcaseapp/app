import { eq, sql, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { documents } from '~/db/schema';

export type Document = InferSelectModel<typeof documents>;

export async function createDocument() {
  const [document] = await db.insert(documents).values({}).returning();
  return document;
}

export async function getDocument(id: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  return db.query.documents.findFirst({
    where: {
      id,
    },
  });
}

export async function getDocumentTitle(id: string) {
  if (!isUuid(id)) {
    return null;
  }

  const doc = await db.query.documents.findFirst({
    where: {
      id,
    },
    columns: {
      title: true,
    },
  });

  return doc?.title ?? null;
}

export async function updateDocument(
  id: string,
  input: { title?: string | null; content?: Buffer<ArrayBufferLike> | null },
) {
  const { title, content } = input;

  const [document] = await db.update(documents)
    .set({ title, content, updatedAt: sql`NOW()` })
    .where(eq(documents.id, id))
    .returning();

  return document;
}
