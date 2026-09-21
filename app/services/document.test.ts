// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeLinkAccess,
  ChangeLinkAccessError,
  deleteDocument,
  DeleteDocumentError,
  getLiveAccess,
  openDocument,
  OpenDocumentError,
  restoreDocument,
  shareDocument,
  ShareDocumentError,
} from './document';
import type { DocumentLinkAccess } from '~/constants/document';
import { documentFixture } from '~/test/fixtures/document';
import { userFixture } from '~/test/fixtures/user';

const getDocumentForViewerMock = vi.fn();
const connectCollaboratorMock = vi.fn();
const setDocumentSharedMock = vi.fn();
const setDocumentLinkAccessMock = vi.fn();
const removeCollaboratorsForDocumentMock = vi.fn();
const softDeleteDocumentMock = vi.fn();
const restoreDocumentRowMock = vi.fn();
vi.mock('~/repos/document', () => ({
  getDocumentForViewer: (...args: unknown[]) =>
    getDocumentForViewerMock(...args),
  connectCollaborator: (...args: unknown[]) => connectCollaboratorMock(...args),
  setDocumentShared: (...args: unknown[]) => setDocumentSharedMock(...args),
  setDocumentLinkAccess: (...args: unknown[]) =>
    setDocumentLinkAccessMock(...args),
  removeCollaboratorsForDocument: (...args: unknown[]) =>
    removeCollaboratorsForDocumentMock(...args),
  softDeleteDocument: (...args: unknown[]) => softDeleteDocumentMock(...args),
  restoreDocument: (...args: unknown[]) => restoreDocumentRowMock(...args),
}));

const closeDocumentConnectionsMock = vi.fn();
vi.mock('~/live/connections', () => ({
  closeDocumentConnections: (...args: unknown[]) =>
    closeDocumentConnectionsMock(...args),
}));

const otherUserId = 'e6d9c8f1-0000-4000-8000-000000000000';

function viewerDocument(overrides?: Partial<{
  shared: boolean;
  linkAccess: DocumentLinkAccess;
  userId: string;
  deletedAt: Date | null;
  isCollaborator: boolean;
}>) {
  return {
    id: documentFixture.id,
    title: documentFixture.title,
    shared: false,
    linkAccess: 'view' as DocumentLinkAccess,
    userId: userFixture.id,
    deletedAt: null,
    isCollaborator: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('openDocument', () => {
  it('returns not found for an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    const [error] = await openDocument(documentFixture.id, userFixture.id);

    expect(error).toBe(OpenDocumentError.NotFound);
  });

  it('opens a deleted document for its owner, marked as deleted', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ deletedAt: new Date() }),
    );

    const [error, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(document).toMatchObject({ isOwner: true, deleted: true });
  });

  it('returns not found for a deleted document to anybody else', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      shared: true,
      isCollaborator: true,
      deletedAt: new Date(),
    }));

    expect((await openDocument(documentFixture.id, userFixture.id))[0])
      .toBe(OpenDocumentError.NotFound);
    expect((await openDocument(documentFixture.id))[0])
      .toBe(OpenDocumentError.NotFound);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('reads the document and the collaborator status in one query', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    await openDocument(documentFixture.id, userFixture.id);

    expect(getDocumentForViewerMock).toHaveBeenCalledTimes(1);
    expect(getDocumentForViewerMock)
      .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  });

  it('lets the owner open a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    const [error, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(document).toStrictEqual({
      title: documentFixture.title,
      shared: false,
      linkAccess: 'view',
      isOwner: true,
      deleted: false,
      readOnly: false,
      hasJoined: false,
    });
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('opens read-only for a visitor a link only lets read', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    const [, document] = await openDocument(documentFixture.id);

    expect(document?.readOnly).toBe(true);
  });

  it('opens editable for a visitor a link lets edit', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({
        userId: otherUserId,
        shared: true,
        linkAccess: 'edit',
      }),
    );

    const [, document] = await openDocument(documentFixture.id);

    expect(document?.readOnly).toBe(false);
  });

  it('denies a visitor access to a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    const [error] = await openDocument(documentFixture.id, userFixture.id);

    expect(error).toBe(OpenDocumentError.PermissionDenied);
  });

  it('denies an anonymous visitor access to a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    const [error] = await openDocument(documentFixture.id);

    expect(error).toBe(OpenDocumentError.PermissionDenied);
  });

  it('connects a visitor on their first open of a shared document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    const [error, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(document?.hasJoined).toBe(true);
    expect(document?.isOwner).toBe(false);
    expect(connectCollaboratorMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      userId: userFixture.id,
    });
  });

  it('does not reconnect a returning visitor', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      shared: true,
      isCollaborator: true,
    }));

    const [, document] = await openDocument(
      documentFixture.id, userFixture.id,
    );

    expect(document?.hasJoined).toBe(false);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });

  it('does not connect an anonymous visitor', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    const [error, document] = await openDocument(documentFixture.id);

    expect(error).toBeNull();
    expect(document?.hasJoined).toBe(false);
    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });
});

