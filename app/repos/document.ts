import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type InferSelectModel,
} from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import {
  DEFAULT_DOCUMENT_LINK_ACCESS,
  type DocumentAccess,
  type DocumentLinkAccess,
} from '~/constants/document';
import { db } from '~/db';
import { documentCollaborators, documents, users } from '~/db/schema';

export type Document = InferSelectModel<typeof documents>;

export type DocumentCollaborator
  = InferSelectModel<typeof documentCollaborators>;

/** Who is looking at a document: the id and address of the session's user. */
export interface DocumentViewer {
  id: string;
  email: string;
}

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
 * Reads the document alongside the viewer's collaborator row in a single
 * query. The row is theirs by user id, or by address for an invite nobody
 * has accepted yet — an invite the viewer accepted and a connection they
 * made through the link can both exist for a moment, and the invite is
 * the one that counts. Leaves out `content`, which only the live server
 * needs.
 */
export async function getDocumentForViewer(
  id: string,
  viewer?: DocumentViewer,
) {
  if (!isUuid(id)) {
    return undefined;
  }

  const isViewer = viewer && isUuid(viewer.id)
    ? or(
        eq(documentCollaborators.userId, viewer.id),
        and(
          isNull(documentCollaborators.userId),
          eq(documentCollaborators.email, viewer.email),
        ),
      )
    : sql`FALSE`;

  const rows = await db.select({
    id: documents.id,
    title: documents.title,
    linkShared: documents.linkShared,
    linkAccess: documents.linkAccess,
    userId: documents.userId,
    deletedAt: documents.deletedAt,
    collaborator: {
      id: documentCollaborators.id,
      source: documentCollaborators.source,
      userId: documentCollaborators.userId,
      email: documentCollaborators.email,
      access: documentCollaborators.access,
      acceptedAt: documentCollaborators.acceptedAt,
    },
  })
    .from(documents)
    .leftJoin(documentCollaborators, and(
      eq(documentCollaborators.documentId, documents.id),
      isViewer,
    ))
    .where(eq(documents.id, id));

  return rows.find(row => row.collaborator?.source === 'invite') ?? rows[0];
}

export type DocumentForViewer
  = NonNullable<Awaited<ReturnType<typeof getDocumentForViewer>>>;

/**
 * The people invited by e-mail, oldest invite first, with the name of
 * those who have accepted. Connections made through the link are left
 * out: they are not the owner's doing and the panel does not list them.
 */
export async function getInvitedCollaborators(documentId: string) {
  if (!isUuid(documentId)) {
    return [];
  }

  return db.select({
    id: documentCollaborators.id,
    userId: documentCollaborators.userId,
    email: sql<string>`${documentCollaborators.email}`,
    access: sql<DocumentAccess>`${documentCollaborators.access}`,
    acceptedAt: documentCollaborators.acceptedAt,
    name: users.name,
  })
    .from(documentCollaborators)
    .leftJoin(users, eq(users.id, documentCollaborators.userId))
    .where(and(
      eq(documentCollaborators.documentId, documentId),
      eq(documentCollaborators.source, 'invite'),
    ))
    .orderBy(asc(documentCollaborators.createdAt));
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
    linkShared: documents.linkShared,
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

/**
 * How many documents the user created themselves, deleted ones left out.
 * The free plan's usage meter counts these, so a shared document somebody
 * else owns does not eat into the allowance.
 */
export async function countOwnedDocuments(userId: string) {
  if (!isUuid(userId)) {
    return 0;
  }

  const [row] = await db.select({ count: count() })
    .from(documents)
    .where(and(
      eq(documents.userId, userId),
      isNull(documents.deletedAt),
    ));

  return row?.count ?? 0;
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

export interface SetDocumentLinkSharedInput {
  documentId: string;
  ownerId: string;
  linkShared: boolean;
}

/**
 * Turns the link on or off, only when the document belongs to `ownerId`, so
 * the authorisation check does not need a query of its own. Returns
 * `undefined` when the document does not exist, is deleted, or is owned by
 * somebody else. Turning the link on resets the link access, so a link
 * turned on again never hands out editing because it did the last time.
 * Like the soft deletion this leaves `updatedAt` alone: sharing is not an
 * edit and should not move the document in the navigation.
 */
export async function setDocumentLinkShared(
  input: SetDocumentLinkSharedInput,
) {
  const { documentId, ownerId, linkShared } = input;

  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ linkShared, linkAccess: DEFAULT_DOCUMENT_LINK_ACCESS })
    .where(and(
      eq(documents.id, documentId),
      eq(documents.userId, ownerId),
      isNull(documents.deletedAt),
    ))
    .returning({
      id: documents.id,
      linkShared: documents.linkShared,
      linkAccess: documents.linkAccess,
    });

  return document;
}

