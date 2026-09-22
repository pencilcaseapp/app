import {
  DOCUMENT_INVITE_LIMIT,
  DOCUMENT_INVITE_WINDOW_MS,
  type DocumentAccess,
} from '~/constants/document';
import { EmailTemplate } from '~/constants/email';
import {
  closeDocumentConnections,
  updateDocumentAccess,
} from '~/live/connections';
import {
  getDocumentForViewer,
  getInvitedCollaborators,
  inviteCollaborator as insertInvite,
  removeCollaborator as deleteCollaborator,
  setCollaboratorAccess,
} from '~/repos/document';
import { countEmailLogsByUser } from '~/repos/email-log';
import { getUserByEmail, type User } from '~/repos/user';
import { normalizeEmail } from '~/utils/email';
import { sendEmailDocumentInvite } from './email-templates';

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
 * like the link access. Only that person's live connections are switched,
 * in place, so they get the access they have now and nobody else notices.
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
    await updateDocumentAccess({ documentId, userId: collaborator.userId });
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
