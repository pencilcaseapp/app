import {
  connectCollaborator,
  getDocumentForViewer,
  removeCollaboratorsForDocument,
  setDocumentShared,
} from '~/repos/document';

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

  if (!document) {
    return [OpenDocumentError.NotFound];
  }

  const isOwner = !!userId && userId === document.userId;

  if (!isOwner && !document.shared) {
    return [OpenDocumentError.PermissionDenied];
  }

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
  }

  return [null, { shared: document.shared }];
}
