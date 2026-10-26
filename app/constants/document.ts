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

/**
 * How somebody came to have access to a document: they followed the
 * public link, or the owner invited their address by e-mail. The two are
 * told apart by `document_collaborators.source` rather than by which of
 * the other columns happen to be set.
 */
export const DOCUMENT_COLLABORATOR_SOURCE = ['link', 'invite'] as const;

export type DocumentCollaboratorSource
  = typeof DOCUMENT_COLLABORATOR_SOURCE[number];

/**
 * Who can open a document, as the navigation says it: nobody but the
 * owner (`private`), anyone with the link (`link`), or the people
 * invited by e-mail (`invite`). The link wins over the invites — a
 * document anyone can open is public whether or not somebody was
 * invited to it as well.
 */
export type DocumentShareState = 'private' | 'link' | 'invite';

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

/**
 * Why somebody reports a document they can open but do not own. The app
 * stores have us offer a way to report what others share (Apple 1.2,
 * Google Play's user generated content policy); the reason heads the
 * e-mail the report becomes.
 */
export const DOCUMENT_REPORT_REASONS = [
  'spam',
  'harassment',
  'sexual',
  'violence',
  'illegal',
  'intellectual-property',
  'other',
] as const;

export type DocumentReportReason = typeof DOCUMENT_REPORT_REASONS[number];

export const documentReportReasonLabels: Record<
  DocumentReportReason,
  string
> = {
  'spam': 'Spam or scam',
  'harassment': 'Harassment or hate',
  'sexual': 'Sexual content',
  'violence': 'Violence or self-harm',
  'illegal': 'Something illegal',
  'intellectual-property': 'Copyright or trademark',
  'other': 'Something else',
};

export const MAX_DOCUMENT_REPORT_DETAILS_LENGTH = 2000;

/**
 * How many reports one account may send within
 * `DOCUMENT_REPORT_WINDOW_MS`. Each one is an e-mail to our own inbox,
 * so the cap only keeps a single account from flooding it.
 */
export const DOCUMENT_REPORT_LIMIT = 10;

export const DOCUMENT_REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const documentReportCopies = {
  reasonRequired: 'Please choose a reason',
  detailsTooLong: 'Keep it under '
    + `${MAX_DOCUMENT_REPORT_DETAILS_LENGTH} characters`,
  tooManyReports: 'Too many reports. Please try again later',
  sent: 'Thanks, we received your report',
};
