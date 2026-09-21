import {
  connectCollaborator,
  getDocumentForViewer,
  removeCollaboratorsForDocument,
  restoreDocument as restoreDocumentRow,
  setDocumentLinkAccess,
  setDocumentShared,
  softDeleteDocument,
} from '~/repos/document';
import { closeDocumentConnections } from '~/live/connections';
import type { DocumentLinkAccess } from '~/constants/document';

export enum OpenDocumentError {
  NotFound,
  PermissionDenied,
}

export interface OpenDocument {
  title: string | null;
  shared: boolean;
  /** What anyone with the link may do while the document is shared. */
  linkAccess: DocumentLinkAccess;
  isOwner: boolean;
  /** A deleted document opens read-only, and only for its owner. */
  deleted: boolean;
  /** True when the viewer may read the document but not change it. */
  readOnly: boolean;
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

  if (!document || isGone(document, userId)) {
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
    linkAccess: document.linkAccess,
    isOwner,
    deleted: document.deletedAt !== null,
    readOnly: isReadOnlyFor(document, userId),
    hasJoined,
  }];
}

export interface LiveAccess {
  readOnly: boolean;
}

/**
 * The access a live connection gets: none, read-only for the owner of a
 * deleted document and for a link that only allows viewing, or full.
 */
export async function getLiveAccess(
  documentId: string,
  userId?: string,
): Promise<LiveAccess | undefined> {
  const document = await getDocumentForViewer(documentId, userId);

  if (!document || isGone(document, userId) || !hasAccess(document, userId)) {
    return undefined;
  }

  return { readOnly: isReadOnlyFor(document, userId) };
}

export enum ShareDocumentError {
  PermissionDenied,
}

export type ShareDocumentResult
  = [ShareDocumentError]
    | [null, { shared: boolean; linkAccess: DocumentLinkAccess }];

export interface ShareDocumentInput {
  documentId: string;
  userId: string;
  shared: boolean;
}

/**
 * Shares or unshares a document. The update is scoped to the owner, so a
 * viewer who is not the owner is rejected without a separate lookup. It also
 * puts the link access back to viewing, so sharing always starts read-only.
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

  return [null, {
    shared: document.shared,
    linkAccess: document.linkAccess,
  }];
}

export enum ChangeLinkAccessError {
  PermissionDenied,
}

export type ChangeLinkAccessResult
  = [ChangeLinkAccessError] | [null, { linkAccess: DocumentLinkAccess }];

export interface ChangeLinkAccessInput {
  documentId: string;
  userId: string;
  linkAccess: DocumentLinkAccess;
}

/**
 * Changes what anyone with the link may do. Owner scoped like
 * `shareDocument`, and refused for a document that is not shared: there is
 * no link to give access to. Everybody else's live connections are closed so
 * they reconnect with the access they have now instead of keeping the one
 * they opened the document with.
 */
export async function changeLinkAccess(
  input: ChangeLinkAccessInput,
): Promise<ChangeLinkAccessResult> {
  const { documentId, userId, linkAccess } = input;
  const document = await setDocumentLinkAccess({
    documentId,
    ownerId: userId,
    linkAccess,
  });

  if (!document) {
    return [ChangeLinkAccessError.PermissionDenied];
  }

  closeDocumentConnections({
    documentId: document.id,
    keepUserId: userId,
  });

  return [null, { linkAccess: document.linkAccess }];
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
 * sharing it again is a separate, deliberate step. The owner's read-only
 * connections are closed like on delete, so the editor reconnects with
 * full access the same way in both directions.
 */
export async function restoreDocument(
  documentId: string,
  userId: string,
): Promise<DeleteDocumentResult> {
  const document = await restoreDocumentRow(documentId, userId);

  if (!document) {
    return [DeleteDocumentError.PermissionDenied];
  }

  closeDocumentConnections({ documentId: document.id });

  return [null, { id: document.id }];
}

interface DocumentAccess {
  userId: string;
  shared: boolean;
  linkAccess: DocumentLinkAccess;
  deletedAt: Date | null;
}

function isOwnedBy(document: DocumentAccess, viewerId?: string) {
  return !!viewerId && document.userId === viewerId;
}

/** A deleted document only still exists for its owner. */
function isGone(document: DocumentAccess, viewerId?: string) {
  return document.deletedAt !== null && !isOwnedBy(document, viewerId);
}

function hasAccess(document: DocumentAccess, viewerId?: string) {
  return isOwnedBy(document, viewerId) || document.shared;
}

/**
 * Everybody but the owner is here through the link, so the link access is
 * what decides whether they may edit. A deleted document is read-only for
 * the owner too. Both the loader and the live connection go through this,
 * so the editor never invites an edit the live server would drop.
 */
function isReadOnlyFor(document: DocumentAccess, viewerId?: string) {
  if (document.deletedAt !== null) {
    return true;
  }

  return !isOwnedBy(document, viewerId) && document.linkAccess === 'view';
}