export interface SetDocumentLinkAccessInput {
  documentId: string;
  ownerId: string;
  linkAccess: DocumentLinkAccess;
}

/**
 * Changes what anyone with the link may do. Owner scoped like
 * `setDocumentLinkShared` and only for a document whose link is on, and it
 * leaves `updatedAt` alone for the same reason.
 */
export async function setDocumentLinkAccess(
  input: SetDocumentLinkAccessInput,
) {
  const { documentId, ownerId, linkAccess } = input;

  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ linkAccess })
    .where(and(
      eq(documents.id, documentId),
      eq(documents.userId, ownerId),
      eq(documents.linkShared, true),
      isNull(documents.deletedAt),
    ))
    .returning({
      id: documents.id,
      linkAccess: documents.linkAccess,
    });

  return document;
}

/**
 * Marks the document deleted and turns the link off in the same update.
 * Scoped to the owner like `setDocumentLinkShared`; returns `undefined` when
 * the document does not exist or belongs to somebody else. Neither this
 * nor the restore touches `updatedAt`: the content did not change, and a
 * restored document should land back where it was in the navigation.
 */
export async function softDeleteDocument(documentId: string, ownerId: string) {
  if (!isUuid(documentId) || !isUuid(ownerId)) {
    return undefined;
  }

  const [document] = await db.update(documents)
    .set({ deletedAt: sql`NOW()`, linkShared: false })
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

const PURGE_BATCH_SIZE = 1000;

/**
 * Hard deletes documents that were soft deleted before the given date, in
 * batches so a backlog never turns into one long statement. Deleting drops
 * the collaborators already; clearing them again here keeps the foreign
 * key satisfied whatever state a row is in.
 */
export async function purgeDocumentsDeletedBefore(before: Date) {
  let deletedCount = 0;

  while (true) {
    const batch = await db
      .select({ id: documents.id })
      .from(documents)
      .where(lt(documents.deletedAt, before))
      .limit(PURGE_BATCH_SIZE);
    const ids = batch.map(document => document.id);

    if (ids.length === 0) {
      return deletedCount;
    }

    await db.transaction(async (tx) => {
      await tx.delete(documentCollaborators)
        .where(inArray(documentCollaborators.documentId, ids));
      await tx.delete(documents).where(inArray(documents.id, ids));
    });

    deletedCount += ids.length;

    if (ids.length < PURGE_BATCH_SIZE) {
      return deletedCount;
    }
  }
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
      source: 'link',
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

/**
 * Drops the connections made through the link, which is what turning the
 * link off takes back. The people invited by e-mail keep their rows.
 */
export async function removeLinkCollaborators(documentId: string) {
  if (!isUuid(documentId)) {
    return;
  }

  await db.delete(documentCollaborators)
    .where(and(
      eq(documentCollaborators.documentId, documentId),
      eq(documentCollaborators.source, 'link'),
    ));
}

export interface InviteCollaboratorInput {
  documentId: string;
  email: string;
  access: DocumentAccess;
  /** The account the address already belongs to, when there is one. */
  userId?: string;
}

/**
 * Records an invite. When the address belongs to somebody who already
 * followed the link, their connection becomes the invite instead of a
 * second row for the same person. Returns `undefined` when the address or
 * the person is invited already.
 */
export async function inviteCollaborator(input: InviteCollaboratorInput) {
  const { documentId, email, access, userId } = input;

  if (!isUuid(documentId) || (userId && !isUuid(userId))) {
    return undefined;
  }

  const invited = await db.query.documentCollaborators.findFirst({
    where: { documentId, email },
    columns: { id: true },
  });

  if (invited) {
    return undefined;
  }

  const [collaborator] = await db.insert(documentCollaborators)
    .values({ documentId, source: 'invite', email, access, userId })
    .onConflictDoUpdate({
      target: [
        documentCollaborators.documentId,
        documentCollaborators.userId,
      ],
      set: { source: 'invite', email, access, updatedAt: sql`NOW()` },
      setWhere: eq(documentCollaborators.source, 'link'),
    })
    .returning();

  return collaborator;
}

export interface AcceptInviteInput {
  collaboratorId: string;
  userId: string;
}

/**
 * Stamps an invite accepted and ties it to the account that opened the
 * document with the invited address. A connection the same account made
 * through the link in the meantime goes, so the pair of document and user
 * stays unique.
 */
export async function acceptInvite(input: AcceptInviteInput) {
  const { collaboratorId, userId } = input;

  if (!isUuid(collaboratorId) || !isUuid(userId)) {
    return undefined;
  }

  return db.transaction(async (tx) => {
    const invite = await tx.query.documentCollaborators.findFirst({
      where: {
        id: collaboratorId,
        source: 'invite',
        acceptedAt: { isNull: true },
      },
      columns: { documentId: true },
    });

    if (!invite) {
      return undefined;
    }

    await tx.delete(documentCollaborators)
      .where(and(
        eq(documentCollaborators.documentId, invite.documentId),
        eq(documentCollaborators.userId, userId),
        eq(documentCollaborators.source, 'link'),
      ));

    const [collaborator] = await tx.update(documentCollaborators)
      .set({ userId, acceptedAt: sql`NOW()`, updatedAt: sql`NOW()` })
      .where(eq(documentCollaborators.id, collaboratorId))
      .returning();

    return collaborator;
  });
}

export interface OwnedCollaboratorInput {
  documentId: string;
  ownerId: string;
  collaboratorId: string;
}

/**
 * The collaborator row belongs to a document `ownerId` owns and has not
 * deleted, which lets the updates below carry their authorisation check
 * like `setDocumentLinkShared` does.
 */
function ownedCollaborator(input: OwnedCollaboratorInput) {
  const { documentId, ownerId, collaboratorId } = input;

  return and(
    eq(documentCollaborators.id, collaboratorId),
    eq(documentCollaborators.documentId, documentId),
    exists(
      db.select({ one: sql`1` })
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.userId, ownerId),
          isNull(documents.deletedAt),
        )),
    ),
  );
}

