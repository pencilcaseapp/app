import {
  DOCUMENT_INVITE_LIMIT,
  DOCUMENT_INVITE_WINDOW_MS,
  type DocumentAccess,
  type DocumentLinkAccess,
} from '~/constants/document';
import { EmailTemplate } from '~/constants/email';
import { FREE_DOCUMENT_LIMIT } from '~/constants/subscription';
import { deleteObjects } from '~/clients/storage';
import { closeDocumentConnections } from '~/live/connections';
import {
  acceptInvite,
  connectCollaborator,
  countOwnedDocuments,
  createDocument as createDocumentRow,
  getDocumentForViewer,
  getDocumentIdsDeletedBefore,
  getInvitedCollaborators,
  hardDeleteDocuments,
  inviteCollaborator as insertInvite,
  removeCollaborator as deleteCollaborator,
  removeLinkCollaborators,
  restoreDocument as restoreDocumentRow,
  setCollaboratorAccess,
  setDocumentLinkAccess,
  setDocumentLinkShared,
  softDeleteDocument,
  type DocumentForViewer,
  type DocumentViewer,
} from '~/repos/document';
import { deleteAssetsOfDocuments, getAssetsOfDocuments } from '~/repos/document-asset';
import { countEmailLogsByUser } from '~/repos/email-log';
import { getUserByEmail, type User } from '~/repos/user';
import { normalizeEmail } from '~/utils/email';
import { sendEmailDocumentInvite } from './email-templates';

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

export interface InvitedCollaborator {
  id: string;
  name: string | null;
  email: string;
  access: DocumentAccess;
  /** True until the invited address has opened the document. */
  pending: boolean;
}

/** The people the owner invited by e-mail, for the share panel. */
export async function listInvitedCollaborators(
  documentId: string,
): Promise<InvitedCollaborator[]> {
  const collaborators = await getInvitedCollaborators(documentId);

  return collaborators.map(collaborator => ({
    id: collaborator.id,
    name: collaborator.name,
    email: collaborator.email,
    access: collaborator.access,
    pending: collaborator.acceptedAt === null,
  }));
}

export enum InviteCollaboratorError {
  PermissionDenied,
  SubscriptionRequired,
  Owner,
  TooManyInvites,
  AlreadyInvited,
}

export type InviteCollaboratorResult
  = [InviteCollaboratorError] | [null, { email: string }];

export interface InviteCollaboratorInput {
  documentId: string;
  user: User;
  email: string;
  access: DocumentAccess;
}

/**
 * Invites somebody to a document by e-mail, which only the owner of the
 * document may do and only on the paid plan. The invite is recorded first
 * and the e-mail carries its id as the idempotency scope, so a retried
 * send never goes out twice while an invite sent afresh after a removal
 * does. The address is stored the way sign-in stores it, which is what
 * lets the invite find its account later. The invites one account may
 * send in a day are capped like the codes, counted from the e-mail log
 * rather than the collaborators, because removing an invite deletes its
 * row and would otherwise reset the count.
 */
export async function inviteCollaborator(
  input: InviteCollaboratorInput,
): Promise<InviteCollaboratorResult> {
  const { documentId, user, access } = input;
  const email = normalizeEmail(input.email);
  const document = await getDocumentForViewer(documentId, user);

  if (!document || document.userId !== user.id || document.deletedAt) {
    return [InviteCollaboratorError.PermissionDenied];
  }

  if (!user.hasSubscription) {
    return [InviteCollaboratorError.SubscriptionRequired];
  }

  if (email === normalizeEmail(user.email)) {
    return [InviteCollaboratorError.Owner];
  }

  if (!await canInvite(user.id)) {
    return [InviteCollaboratorError.TooManyInvites];
  }

  const invitee = await getUserByEmail(email);
  const invite = await insertInvite({
    documentId: document.id,
    email,
    access,
    userId: invitee?.id,
  });

  if (!invite) {
    return [InviteCollaboratorError.AlreadyInvited];
  }

  await sendEmailDocumentInvite({
    to: { email },
    inviteId: invite.id,
    documentId: document.id,
    documentTitle: document.title,
    inviterName: user.name ?? user.email,
    inviterId: user.id,
  });

  return [null, { email }];
}