describe('shareDocument', () => {
  it('shares a document for its owner', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: true,
      linkAccess: 'view',
    });

    const [error, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: true,
    });

    expect(error).toBeNull();
    expect(result?.shared).toBe(true);
    expect(setDocumentSharedMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: userFixture.id,
      shared: true,
    });
    expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('drops the collaborators when a document is unshared', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: false,
      linkAccess: 'view',
    });

    const [error, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: false,
    });

    expect(error).toBeNull();
    expect(result?.shared).toBe(false);
    expect(removeCollaboratorsForDocumentMock)
      .toHaveBeenCalledWith(documentFixture.id);
  });

  it('disconnects the collaborators editing right now', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: false,
      linkAccess: 'view',
    });

    await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: false,
    });

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    setDocumentSharedMock.mockResolvedValue(undefined);

    const [error] = await shareDocument({
      documentId: documentFixture.id,
      userId: otherUserId,
      shared: true,
    });

    expect(error).toBe(ShareDocumentError.PermissionDenied);
    expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });

  it('reports the access the link starts with', async () => {
    setDocumentSharedMock.mockResolvedValue({
      id: documentFixture.id,
      shared: true,
      linkAccess: 'view',
    });

    const [, result] = await shareDocument({
      documentId: documentFixture.id,
      userId: userFixture.id,
      shared: true,
    });

    expect(result?.linkAccess).toBe('view');
  });
});

describe('changeLinkAccess', () => {
  it('changes the access for the owner', async () => {
    setDocumentLinkAccessMock.mockResolvedValue({
      id: documentFixture.id,
      linkAccess: 'edit',
    });

    const [error, result] = await changeLinkAccess({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkAccess: 'edit',
    });

    expect(error).toBeNull();
    expect(result?.linkAccess).toBe('edit');
    expect(setDocumentLinkAccessMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      ownerId: userFixture.id,
      linkAccess: 'edit',
    });
  });

  it('sends everybody else back for the access they have now', async () => {
    setDocumentLinkAccessMock.mockResolvedValue({
      id: documentFixture.id,
      linkAccess: 'view',
    });

    await changeLinkAccess({
      documentId: documentFixture.id,
      userId: userFixture.id,
      linkAccess: 'view',
    });

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
      keepUserId: userFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    setDocumentLinkAccessMock.mockResolvedValue(undefined);

    const [error] = await changeLinkAccess({
      documentId: documentFixture.id,
      userId: otherUserId,
      linkAccess: 'edit',
    });

    expect(error).toBe(ChangeLinkAccessError.PermissionDenied);
  });
});