export interface SetCollaboratorAccessInput extends OwnedCollaboratorInput {
  access: DocumentAccess;
}

/**
 * Changes what an invited person may do. Returns `undefined` when the row
 * is not an invite of a document the owner may change.
 */
export async function setCollaboratorAccess(
  input: SetCollaboratorAccessInput,
) {
  const { documentId, ownerId, collaboratorId, access } = input;

  if (!isUuid(documentId) || !isUuid(ownerId) || !isUuid(collaboratorId)) {
    return undefined;
  }

  const [collaborator] = await db.update(documentCollaborators)
    .set({ access, updatedAt: sql`NOW()` })
    .where(and(
      ownedCollaborator({ documentId, ownerId, collaboratorId }),
      eq(documentCollaborators.source, 'invite'),
    ))
    .returning({
      id: documentCollaborators.id,
      userId: documentCollaborators.userId,
      access: sql<DocumentAccess>`${documentCollaborators.access}`,
    });

  return collaborator;
}

/**
 * Takes somebody's access away for good: the row is deleted, so a
 * removed person can be invited afresh. Returns `undefined` when the row
 * does not belong to a document the owner may change.
 */
export async function removeCollaborator(input: OwnedCollaboratorInput) {
  const { documentId, ownerId, collaboratorId } = input;

  if (!isUuid(documentId) || !isUuid(ownerId) || !isUuid(collaboratorId)) {
    return undefined;
  }

  const [collaborator] = await db.delete(documentCollaborators)
    .where(ownedCollaborator({ documentId, ownerId, collaboratorId }))
    .returning({
      id: documentCollaborators.id,
      userId: documentCollaborators.userId,
    });

  return collaborator;
}
