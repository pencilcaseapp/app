/** How long a deleted document can be restored before it is purged. */
export const DELETED_DOCUMENT_RETENTION_DAYS = 30;

/**
 * What somebody may do with a document: anyone with the link, or one
 * person invited by e-mail.
 */
export const DOCUMENT_ACCESS = ['view', 'edit'] as const;

export type DocumentAccess = typeof DOCUMENT_ACCESS[number];

/** What anyone with the link may do with a shared document. */
export const DOCUMENT_LINK_ACCESS = DOCUMENT_ACCESS;

export type DocumentLinkAccess = DocumentAccess;

/** An invite defaults to editing: inviting somebody by name is asking
 * them to work on the document, not to look at it. */
export const DEFAULT_DOCUMENT_INVITE_ACCESS: DocumentAccess = 'edit';

/**
 * Sharing a document always starts read-only, so turning the link on again
 * never hands out editing because it did the last time.
 */
export const DEFAULT_DOCUMENT_LINK_ACCESS: DocumentLinkAccess = 'view';

export const documentInviteCopies = {
  alreadyInvited: 'This address is invited already',
  owner: 'That is your own address',
  subscriptionRequired: 'Inviting people by email needs the Pro plan',
  invalidEmail: 'Enter a valid email address',
};