describe('getLiveAccess', () => {
  it('rejects an unknown document', async () => {
    getDocumentForViewerMock.mockResolvedValue(undefined);

    expect(await getLiveAccess(documentFixture.id, userFixture.id))
      .toBeUndefined();
  });

  it('lets the owner into a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    expect(await getLiveAccess(documentFixture.id, userFixture.id))
      .toStrictEqual({ readOnly: false });
  });

  it('lets the owner into a deleted document read-only', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ deletedAt: new Date() }),
    );

    expect(await getLiveAccess(documentFixture.id, userFixture.id))
      .toStrictEqual({ readOnly: true });
  });

  it('rejects anybody else from a deleted document', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument({
      userId: otherUserId,
      shared: true,
      deletedAt: new Date(),
    }));

    expect(await getLiveAccess(documentFixture.id, userFixture.id))
      .toBeUndefined();
  });

  it('rejects a visitor of a private document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId }),
    );

    expect(await getLiveAccess(documentFixture.id, userFixture.id))
      .toBeUndefined();
  });

  it('lets an anonymous visitor read a shared document', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    expect(await getLiveAccess(documentFixture.id))
      .toStrictEqual({ readOnly: true });
  });

  it('lets a visitor edit when the link allows it', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({
        userId: otherUserId,
        shared: true,
        linkAccess: 'edit',
      }),
    );

    expect(await getLiveAccess(documentFixture.id))
      .toStrictEqual({ readOnly: false });
  });

  it('leaves the owner editing whatever the link allows', async () => {
    getDocumentForViewerMock.mockResolvedValue(viewerDocument());

    expect(await getLiveAccess(documentFixture.id, userFixture.id))
      .toStrictEqual({ readOnly: false });
  });

  it('does not connect a collaborator', async () => {
    getDocumentForViewerMock.mockResolvedValue(
      viewerDocument({ userId: otherUserId, shared: true }),
    );

    await getLiveAccess(documentFixture.id, userFixture.id);

    expect(connectCollaboratorMock).not.toHaveBeenCalled();
  });
});

describe('deleteDocument', () => {
  it('soft deletes a document for its owner', async () => {
    softDeleteDocumentMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: new Date(),
    });

    const [error, result] = await deleteDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(result).toStrictEqual({ id: documentFixture.id });
    expect(softDeleteDocumentMock)
      .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  });

  it('drops the collaborators and closes every connection', async () => {
    softDeleteDocumentMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: new Date(),
    });

    await deleteDocument(documentFixture.id, userFixture.id);

    expect(removeCollaboratorsForDocumentMock)
      .toHaveBeenCalledWith(documentFixture.id);
    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    softDeleteDocumentMock.mockResolvedValue(undefined);

    const [error] = await deleteDocument(documentFixture.id, otherUserId);

    expect(error).toBe(DeleteDocumentError.PermissionDenied);
    expect(removeCollaboratorsForDocumentMock).not.toHaveBeenCalled();
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });
});

describe('restoreDocument', () => {
  it('restores a deleted document for its owner', async () => {
    restoreDocumentRowMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: null,
    });

    const [error, result] = await restoreDocument(
      documentFixture.id, userFixture.id,
    );

    expect(error).toBeNull();
    expect(result).toStrictEqual({ id: documentFixture.id });
    expect(restoreDocumentRowMock)
      .toHaveBeenCalledWith(documentFixture.id, userFixture.id);
  });

  it('closes the read-only connections so the editor reconnects', async () => {
    restoreDocumentRowMock.mockResolvedValue({
      id: documentFixture.id,
      deletedAt: null,
    });

    await restoreDocument(documentFixture.id, userFixture.id);

    expect(closeDocumentConnectionsMock).toHaveBeenCalledWith({
      documentId: documentFixture.id,
    });
  });

  it('denies somebody who does not own the document', async () => {
    restoreDocumentRowMock.mockResolvedValue(undefined);

    const [error] = await restoreDocument(documentFixture.id, otherUserId);

    expect(error).toBe(DeleteDocumentError.PermissionDenied);
    expect(closeDocumentConnectionsMock).not.toHaveBeenCalled();
  });
});
