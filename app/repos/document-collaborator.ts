import { eq, type InferSelectModel } from 'drizzle-orm';
import { validate as isUuid } from 'uuid';
import { db } from '~/db';
import { documentCollaborators } from '~/db/schema';

export type DocumentCollaborator
  = InferSelectModel<typeof documentCollaborators>;

export interface ConnectCollaboratorInput {
  documentId: string;
  userId: string;
}

// Connects a user to a shared document. Idempotent: opening the same shared
// document again keeps the single existing membership row.
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

// Drops every collaborator connection for a document. Used when a document is
// unshared so it disappears from collaborators' navigation immediately.
export async function removeCollaboratorsForDocument(documentId: string) {
  if (!isUuid(documentId)) {
    return;
  }

  await db.delete(documentCollaborators)
    .where(eq(documentCollaborators.documentId, documentId));
}
