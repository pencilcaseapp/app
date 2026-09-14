import {
  connectCollaborator,
  getDocumentForViewer,
  removeCollaboratorsForDocument,
  restoreDocument as restoreDocumentRow,
  setDocumentShared,
  softDeleteDocument,
} from '~/repos/document';
import { closeDocumentConnections } from '~/live/connections';

export enum OpenDocumentError {
  NotFound,
  PermissionDenied,
}

export interface OpenDocument {
  title: string | null;
  shared: boolean;
  isOwner: boolean;
  /** True when this open connected the viewer as a new collaborator. */
  hasJoined: boolean;
}

export type OpenDocumentResult
  = [OpenDocumentError] | [null, OpenDocument];

/**
 * Authorises a viewer for a document and connects them as a collaborator the
 * first time they open a shared one, so it appears in their navigation.
 */
export async function openDocument(
  documentId: string,
  userId?: string,
): Promise<OpenDocumentResult> {
  const document = await getDocumentForViewer(documentId, userId);

  if (!document || document.deletedAt) {
    return [OpenDocumentError.NotFound];
  }

  if (!hasAccess(document, userId)) {
    return [OpenDocumentError.PermissionDenied];
  }

  const isOwner = isOwnedBy(document, userId);
  let hasJoined = false;

  if (userId && !isOwner && !document.isCollaborator) {
    await connectCollaborator({ documentId: document.id, userId });
    hasJoined = true;
  }

  return [null, {
    title: document.title,
    shared: document.shared,
    isOwner,
    hasJoined,
  }];
}

export async function canOpenDocument(documentId: string, userId?: string) {
  const document = await getDocumentForViewer(documentId, userId);

  return !!document && !document.deletedAt && hasAccess(document, userId);
}

export enum ShareDocumentError {
  PermissionDenied,
}

export type ShareDocumentResult
  = [ShareDocumentError] | [null, { shared: boolean }];

export interface ShareDocumentInput {
  documentId: string;
  userId: string;
  shared: boolean;
}

/**
 * Shares or unshares a document. The update is scoped to the owner, so a
 * viewer who is not the owner is rejected without a separate lookup.
 */
export async function shareDocument(
  input: ShareDocumentInput,
): Promise<ShareDocumentResult> {
  const { documentId, userId, shared } = input;
  const document = await setDocumentShared({
    documentId,
    ownerId: userId,
    shared,
  });

  if (!document) {
    return [ShareDocumentError.PermissionDenied];
  }

  if (!shared) {
    await removeCollaboratorsForDocument(document.id);
    closeDocumentConnections({
      documentId: document.id,
      keepUserId: userId,
    });
  }

  return [null, { shared: document.shared }];
}

export enum DeleteDocumentError {
  PermissionDenied,
}

export type DeleteDocumentResult
  = [DeleteDocumentError] | [null, { id: string }];

/**
 * Soft deletes a document. Only the owner may delete, collaborators are
 * rejected by the owner-scoped update. Deleting also unshares: the
 * collaborators are dropped and every live connection is closed, so the
 * document is gone for everybody at once.
 */
export async function deleteDocument(
  documentId: string,
  userId: string,
): Promise<DeleteDocumentResult> {
  const document = await softDeleteDocument(documentId, userId);

  if (!document) {
    return [DeleteDocumentError.PermissionDenied];
  }

  await removeCollaboratorsForDocument(document.id);
  closeDocumentConnections({ documentId: document.id });

  return [null, { id: document.id }];
}

/**
 * Undoes a soft deletion for the owner. The document comes back private;
 * sharing it again is a separate, deliberate step.
 */
export async function restoreDocument(
  documentId: string,
  userId: string,
): Promise<DeleteDocumentResult> {
  const document = await restoreDocumentRow(documentId, userId);

  if (!document) {
    return [DeleteDocumentError.PermissionDenied];
  }

  return [null, { id: document.id }];
}

interface DocumentAccess {
  userId: string;
  shared: boolean;
}

function isOwnedBy(document: DocumentAccess, viewerId?: string) {
  return !!viewerId && document.userId === viewerId;
}

function hasAccess(document: DocumentAccess, viewerId?: string) {
  return isOwnedBy(document, viewerId) || document.shared;
}
