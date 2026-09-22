import { db } from '~/db';
import { faker } from '@faker-js/faker';
import { documentCollaborators, documents } from '~/db/schema';
import type { DocumentAccess } from '~/constants/document';

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

export async function createSharedDocument(userId: string) {
  const [document] = await db.insert(documents).values({
    title: faker.lorem.sentence({ min: 3, max: 10 }),
    linkShared: true,
    userId: userId ?? null,
  }).returning();

  return document;
}

export async function createDeletedDocument(
  userId: string,
  deletedAt: Date = faker.date.recent(),
) {
  const [document] = await db.insert(documents).values({
    title: faker.lorem.sentence({ min: 3, max: 10 }),
    deletedAt,
    userId: userId ?? null,
  }).returning();

  return document;
}

export async function connectDocumentCollaborator(
  documentId: string,
  userId: string,
) {
  const [collaborator] = await db.insert(documentCollaborators).values({
    documentId,
    source: 'link',
    userId,
  }).returning();

  return collaborator;
}

/**
 * An invite by e-mail. Without `userId` it is still pending; with one it
 * was accepted by that account.
 */
export interface InviteDocumentCollaboratorOptions {
  access?: DocumentAccess;
  /** The account the address belongs to, linked but not yet accepted. */
  userId?: string;
  /** Stamps the invite accepted by `userId`. */
  accepted?: boolean;
}

export async function inviteDocumentCollaborator(
  documentId: string,
  email: string,
  options: InviteDocumentCollaboratorOptions = {},
) {
  const { access = 'edit', userId, accepted = false } = options;
  const [collaborator] = await db.insert(documentCollaborators).values({
    documentId,
    source: 'invite',
    email,
    access,
    userId,
    acceptedAt: accepted ? new Date() : null,
  }).returning();

  return collaborator;
}
