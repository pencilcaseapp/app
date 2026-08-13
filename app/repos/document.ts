import { eq, sql, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { documents } from '~/db/schema';

export type Document = InferSelectModel<typeof documents>;

export interface CreateDocumentInput {
  userId: string;
}

export async function createDocument(input: CreateDocumentInput) {
  const { userId } = input;
  const [document] = await db.insert(documents)
    .values({
      userId,
    })
    .returning();

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
    return undefined;
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

export async function getDocumentList(userId: string) {
  if (!isUuid(userId)) {
    return [];
  }

  const owned = await db.query.documents.findMany({
    columns: {
      id: true,
      title: true,
      updatedAt: true,
    },
    where: {
      userId,
    },
  });

  // Documents shared with the user get connected to their account through the
  // collaborators join table, so they surface in the same navigation list.
  const collaborations = await db.query.documentCollaborators.findMany({
    columns: {},
    where: {
      userId,
    },
    with: {
      document: {
        columns: {
          id: true,
          title: true,
          updatedAt: true,
        },
      },
    },
  });

  const collaboratorDocuments = collaborations.map(
    collaboration => collaboration.document,
  );

  const documentsById = new Map(
    [...owned, ...collaboratorDocuments].map(
      document => [document.id, document],
    ),
  );

  return [...documentsById.values()]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map(({ id, title }) => ({ id, title }));
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

export async function setDocumentShared(id: string, shared: boolean) {
  if (!isUuid(id)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ shared, updatedAt: sql`NOW()` })
    .where(eq(documents.id, id))
    .returning();

  return document;
}
