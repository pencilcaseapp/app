import {
  acceptInvite,
  connectCollaborator,
  getDocumentForViewer,
  removeLinkCollaborators,
  restoreDocument as restoreDocumentRow,
  setDocumentLinkAccess,
  setDocumentLinkShared,
  softDeleteDocument,
  type DocumentForViewer,
  type DocumentViewer,
} from '~/repos/document';
import { closeDocumentConnections } from '~/live/connections';
import type { DocumentLinkAccess } from '~/constants/document';

export type { DocumentViewer } from '~/repos/document';

export enum OpenDocumentError {
  NotFound,
  PermissionDenied,
}

export interface OpenDocument {
  title: string | null;
  /** True when the document is published to anyone with the link. */
  linkShared: boolean;
  /** What anyone with the link may do while the link is on. */
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
 * first time they open a shared one, so it appears in their navigation. An
 * invite is accepted the same way: opening the document while signed in
 * with the invited address ties the invite to the account.
 */
export async function openDocument(
  documentId: string,
  viewer?: DocumentViewer,
): Promise<OpenDocumentResult> {
  const document = await getDocumentForViewer(documentId, viewer);

  if (!document || isGone(document, viewer)) {
    return [OpenDocumentError.NotFound];
  }

  if (!hasAccess(document, viewer)) {
    return [OpenDocumentError.PermissionDenied];
  }

  const isOwner = isOwnedBy(document, viewer);
  let hasJoined = false;

  if (viewer && !isOwner && !document.collaborator) {
    await connectCollaborator({ documentId: document.id, userId: viewer.id });
    hasJoined = true;
  }

  if (viewer && isPendingInvite(document.collaborator)) {
    await acceptInvite({
      collaboratorId: document.collaborator.id,
      userId: viewer.id,
    });
    hasJoined = true;
  }

  return [null, {
    title: document.title,
    linkShared: document.linkShared,
    linkAccess: document.linkAccess,
    isOwner,
    deleted: document.deletedAt !== null,
    readOnly: isReadOnlyFor(document, viewer),
    hasJoined,
  }];
}

export interface LiveAccess {
  readOnly: boolean;
}

/**
 * The access a live connection gets: none, read-only for the owner of a
 * deleted document, for a link that only allows viewing and for an invite
 * that does, or full.
 */
export async function getLiveAccess(
  documentId: string,
  viewer?: DocumentViewer,
): Promise<LiveAccess | undefined> {
  const document = await getDocumentForViewer(documentId, viewer);

  if (!document || isGone(document, viewer) || !hasAccess(document, viewer)) {
    return undefined;
  }

  return { readOnly: isReadOnlyFor(document, viewer) };
}

export enum ShareDocumentError {
  PermissionDenied,
}

export type ShareDocumentResult
  = [ShareDocumentError]
    | [null, { linkShared: boolean; linkAccess: DocumentLinkAccess }];

export interface ShareDocumentInput {
  documentId: string;
  userId: string;
  linkShared: boolean;
}

/**
 * Turns the public link on or off. The update is scoped to the owner, so a
 * viewer who is not the owner is rejected without a separate lookup. It also
 * puts the link access back to viewing, so a link turned on always starts
 * read-only. Turning it off takes back what the link handed out and nothing
 * else: the people invited by e-mail keep their access, and reconnect after
 * the close like everybody else.
 */
export async function shareDocument(
  input: ShareDocumentInput,
): Promise<ShareDocumentResult> {
  const { documentId, userId, linkShared } = input;
  const document = await setDocumentLinkShared({
    documentId,
    ownerId: userId,
    linkShared,
  });

  if (!document) {
    return [ShareDocumentError.PermissionDenied];
  }

  if (!linkShared) {
    await removeLinkCollaborators(document.id);
    closeDocumentConnections({
      documentId: document.id,
      keepUserId: userId,
    });
  }

  return [null, {
    linkShared: document.linkShared,
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
 * `shareDocument`, and refused for a document whose link is off: there is
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
 * rejected by the owner-scoped update. Deleting also turns the link off: the
 * connections made through the link are dropped and every live connection
 * is closed, so the document is gone for everybody at once. The invites
 * stay, and come back with the document when it is restored.
 */
export async function deleteDocument(
  documentId: string,
  userId: string,
): Promise<DeleteDocumentResult> {
  const document = await softDeleteDocument(documentId, userId);

  if (!document) {
    return [DeleteDocumentError.PermissionDenied];
  }

  await removeLinkCollaborators(document.id);
  closeDocumentConnections({ documentId: document.id });

  return [null, { id: document.id }];
}

/**
 * Undoes a soft deletion for the owner. The document comes back private;
 * turning the link on again is a separate, deliberate step. The owner's
 * read-only connections are closed like on delete, so the editor reconnects
 * with full access the same way in both directions.
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

type DocumentAccessInfo = Pick<
  DocumentForViewer,
  'userId' | 'linkShared' | 'linkAccess' | 'deletedAt' | 'collaborator'
>;

function isOwnedBy(document: DocumentAccessInfo, viewer?: DocumentViewer) {
  return !!viewer && document.userId === viewer.id;
}

/** A deleted document only still exists for its owner. */
function isGone(document: DocumentAccessInfo, viewer?: DocumentViewer) {
  return document.deletedAt !== null && !isOwnedBy(document, viewer);
}

/** An invite the viewer has not opened the document on yet. */
function isPendingInvite(
  collaborator: DocumentForViewer['collaborator'],
): collaborator is NonNullable<DocumentForViewer['collaborator']> {
  return collaborator?.source === 'invite' && collaborator.acceptedAt === null;
}

/** The viewer was invited by e-mail, whether or not they accepted yet. */
function isInvited(document: DocumentAccessInfo) {
  return document.collaborator?.source === 'invite';
}

function hasAccess(document: DocumentAccessInfo, viewer?: DocumentViewer) {
  return isOwnedBy(document, viewer)
    || isInvited(document)
    || document.linkShared;
}

/**
 * An invited person may do what the owner set for them, and everybody else
 * but the owner is here through the link, so the link access is what
 * decides for them. A deleted document is read-only for the owner too.
 * Both the loader and the live connection go through this, so the editor
 * never invites an edit the live server would drop.
 */
function isReadOnlyFor(document: DocumentAccessInfo, viewer?: DocumentViewer) {
  if (document.deletedAt !== null) {
    return true;
  }

  if (isOwnedBy(document, viewer)) {
    return false;
  }

  if (isInvited(document)) {
    return document.collaborator?.access === 'view';
  }

  return document.linkAccess === 'view';
}
