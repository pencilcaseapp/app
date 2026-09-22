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

/**
 * How many invites one account may send within `DOCUMENT_INVITE_WINDOW_MS`,
 * whatever the document and whoever the address. Every invite is an e-mail
 * to an address the owner typed, so without a cap a paid account could
 * flood a mailbox; with it, inviting a whole team in one sitting still
 * fits.
 */
export const DOCUMENT_INVITE_LIMIT = 50;

export const DOCUMENT_INVITE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const documentInviteCopies = {
  alreadyInvited: 'This address is invited already',
  owner: 'That is your own address',
  subscriptionRequired: 'Inviting people by email needs the Pro plan',
  invalidEmail: 'Enter a valid email address',
  tooManyInvites: 'Too many invites. Please try again later',
};