async function canInvite(userId: string) {
  const count = await countEmailLogsByUser({
    userId,
    template: EmailTemplate.DocumentInvite,
    since: new Date(Date.now() - DOCUMENT_INVITE_WINDOW_MS),
  });

  return count < DOCUMENT_INVITE_LIMIT;
}

export enum ChangeCollaboratorAccessError {
  PermissionDenied,
}

export type ChangeCollaboratorAccessResult
  = [ChangeCollaboratorAccessError] | [null, { access: DocumentAccess }];

export interface ChangeCollaboratorAccessInput {
  documentId: string;
  userId: string;
  collaboratorId: string;
  access: DocumentAccess;
}

/**
 * Changes what an invited person may do. Owner scoped through the update
 * like the link access. Only that person's live connections are closed, so
 * they reconnect with the access they have now and nobody else notices.
 */
export async function changeCollaboratorAccess(
  input: ChangeCollaboratorAccessInput,
): Promise<ChangeCollaboratorAccessResult> {
  const { documentId, userId, collaboratorId, access } = input;
  const collaborator = await setCollaboratorAccess({
    documentId,
    ownerId: userId,
    collaboratorId,
    access,
  });

  if (!collaborator) {
    return [ChangeCollaboratorAccessError.PermissionDenied];
  }

  if (collaborator.userId) {
    closeDocumentConnections({ documentId, userId: collaborator.userId });
  }

  return [null, { access: collaborator.access }];
}

export enum RemoveCollaboratorError {
  PermissionDenied,
}

export type RemoveCollaboratorResult
  = [RemoveCollaboratorError] | [null, { id: string }];

export interface RemoveCollaboratorInput {
  documentId: string;
  userId: string;
  collaboratorId: string;
}

/**
 * Takes an invited person's access away. The row is hard deleted and
 * their live connections are closed, so the document is gone for them at
 * once — unless the link is on, in which case they are back to what
 * anyone with the link gets.
 */
export async function removeCollaborator(
  input: RemoveCollaboratorInput,
): Promise<RemoveCollaboratorResult> {
  const { documentId, userId, collaboratorId } = input;
  const collaborator = await deleteCollaborator({
    documentId,
    ownerId: userId,
    collaboratorId,
  });

  if (!collaborator) {
    return [RemoveCollaboratorError.PermissionDenied];
  }

  if (collaborator.userId) {
    closeDocumentConnections({ documentId, userId: collaborator.userId });
  }

  return [null, { id: collaborator.id }];
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

/**
 * A free account may own `FREE_DOCUMENT_LIMIT` documents at a time. The
 * deleted ones do not count, so deleting one frees a place again.
 */
export function hasReachedDocumentLimit(
  user: Pick<User, 'hasSubscription'>,
  ownedDocumentCount: number,
) {
  return !user.hasSubscription && ownedDocumentCount >= FREE_DOCUMENT_LIMIT;
}

export enum CreateDocumentError {
  LimitReached,
}

export type CreateDocumentResult
  = [CreateDocumentError] | [null, { id: string }];

export async function createDocument(
  user: Pick<User, 'id' | 'hasSubscription'>,
): Promise<CreateDocumentResult> {
  const ownedDocumentCount = user.hasSubscription
    ? 0
    : await countOwnedDocuments(user.id);

  if (hasReachedDocumentLimit(user, ownedDocumentCount)) {
    return [CreateDocumentError.LimitReached];
  }

  const document = await createDocumentRow({ userId: user.id });

  return [null, { id: document.id }];
}

const PURGE_BATCH_SIZE = 1000;

/**
 * Hard deletes documents that were soft deleted before the given date, in
 * batches so a backlog never turns into one long statement. Their files go
 * from the bucket before their rows, so a failure halfway leaves rows to
 * retry with rather than files nothing points at any more.
 */
export async function purgeDeletedDocuments(before: Date) {
  let deletedCount = 0;

  while (true) {
    const ids = await getDocumentIdsDeletedBefore(before, PURGE_BATCH_SIZE);

    if (ids.length === 0) {
      return deletedCount;
    }

    const assets = await getAssetsOfDocuments(ids);
    await deleteObjects(assets.map(asset => asset.storageKey));
    await deleteAssetsOfDocuments(ids);
    await hardDeleteDocuments(ids);

    deletedCount += ids.length;

    if (ids.length < PURGE_BATCH_SIZE) {
      return deletedCount;
    }
  }
}
