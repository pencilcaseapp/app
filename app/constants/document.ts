/** How long a deleted document can be restored before it is purged. */
export const DELETED_DOCUMENT_RETENTION_DAYS = 30;

/** What anyone with the link may do with a shared document. */
export const DOCUMENT_LINK_ACCESS = ['view', 'edit'] as const;

export type DocumentLinkAccess = typeof DOCUMENT_LINK_ACCESS[number];

/**
 * Sharing a document always starts read-only, so turning the link on again
 * never hands out editing because it did the last time.
 */
export const DEFAULT_DOCUMENT_LINK_ACCESS: DocumentLinkAccess = 'view';
