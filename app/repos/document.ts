import {
  and,
  desc,
  eq,
  exists,
  isNotNull,
  isNull,
  or,
  sql,
  type InferSelectModel,
} from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { documentCollaborators, documents } from '~/db/schema';

export type Document = InferSelectModel<typeof documents>;

export type DocumentCollaborator
  = InferSelectModel<typeof documentCollaborators>;

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

/**
 * Reads the document alongside the viewer's collaborator status in a single
 * query. Leaves out `content`, which only the live server needs.
 */
export async function getDocumentForViewer(id: string, viewerId?: string) {
  if (!isUuid(id)) {
    return undefined;
  }

  const collaborates = viewerId && isUuid(viewerId)
    ? exists(
        db.select({ one: sql`1` })
          .from(documentCollaborators)
          .where(and(
            eq(documentCollaborators.documentId, documents.id),
            eq(documentCollaborators.userId, viewerId),
          )),
      )
    : sql`FALSE`;

  const [document] = await db.select({
    id: documents.id,
    title: documents.title,
    shared: documents.shared,
    userId: documents.userId,
    deletedAt: documents.deletedAt,
    isCollaborator: sql<boolean>`${collaborates}`,
  })
    .from(documents)
    .where(eq(documents.id, id));

  return document;
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

/**
 * The documents the user owns or collaborates on, deleted ones left out.
 */
export async function getDocumentList(userId: string) {
  if (!isUuid(userId)) {
    return [];
  }

  return db.select({
    id: documents.id,
    title: documents.title,
    shared: documents.shared,
    userId: documents.userId,
  })
    .from(documents)
    .where(and(
      isNull(documents.deletedAt),
      or(
        eq(documents.userId, userId),
        exists(
          db.select({ one: sql`1` })
            .from(documentCollaborators)
            .where(and(
              eq(documentCollaborators.documentId, documents.id),
              eq(documentCollaborators.userId, userId),
            )),
        ),
      ),
    ))
    .orderBy(desc(documents.updatedAt));
}

/**
 * The deleted documents the user owns. Deleting drops the collaborators, so
 * a document somebody else deleted never shows up here.
 */
export async function getDeletedDocumentList(userId: string) {
  if (!isUuid(userId)) {
    return [];
  }

  return db.select({
    id: documents.id,
    title: documents.title,
  })
    .from(documents)
    .where(and(
      eq(documents.userId, userId),
      isNotNull(documents.deletedAt),
    ))
    .orderBy(desc(documents.deletedAt));
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

export interface SetDocumentSharedInput {
  documentId: string;
  ownerId: string;
  shared: boolean;
}

/**
 * Flips the shared flag only when the document belongs to `ownerId`, so the
 * authorisation check does not need a query of its own. Returns `undefined`
 * when the document does not exist, is deleted, or is owned by somebody else.
 */
export async function setDocumentShared(input: SetDocumentSharedInput) {
  const { documentId, ownerId, shared } = input;

  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ shared, updatedAt: sql`NOW()` })
    .where(and(
      eq(documents.id, documentId),
      eq(documents.userId, ownerId),
      isNull(documents.deletedAt),
    ))
    .returning({
      id: documents.id,
      shared: documents.shared,
    });

  return document;
}

/**
 * Marks the document deleted and turns sharing off in the same update.
 * Scoped to the owner like `setDocumentShared`; returns `undefined` when
 * the document does not exist or belongs to somebody else. Neither this
 * nor the restore touches `updatedAt`: the content did not change, and a
 * restored document should land back where it was in the navigation.
 */
export async function softDeleteDocument(documentId: string, ownerId: string) {
  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ deletedAt: sql`NOW()`, shared: false })
    .where(and(
      eq(documents.id, documentId),
      eq(documents.userId, ownerId),
    ))
    .returning({
      id: documents.id,
      deletedAt: documents.deletedAt,
    });

  return document;
}

/**
 * Undoes the soft deletion. Sharing stays off — the owner has to share the
 * document again on purpose.
 */
export async function restoreDocument(documentId: string, ownerId: string) {
  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ deletedAt: null })
    .where(and(
      eq(documents.id, documentId),
      eq(documents.userId, ownerId),
    ))
    .returning({
      id: documents.id,
      deletedAt: documents.deletedAt,
    });

  return document;
}

export interface ConnectCollaboratorInput {
  documentId: string;
  userId: string;
}

export async function connectCollaborator(input: ConnectCollaboratorInput) {
  const { documentId, userId } = input;

  if (!isUuid(documentId) || !isUuid(userId)) {
    return undefined;
  }

  const [collaborator] = await db.insert(documentCollaborators)
    .values({
      documentId,
      userId,
    })
    .onConflictDoNothing({
      target: [
        documentCollaborators.documentId,
        documentCollaborators.userId,
      ],
    })
    .returning();

  return collaborator;
}

export async function removeCollaboratorsForDocument(documentId: string) {
  if (!isUuid(documentId)) {
    return;
  }

  await db.delete(documentCollaborators)
    .where(eq(documentCollaborators.documentId, documentId));
}
